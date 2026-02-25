import React from 'react'
import {
  Box,
  Button,
  Stack,
  Paper,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import type { JournalDraft } from '../../../api/schemas'
import { format } from 'date-fns'

interface Props {
  draft: JournalDraft
  canApprove: boolean
  approving: string | null
  copied: string | null
  onApprove: (draftId: string) => void
  onCopy: (content: string, draftId: string) => void
}

export default function JournalDraftCard({
  draft,
  canApprove,
  approving,
  copied,
  onApprove,
  onCopy,
}: Props) {
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Stack direction="row" gap={1} alignItems="center">
          <Chip
            label={draft.status === 'APPROVED' ? t('journal.approved') : t('journal.draft')}
            size="small"
            color={draft.status === 'APPROVED' ? 'success' : 'default'}
            icon={draft.status === 'APPROVED' ? <CheckCircleIcon fontSize="inherit" /> : undefined}
          />
          <Typography variant="caption" color="text.secondary">
            {format(new Date(draft.createdAt), 'dd MMM yyyy HH:mm')}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          <Tooltip title={copied === draft.id ? t('journal.copied') : t('journal.copy')}>
            <IconButton
              size="small"
              onClick={() => onCopy(draft.content, draft.id)}
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
                onClick={() => onApprove(draft.id)}
                disabled={approving === draft.id}
                startIcon={approving === draft.id ? <CircularProgress size={12} /> : undefined}
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
        sx={{
          fontSize: '0.85rem',
          p: 1,
          bgcolor: 'background.default',
          borderRadius: 1,
          maxHeight: 400,
          overflowY: 'auto',
          '& h2': { fontSize: '1rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
          '& h3': { fontSize: '0.9rem', fontWeight: 600, mt: 1.5, mb: 0.25 },
          '& p': { my: 0.5 },
          '& ul, & ol': { my: 0.5, pl: 2.5 },
          '& li': { my: 0 },
          '& strong': { fontWeight: 600 },
        }}
      >
        <ReactMarkdown>{draft.content}</ReactMarkdown>
      </Box>

      {draft.status === 'APPROVED' && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          {t('journal.approvedBy')}: {draft.approvedByUserId} ·{' '}
          {draft.approvedAt ? format(new Date(draft.approvedAt), 'dd MMM yyyy HH:mm') : ''}
        </Typography>
      )}
    </Paper>
  )
}
