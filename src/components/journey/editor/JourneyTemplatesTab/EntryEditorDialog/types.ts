import type { InstructionMode } from '../../useEntryEditor'

export interface SelectOption {
  id: string
  name: string
}

export type DashboardCategory = 'CONTROL' | 'ACUTE' | 'SUBACUTE'

export interface InstructionSectionProps {
  instructionMode: InstructionMode
  setInstructionMode: (mode: InstructionMode) => void
  instructionTemplateId: string
  setInstructionTemplateId: (id: string) => void
  instructionText: string
  setInstructionText: (text: string) => void
  itOptions: SelectOption[]
  selectedIT?: {
    id: string
    name: string
    content: string
  } | null
}
