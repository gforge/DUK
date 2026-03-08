import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Hint {
  pnr: string
  displayName: string
  pnr12: string
}

interface Props {
  hintOpen: boolean
  setHintOpen: (v: boolean) => void
  demoHints: Hint[]
  registeredPnrs: Set<string>
  onSelectPnr: (pnr: string) => void
}

export function DemoRegisterHint({
  hintOpen,
  setHintOpen,
  demoHints,
  registeredPnrs,
  onSelectPnr,
}: Props) {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'info.light',
        borderRadius: 1,
        bgcolor: 'info.50',
        overflow: 'hidden',
        mt: 1,
      }}
    >
      <Button
        fullWidth
        size="small"
        onClick={() => setHintOpen(!hintOpen)}
        startIcon={<InfoOutlinedIcon color="info" />}
        endIcon={hintOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          justifyContent: 'flex-start',
          textTransform: 'none',
          color: 'info.dark',
          fontWeight: 600,
          px: 1.5,
          py: 1,
          borderRadius: 0,
        }}
      >
        {t('patients.register.demoHintTitle')}
      </Button>

      <Collapse in={hintOpen}>
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {t('patients.register.demoHintDescription')}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
                  {t('patients.displayName')}
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
                  {t('patients.personalNumber')}
                </TableCell>
                <TableCell sx={{ py: 0.5 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {demoHints.map((hint) => {
                const alreadyRegistered =
                  registeredPnrs.has(hint.pnr12) || registeredPnrs.has(hint.pnr12.slice(2))
                return (
                  <TableRow
                    key={hint.pnr12}
                    hover={!alreadyRegistered}
                    sx={{
                      cursor: alreadyRegistered ? 'default' : 'pointer',
                      opacity: alreadyRegistered ? 0.5 : 1,
                    }}
                    onClick={() => !alreadyRegistered && onSelectPnr(hint.pnr)}
                  >
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{hint.displayName}</TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {hint.pnr}
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      {alreadyRegistered && (
                        <Chip
                          label={t('patients.register.demoHintAlreadyRegistered')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Box>
  )
}
