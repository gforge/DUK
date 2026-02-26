import { iso, daysAgo } from './shared'
import type { InstructionTemplate } from '../schemas'

export const instructionTemplates: InstructionTemplate[] = [
  {
    id: 'it-proximal-humerus',
    name: 'Proximal Humerus — Physio Protocol',
    tags: ['shoulder', 'physio', 'fracture'],
    content: `## Rörelseträning — Proximal humerusfraktur

**Vecka 1–2:** Vila i mitella. Rör på fingrarna och handleden för att motverka svullnad. Pendlingsövningar tillåtna (armen hänger fritt och pendlar med gravitationen).

**Vecka 2–4:** Ta bort mitella gradvis. Aktiv assisterad rörelseträning: flexion och abduktion upp till 90°. Fortsätt pendlingsövningar.

**Vecka 4–6:** Aktiv rörelseträning utan stöd. Extensionsövningar. Börja lätt muskelstärkande om smärtan tillåter.

**Vecka 6–12:** Progressiv styrketräning. Mål: full rörlighet och normal styrka.

> **OBS:** Individanpassa efter smärta och röntgenfynd. Kontakta ansvarig läkare vid ökad smärta eller utebliven förbättring.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-distal-radius',
    name: 'Distal Radius — Physio Protocol',
    tags: ['wrist', 'physio', 'fracture'],
    content: `## Rörelseträning — Distal radiusfraktur

**Dag 1–10 (gipsat):** Rör aktivt på fingrarna, tummen och armbågen. Höj handen för att minska svullnad.

**Vecka 2–3 (gipsavlägsnat):** Aktiv handledsträning: flexion, extension, radial- och ulnardeviation. Börja försiktigt med pronation/supination.

**Vecka 3–6:** Öka rörelseomfånget progressivt. Lätt greppstyrketräning med mjukt hjälpmedel. Undvik tung belastning.

**Vecka 6–12:** Progressiv styrketräning. Återgång till normala aktiviteter efter klinisk bedömning.

> **Patientinformation:** Svullnad och stelhet efter gipsavlägsnande är normalt — minskar med träning.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-wound-care',
    name: 'Wound Care Instructions',
    tags: ['wound', 'post-op', 'infection'],
    content: `## Sårvård efter operation

**Dagar 1–3:** Håll såret torrt och täckt med sterilt förband. Undvik att blöta ner operationsområdet.

**Kontakta vården omedelbart vid:**
- Ökad rodnad, värme eller svullnad
- Vätska eller var från såret
- Feber (>38,5 °C)
- Kraftigt ökad smärta

**Dagar 3–10:** Byt förband dagligen eller vid genomblötning. Tvätta händerna noga innan och efter.

**Suturtagning:** Planeras vid dag 10–14 — tid bokas av mottagningen.

> Frågor om såret? Ring mottagningen på telefonnummer i ditt informationsbrev.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-post-op-general',
    name: 'Post-Op General Information',
    tags: ['post-op', 'general', 'patient-info'],
    content: `## Allmän information efter operation

**Smärtlindring:** Ta smärtstillande enligt ordination. Paracetamol och ibuprofen kan kombineras vid behov.

**Svullnad:** Lägg upp opererat område för att minska svullnad, särskilt de första dagarna.

**Aktivitet:** Undvik tung belastning tills läkaren säger annat. Lätt promenad uppmuntras från dag 1.

**Näring:** Ät proteinkostnäring för att stödja läkning. Undvik rökning — det försämrar sårläkning avsevärt.

**Kontroll:** Din nästa kontroll är inbokad — se nedan. Utebliv inte utan att kontakta oss.

**Vid oro:** Tveka inte att kontakta mottagningen.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
]
