import { Stack, StatusChip } from 'duk-clinical-triage-demo'

export const AllStatuses = () => (
  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
    <StatusChip status="NEW" />
    <StatusChip status="NEEDS_REVIEW" />
    <StatusChip status="TRIAGED" />
    <StatusChip status="FOLLOWING_UP" />
    <StatusChip status="CLOSED" />
  </Stack>
)

export const MediumSize = () => (
  <Stack direction="row" spacing={1}>
    <StatusChip status="NEEDS_REVIEW" size="medium" />
    <StatusChip status="TRIAGED" size="medium" />
  </Stack>
)
