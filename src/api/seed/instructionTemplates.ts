import type { InstructionTemplate } from '../schemas'
import { daysAgo, iso } from './shared'

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
  {
    id: 'it-physio-week4-general',
    name: 'Vecka 4 - Rörelseträning',
    tags: ['physio', 'week4', 'rehab'],
    content:
      'Rörelseträning: aktiv assisterad flexion och abduktion upp till 90°. Motverka svullnad med höjning och fingerrörelser.',
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-monitoring-baseline',
    name: 'Baslinjemätning - Instruktion',
    tags: ['monitoring', 'baseline'],
    content:
      'Baslinjemätning. Svara på frågorna om din smärta, rörlighet och livskvalitet. Dina svar hjälper teamet att följa din återhämtning.',
    createdAt: iso(daysAgo(30)),
    updatedAt: iso(daysAgo(30)),
  },
  {
    id: 'it-monitoring-recurring',
    name: 'Halvårsuppföljning - Instruktion',
    tags: ['monitoring', 'recurring'],
    content:
      'Halvårsuppföljning. Besvara frågorna om smärta, funktion och livskvalitet. Nästa uppföljning schemaläggs automatiskt 6 månader efter att du svarat.',
    createdAt: iso(daysAgo(30)),
    updatedAt: iso(daysAgo(30)),
  },
  // ── Knee OA templates ─────────────────────────────────────────────────────
  {
    id: 'it-knee-previsit',
    name: 'Förberedelse inför ortopedbesök',
    tags: ['knee', 'pre-visit', 'patient-info'],
    content: `## Förberedelse inför ditt ortopedbesök

**Ta med till besöket:**
- Lista med aktuella läkemedel och doser
- Röntgenbilder om du har egna kopior
- Antecknade frågor till läkaren

**Beskriv dina besvär:**
- Smärta: Hur ont gör det på en skala 0–10?
- Var sitter smärtan? Strålning till lår eller vader?
- Vilka aktiviteter begränsas av besvären?
- Hur länge har du haft besvären?

**Förväntan på besöket:**
Du träffar en ortoped som granskar din remiss och undersöker knäleden. Efter bedömningen informeras du om alternativa behandlingsmöjligheter och eventuellt fortsatt utredning eller operation diskuteras.

> **Tips:** Skriv ned dina besvär och frågor i förväg — besöket går snabbare och du glömmer inget viktigt.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-knee-waitinglist',
    name: 'Information under väntetid på operation',
    tags: ['knee', 'waiting-list', 'pre-op'],
    content: `## Under väntetiden på knäoperation

**Håll dig aktiv:**
- Fortsätt med lättare promenader och simning om du klarar det
- Undvik tunga lyft och aktiviteter som ger kraftig smärta
- Vattengymnastik är skonsamt och rekommenderas

**Rapportera förändring omedelbart till oss om:**
- Smärtan ökar kraftigt och inte svarar på smärtstillande
- Du får feber, rodnad eller svullnad i knäleden
- Du inte längre önskar operation

**Smärtlindring:**
- Paracetamol vid behov (upp till 4 g/dag)
- Ibuprofen kan kombineras vid behov — undvik på fastande mage
- Kontakta oss om du behöver starkare smärtstillande

**Livsstil:**
- Viktminskning minskar belastning på knäleden och förbättrar operationsresultat
- Rökstopp är viktigt — rökning fördröjer sårläkning och ökar komplikationsrisk

**Din plats i kön:**
Du kontaktas när din operationstid är klar. Vi hör av oss var tredje månad för att stämma av hur du mår.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-knee-physio-week1',
    name: 'Träningsprogram vecka 1–2 (postoperativt)',
    tags: ['knee', 'physio', 'post-op', 'week1'],
    content: `## Träningsprogram — Vecka 1–2 efter knäoperation

**Mål:** Minska svullnad, återfå grundläggande rörlighet, komma igång med belastning.

### Övningar 3–4 gånger per dag:

**Ankelrörelser** (dag 1 och framåt)
- Böj och sträck foten upprepade gånger, 20 repetitioner
- Cirkla med foten åt båda håll, 10 repetitioner per riktning

**Quadriceps-spänning** (dag 2 och framåt)
- Ligg på rygg med rakt ben
- Spänn lårmuskeln och tryck knävecket mot underlaget, håll 5 sekunder
- 10 repetitioner per ben

**Häl-sliding** (dag 2 och framåt)
- Ligg på rygg, dra långsamt hälen mot dig längs sängen
- Böj knäet så mycket det går utan kraftig smärta
- 10 repetitioner

**Stod och gång**
- Res dig med hjälp av rollator/kryckor
- Gå korta sträckor (10–15 min), öka gradvis

### Kylning och höjning:
- Kyla på opererat knä 15–20 min, 3–4 gånger per dag
- Höj benet när du vilar för att minska svullnad

> **Kontakta oss vid:** ökad värme, rodnad, feber >38.5°C, eller kraftig ökad smärta.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
  {
    id: 'it-knee-physio-week4',
    name: 'Träningsprogram vecka 4–6 (progressiv träning)',
    tags: ['knee', 'physio', 'post-op', 'week4'],
    content: `## Träningsprogram — Vecka 4–6 efter knäoperation

**Mål:** Progressiv styrketräning, återgå till vardagsaktiviteter, förbättra balans och koordination.

### Dagliga övningar:

**Minisquat** (knäböj med kontroll)
- Stå med fötterna axelbrett isär
- Böj knäna till ca 30–45°, håll 3 sekunder, sträck upp
- 3 × 10 repetitioner — öka djupet gradvis

**Utfall framåt**
- Ta ett steg framåt, sänk dig kontrollerat
- 3 × 8 repetitioner per ben

**Balansövning**
- Stå på ett ben, 3 × 30 sekunder
- Utmaning: gör det med ögonen stängda

**Cykling på konditionscykel**
- Börja med 10–15 min på lågt motstånd
- Öka successivt till 20–30 min

### Återgång till vardag:
- Bilkörning efter godkännande av läkare (vanligen vecka 4–6)
- Simning (ej bröstsim) kan påbörjas när såret är läkt

> **Individanpassa**: Om smärtan ökar markant — reducera belastning och kontakta din fysioterapeut.`,
    createdAt: iso(daysAgo(90)),
    updatedAt: iso(daysAgo(90)),
  },
]
