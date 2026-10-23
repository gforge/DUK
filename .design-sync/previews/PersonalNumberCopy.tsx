import { PersonalNumberCopy, Stack } from 'duk-clinical-triage-demo'

export const Short = () => <PersonalNumberCopy personalNumber="195403128821" />

export const LongLabel = () => (
  <PersonalNumberCopy personalNumber="19540312-8821" labelFormat="long" color="text.primary" />
)

export const Variants = () => (
  <Stack spacing={1}>
    <PersonalNumberCopy personalNumber="198811052394" showCopy={false} />
    <PersonalNumberCopy personalNumber="198811052394" labelFormat="none" />
    <PersonalNumberCopy personalNumber={null} />
  </Stack>
)
