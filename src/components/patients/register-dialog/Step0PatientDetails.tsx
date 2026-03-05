import React from 'react'
import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTranslation } from 'react-i18next'
import { parsePersonnummer } from '@/api/utils/personnummer'
import { DemoRegisterHint } from './DemoRegisterHint'

interface Props {
  personalNumber: string
  setPersonalNumber: (v: string) => void
  lookupStatus: 'idle' | 'loading' | 'found' | 'not-found'
  _lookupName: string | null
  displayName: string
  setDisplayName: (v: string) => void
  dateOfBirth: string
  setDateOfBirth: (v: string) => void
  registerName: string | null
  hintOpen: boolean
  setHintOpen: (v: boolean) => void
  registeredPnrs: Set<string>
  demoHints: Array<{ pnr: string; displayName: string; pnr12: string }>
  handleLookup: () => void
  onSelectPnr: (pnr: string) => void
}

export function Step0PatientDetails({
  personalNumber,
  setPersonalNumber,
  lookupStatus,
  _lookupName, // unused, preserved for future
  displayName,
  setDisplayName,
  dateOfBirth,
  setDateOfBirth,
  registerName,
  hintOpen,
  setHintOpen,
  registeredPnrs,
  demoHints,
  handleLookup,
  onSelectPnr,
}: Props) {
  const { t } = useTranslation()
  const pnrInfo = parsePersonnummer(personalNumber)

  return (
    <>
      {/* Personnummer input + lookup button */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          label={t('patients.personalNumber')}
          value={personalNumber}
          onChange={(e) => {
            setPersonalNumber(e.target.value)
          }}
          size="small"
          fullWidth
          required
          autoFocus
          placeholder="YYYYMMDD-XXXX"
        />
        <Button
          variant="outlined"
          onClick={handleLookup}
          disabled={lookupStatus === 'loading' || !personalNumber.trim()}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0, height: 40 }}
        >
          {lookupStatus === 'loading' ? (
            <CircularProgress size={18} />
          ) : (
            t('patients.register.fetchFromRegister')
          )}
        </Button>
      </Box>

      {pnrInfo.isValid && pnrInfo.isReservnummer && (
        <Alert severity="info" sx={{ py: 0.5, mt: 1 }}>
          {t('patients.register.reservnummerDetected')}
        </Alert>
      )}

      {lookupStatus === 'found' && registerName && (
        <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ py: 0.5, mt: 1 }}>
          {t('patients.register.foundInRegister')}: <strong>{registerName}</strong>
        </Alert>
      )}

      {lookupStatus === 'not-found' && (
        <Alert severity="warning" sx={{ py: 0.5, mt: 1 }}>
          {t('patients.register.notFoundInRegister')}
        </Alert>
      )}

      {(lookupStatus === 'found' || lookupStatus === 'not-found') && (
        <TextField
          label={
            lookupStatus === 'found'
              ? t('patients.register.nameOverride')
              : t('patients.displayName')
          }
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          size="small"
          fullWidth
          required={lookupStatus === 'not-found'}
          placeholder={lookupStatus === 'found' ? (registerName ?? '') : 'Anna Johansson'}
          helperText={
            lookupStatus === 'found' ? t('patients.register.nameOverrideHint') : undefined
          }
          sx={{ mt: 1 }}
        />
      )}

      {(lookupStatus === 'found' || lookupStatus === 'not-found') && pnrInfo.isReservnummer && (
        <TextField
          label={t('patients.dateOfBirth')}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          size="small"
          type="date"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 1 }}
        />
      )}

      <DemoRegisterHint
        hintOpen={hintOpen}
        setHintOpen={setHintOpen}
        demoHints={demoHints}
        registeredPnrs={registeredPnrs}
        onSelectPnr={onSelectPnr}
      />
    </>
  )
}
