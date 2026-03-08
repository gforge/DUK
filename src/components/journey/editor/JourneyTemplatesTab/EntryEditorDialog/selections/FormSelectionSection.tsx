import { Autocomplete, FormControlLabel, Switch, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { SelectOption } from '../types'

interface SelectedQuestionnaire {
  id: string
  name: string
  questions: unknown[]
}

interface Props {
  templateId: string
  setTemplateId: (id: string) => void
  qtOptions: SelectOption[]
  selectedQT?: SelectedQuestionnaire | null
}

export function FormSelectionSection({ templateId, setTemplateId, qtOptions, selectedQT }: Props) {
  const { t } = useTranslation()

  const options: SelectOption[] = [{ id: '', name: `— ${t('journey.entry.noForm')}` }, ...qtOptions]

  const value = templateId ? { id: templateId, name: selectedQT?.name ?? '' } : null

  return (
    <>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('journey.entry.questionnaire' as any) as string}
            size="small"
          />
        )}
        value={value}
        onChange={(_, option) => setTemplateId(option?.id ?? '')}
        sx={{ maxWidth: 320 }}
      />

      {selectedQT && (
        <FormControlLabel
          control={<Switch checked={selectedQT.questions.length > 0} disabled />}
          label={t('journey.entry.showFormDetails', {
            count: selectedQT.questions.length,
          })}
        />
      )}
    </>
  )
}
