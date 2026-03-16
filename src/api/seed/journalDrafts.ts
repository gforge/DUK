import type { JournalDraft } from '../schemas'
import { daysAgo, iso } from './shared'

export const journalDrafts: JournalDraft[] = [
  // Anders Björk — case-1 — acute post-op, infection signs but normal labs
  {
    id: 'jd-1',
    caseId: 'case-1',
    templateId: 'jt-standard-sv',
    status: 'DRAFT',
    content: `## Ortopedisk journal

**Patient:** Anders Andersson (1945-01-01)

### Smärtstatus
- Smärta (NRS, vila): 8/10
- Smärta (NRS, natt): 7/10

### Fynd
Patienten rapporterar sårsekretion och feber postoperativt. Kontrollprover dag 10–14: CRP och Hb normala. Röntgen dag 14 utan komplikationer. Kvarstående sårsekretion och hög smärta trots normala inflammationsmarkörer.

### Åtgärd och plan
Förnyad sårinspektion rekommenderas. Ytlig sårinfektion kan ej uteslutas. Överväg utökad sårvård och tätare uppföljning.`,
    createdByUserId: 'user-pal-1',
    createdAt: iso(daysAgo(1)),
    updatedAt: iso(daysAgo(1)),
  },
  // Bert Borg — case-14 — distal radius, OSS deterioration V4→V8
  {
    id: 'jd-2',
    caseId: 'case-14',
    templateId: 'jt-standard-sv',
    status: 'DRAFT',
    content: `## Ortopedisk journal

**Patient:** Bert Borg (1957-04-04)

### Smärtstatus
- Smärta (NRS, vila): 6/10
- Smärta (NRS, natt): –

### OSS-utveckling
- Vecka 4: 36/48
- Vecka 8: 20/48
- Trend: försämras

### Klinisk bedömning
Oväntat skov vid vecka 8. Patienten upplever tilltagande smärta och försämrad handfunktion sedan 4-veckorskontrollen. Möjliga differentialdiagnoser: CRPS, adherenser, sekundär felläkning. Laboratorieprover inväntas.

### Åtgärd och plan
Ny läkarbedömning motiverad. Vid utebliven förbättring efter provsvar — överväg remiss till handkirurgi.`,
    createdByUserId: 'user-doc-1',
    createdAt: iso(daysAgo(2)),
    updatedAt: iso(daysAgo(2)),
  },
]
