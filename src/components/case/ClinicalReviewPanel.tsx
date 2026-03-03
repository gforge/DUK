import React, { useState } from 'react'
import {
  Alert,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import PendingIcon from '@mui/icons-material/Pending'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useRole } from '../../store/roleContext'
import { useSnack } from '../../store/snackContext'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'
import type { Case, ReviewType, ReviewOutcome } from '../../api/schemas'
import { RoleIcon } from '../common/RoleIcon'

function outcomeColor(
  outcome: ReviewOutcome | undefined,
): 'success' | 'warning' | 'error' | 'default' {
  if (outcome === 'OK') return 'success'
  if (outcome === 'UNCERTAIN') return 'warning'
  if (outcome === 'PROBLEM') return 'error'
  return 'default'
}

interface Props {
  readonly caseData: Case
  readonly onRefetch: () => void
}

export default function ClinicalReviewPanel({ caseData, onRefetch }: Props) {
  const { t } = useTranslation()
  const { currentUser, isRole } = useRole()
  const { showSnack } = useSnack()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>('OK')
  const [reviewNote, setReviewNote] = useState('')
  const [newReviewType, setNewReviewType] = useState<ReviewType>('LAB')
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null)
  const [completingReviewId, setCompletingReviewId] = useState<string | null>(null)

  const { data: reviewsData, loading } = useApi(
    () => client.getAllReviews(caseData.id),
    [caseData.id],
  )
  const allReviews = reviewsData ?? []

  const { data: users } = useApi(() => client.getUsers(), [])
  const userMap = React.useMemo(() => {
    if (!users) return new Map()
    return new Map(users.map((u) => [u.id, u]))
  }, [users])

  const pendingReviews = allReviews.filter((r) => r.reviewedAt === null)
  const completedReviews = allReviews.filter((r) => r.reviewedAt !== null)

  const isClinician = isRole('NURSE', 'DOCTOR', 'PAL')

  async function handleCreateReview() {
    try {
      setLoadingReviewId('creating')
      await client.createReview(caseData.id, newReviewType, currentUser.id, currentUser.role)
      showSnack(t('review.created'), 'success')
      setOpenAddDialog(false)
      setNewReviewType('LAB')
      onRefetch()
    } catch {
      showSnack(t('common.errorGeneric'), 'error')
    } finally {
      setLoadingReviewId(null)
    }
  }

  async function handleCompleteReview(reviewId: string) {
    try {
      setCompletingReviewId(reviewId)
      await client.completeReview(
        reviewId,
        caseData.id,
        currentUser.id,
        currentUser.role,
        reviewOutcome,
        reviewNote || undefined,
      )
      showSnack(t('review.completed'), 'success')
      setSelectedReviewId(null)
      setReviewOutcome('OK')
      setReviewNote('')
      onRefetch()
    } catch {
      showSnack(t('common.errorGeneric'), 'error')
    } finally {
      setCompletingReviewId(null)
    }
  }

  async function handleDeleteReview(reviewId: string) {
    try {
      setLoadingReviewId(reviewId)
      await client.deleteReview(reviewId, caseData.id)
      showSnack(t('review.deleted'), 'info')
      onRefetch()
    } catch {
      showSnack(t('common.errorGeneric'), 'error')
    } finally {
      setLoadingReviewId(null)
    }
  }

  if (loading) return <CircularProgress size={24} />

  if (allReviews.length === 0) {
    if (!isClinician) return null

    return (
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={() => setOpenAddDialog(true)}
        >
          {t('review.addReview')}
        </Button>

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
          <DialogTitle>{t('review.addReview')}</DialogTitle>
          <DialogContent sx={{ minWidth: 400, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('review.type')}</InputLabel>
              <Select
                value={newReviewType}
                label={t('review.type')}
                onChange={(e) => setNewReviewType(e.target.value as ReviewType)}
              >
                <MenuItem value="LAB">{t('reviewType.LAB')}</MenuItem>
                <MenuItem value="XRAY">{t('reviewType.XRAY')}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreateReview}
              variant="contained"
              disabled={loadingReviewId === 'creating'}
            >
              {loadingReviewId === 'creating' ? (
                <CircularProgress size={24} />
              ) : (
                t('common.confirm')
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Pending reviews section */}
      {pendingReviews.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<PendingIcon />}>
          <Stack gap={1.5}>
            <Typography variant="body2" fontWeight={600}>
              {t('review.pending')} ({pendingReviews.length})
            </Typography>
            <Stack gap={1}>
              {pendingReviews.map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1}>
                    <Box>
                      <Chip
                        label={t(`reviewType.${review.type}`)}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <RoleIcon role={review.createdByRole} sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {userMap.get(review.createdByUserId)?.name ?? review.createdByUserId}
                        </Typography>
                      </Stack>
                    </Box>
                    {isClinician && (
                      <Stack direction="row" gap={0.5}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setSelectedReviewId(review.id)}
                        >
                          {t('review.markReviewed')}
                        </Button>
                        {currentUser.role !== 'PATIENT' && (
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={loadingReviewId === review.id}
                          >
                            {loadingReviewId === review.id ? <CircularProgress size={16} /> : null}
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Alert>
      )}

      {/* Add new review button */}
      {isClinician && (
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          onClick={() => setOpenAddDialog(true)}
        >
          {t('review.addReview')}
        </Button>
      )}

      {/* Completed reviews table */}
      {completedReviews.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('review.completed')} ({completedReviews.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('review.type')}</TableCell>
                  <TableCell>{t('review.outcome')}</TableCell>
                  <TableCell>{t('review.reviewedBy')}</TableCell>
                  <TableCell>{t('review.reviewedAt')}</TableCell>
                  <TableCell>{t('review.note')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Stack direction="row" gap={1} alignItems="center">
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Chip label={t(`reviewType.${review.type}`)} size="small" />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {review.outcome ? (
                        <Chip
                          label={t(`reviewOutcome.${review.outcome}`)}
                          size="small"
                          color={outcomeColor(review.outcome)}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {review.reviewedByUserId && review.reviewedByRole ? (
                        <Stack direction="row" gap={0.5} alignItems="center">
                          <RoleIcon role={review.reviewedByRole} sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            {userMap.get(review.reviewedByUserId)?.name ?? review.reviewedByUserId}
                          </Typography>
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{review.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Add new review dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>{t('review.addReview')}</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('review.type')}</InputLabel>
            <Select
              value={newReviewType}
              label={t('review.type')}
              onChange={(e) => setNewReviewType(e.target.value as ReviewType)}
            >
              <MenuItem value="LAB">{t('reviewType.LAB')}</MenuItem>
              <MenuItem value="XRAY">{t('reviewType.XRAY')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreateReview}
            variant="contained"
            disabled={loadingReviewId === 'creating'}
          >
            {loadingReviewId === 'creating' ? <CircularProgress size={24} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete review dialog */}
      {selectedReviewId && (
        <Dialog
          open={!!selectedReviewId}
          onClose={() => {
            setSelectedReviewId(null)
            setReviewOutcome('OK')
            setReviewNote('')
          }}
        >
          <DialogTitle>{t('review.markReviewed')}</DialogTitle>
          <DialogContent sx={{ minWidth: 420, pt: 2 }}>
            <Stack gap={2.5}>
              <ToggleButtonGroup
                value={reviewOutcome}
                exclusive
                fullWidth
                onChange={(_, val: ReviewOutcome | null) => {
                  if (val) {
                    setReviewOutcome(val)
                    setReviewNote('')
                  }
                }}
              >
                <ToggleButton value="OK" color="success">
                  <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                  {t('reviewOutcome.OK')}
                </ToggleButton>
                <ToggleButton value="UNCERTAIN" color="warning">
                  <HelpOutlineIcon sx={{ mr: 1 }} />
                  {t('reviewOutcome.UNCERTAIN')}
                </ToggleButton>
                <ToggleButton value="PROBLEM" color="error">
                  <ReportProblemIcon sx={{ mr: 1 }} />
                  {t('reviewOutcome.PROBLEM')}
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('review.comment')}
                placeholder={t('review.commentPlaceholder')}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                required={reviewOutcome !== 'OK'}
                error={reviewOutcome !== 'OK' && !reviewNote.trim()}
                helperText={
                  reviewOutcome !== 'OK' && !reviewNote.trim()
                    ? t('review.commentRequired')
                    : undefined
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setSelectedReviewId(null)
                setReviewOutcome('OK')
                setReviewNote('')
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => selectedReviewId && handleCompleteReview(selectedReviewId)}
              variant="contained"
              disabled={
                completingReviewId === selectedReviewId ||
                (reviewOutcome !== 'OK' && !reviewNote.trim())
              }
            >
              {completingReviewId === selectedReviewId ? (
                <CircularProgress size={24} />
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
