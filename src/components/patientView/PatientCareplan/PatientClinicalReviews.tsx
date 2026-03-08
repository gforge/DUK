import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as client from '@/api/client'
import { useReviewTypeLabel } from '@/hooks/labels'
import { useApi } from '@/hooks/useApi'

interface Props {
  patientId: string
}

export function PatientClinicalReviews({ patientId }: Readonly<Props>) {
  const { t } = useTranslation()
  const getReviewTypeLabel = useReviewTypeLabel()
  const [openDetails, setOpenDetails] = useState(false)

  // Fetch all cases to find reviews
  const { data: cases } = useApi(() => client.getCasesByPatient(patientId), [patientId])

  // Collect only MANUAL reviews — JOURNEY reviews are shown inline on each timeline step
  const allReviews = React.useMemo(() => {
    if (!cases) return []
    return cases.flatMap(
      (c) =>
        c.reviews?.filter((r) => r.source === 'MANUAL').map((r) => ({ ...r, caseId: c.id })) ?? [],
    )
  }, [cases])

  const allPendingReviews = allReviews.filter((r) => r.reviewedAt === null)
  const allCompletedReviews = allReviews.filter((r) => r.reviewedAt !== null)

  if (allReviews.length === 0) {
    return null
  }

  const labCount = allPendingReviews.filter((r) => r.type === 'LAB').length
  const xrayCount = allPendingReviews.filter((r) => r.type === 'XRAY').length

  return (
    <>
      <Box sx={{ mb: 2 }}>
        {allPendingReviews.length > 0 && (
          <Alert severity="info" icon={false}>
            <Stack gap={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('patient.pendingReviews')}
              </Typography>
              <Stack direction="row" gap={1}>
                {labCount > 0 && (
                  <Chip
                    icon={<BiotechIcon />}
                    label={t('reviewType.LAB', { count: labCount })}
                    color="info"
                    size="small"
                  />
                )}
                {xrayCount > 0 && (
                  <Chip
                    icon={<ImageIcon />}
                    label={t('reviewType.XRAY', { count: xrayCount })}
                    color="info"
                    size="small"
                  />
                )}
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenDetails(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('patient.viewDetails')}
              </Button>
            </Stack>
          </Alert>
        )}

        {allCompletedReviews.length > 0 && (
          <Alert severity="success" icon={false} sx={{ mt: allPendingReviews.length > 0 ? 2 : 0 }}>
            <Stack gap={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('patient.completedReviews')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('patient.completedReviewsCount', { count: allCompletedReviews.length })}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenDetails(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('patient.viewDetails')}
              </Button>
            </Stack>
          </Alert>
        )}
      </Box>

      {/* Details dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('patient.clinicalReviews')}</DialogTitle>
        <DialogContent>
          {allPendingReviews.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                {t('patient.pendingReviews')}
              </Typography>
              <Stack gap={1.5}>
                {allPendingReviews.map((review) => (
                  <Box
                    key={review.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                      {review.type === 'LAB' ? (
                        <BiotechIcon color="info" fontSize="small" />
                      ) : (
                        <ImageIcon color="info" fontSize="small" />
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {getReviewTypeLabel(review.type)}
                      </Typography>
                      <Chip
                        label={t('review.pending')}
                        size="small"
                        color="info"
                        sx={{ ml: 'auto', height: 20 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t('review.createdAt', {
                        date: new Date(review.createdAt).toLocaleDateString(),
                      })}
                    </Typography>
                    {review.journeyStepLabel && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('review.journeyStep', { label: review.journeyStepLabel })}
                      </Typography>
                    )}
                    {review.note && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {review.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {allCompletedReviews.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                {t('patient.completedReviews')}
              </Typography>
              <Stack gap={1.5}>
                {allCompletedReviews.map((review) => (
                  <Box
                    key={review.id}
                    sx={{
                      border: 1,
                      borderColor: 'success.light',
                      borderRadius: 1,
                      p: 1.5,
                      bgcolor: 'success.50',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                      {review.type === 'LAB' ? (
                        <BiotechIcon color="success" fontSize="small" />
                      ) : (
                        <ImageIcon color="success" fontSize="small" />
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {getReviewTypeLabel(review.type)}
                      </Typography>
                      <Chip
                        label={t('review.completed')}
                        size="small"
                        color="success"
                        sx={{ ml: 'auto', height: 20 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t('review.reviewedAt', {
                        date: new Date(review.reviewedAt!).toLocaleDateString(),
                      })}
                    </Typography>
                    {review.journeyStepLabel && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('review.journeyStep', { label: review.journeyStepLabel })}
                      </Typography>
                    )}
                    {review.note && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                      >
                        {review.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
