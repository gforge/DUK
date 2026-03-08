import { Stack } from '@mui/material'
import React from 'react'

import type { InstructionTemplate, JourneyTemplate, JourneyTemplateEntry } from '@/api/schemas'

import { TemplateAccordion } from './TemplateAccordion'

interface Props {
  journeyTemplates: JourneyTemplate[]
  instructionTemplates: InstructionTemplate[]
  parentName: (id?: string) => string | undefined
  onDelete: (id: string, name: string) => void
  setSyncTarget: (jt: JourneyTemplate) => void
  setEditTarget: (jt: JourneyTemplate | undefined) => void
  setDeriveTarget: (jt: JourneyTemplate) => void
  setTemplateInstructionsTarget: (jt: JourneyTemplate) => void
  setEntryEditState: React.Dispatch<
    React.SetStateAction<{ template: JourneyTemplate; entry?: JourneyTemplateEntry } | null>
  >
  handleDeleteEntry: (template: JourneyTemplate, entryId: string) => void
  handleDeleteInstruction: (template: JourneyTemplate, instrId: string) => void
}

export function JourneyTemplatesTabList({
  journeyTemplates,
  instructionTemplates,
  parentName,
  onDelete,
  setSyncTarget,
  setEditTarget,
  setDeriveTarget,
  setTemplateInstructionsTarget,
  setEntryEditState,
  handleDeleteEntry,
  handleDeleteInstruction,
}: Props) {
  return (
    <Stack gap={1.5}>
      {journeyTemplates.map((jt) => (
        <TemplateAccordion
          key={jt.id}
          jt={jt}
          instructionTemplates={instructionTemplates}
          parentName={parentName}
          onDelete={onDelete}
          setSyncTarget={setSyncTarget}
          setEditTarget={setEditTarget}
          setDeriveTarget={setDeriveTarget}
          setTemplateInstructionsTarget={setTemplateInstructionsTarget}
          setEntryEditState={setEntryEditState}
          handleDeleteEntry={handleDeleteEntry}
          handleDeleteInstruction={handleDeleteInstruction}
        />
      ))}
    </Stack>
  )
}
