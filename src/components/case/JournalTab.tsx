import React, { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import { useTranslation } from 'react-i18next'
import { useRole } from '../../store/roleContext'
import { useSnack } from '../../store/snackContext'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import type { Case, Patient } from '../../api/schemas'
import JournalDraftCard from './journal/JournalDraftCard'
import BookingsList from './BookingsList'

interface JournalTabProps {
  readonly caseData: Case
  readonly patient?: Patient
  readonly onCaseChange?: () => void
}

export default function JournalTab({ caseData, patient: _patient, onCaseChange }: JournalTabProps) {
  const { t, i18n } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: allTemplates } = useApi(() => client.getJournalTemplates(), [])
  const {
    data: drafts,
    loading,
    refetch: refetchDrafts,
  } = useApi(() => client.getJournalDrafts(caseData.id), [caseData.id])

  const canApprove = isRole('DOCTOR', 'PAL')

  const currentLangTemplates = useMemo(() => {
    const all = allTemplates ?? []
    return all.filter((t) => (t.language ?? 'sv') === i18n.language)
  }, [allTemplates, i18n.language])

  async function handleGenerate() {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      await client.generateJournalDraft(
        caseData.id,
        selectedTemplate,
        currentUser.id,
        currentUser.role,
        i18n.language,
      )
      showSnack(t('journal.generate'), 'success')
      refetchDrafts()
    } catch (err) {
      showSnack(String(err), 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprove(draftId: string) {
    setApproving(draftId)
    try {
      await client.approveJournalDraft(draftId, currentUser.id, currentUser.role)
      showSnack(t('journal.approved'), 'success')
      refetchDrafts()
    } catch (err) {
      showSnack(String(err), 'error')
    } finally {
      setApproving(null)
    }
  }

  async function handleCopy(content: string, draftId: string) {
    await navigator.clipboard.writeText(content)
    setCopied(draftId)
    showSnack(t('journal.copied'), 'success')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1, displayPrint: 'none' }}>
        <Tooltip title={t('common.print')}>
          <IconButton
            size="small"
            onClick={() => globalThis.print()}
            aria-label={t('common.print')}
          >
            <PrintIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <BookingsList
          caseData={caseData}
          onChange={() => {
            onCaseChange?.()
          }}
        />
      </Paper>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t('journal.generate')}
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="journal-template-label">{t('journal.selectTemplate')}</InputLabel>
            <Select
              labelId="journal-template-label"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              label={t('journal.selectTemplate')}
            >
              {currentLangTemplates.map((tmpl) => (
                <MenuItem key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!selectedTemplate || generating}
            startIcon={generating ? <CircularProgress size={16} /> : undefined}
          >
            {generating ? t('journal.generating') : t('journal.generate')}
          </Button>
        </Stack>
      </Paper>

      {loading && <CircularProgress />}
      {!loading && (!drafts || drafts.length === 0) && (
        <Typography color="text.secondary" variant="body2">
          {t('journal.noDrafts')}
        </Typography>
      )}

      <Stack gap={2}>
        {drafts?.map((draft) => (
          <JournalDraftCard
            key={draft.id}
            draft={draft}
            canApprove={canApprove}
            approving={approving}
            copied={copied}
            onApprove={handleApprove}
            onCopy={handleCopy}
          />
        ))}
      </Stack>
    </Box>
  )
}
