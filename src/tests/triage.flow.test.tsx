import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { SEED_STATE } from '@/api/seed'
import { initStore } from '@/api/storage'
import type { TriageForm as TriageFormValues } from '@/components/case/triage/schema'
import { toTriageSubmitData } from '@/components/case/triage/toSubmitData'
import TriageForm from '@/components/case/triage/TriageForm'

import i18n from '../i18n'

beforeAll(() => {
  initStore(structuredClone(SEED_STATE))
})

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

const CASE_NEEDS_REVIEW = {
  ...SEED_STATE.cases.find((c) => c.status === 'NEEDS_REVIEW')!,
  assignedUserId: undefined,
}

const tr = (key: string) => i18n.t(key as never) as string
const submitButton = () => screen.getByRole('button', { name: tr('triage.submit') })

async function pickPhoneAndRole(user: ReturnType<typeof userEvent.setup>, role: string) {
  await user.click(screen.getByRole('radio', { name: new RegExp(tr('triage.contactMode.PHONE')) }))
  await user.click(screen.getByRole('radio', { name: tr(`triage.careRoleOption.${role}`) }))
}

async function pickOneWeek(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: new RegExp(tr('triage.dueAtQuick.1w')) }))
}

describe('TriageForm', () => {
  it('shows the three follow-up contact modes and the close link', () => {
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={vi.fn()} />)
    for (const mode of ['DIGITAL', 'PHONE', 'VISIT']) {
      expect(
        screen.getByRole('radio', { name: new RegExp(tr(`triage.contactMode.${mode}`)) }),
      ).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: tr('triage.contactMode.CLOSE') })).toBeVisible()
    expect(submitButton()).toBeDisabled()
    expect(screen.getByText(tr('triage.missingRequired_other').replace('{{count}}', '4')))
  })

  it('closing asks for confirmation and submits a CLOSE decision', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: tr('triage.contactMode.CLOSE') }))
    expect(screen.getAllByText(tr('triage.closeNoWorklist')).length).toBeGreaterThan(0)

    await user.click(submitButton())
    const dialog = await screen.findByRole('dialog')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: tr('triage.contactMode.CLOSE') }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          triageDecision: expect.objectContaining({
            contactMode: 'CLOSE',
            careRole: null,
            assignmentMode: null,
          }),
        }),
      )
    })
  })

  it('submits a PHONE decision to VSH with a due date', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await pickPhoneAndRole(user, 'NURSE')
    await user.click(screen.getByRole('radio', { name: tr('triage.assignmentModeOption.ANY') }))
    expect(submitButton()).toBeDisabled()
    await pickOneWeek(user)
    expect(submitButton()).toBeEnabled()
    await user.click(submitButton())

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          triageDecision: expect.objectContaining({
            contactMode: 'PHONE',
            careRole: 'NURSE',
            assignmentMode: 'ANY',
            assignedUserId: null,
            dueAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        }),
      )
    })
  })

  it('disables PAL unless the competence is doctor', async () => {
    const user = userEvent.setup()
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={vi.fn()} />)
    await pickPhoneAndRole(user, 'NURSE')
    expect(
      screen.getByRole('radio', { name: tr('triage.assignmentModeOption.PAL') }),
    ).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: tr('triage.careRoleOption.DOCTOR') }))
    expect(screen.getByRole('radio', { name: tr('triage.assignmentModeOption.PAL') })).toBeEnabled()
  })

  it('submits several named people as NAMED without a single owner', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await pickPhoneAndRole(user, 'DOCTOR')
    await user.click(screen.getByRole('radio', { name: tr('triage.specificOption') }))
    await user.click(await screen.findByRole('checkbox', { name: /Sara Lindqvist/ }))
    await user.click(screen.getByRole('checkbox', { name: /Erik Bergström/ }))
    // nurses are filtered out by the chosen competence
    expect(screen.queryByRole('checkbox', { name: /Anna Holmberg/ })).toBeNull()
    await pickOneWeek(user)
    await user.click(submitButton())

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          triageDecision: expect.objectContaining({
            assignmentMode: 'NAMED',
            assignedUserIds: ['user-pal-1', 'user-doc-1'],
            assignedUserId: null,
          }),
        }),
      )
    })
  })

  it('submits a group choice as TEAM', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    wrap(<TriageForm caseData={CASE_NEEDS_REVIEW} onSubmit={onSubmit} />)

    await pickPhoneAndRole(user, 'NURSE')
    await user.click(screen.getByRole('radio', { name: tr('triage.specificOption') }))
    await user.click(screen.getByRole('radio', { name: tr('triage.specificGroup') }))
    await user.click(await screen.findByRole('checkbox', { name: /Höft/ }))
    await pickOneWeek(user)
    await user.click(submitButton())

    await waitFor(() => {
      const call = onSubmit.mock.calls[0][0]
      expect(call.triageDecision).toMatchObject({
        assignmentMode: 'TEAM',
        assignedTeamIds: ['team-hip'],
        assignedUserId: null,
      })
      expect(call.triageDecision.assignedUserIds).toBeUndefined()
    })
  })
})

describe('toTriageSubmitData', () => {
  const base: TriageFormValues = {
    contactMode: 'VISIT',
    careRole: 'DOCTOR',
    assignmentMode: 'NAMED',
    assignedUserIds: ['user-doc-1'],
    assignedTeamIds: ['team-hip'],
    dueAtInput: '2030-01-15',
    note: '  ',
    patientMessage: '',
  }

  it('sets assignedUserId when exactly one person is named', () => {
    const out = toTriageSubmitData(base)
    expect(out.triageDecision).toMatchObject({
      assignmentMode: 'NAMED',
      assignedUserId: 'user-doc-1',
      assignedUserIds: ['user-doc-1'],
      note: null,
    })
    expect(out.triageDecision.assignedTeamIds).toBeUndefined()
    expect(out.triageDecision.dueAt).toMatch(/^2030-01-15T/)
    expect(out.patientMessage).toBeUndefined()
  })

  it('leaves assignedUserId empty for several people', () => {
    const out = toTriageSubmitData({ ...base, assignedUserIds: ['user-doc-1', 'user-pal-1'] })
    expect(out.triageDecision.assignedUserId).toBeNull()
    expect(out.triageDecision.assignedUserIds).toEqual(['user-doc-1', 'user-pal-1'])
  })

  it('maps TEAM to assignedTeamIds only', () => {
    const out = toTriageSubmitData({ ...base, assignmentMode: 'TEAM' })
    expect(out.triageDecision).toMatchObject({
      assignmentMode: 'TEAM',
      assignedTeamIds: ['team-hip'],
      assignedUserId: null,
    })
    expect(out.triageDecision.assignedUserIds).toBeUndefined()
  })

  it('drops all assignment for CLOSE', () => {
    const out = toTriageSubmitData({ ...base, contactMode: 'CLOSE', note: 'klar' })
    expect(out.triageDecision).toEqual({
      contactMode: 'CLOSE',
      careRole: null,
      assignmentMode: null,
      assignedUserId: null,
      dueAt: null,
      note: 'klar',
    })
  })
})
