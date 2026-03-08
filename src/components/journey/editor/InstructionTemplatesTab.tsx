import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'

import type { InstructionTemplate } from '@/api/schemas'

interface Props {
  instructionTemplates: InstructionTemplate[] | null
  loading: boolean
  onDelete: (id: string, name: string) => void
  onSave: (data: { id?: string; name: string; content: string; tags: string[] }) => void
}

function EditInstructionDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: { id?: string; name: string; content: string; tags: string[] }) => void
  initial?: InstructionTemplate
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [tagsStr, setTagsStr] = useState(initial?.tags?.join(', ') ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!name.trim() || !content.trim()) {
      setError(t('journey.modify.requiredFields'))
      return
    }
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ id: initial?.id, name: name.trim(), content: content.trim(), tags })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? t('common.edit') : t('journey.editor.tabInstructions')}</DialogTitle>
      <DialogContent>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField
            label={t('policy.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            size="small"
            fullWidth
            required
            multiline
            minRows={4}
            maxRows={12}
          />
          <TextField
            label="Tags"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            size="small"
            fullWidth
            helperText="Comma-separated tags"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disableElevation>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function InstructionTemplatesTab({
  instructionTemplates,
  loading,
  onDelete,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InstructionTemplate | undefined>(undefined)

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />

  const handleEdit = (it: InstructionTemplate) => {
    setEditTarget(it)
    setEditDialogOpen(true)
  }

  const handleCreate = () => {
    setEditTarget(undefined)
    setEditDialogOpen(true)
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}>
          {t('journey.editor.addInstruction')}
        </Button>
      </Stack>

      {!instructionTemplates?.length ? (
        <Typography color="text.secondary">{t('journey.editor.noInstructions')}</Typography>
      ) : (
        <Stack gap={1.5}>
          {instructionTemplates.map((it) => (
            <Accordion key={it.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, pr: 1 }}>
                  <DescriptionOutlinedIcon color="primary" fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {it.name}
                    </Typography>
                    {it.tags.length > 0 && (
                      <Stack direction="row" gap={0.5} mt={0.25}>
                        {it.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 18 }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Tooltip title={t('common.edit')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(it)
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(it.id, it.name)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: 'primary.light',
                    '& p': { mt: 0.5, mb: 0.5, typography: 'body2' },
                  }}
                >
                  <ReactMarkdown>{it.content}</ReactMarkdown>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      <EditInstructionDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={onSave}
        initial={editTarget}
        key={editTarget?.id ?? 'new'}
      />
    </Box>
  )
}
