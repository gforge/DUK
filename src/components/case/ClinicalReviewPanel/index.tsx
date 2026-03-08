import AddIcon from '@mui/icons-material/Add'
import { Box, Button, CircularProgress } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import type { Case, ReviewOutcome,ReviewType } from '@/api/schemas'
import { useApi } from '@/hooks/useApi'
import { useRole } from '@/store/roleContext'
import { useSnack } from '@/store/snackContext'

import AddReviewDialog from './AddReviewDialog'
import CompletedReviewsTable from './CompletedReviewsTable'
import CompleteReviewDialog from './CompleteReviewDialog'
import PendingReviewsSection from './PendingReviewsSection'

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
        <AddReviewDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          reviewType={newReviewType}
          setReviewType={setNewReviewType}
          loading={loadingReviewId === 'creating'}
          onConfirm={handleCreateReview}
        />
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <PendingReviewsSection
        reviews={pendingReviews}
        userMap={userMap}
        isClinician={isClinician}
        currentUserRole={currentUser.role}
        loadingReviewId={loadingReviewId}
        onMarkReviewed={(id) => setSelectedReviewId(id)}
        onDelete={handleDeleteReview}
      />

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

      <CompletedReviewsTable reviews={completedReviews} userMap={userMap} />

      <AddReviewDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        reviewType={newReviewType}
        setReviewType={setNewReviewType}
        loading={loadingReviewId === 'creating'}
        onConfirm={handleCreateReview}
      />

      <CompleteReviewDialog
        open={!!selectedReviewId}
        outcome={reviewOutcome}
        note={reviewNote}
        loading={completingReviewId === selectedReviewId}
        onClose={() => {
          setSelectedReviewId(null)
          setReviewOutcome('OK')
          setReviewNote('')
        }}
        onChangeOutcome={(o) => setReviewOutcome(o)}
        onChangeNote={(n) => setReviewNote(n)}
        onConfirm={() => selectedReviewId && handleCompleteReview(selectedReviewId)}
      />
    </Box>
  )
}
