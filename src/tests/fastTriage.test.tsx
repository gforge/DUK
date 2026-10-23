import { render, screen } from '@testing-library/react'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import * as service from '@/api/service'
import { getStore, initStore } from '@/api/storage'
import ContactActions from '@/components/case/ContactActions'
import type { TriageForm as TriageFormValues } from '@/components/case/triage/schema'
import { countMissingRequired, toTriageSubmitData } from '@/components/case/triage/toSubmitData'
import { RoleProvider } from '@/store/roleContext'
import { SnackProvider } from '@/store/snackContext'

import i18n from '../i18n'

beforeEach(() => {
  initStore(structuredClone(SEED_STATE))
})

const reviewCase = () => SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!

const callingNowForm: TriageFormValues = {
  contactMode: 'PHONE',
  careRole: null,
  assignmentMode: null,
  assignedUserIds: [],
  assignedTeamIds: [],
  dueAtInput: '',
  note: 'Ringde, patienten mår bra',
  handledNow: true,
  patientMessage: '',
}

describe('"Jag ringer patienten nu" (handledNow)', () => {
  it('needs no further choices once the clinician calls now', () => {
    expect(countMissingRequired(callingNowForm)).toBe(0)
    expect(countMissingRequired({ ...callingNowForm, handledNow: false })).toBe(3)
  })

  it('maps to a phone decision owned by the triaging clinician', () => {
    const data = toTriageSubmitData(callingNowForm, { userId: 'user-pal-1', careRole: 'DOCTOR' })
    expect(data.triageDecision).toMatchObject({
      contactMode: 'PHONE',
      careRole: 'DOCTOR',
      assignmentMode: 'NAMED',
      assignedUserId: 'user-pal-1',
      handledNow: true,
    })
    expect(() => toTriageSubmitData(callingNowForm)).toThrow()
  })

  it('logs the call and closes the case without a worklist task', () => {
    const c = reviewCase()
    const result = service.triageCase(
      c.id,
      {
        triageDecision: {
          contactMode: 'PHONE',
          careRole: 'NURSE',
          assignmentMode: 'NAMED',
          assignedUserId: 'user-nurse-1',
          assignedUserIds: ['user-nurse-1'],
          dueAt: new Date().toISOString(),
          note: 'Ringde nu',
          handledNow: true,
        },
      },
      'user-nurse-1',
      'NURSE',
    )
    expect(result.status).toBe('CLOSED')
    expect(result.closedAt).toBeTruthy()
    expect(result.triageDecision?.handledNow).toBe(true)
    const actions = service.getAuditEvents(c.id).map((e) => e.action)
    expect(actions).toContain('TRIAGED')
    expect(actions).toContain('CONTACTED')
    // closed cases never reach the worklist's active queue
    expect(service.getCase(c.id)?.status).toBe('CLOSED')
  })
})

describe('"Jag svarar patienten nu" (replying in the app)', () => {
  const replyingNowForm: TriageFormValues = {
    ...callingNowForm,
    contactMode: 'DIGITAL',
    patientMessage: 'Allt ser bra ut, ingen mer uppföljning behövs.',
  }

  it('requires a message to the patient and nothing else', () => {
    expect(countMissingRequired(replyingNowForm)).toBe(0)
    expect(countMissingRequired({ ...replyingNowForm, patientMessage: '  ' })).toBe(1)
    expect(countMissingRequired({ ...replyingNowForm, handledNow: false })).toBe(3)
  })

  it('maps to a digital decision owned by the triaging clinician, with the message', () => {
    const data = toTriageSubmitData(replyingNowForm, { userId: 'user-pal-1', careRole: 'DOCTOR' })
    expect(data.triageDecision).toMatchObject({
      contactMode: 'DIGITAL',
      careRole: 'DOCTOR',
      assignmentMode: 'NAMED',
      assignedUserId: 'user-pal-1',
      handledNow: true,
    })
    expect(data.patientMessage).toBe(replyingNowForm.patientMessage)
  })

  it('stores the reply, logs the contact and closes the case', () => {
    const c = reviewCase()
    const result = service.triageCase(
      c.id,
      {
        triageDecision: {
          contactMode: 'DIGITAL',
          careRole: 'DOCTOR',
          assignmentMode: 'NAMED',
          assignedUserId: 'user-pal-1',
          assignedUserIds: ['user-pal-1'],
          dueAt: new Date().toISOString(),
          note: null,
          handledNow: true,
        },
        patientMessage: 'Allt ser bra ut.',
      },
      'user-pal-1',
      'DOCTOR',
    )
    expect(result.status).toBe('CLOSED')
    expect(service.getCase(c.id)?.patientMessage).toBe('Allt ser bra ut.')
    const actions = service.getAuditEvents(c.id).map((e) => e.action)
    expect(actions).toContain('CONTACTED')
  })
})

describe('closing a case keeps the message to the patient', () => {
  it('stores the message written in the close dialog', () => {
    const c = reviewCase()
    const result = service.triageCase(
      c.id,
      {
        triageDecision: {
          contactMode: 'CLOSE',
          careRole: null,
          assignmentMode: null,
          assignedUserId: null,
          dueAt: null,
          note: null,
        },
        patientMessage: 'Tack, allt ser bra ut. Hör av dig om något ändras.',
      },
      'user-pal-1',
      'DOCTOR',
    )
    expect(result.status).toBe('CLOSED')
    expect(result.patientMessage).toBe('Tack, allt ser bra ut. Hör av dig om något ändras.')
  })
})

describe('getNextCaseToReview', () => {
  it('returns the next open case in queue order and the remaining count', () => {
    const queue = service.getReviewQueue()
    expect(queue.length).toBeGreaterThan(1)
    const { next, remaining } = service.getNextCaseToReview(queue[0].id)
    expect(next?.id).toBe(queue[1].id)
    expect(remaining).toBe(queue.length - 1)
    expect(next?.patientName).toBeTruthy()
  })

  it('puts acute cases first and sorts by longest wait inside a category', () => {
    const queue = service.getReviewQueue()
    const order = { ACUTE: 0, SUBACUTE: 1, CONTROL: 2 }
    for (let i = 1; i < queue.length; i++) {
      const a = queue[i - 1]
      const b = queue[i]
      const ca = order[a.activeCategory ?? a.category]
      const cb = order[b.activeCategory ?? b.category]
      expect(ca <= cb).toBe(true)
      if (ca === cb) expect(a.scheduledAt <= b.scheduledAt).toBe(true)
    }
  })

  it('reports an empty queue when every case is handled', () => {
    for (const c of service.getReviewQueue()) {
      // cases blocked by a pending lab/X-ray review cannot be triaged; close them directly
      if (service.getPendingReviews(c.id).length > 0) {
        service.completeWorklistCase(c.id, 'user-pal-1', 'DOCTOR')
        continue
      }
      service.triageCase(
        c.id,
        { triageDecision: { contactMode: 'CLOSE', careRole: null, assignmentMode: null } },
        'user-pal-1',
        'DOCTOR',
      )
    }
    expect(service.getNextCaseToReview('nothing')).toEqual({ next: null, remaining: 0 })
  })
})

describe('patients without a digital channel', () => {
  it('stores the flag at registration', () => {
    const p = service.createPatient({
      displayName: 'Test Testsson',
      personalNumber: '193801011234',
      dateOfBirth: '1938-01-01',
      noDigitalChannel: true,
    })
    expect(getStore().patients.find((x) => x.id === p.id)?.noDigitalChannel).toBe(true)
    const q = service.createPatient({
      displayName: 'Digital Dunder',
      personalNumber: '198001011234',
      dateOfBirth: '1980-01-01',
    })
    expect(getStore().patients.find((x) => x.id === q.id)?.noDigitalChannel).toBeUndefined()
  })

  it('seeds one such patient with a case for staff to handle', () => {
    const p = SEED_STATE.patients.find((x) => x.noDigitalChannel)
    expect(p).toBeTruthy()
    const c = SEED_STATE.cases.find((x) => x.patientId === p!.id)
    expect(c?.status).toBe('NEEDS_REVIEW')
    expect(c?.triggers).toContain('NO_DIGITAL_CHANNEL')
  })

  it('offers a call but no reminder in the contact panel', () => {
    const c = { ...reviewCase(), triggers: ['NO_DIGITAL_CHANNEL' as const] }
    render(
      <I18nextProvider i18n={i18n}>
        <RoleProvider>
          <SnackProvider>
            <ContactActions caseData={c} onRefetch={() => {}} />
          </SnackProvider>
        </RoleProvider>
      </I18nextProvider>,
    )
    const tr = (key: string) => i18n.t(key as never) as string
    expect(screen.getByRole('button', { name: tr('contactActions.contacted') })).toBeVisible()
    expect(screen.queryByRole('button', { name: tr('contactActions.reminded') })).toBeNull()
  })
})
