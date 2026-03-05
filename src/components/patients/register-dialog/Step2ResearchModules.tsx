import React from 'react'
import { Checkbox, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import { useTranslation } from 'react-i18next'
import type { ResearchModule } from '../../../api/schemas'

interface Props {
  selectedModuleIds: string[]
  setSelectedModuleIds: (ids: string[]) => void
  researchModules: ResearchModule[] | null
}

export function Step2ResearchModules({
  selectedModuleIds,
  setSelectedModuleIds,
  researchModules,
}: Props) {
  const { t } = useTranslation()
  return (
    <Stack gap={2}>
      <Typography variant="body2" color="text.secondary">
        {t('patients.register.studiesHint')}
      </Typography>
      {!researchModules || researchModules.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {t('patients.register.noStudies')}
        </Typography>
      ) : (
        <FormGroup>
          {researchModules.map((rm) => (
            <FormControlLabel
              key={rm.id}
              control={
                <Checkbox
                  checked={selectedModuleIds.includes(rm.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedModuleIds, rm.id]
                      : selectedModuleIds.filter((id) => id !== rm.id)
                    setSelectedModuleIds(next)
                  }}
                />
              }
              label={
                <Stack gap={0}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ScienceIcon fontSize="small" color="secondary" />
                    <Typography variant="body2" fontWeight={600}>
                      {rm.studyName}
                    </Typography>
                  </Stack>
                  {rm.name !== rm.studyName && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                      {rm.name}
                    </Typography>
                  )}
                </Stack>
              }
            />
          ))}
        </FormGroup>
      )}
    </Stack>
  )
}
