import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import { InstructionMode } from '../../../useEntryEditor'
import type { InstructionSectionProps } from '../types'

export function InstructionSection({
  instructionMode,
  setInstructionMode,
  instructionTemplateId,
  setInstructionTemplateId,
  instructionText,
  setInstructionText,
  itOptions,
  selectedIT,
}: InstructionSectionProps) {
  const { t } = useTranslation()

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, value: InstructionMode | null) => {
    if (value) {
      setInstructionMode(value)
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('journey.entry.instruction')}
      </Typography>

      <ToggleButtonGroup value={instructionMode} exclusive onChange={handleModeChange}>
        <ToggleButton value="NONE">{t('journey.entry.instructionNone')}</ToggleButton>
        <ToggleButton value="TEMPLATE">{t('journey.entry.instructionFromTemplate')}</ToggleButton>
        <ToggleButton value="FREETEXT">{t('journey.entry.instructionFreetext')}</ToggleButton>
      </ToggleButtonGroup>

      {instructionMode === 'TEMPLATE' && (
        <FormControl size="small" sx={{ mt: 1, minWidth: 240 }}>
          <InputLabel>{t('journey.entry.instructionTemplate' as any) as string}</InputLabel>
          <Select
            value={instructionTemplateId}
            label={t('journey.entry.instructionTemplate' as any) as string}
            onChange={(e) => setInstructionTemplateId(e.target.value)}
          >
            {itOptions.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {instructionMode === 'TEMPLATE' && selectedIT && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: 3,
            borderColor: 'primary.light',
            '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
          }}
        >
          <Typography variant="overline" color="text.secondary" display="block" mb={0.5}>
            {t('journey.entry.instruction')}
          </Typography>
          <ReactMarkdown>{selectedIT.content}</ReactMarkdown>
        </Box>
      )}

      {instructionMode === 'FREETEXT' && (
        <TextField
          value={instructionText}
          onChange={(e) => setInstructionText(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  )
}
