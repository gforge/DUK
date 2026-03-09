import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import type { CareRole } from '@/api/schemas'
import type { TriageForm } from '@/components/case/triage/schema'
import { AssignmentModeField } from '@/components/case/triage/Step2/AssignmentModeField'

import i18n from '../i18n'

function Wrapper({ careRole }: { careRole: CareRole }) {
  return (
    <I18nextProvider i18n={i18n}>
      <InnerWrapper careRole={careRole} />
    </I18nextProvider>
  )
}

function InnerWrapper({ careRole }: { careRole: CareRole }) {
  const { control, setValue } = useForm<TriageForm>({
    defaultValues: { assignmentMode: 'ANY', assignedUserId: 'foo' },
  })
  const assignmentMode = useWatch({ control, name: 'assignmentMode' })
  const assignedUserId = useWatch({ control, name: 'assignedUserId' })

  return (
    <>
      <AssignmentModeField
        control={control}
        error={undefined}
        careRole={careRole}
        setValue={setValue}
      />
      <div data-testid="mode">{assignmentMode ?? ''}</div>
      <div data-testid="user">{assignedUserId ?? ''}</div>
    </>
  )
}

describe('AssignmentModeField', () => {
  beforeEach(() => {
    // nothing to clear here
  })

  it('renders three buttons for doctor and clears assignedUserId when switching off NAMED', async () => {
    render(<Wrapper careRole="DOCTOR" />)
    const user = userEvent.setup()

    const anyLabel = i18n.t('triage.assignmentModeOption.ANY') as string
    const palLabel = i18n.t('triage.assignmentModeOption.PAL') as string
    const namedLabel = i18n.t('triage.assignmentModeOption.NAMED') as string

    // initial state ANY, userId "foo"
    expect(screen.getByTestId('mode')).toHaveTextContent('ANY')
    expect(screen.getByTestId('user')).toHaveTextContent('foo')

    // named should appear, click it
    const namedBtn = screen.getByRole('button', { name: namedLabel })
    await user.click(namedBtn)
    expect(screen.getByTestId('mode')).toHaveTextContent('NAMED')

    // now choose ANY again - should clear user id
    const anyBtn = screen.getByRole('button', { name: anyLabel })
    await user.click(anyBtn)
    expect(screen.getByTestId('mode')).toHaveTextContent('ANY')
    expect(screen.getByTestId('user')).toHaveTextContent('')

    // PAL button should be present for doctor
    expect(screen.getByRole('button', { name: palLabel })).toBeInTheDocument()
  })

  it('hides PAL button for non-doctor roles', () => {
    render(<Wrapper careRole="NURSE" />)
    expect(screen.queryByRole('button', { name: /PAL/i })).not.toBeInTheDocument()
  })
})
