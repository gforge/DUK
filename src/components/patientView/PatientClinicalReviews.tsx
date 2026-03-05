import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import BiotechIcon from '@mui/icons-material/Biotech'
import ImageIcon from '@mui/icons-material/Image'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../hooks/useApi'
import * as client from '../../api/client'

interface Props {
  patientId: string
}

export default function PatientClinicalReviews({ patientId }: Readonly<Props>) {
  const { t } = useTranslation()
  const [openDetails, setOpenDetails] = useState(false)

  // Fetch all cases to find pending reviews
  const { data: cases } = useApi(() => client.getCasesByPatient(patientId), [patientId])

  // Collect all pending reviews from all cases
  const allPendingReviews = React.useMemo(() => {
    if (!cases) return []
    return cases
      .flatMap((c) => c.reviews?.map((r) => ({ ...r, caseId: c.id })) ?? [])
      .filter((r) => r.reviewedAt === null)
  }, [cases])

  if (allPendingReviews.length === 0) {
    return null
  }

  const labCount = allPendingReviews.filter((r) => r.type === 'LAB').length
  const xrayCount = allPendingReviews.filter((r) => r.type === 'XRAY').length

  return (
    <>
      <Box sx={{ mb: 2 }}>
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
      </Box>

      {/* Details dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('patient.pendingReviews')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ mt: 1 }}>
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
                    {t(`reviewType.${review.type}`)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('review.createdAt', {
                    date: new Date(review.createdAt).toLocaleDateString(),
                  })}
                </Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
