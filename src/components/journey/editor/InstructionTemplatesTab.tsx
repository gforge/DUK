import React, { useState } from 'react'
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import type { InstructionTemplate } from '../../../api/schemas'

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
    <Dialog maxWidth="sm" open={open} onClose={onClose} fullWidth>
      <DialogTitle>{initial ? t('common.edit') : t('journey.editor.tabInstructions')}</DialogTitle>
      <DialogContent>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        <Stack sx={{ gap: 2, mt: 1 }}>
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
      <Stack sx={{ justifyContent: 'flex-end', mb: 1.5 }} direction="row">
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}>
          {t('journey.editor.addInstruction')}
        </Button>
      </Stack>

      {!instructionTemplates?.length ? (
        <Typography color="text.secondary">{t('journey.editor.noInstructions')}</Typography>
      ) : (
        <Stack sx={{ gap: 1.5 }}>
          {instructionTemplates.map((it) => (
            <Accordion key={it.id} variant="outlined" sx={{ borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack sx={{ alignItems: 'center', gap: 1.5, flex: 1, pr: 1 }} direction="row">
                  <DescriptionOutlinedIcon color="primary" fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
                      {it.name}
                    </Typography>
                    {it.tags.length > 0 && (
                      <Stack sx={{ gap: 0.5, mt: 0.25 }} direction="row">
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
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      color: 'text.secondary',
                    }}
                  >
                    {it.content}
                  </Typography>
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
