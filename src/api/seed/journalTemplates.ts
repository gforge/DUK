import { iso, daysAgo } from './shared'
import type { JournalTemplate } from '../schemas'

const STANDARD_BODY_SV = `## Ortopedisk journal – standardmall

**Patient:** {{patient.displayName}} ({{patient.dateOfBirth}})

### Smärtstatus
- Smärta (NRS, vila): {{scores.PNRS_1}}/10
- Smärta (NRS, natt): {{scores.PNRS_NIGHT}}/10
- OSS-total: {{scores.OSS.total}}/48

### Klinisk bedömning
{{triage.internalNote}}

### Åtgärd och plan
Nästa steg: {{triage.nextStep}}
Deadline: {{triage.deadline}}

### Information till patient
{{triage.patientMessage}}

### Automatiska varningar
{{policyWarnings.list}}
`

const STANDARD_BODY_EN = `## Orthopaedic Journal – Standard Template

**Patient:** {{patient.displayName}} ({{patient.dateOfBirth}})

### Pain status
- Pain (NRS, rest): {{scores.PNRS_1}}/10
- Pain (NRS, night): {{scores.PNRS_NIGHT}}/10
- OSS total: {{scores.OSS.total}}/48

### Clinical assessment
{{triage.internalNote}}

### Action and plan
Next step: {{triage.nextStep}}
Deadline: {{triage.deadline}}

### Patient information
{{triage.patientMessage}}

### Automatic warnings
{{policyWarnings.list}}
`

const CLOSURE_BODY_SV = `## Avslutningsanteckning

**Patient:** {{patient.displayName}} ({{patient.dateOfBirth}})

### Slutresultat
- Smärta (NRS, vila): {{scores.PNRS_1}}/10
- Smärta (NRS, natt): {{scores.PNRS_NIGHT}}/10
- OSS vid avslut: {{scores.OSS.total}}/48
- EQ-5D: {{scores.EQ5D.index}}
- EQ VAS: {{scores.EQ_VAS}}

### Klinisk sammanfattning
{{triage.internalNote}}

### Rekommendationer
{{triage.patientMessage}}

Ärendet avslutas. Patient uppmuntras att återta kontakt vid symtomförsämring.
`

const CLOSURE_BODY_EN = `## Closure Note

**Patient:** {{patient.displayName}} ({{patient.dateOfBirth}})

### Final outcomes
- Pain (NRS, rest): {{scores.PNRS_1}}/10
- Pain (NRS, night): {{scores.PNRS_NIGHT}}/10
- OSS at closure: {{scores.OSS.total}}/48
- EQ-5D: {{scores.EQ5D.index}}
- EQ VAS: {{scores.EQ_VAS}}

### Clinical summary
{{triage.internalNote}}

### Recommendations
{{triage.patientMessage}}

Case closed. Patient advised to re-contact if symptoms worsen.
`

export const journalTemplates: JournalTemplate[] = [
  {
    id: 'jt-standard-sv',
    name: 'Standardjournal',
    language: 'sv',
    body: STANDARD_BODY_SV,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'jt-standard-en',
    name: 'Standard Journal',
    language: 'en',
    body: STANDARD_BODY_EN,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'jt-closure-sv',
    name: 'Avslutningsanteckning',
    language: 'sv',
    body: CLOSURE_BODY_SV,
    createdAt: iso(daysAgo(100)),
  },
  {
    id: 'jt-closure-en',
    name: 'Closure Note',
    language: 'en',
    body: CLOSURE_BODY_EN,
    createdAt: iso(daysAgo(100)),
  },
]
