import { Stack, TriggerChips } from 'duk-clinical-triage-demo'

export const Mixed = () => <TriggerChips triggers={['HIGH_PAIN', 'LOW_FUNCTION', 'SEEK_CONTACT']} />

export const Overflow = () => (
  <TriggerChips
    triggers={['INFECTION_SUSPECTED', 'ABNORMAL_ANSWER', 'NO_RESPONSE', 'LAB_PENDING', 'XRAY_PENDING']}
  />
)

export const AllTypes = () => (
  <Stack sx={{ maxWidth: 520 }}>
    <TriggerChips
      maxVisible={10}
      triggers={[
        'HIGH_PAIN',
        'INFECTION_SUSPECTED',
        'ABNORMAL_ANSWER',
        'LOW_FUNCTION',
        'LOW_QOL',
        'NOT_OPENED',
        'NO_RESPONSE',
        'SEEK_CONTACT',
        'LAB_PENDING',
        'XRAY_PENDING',
      ]}
    />
  </Stack>
)
