import { DeadlineLabel, Stack } from 'duk-clinical-triage-demo'

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString()

export const Default = () => (
  <Stack spacing={1}>
    <DeadlineLabel deadline={inDays(-2)} />
    <DeadlineLabel deadline={inDays(0)} />
    <DeadlineLabel deadline={inDays(2)} />
    <DeadlineLabel deadline={inDays(12)} />
  </Stack>
)

export const QueueTone = () => (
  <Stack spacing={1}>
    <DeadlineLabel deadline={inDays(-3)} tone="queue" />
    <DeadlineLabel deadline={inDays(1)} tone="queue" />
    <DeadlineLabel deadline={inDays(9)} tone="queue" />
    <DeadlineLabel deadline={inDays(60)} tone="queue" />
  </Stack>
)
