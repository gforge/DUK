import React, { useState } from 'react'
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
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'
import { useRole } from '../../store/roleContext'
import { useSnack } from '../../store/snackContext'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import type { Case, Patient } from '../../api/schemas'
import { format } from 'date-fns'

interface JournalTabProps {
  caseData: Case
  patient?: Patient
}

export default function JournalTab({ caseData, patient: _patient }: JournalTabProps) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: templates } = useApi(() => client.getJournalTemplates(), [])
  const {
    data: drafts,
    loading,
    refetch: refetchDrafts,
  } = useApi(() => client.getJournalDrafts(caseData.id), [caseData.id])

  const canApprove = isRole('DOCTOR', 'PAL')

  async function handleGenerate() {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      await client.generateJournalDraft(
        caseData.id,
        selectedTemplate,
        currentUser.id,
        currentUser.role,
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
      {/* Generate new draft */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t('journal.generate')}
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="journal-template-label">{t('journal.selectTemplate')}</InputLabel>
            <Select
              labelId="journal-template-label"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              label={t('journal.selectTemplate')}
            >
              {templates?.map((tmpl) => (
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

      {/* Draft list */}
      {loading && <CircularProgress />}
      {!loading && (!drafts || drafts.length === 0) && (
        <Typography color="text.secondary" variant="body2">
          {t('journal.noDrafts')}
        </Typography>
      )}

      <Stack gap={2}>
        {drafts?.map((draft) => (
          <Paper key={draft.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" gap={1} alignItems="center">
                <Chip
                  label={draft.status === 'APPROVED' ? t('journal.approved') : t('journal.draft')}
                  size="small"
                  color={draft.status === 'APPROVED' ? 'success' : 'default'}
                  icon={
                    draft.status === 'APPROVED' ? <CheckCircleIcon fontSize="inherit" /> : undefined
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(draft.createdAt), 'dd MMM yyyy HH:mm')}
                </Typography>
              </Stack>

              <Stack direction="row" gap={1}>
                <Tooltip title={copied === draft.id ? t('journal.copied') : t('journal.copy')}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(draft.content, draft.id)}
                    aria-label={t('journal.copy')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {draft.status === 'DRAFT' &&
                  (canApprove ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleApprove(draft.id)}
                      disabled={approving === draft.id}
                      startIcon={
                        approving === draft.id ? <CircularProgress size={12} /> : undefined
                      }
                    >
                      {t('journal.approve')}
                    </Button>
                  ) : (
                    <Tooltip title={t('journal.onlyDoctorApprove')}>
                      <span>
                        <Button size="small" variant="outlined" disabled>
                          {t('journal.approve')}
                        </Button>
                      </span>
                    </Tooltip>
                  ))}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <Box
              component="pre"
              sx={{
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
                p: 1,
                bgcolor: 'background.default',
                borderRadius: 1,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {draft.content}
            </Box>

            {draft.status === 'APPROVED' && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {t('journal.approvedBy')}: {draft.approvedByUserId} ·{' '}
                {draft.approvedAt ? format(new Date(draft.approvedAt), 'dd MMM yyyy HH:mm') : ''}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
