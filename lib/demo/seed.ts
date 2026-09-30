// Deterministic demo dataset. Built once per server process and then mutated
// in place by the server actions, exactly like the production app mutates its
// rules tables — only the storage is a plain object instead of Postgres.

import type {
  AppUserRec,
  AuditRec,
  BandColorValue,
  BucketRateRec,
  BucketRec,
  CategoryMappingRec,
  CommissionLineRec,
  CommissionMonthlyRec,
  DemoState,
  DoctorBucketRateRec,
  DoctorKpiMonthlyRec,
  DoctorKpiProfileRec,
  DoctorMonthlyStatsRec,
  DoctorPayoutRec,
  KpiMetricValue,
  KpiProfileBandRec,
  KpiProfileRec,
  ServiceCatalogRec,
  ServiceExclusionRec,
  ServiceMappingRec,
  SourceRec,
  SpecializationBandRec,
  SpecializationRec,
  StaffRec,
  StaffSpecializationRec,
} from "./types"

/* ------------------------------- primitives ------------------------------- */

/** mulberry32 — small, fast, seeded PRNG so every deploy renders identical numbers. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/* -------------------------------- calendar -------------------------------- */

export const PERIODS = [
  "2025-11-01",
  "2025-12-01",
  "2026-01-01",
  "2026-02-01",
  "2026-03-01",
  "2026-04-01",
  "2026-05-01",
  "2026-06-01",
]

/** Latest month — the one carrying the open questions on /attention. */
export const CURRENT_PERIOD = "2026-06-01"
/** Everything older than this is already frozen. */
const FROZEN_THROUGH = "2026-04-01"

const RULES_FROM = "2025-11-01"

/* --------------------------------- buckets -------------------------------- */

const BUCKETS: [string, string, "source" | "performer", number, number][] = [
  ["medlab", "Laboratoř MEDLAB", "source", 0.07, 10],
  ["smear", "MEDLAB stěry gyn./urol.", "performer", 0.05, 20],
  ["biomat", "MEDLAB biomateriál", "source", 0.05, 30],
  ["esculab", "Laboratoř ESCULAB", "source", 0.07, 40],
  ["inhouse", "Interní laboratoř", "source", 0.07, 50],
  ["consult", "Konzultace jiných specialistů", "source", 0.1, 60],
  ["uzd", "Ultrazvuk", "source", 0.1, 70],
  ["endo", "Endoskopie", "source", 0.1, 80],
  ["ekg", "EKG", "source", 0.1, 90],
]

/** bucket -> [rate, valid_from, valid_to] versions, newest last. */
const RATE_HISTORY: Record<string, [number, string, string | null][]> = {
  medlab: [
    [0.05, RULES_FROM, "2026-03-01"],
    [0.07, "2026-03-01", null],
  ],
  smear: [[0.05, RULES_FROM, null]],
  biomat: [[0.05, RULES_FROM, null]],
  esculab: [[0.07, RULES_FROM, null]],
  inhouse: [
    [0.06, RULES_FROM, "2026-02-01"],
    [0.07, "2026-02-01", null],
  ],
  consult: [[0.1, RULES_FROM, null]],
  uzd: [
    [0.08, RULES_FROM, "2026-05-01"],
    [0.1, "2026-05-01", null],
  ],
  endo: [[0.1, RULES_FROM, null]],
  ekg: [[0.1, RULES_FROM, null]],
}

/* ------------------------------- categories ------------------------------- */

/** [category_id, name, bucket | null] — null means "deliberately without commission". */
const CATEGORIES: [string, string, string | null][] = [
  ["835", "Laboratoř MEDLAB", "medlab"],
  ["836", "MEDLAB – gynekologie a urologie", "smear"],
  ["773", "Laboratoř ESCULAB", "esculab"],
  ["710", "Interní laboratoř – biochemie", "inhouse"],
  ["720", "Interní laboratoř – rychlotesty", "inhouse"],
  ["699", "Expresní testy", "inhouse"],
  ["685", "Konzultace lékařů", "consult"],
  ["834", "ONLINE – konzultace lékařů", "consult"],
  ["684", "Ultrazvuk (od 5 let)", "uzd"],
  ["954", "Endoskopie", "endo"],
  ["1089", "Konzultace lékařů – opakované", null],
  ["772", "Deklarace – bezplatné služby", null],
  ["1081", "Screening 40+", null],
  ["686", "Manipulační výkony", null],
  ["889", "Gynekologie", null],
  ["691", "Funkční diagnostika", null],
  ["801", "Odběr biomateriálu", null],
  ["1078", "Dermatologie", null],
  ["1091", "Elektrokoagulace", null],
  ["1093", "Kryomasáž", null],
]

const CATEGORY_NAME = new Map(CATEGORIES.map(([id, name]) => [id, name]))

/* --------------------------------- services ------------------------------- */

/** [service_id, name, category_id, price] */
const SERVICES: [string, string, string, number][] = [
  // Laboratoř MEDLAB
  ["101", "Krevní obraz s diferenciálem (5 populací)", "835", 340],
  ["102", "Lipidový profil (celkový cholesterol, HDL, LDL, TAG)", "835", 620],
  ["103", "Glykovaný hemoglobin HbA1c", "835", 480],
  ["104", "Jaterní testy (ALT, AST, GGT, ALP, bilirubin)", "835", 690],
  ["105", "TSH, fT3, fT4 – štítná žláza", "835", 850],
  ["106", "Feritin, železo, transferin", "835", 720],
  ["107", "Mikroskopické vyšetření biomateriálu na patogenní houby", "835", 340],
  ["108", "Biopsie kůže / papilomu – histologie", "835", 1080],
  ["109", "Vitamin D (25-OH)", "835", 650],
  // MEDLAB stěry gyn./urol.
  ["120", "Urogenitální PCR panel č. 5 – ženy", "836", 5300],
  ["121", "Mykoplazma (Mycoplasma genitalium) metodou PCR", "836", 600],
  ["122", "Kapavka (Neisseria gonorrhoeae) metodou PCR", "836", 650],
  ["123", "Trichomonáda – antigenní rychlotest", "836", 530],
  ["124", "Mikroskopie stěru Hay-Ison", "836", 420],
  ["125", "Diagnostika chronické endometritidy (CD-138)", "836", 1500],
  // Laboratoř ESCULAB
  ["140", "Kompletní biochemický panel", "773", 1450],
  ["141", "Koagulační vyšetření (INR, APTT, fibrinogen)", "773", 690],
  ["142", "Onkomarkery – základní panel", "773", 1980],
  ["143", "Alergologický panel – inhalační alergeny", "773", 2400],
  // Interní laboratoř – biochemie
  ["160", "Moč chemicky a sediment", "710", 210],
  ["161", "Kreatinin v séru", "710", 180],
  ["162", "Elektrolyty (Na, K, Cl)", "710", 260],
  ["163", "CRP kvantitativně", "710", 240],
  // Interní laboratoř – rychlotesty
  ["170", "Vitamin D – rychlotest", "720", 650],
  ["171", "Troponin – rychlotest", "720", 480],
  ["172", "D-dimery – rychlotest", "720", 560],
  // Expresní testy
  ["180", "HPV 9 typů – rychlotest", "699", 600],
  ["181", "Streptokok A – výtěr z krku", "699", 320],
  ["182", "Chřipka A/B + COVID-19 – kombinovaný test", "699", 450],
  // Konzultace lékařů
  ["200", "Konzultace internisty", "685", 750],
  ["201", "Konzultace pediatra", "685", 800],
  ["202", "Konzultace kardiologa", "685", 900],
  ["203", "Konzultace dermatologa", "685", 800],
  ["204", "Konzultace gynekologa", "685", 800],
  ["205", "Konzultace endokrinologa", "685", 850],
  ["206", "Konzultace neurologa", "685", 850],
  ["207", "Konzultace urologa", "685", 800],
  ["208", "Konzultace gastroenterologa", "685", 900],
  ["209", "Konzultace revmatologa", "685", 800],
  ["210", "Konzultace chirurga", "685", 850],
  ["211", "Konzultace trichologa s trichoskopií", "685", 950],
  // ONLINE konzultace
  ["220", "ONLINE – konzultace internisty", "834", 750],
  ["221", "ONLINE – konzultace dermatologa", "834", 800],
  ["222", "ONLINE – konzultace endokrinologa", "834", 850],
  ["223", "ONLINE – konzultace gynekologa", "834", 800],
  // Ultrazvuk
  ["240", "UZ břicha (játra, žlučník, slinivka, slezina)", "684", 800],
  ["241", "UZ ledvin a nadledvin", "684", 650],
  ["242", "UZ štítné žlázy", "684", 750],
  ["243", "UZ močového měchýře", "684", 550],
  ["244", "UZ malé pánve – transvaginálně", "684", 750],
  ["245", "UZ prsou", "684", 850],
  ["246", "Duplexní UZ cév dolních končetin", "684", 1200],
  // Endoskopie
  ["260", "Gastroskopie s biopsií", "954", 3200],
  ["261", "Kolonoskopie v analgosedaci", "954", 4800],
  ["262", "Rektoskopie", "954", 1400],
  // Bez provize – opakované konzultace
  ["280", "Opakovaná konzultace internisty", "1089", 650],
  ["281", "Opakovaná konzultace gynekologa", "1089", 650],
  ["282", "Opakovaná konzultace kardiologa", "1089", 650],
  // Bez provize – ostatní
  ["300", "Odběr biomateriálu", "801", 80],
  ["301", "Odběr stěru na mikroskopické vyšetření", "801", 150],
  ["302", "EKG – elektrokardiogram", "691", 350],
  ["303", "Holter TK (24 hodin)", "691", 1000],
  ["304", "Dermatoskopie s fotodokumentací (1–4 útvary)", "1078", 500],
  ["305", "Kryomasáž obličeje", "1093", 650],
  ["306", "Odstranění névu elektrokoagulací do 5 mm", "1091", 1100],
  ["307", "Lokální infiltrační anestezie – 1 oblast", "686", 250],
  ["310", "Komplexní gynekologické vyšetření", "889", 1480],
  ["311", "Kolposkopie", "889", 900],
  ["308", "Screening 40+ – vstupní konzultace", "1081", 0],
  ["309", "Deklarace – doporučení / recept / potvrzení", "772", 0],
]

/** Standalone service override: EKG is billed from its own bucket. */
const EKG_SERVICE_ID = "302"

/* ---------------------------------- staff --------------------------------- */

/** [master_id, full_name, specialization used for line flavouring] */
const DOCTORS: [string, string, string][] = [
  ["101", "MUDr. Jan Novák", "internista"],
  ["102", "MUDr. Petra Svobodová", "gynekoložka"],
  ["103", "MUDr. Tomáš Dvořák", "kardiolog"],
  ["104", "MUDr. Lucie Černá", "dermatoložka"],
  ["105", "MUDr. Martin Procházka", "urolog"],
  ["106", "MUDr. Eva Kučerová", "endokrinoložka"],
  ["107", "MUDr. Jakub Veselý", "neurolog"],
  ["108", "MUDr. Hana Horáková", "pediatrička"],
  ["109", "MUDr. Ondřej Marek", "gastroenterolog"],
  ["110", "MUDr. Klára Pospíšilová", "revmatoložka"],
  ["111", "MUDr. Filip Krejčí", "chirurg"],
  ["112", "MUDr. Barbora Němcová", "nefroložka"],
  ["113", "MUDr. David Beneš", "proktolog"],
  ["114", "MUDr. Tereza Malá", "tricholožka"],
]

const NON_DOCTORS: [string, string, string][] = [
  ["20", "Odběrová místnost", "kabinet", ],
  ["21", "Recepce – objednávky", "recepce"],
]

const UNFLAGGED: [string, string, string | null][] = [
  ["130", "Mgr. Simona Bartošová", "nutriční terapeutka – ověřit"],
  ["131", "Zdeňka Vlčková", "automatické rozpoznání: ověřit"],
  ["132", "MUDr. Adam Šťastný", "nastoupil 04/2026 – ověřit"],
]

/* ---------------------------- specializations ------------------------------ */

/** [id, name, active] — one per doctor specialty note, plus two extras for variety. */
const SPECIALIZATIONS: [string, string, boolean][] = [
  ["1", "Interní lékařství", true],
  ["2", "Gynekologie", true],
  ["3", "Kardiologie", true],
  ["4", "Dermatologie", true],
  ["5", "Urologie", true],
  ["6", "Endokrinologie", true],
  ["7", "Neurologie", true],
  ["8", "Pediatrie", true],
  ["9", "Gastroenterologie", true],
  ["10", "Revmatologie", true],
  ["11", "Chirurgie", true],
  ["12", "Nefrologie", true],
  ["13", "Proktologie", true],
  ["14", "Trichologie", true],
  ["15", "Estetická medicína", true],
  ["16", "Sportovní medicína", false],
]

/** staff note -> specialization id, for the 1:1 primary assignment. */
const SPECIALIZATION_BY_NOTE: Record<string, string> = {
  internista: "1",
  gynekoložka: "2",
  kardiolog: "3",
  dermatoložka: "4",
  urolog: "5",
  endokrinoložka: "6",
  neurolog: "7",
  pediatrička: "8",
  gastroenterolog: "9",
  revmatoložka: "10",
  chirurg: "11",
  nefroložka: "12",
  proktolog: "13",
  tricholožka: "14",
}

/** master_id -> extra (non-primary) specialization ids, for demo variety. */
const ADDITIONAL_SPECIALIZATIONS: Record<string, string[]> = {
  "111": ["15"], // Krejčí: Chirurgie + Estetická medicína
  "114": ["15"], // Malá: Trichologie + Estetická medicína
  "104": ["16"], // Černá: Dermatologie + Sportovní medicína (inactive)
}

/** specialization id -> custom coefficient bands (colored thresholds). Others use the shared defaults. */
const SPECIALIZATION_BANDS: Record<string, [number, BandColorValue][]> = {
  "2": [
    [0, "red"],
    [15, "yellow"],
    [40, "green"],
    [70, "blue"],
  ], // Gynekologie — stricter thresholds
  "14": [
    [0, "red"],
    [25, "yellow"],
    [55, "green"],
  ], // Trichologie — no "blue" tier
}

/* --------------------------------- KPI profiles ----------------------------- */

type KpiBandTuple = [number | "", number | "", number] // [min, max, points] — "" means unset

const KPI_PROFILE_DEFS: {
  id: string
  name: string
  active: boolean
  maxBonus: number
  maxPenalty: number
  minSample: number
  bands: Record<KpiMetricValue, KpiBandTuple[]>
}[] = [
  {
    id: "1",
    name: "Standardní KPI",
    active: true,
    maxBonus: 0.2,
    maxPenalty: 0.3,
    minSample: 10,
    bands: {
      showup: [
        [0, 55, -0.15],
        [55, 70, -0.1],
        [70, 85, 0],
        [85, "", 0.1],
      ],
      avg_check: [
        [0, 600, -0.1],
        [600, 900, 0],
        [900, "", 0.05],
      ],
      activity: [
        [0, 30, -0.05],
        [30, 60, 0],
        [60, "", 0.05],
      ],
    },
  },
  {
    id: "2",
    name: "Rozšířené KPI",
    active: true,
    maxBonus: 0.25,
    maxPenalty: 0.2,
    minSample: 15,
    bands: {
      showup: [
        [0, 60, -0.1],
        [60, 80, 0],
        [80, "", 0.15],
      ],
      avg_check: [
        [0, 700, -0.05],
        [700, 1100, 0],
        [1100, "", 0.1],
      ],
      activity: [
        [0, 35, -0.05],
        [35, 65, 0.02],
        [65, "", 0.08],
      ],
    },
  },
  {
    id: "3",
    name: "Zkušební KPI (neaktivní)",
    active: false,
    maxBonus: 0.15,
    maxPenalty: 0.15,
    minSample: 8,
    bands: {
      showup: [
        [0, 65, -0.08],
        [65, "", 0.08],
      ],
      avg_check: [[0, "", 0]],
      activity: [[0, "", 0]],
    },
  },
]

/** master_id -> [profileId, validFromPeriod]. Everyone else stays "Bez KPI". */
const KPI_ASSIGNMENTS: Record<string, [string, string]> = {
  "101": ["1", "2025-12-01"], // Novák
  "106": ["1", "2025-12-01"], // Kučerová
  "108": ["1", "2026-02-01"], // Horáková
  "110": ["2", "2026-01-01"], // Pospíšilová
  "111": ["2", "2025-12-01"], // Krejčí
  "113": ["1", "2026-03-01"], // Beneš
}

/* ------------------------------ doctor rate overrides ----------------------- */

/** master_id -> [bucket, ratePercent][] personal overrides, active from RULES_FROM. */
const DOCTOR_RATE_OVERRIDES: Record<string, [string, number][]> = {
  "101": [["uzd", 12]], // Novák: boosted ultrasound rate
  "106": [["medlab", 9]], // Kučerová: boosted lab rate
}

/* --------------------------------- sources -------------------------------- */

const UNMAPPED_SOURCES: [string, string, string | null][] = [
  ["1090", "Tereza Malá", "objevilo se v objednávkách, chybí v číselníku zdrojů"],
  ["1091", "Ordinace Smíchov – dr. Nováková", "objevilo se v objednávkách, chybí v číselníku zdrojů"],
  ["1092", "Doporučení – lékárna Vinohrady", "objevilo se v objednávkách, chybí v číselníku zdrojů"],
]

const NON_COMMISSION_SOURCES: [string, string][] = [
  ["780", "Samodoporučení"],
  ["781", "Google – vyhledávání"],
  ["782", "Instagram"],
  ["783", "Doporučení pacienta"],
  ["784", "Web kliniky – online objednávka"],
  ["785", "Call centrum"],
]

/* ------------------------------ new categories ---------------------------- */

/** Categories that showed up in the newest month with no mapping rule yet. */
const NEW_CATEGORIES: [string, string, number][] = [
  ["1102", "Fyzioterapie – individuální terapie", 34],
  ["1103", "Laserová terapie", 12],
]

/** Check items that are not in the service catalog at all. */
const UNMATCHED_ITEMS: [string, string, number, number][] = [
  ["9001", "Konzultace nutričního terapeuta (60 min)", 9, 10800],
  ["9002", "Rázová vlna – 1 aplikace", 14, 12600],
  ["9003", "Lymfodrenáž dolních končetin", 6, 5400],
  ["9004", "Aplikace kyseliny hyaluronové do kolene", 4, 15600],
  ["9005", "Kineziotaping – 1 oblast", 11, 3300],
]

const IGNORED_ITEMS: [string, string, string, string][] = [
  ["9010", "Testovací položka (nepoužívat)", "testovací položka v CRM", "2026-06-08T09:14:00.000Z"],
]

const PENDING_REASON = "nová kategorie bez sazby"
const UNMATCHED_REASON = "služba není v číselníku"
const SKIPPED_REASON = "kategorie bez provize"

/* --------------------------------- helpers -------------------------------- */

function rateAt(bucket: string, period: string): number {
  const versions = RATE_HISTORY[bucket] ?? []
  for (const [rate, from, to] of versions) {
    if (period >= from && (to === null || period < to)) return rate
  }
  return versions.length > 0 ? versions[versions.length - 1][0] : 0
}

/** General rule rate, unless this doctor has a personal override on that bucket. */
function doctorRateAt(masterId: string, bucket: string, period: string): number {
  const override = DOCTOR_RATE_OVERRIDES[masterId]?.find(([b]) => b === bucket)
  if (override && period >= RULES_FROM) return override[1] / 100
  return rateAt(bucket, period)
}

const COMMISSIONABLE = SERVICES.filter(([, , cat]) => {
  const entry = CATEGORIES.find(([id]) => id === cat)
  return entry?.[2] != null
})
const NON_COMMISSIONABLE = SERVICES.filter(([, , cat]) => {
  const entry = CATEGORIES.find(([id]) => id === cat)
  return entry?.[2] == null
})

function bucketOfCategory(categoryId: string): string | null {
  return CATEGORIES.find(([id]) => id === categoryId)?.[2] ?? null
}

/* -------------------------------- the seed -------------------------------- */

export function buildDemoState(): DemoState {
  const rand = rng(20260601)

  const staff: StaffRec[] = [
    ...DOCTORS.map(([id, name, spec]) => ({
      master_id: id,
      full_name: name,
      is_doctor: true as boolean | null,
      note: spec,
    })),
    ...NON_DOCTORS.map(([id, name, note]) => ({
      master_id: id,
      full_name: name,
      is_doctor: false as boolean | null,
      note,
    })),
    ...UNFLAGGED.map(([id, name, note]) => ({
      master_id: id,
      full_name: name,
      is_doctor: null as boolean | null,
      note,
    })),
  ]

  const sources: SourceRec[] = [
    ...DOCTORS.map(([id, name], i) => ({
      source_id: String(1000 + i),
      // Referral sources are typed by the reception, so they carry the short
      // surname form rather than the full staff record name.
      label: name.replace("MUDr. ", "").split(" ").reverse().join(" ").trim(),
      status: "doctor" as const,
      master_id: id,
      note: "lékař (z číselníku zdrojů)",
    })),
    ...NON_COMMISSION_SOURCES.map(([id, label]) => ({
      source_id: id,
      label,
      status: "non_commission" as const,
      master_id: null,
      note: "bez provize",
    })),
    ...UNMAPPED_SOURCES.map(([id, label, note]) => ({
      source_id: id,
      label,
      status: "unmapped" as const,
      master_id: null,
      note,
    })),
  ]

  const buckets: BucketRec[] = BUCKETS.map(([bucket, label, beneficiary, , sort]) => ({
    bucket,
    label,
    beneficiary,
    sort_order: sort,
  }))

  let rowId = 1
  const nextId = () => String(rowId++)

  const bucketRates: BucketRateRec[] = []
  for (const [bucket, versions] of Object.entries(RATE_HISTORY)) {
    for (const [rate, from, to] of versions) {
      bucketRates.push({ id: nextId(), bucket, rate, valid_from: from, valid_to: to })
    }
  }

  const categoryMapping: CategoryMappingRec[] = CATEGORIES.map(([category_id, , bucket]) => ({
    id: nextId(),
    category_id,
    bucket,
    valid_from: RULES_FROM,
    valid_to: null,
  }))

  const serviceMapping: ServiceMappingRec[] = [
    {
      id: nextId(),
      service_id: EKG_SERVICE_ID,
      bucket: "ekg",
      valid_from: RULES_FROM,
      valid_to: null,
    },
    {
      id: nextId(),
      service_id: "246",
      bucket: "uzd",
      valid_from: "2026-02-01",
      valid_to: null,
    },
    {
      id: nextId(),
      service_id: "300",
      bucket: null,
      valid_from: RULES_FROM,
      valid_to: null,
    },
  ]

  const serviceExclusions: ServiceExclusionRec[] = [
    {
      id: nextId(),
      service_id: "307",
      reason: "anestezii provádí sám lékař",
      valid_from: RULES_FROM,
      valid_to: null,
    },
    {
      id: nextId(),
      service_id: "301",
      reason: "odběr materiálu provizi nezakládá",
      valid_from: RULES_FROM,
      valid_to: null,
    },
    {
      id: nextId(),
      service_id: "303",
      reason: "zapůjčení přístroje – bez provize",
      valid_from: "2025-12-01",
      valid_to: "2026-04-01",
    },
  ]

  const servicesCatalog: ServiceCatalogRec[] = SERVICES.map(([service_id, name, category_id, price]) => ({
    service_id,
    name,
    price,
    category_id,
    category_name: CATEGORY_NAME.get(category_id) ?? null,
    note: null,
  }))

  /* ------------------------------ commission ----------------------------- */

  const commissionLines: CommissionLineRec[] = []
  const doctorMonthlyStats: DoctorMonthlyStatsRec[] = []
  /** `${period}|${masterId}` -> commission split by beneficiary, for the KPI worker below. */
  const commissionSplit = new Map<string, { source: number; performer: number }>()
  let visitSeq = 40000

  // A doctor's referral volume is a stable trait, not re-rolled every month —
  // otherwise the per-doctor charts would look like noise.
  const baseVolume = DOCTORS.map(() => 6 + rand() * 24)

  PERIODS.forEach((period, periodIndex) => {
    // Gentle month-over-month growth so the trend charts have a shape.
    const growth = 0.8 + periodIndex * 0.05

    DOCTORS.forEach(([masterId], doctorIndex) => {
      const sourceId = String(1000 + doctorIndex)
      // Each accrued line below stands for one completed, paid visit referred
      // to this doctor by another performer — i.e. one referral ("doporučení").
      const lineCount = Math.max(
        3,
        Math.round(baseVolume[doctorIndex] * growth * (0.85 + rand() * 0.3)),
      )

      let sourceCommission = 0
      let performerCommission = 0

      for (let i = 0; i < lineCount; i++) {
        const [serviceId, name, categoryId, price] = COMMISSIONABLE[Math.floor(rand() * COMMISSIONABLE.length)]
        const bucket = serviceId === EKG_SERVICE_ID ? "ekg" : bucketOfCategory(categoryId)!
        const qty = rand() < 0.82 ? 1 : rand() < 0.7 ? 2 : 3
        const base = price * qty
        const rate = doctorRateAt(masterId, bucket, period)
        const commission = round2(base * rate)
        commissionLines.push({
          id: nextId(),
          period,
          visit_id: String(visitSeq++),
          source_id: sourceId,
          beneficiary_master_id: masterId,
          item_id: serviceId,
          item_name: name,
          category_id: categoryId,
          bucket,
          base_amount: base,
          rate,
          commission,
          status: "accrued",
          reason: null,
        })
        const bucketDef = BUCKETS.find(([b]) => b === bucket)
        if (bucketDef?.[2] === "performer") performerCommission += commission
        else sourceCommission += commission
      }

      // A few deliberately non-commission lines, so the doctor card shows the
      // "why did this not pay out" side of the calculation too.
      const skippedCount = 1 + Math.floor(rand() * 4)
      for (let i = 0; i < skippedCount; i++) {
        const [serviceId, name, categoryId, price] =
          NON_COMMISSIONABLE[Math.floor(rand() * NON_COMMISSIONABLE.length)]
        commissionLines.push({
          id: nextId(),
          period,
          visit_id: String(visitSeq++),
          source_id: sourceId,
          beneficiary_master_id: masterId,
          item_id: serviceId,
          item_name: name,
          category_id: categoryId,
          bucket: null,
          base_amount: price,
          rate: null,
          commission: 0,
          status: "skipped",
          reason: SKIPPED_REASON,
        })
      }

      // --- rich monthly activity snapshot, as the (fictional) worker would produce it ---

      const referrals = lineCount
      const referredPatients = Math.max(1, Math.round(referrals * (0.75 + rand() * 0.2)))
      const referralsCommissionable = referrals

      // Coefficient = referred patients ÷ patients served; occasionally above 100%.
      const patientsServed = Math.max(1, Math.round(referrals * (0.7 + rand() * 0.75)))
      const visitsPerformed = Math.max(patientsServed, Math.round(patientsServed * (1.05 + rand() * 0.25)))
      const selfRecords = Math.round(visitsPerformed * (0.08 + rand() * 0.2))

      const showupPct = 0.55 + rand() * 0.4
      const showupDoneCount = Math.round(referrals * showupPct)
      const showupCancelCount = Math.max(0, referrals - showupDoneCount)
      const referredBaseForPeriod = round2(sourceCommission > 0 ? sourceCommission / doctorRateAt(masterId, "consult", period) : 0)
      const showupDoneSum = referredBaseForPeriod
      const showupCancelSum = round2(showupCancelCount * (referredBaseForPeriod / Math.max(showupDoneCount, 1)))

      const consultTotal = patientsServed
      const offlineShare = 0.6 + rand() * 0.2
      const primaryShare = 0.35 + rand() * 0.2
      const consultOfflinePrimary = Math.round(consultTotal * offlineShare * primaryShare)
      const consultOfflineRepeat = Math.round(consultTotal * offlineShare * (1 - primaryShare))
      const consultOnlinePrimary = Math.round(consultTotal * (1 - offlineShare) * primaryShare)
      const consultOnlineRepeat = Math.max(
        0,
        consultTotal - consultOfflinePrimary - consultOfflineRepeat - consultOnlinePrimary,
      )

      doctorMonthlyStats.push({
        period,
        master_id: masterId,
        patients_served: patientsServed,
        referrals,
        referred_patients: referredPatients,
        referrals_commissionable: referralsCommissionable,
        visits_performed: visitsPerformed,
        self_records: selfRecords,
        showup_done_count: showupDoneCount,
        showup_done_sum: showupDoneSum,
        showup_cancel_count: showupCancelCount,
        showup_cancel_sum: showupCancelSum,
        consult_offline_primary: consultOfflinePrimary,
        consult_offline_repeat: consultOfflineRepeat,
        consult_online_primary: consultOnlinePrimary,
        consult_online_repeat: consultOnlineRepeat,
      })

      commissionSplit.set(`${period}|${masterId}`, { source: sourceCommission, performer: performerCommission })
    })
  })

  /* ------------------------- open questions (06/2026) -------------------- */

  // New categories with no rate yet → "pending_review".
  NEW_CATEGORIES.forEach(([categoryId, name, count]) => {
    for (let i = 0; i < count; i++) {
      const doctorIndex = Math.floor(rand() * DOCTORS.length)
      commissionLines.push({
        id: nextId(),
        period: CURRENT_PERIOD,
        visit_id: String(visitSeq++),
        source_id: String(1000 + doctorIndex),
        beneficiary_master_id: DOCTORS[doctorIndex][0],
        item_id: String(9100 + Number(categoryId)),
        item_name: name,
        category_id: categoryId,
        bucket: null,
        base_amount: 900 + Math.floor(rand() * 800),
        rate: null,
        commission: 0,
        status: "pending_review",
        reason: PENDING_REASON,
      })
    }
  })

  // Check items missing from the service catalog → "unmatched".
  UNMATCHED_ITEMS.forEach(([itemId, name, count, total]) => {
    for (let i = 0; i < count; i++) {
      commissionLines.push({
        id: nextId(),
        period: CURRENT_PERIOD,
        visit_id: String(visitSeq++),
        source_id: String(1000 + Math.floor(rand() * DOCTORS.length)),
        beneficiary_master_id: DOCTORS[Math.floor(rand() * DOCTORS.length)][0],
        item_id: itemId,
        item_name: name,
        category_id: null,
        bucket: null,
        base_amount: round2(total / count),
        rate: null,
        commission: 0,
        status: "unmatched",
        reason: UNMATCHED_REASON,
      })
    }
  })

  // Already-ignored item — still present in the data, hidden from the card.
  IGNORED_ITEMS.forEach(([itemId, name]) => {
    for (let i = 0; i < 3; i++) {
      commissionLines.push({
        id: nextId(),
        period: CURRENT_PERIOD,
        visit_id: String(visitSeq++),
        source_id: String(1000 + Math.floor(rand() * DOCTORS.length)),
        beneficiary_master_id: DOCTORS[0][0],
        item_id: itemId,
        item_name: name,
        category_id: null,
        bucket: null,
        base_amount: 100,
        rate: null,
        commission: 0,
        status: "unmatched",
        reason: UNMATCHED_REASON,
      })
    }
  })

  // Lines carrying the unmapped sources and the unflagged staff, so the newest
  // month reports those two freeze blockers as well.
  UNMAPPED_SOURCES.forEach(([sourceId], i) => {
    for (let j = 0; j < 2 + i; j++) {
      commissionLines.push({
        id: nextId(),
        period: CURRENT_PERIOD,
        visit_id: String(visitSeq++),
        source_id: sourceId,
        beneficiary_master_id: null,
        item_id: "200",
        item_name: "Konzultace internisty",
        category_id: "685",
        bucket: null,
        base_amount: 750,
        rate: null,
        commission: 0,
        status: "pending_review",
        reason: "zdroj doporučení není přiřazen k lékaři",
      })
    }
  })

  UNFLAGGED.forEach(([masterId], i) => {
    for (let j = 0; j < 2 + i; j++) {
      commissionLines.push({
        id: nextId(),
        period: CURRENT_PERIOD,
        visit_id: String(visitSeq++),
        source_id: String(1000 + i),
        beneficiary_master_id: masterId,
        item_id: "204",
        item_name: "Konzultace gynekologa",
        category_id: "685",
        bucket: null,
        base_amount: 800,
        rate: null,
        commission: 0,
        status: "pending_review",
        reason: "u zaměstnance není určeno, zda je lékař",
      })
    }
  })

  /* ------------------------------- rollups ------------------------------- */

  const commissionMonthly = rollupMonthly(commissionLines)

  const periods = PERIODS.map((period) => {
    const frozen = period <= FROZEN_THROUGH
    const total = commissionMonthly
      .filter((m) => m.period === period)
      .reduce((s, m) => s + m.commission, 0)
    return {
      period,
      status: (frozen ? "frozen" : "draft") as "frozen" | "draft",
      frozen_at: frozen ? `${nextMonthOf(period)}T08:12:00.000Z` : null,
      frozen_by: frozen ? "hlavni.ucetni@demo.clinic" : null,
      total_commission: frozen ? round2(total) : null,
    }
  })

  /* ------------------------------- payouts -------------------------------- */

  // Most doctors have already been paid out for the frozen months; the two
  // open (draft) months are left untouched so the checkbox has something to
  // demonstrate live. "Vyplaceno" is independent of the freeze itself.
  const doctorPayouts: DoctorPayoutRec[] = []
  for (const period of PERIODS) {
    if (period > FROZEN_THROUGH) continue
    const paidAt = `${nextMonthOf(period)}T13:00:00.000Z`
    for (const [masterId] of DOCTORS) {
      const hasCommission = commissionMonthly.some(
        (m) => m.period === period && m.master_id === masterId && m.commission > 0,
      )
      if (hasCommission && rand() < 0.75) {
        doctorPayouts.push({ period, master_id: masterId, paid_by: "hlavni.ucetni@demo.clinic", paid_at: paidAt })
      }
    }
  }

  /* --------------------------- specializations ---------------------------- */

  const specializations: SpecializationRec[] = SPECIALIZATIONS.map(([id, name, active]) => ({
    id,
    name,
    active,
  }))

  const staffSpecializations: StaffSpecializationRec[] = []
  for (const [masterId, , note] of DOCTORS) {
    const primaryId = SPECIALIZATION_BY_NOTE[note]
    if (primaryId) {
      staffSpecializations.push({ master_id: masterId, specialization_id: primaryId, is_primary: true })
    }
    for (const extraId of ADDITIONAL_SPECIALIZATIONS[masterId] ?? []) {
      staffSpecializations.push({ master_id: masterId, specialization_id: extraId, is_primary: false })
    }
  }

  const specializationBands: SpecializationBandRec[] = []
  for (const [specId, bands] of Object.entries(SPECIALIZATION_BANDS)) {
    for (const [min_pct, color] of bands) {
      specializationBands.push({ specialization_id: specId, min_pct, color })
    }
  }

  /* --------------------------------- KPI ----------------------------------- */

  const kpiProfiles: KpiProfileRec[] = KPI_PROFILE_DEFS.map((p) => ({
    id: p.id,
    name: p.name,
    active: p.active,
    max_bonus: p.maxBonus,
    max_penalty: p.maxPenalty,
    min_sample: p.minSample,
  }))

  const kpiProfileBands: KpiProfileBandRec[] = []
  for (const profile of KPI_PROFILE_DEFS) {
    for (const metric of Object.keys(profile.bands) as KpiMetricValue[]) {
      for (const [min, max, points] of profile.bands[metric]) {
        if (min === "") continue
        kpiProfileBands.push({
          profile_id: profile.id,
          metric,
          min_value: min,
          max_value: max === "" ? null : max,
          points,
        })
      }
    }
  }

  /** Points awarded by the first band whose [min, max) contains `value`. */
  function bandPoints(value: number, bands: KpiBandTuple[]): number {
    for (const [min, max, points] of bands) {
      if (min === "") continue
      if (value >= min && (max === "" || value < max)) return points
    }
    return 0
  }

  const doctorKpiProfiles: DoctorKpiProfileRec[] = []
  const doctorKpiMonthly: DoctorKpiMonthlyRec[] = []

  for (const [masterId, [profileId, validFrom]] of Object.entries(KPI_ASSIGNMENTS)) {
    doctorKpiProfiles.push({
      id: nextId(),
      master_id: masterId,
      profile_id: profileId,
      valid_from: validFrom,
      valid_to: null,
    })

    const profile = KPI_PROFILE_DEFS.find((p) => p.id === profileId)!

    for (const period of PERIODS) {
      if (period < validFrom) continue
      const stats = doctorMonthlyStats.find((s) => s.period === period && s.master_id === masterId)
      const split = commissionSplit.get(`${period}|${masterId}`)
      if (!stats || !split) continue

      const showupTotalSum = stats.showup_done_sum + stats.showup_cancel_sum
      const showupPct = showupTotalSum > 0 ? (stats.showup_done_sum / showupTotalSum) * 100 : null
      const avgCheck = stats.referrals_commissionable > 0 ? split.source / stats.referrals_commissionable : null
      const activityPct = stats.patients_served > 0 ? (stats.referred_patients / stats.patients_served) * 100 : null

      const showupPoints = showupPct != null ? bandPoints(showupPct, profile.bands.showup) : 0
      const avgCheckPoints = avgCheck != null ? bandPoints(avgCheck, profile.bands.avg_check) : 0
      const activityPoints = activityPct != null ? bandPoints(activityPct, profile.bands.activity) : 0

      const kRaw = round2(1 + showupPoints + avgCheckPoints + activityPoints)
      const kKpi = round2(Math.min(1 + profile.maxBonus, Math.max(1 - profile.maxPenalty, kRaw)))
      const sampleOk = stats.referrals_commissionable >= profile.minSample

      const finalCommission = sampleOk
        ? round2(split.source * kKpi + split.performer)
        : round2(split.source * 0.5 + split.performer)

      doctorKpiMonthly.push({
        master_id: masterId,
        period,
        profile_id: profileId,
        showup_pct: showupPct,
        avg_check: avgCheck,
        activity_pct: activityPct,
        planned_count: stats.referrals_commissionable,
        showup_points: showupPoints,
        avg_check_points: avgCheckPoints,
        activity_points: activityPoints,
        k_raw: kRaw,
        k_kpi: sampleOk ? kKpi : 0.5,
        sample_ok: sampleOk,
        commission_source: split.source,
        commission_performer: split.performer,
        final_commission: finalCommission,
      })
    }
  }

  /* --------------------------- doctor rate overrides ------------------------ */

  const doctorBucketRates: DoctorBucketRateRec[] = []
  for (const [masterId, overrides] of Object.entries(DOCTOR_RATE_OVERRIDES)) {
    for (const [bucket, ratePercent] of overrides) {
      doctorBucketRates.push({
        master_id: masterId,
        bucket,
        enabled: true,
        rate: Math.round((ratePercent / 100) * 10000) / 10000,
        valid_from: RULES_FROM,
        valid_to: null,
      })
    }
  }

  /* -------------------------------- users --------------------------------- */

  const users: AppUserRec[] = [
    {
      id: "1",
      email: "spravce@demo.clinic",
      full_name: "Petr Zeman",
      role: "admin",
      created_at: "2025-10-20T08:00:00.000Z",
      invited_by: null,
    },
    {
      id: "2",
      email: "hlavni.ucetni@demo.clinic",
      full_name: "Jana Dostálová",
      role: "admin",
      created_at: "2025-10-21T09:15:00.000Z",
      invited_by: "1",
    },
    {
      id: "3",
      email: "hlavni.lekar@demo.clinic",
      full_name: "MUDr. Filip Krejčí",
      role: "viewer",
      created_at: "2025-10-22T10:30:00.000Z",
      invited_by: "1",
    },
  ]

  const state: DemoState = {
    periods,
    staff,
    sources,
    buckets,
    bucketRates,
    categoryMapping,
    serviceMapping,
    serviceExclusions,
    servicesCatalog,
    commissionLines,
    commissionMonthly,
    doctorMonthlyStats,
    doctorPayouts,
    unmatchedIgnored: IGNORED_ITEMS.map(([itemId, , reason, at]) => ({
      item_id: itemId,
      reason,
      user_email: "spravce@demo.clinic",
      at,
    })),
    users,
    specializations,
    staffSpecializations,
    specializationBands,
    kpiProfiles,
    kpiProfileBands,
    doctorKpiProfiles,
    doctorKpiMonthly,
    doctorBucketRates,
    auditLog: [],
    nextAuditId: 1,
    nextRowId: rowId,
  }

  state.auditLog = buildAuditLog(state)
  state.nextAuditId = state.auditLog.length + 1

  return state
}

/** Recomputes commission_monthly from the accrued lines. */
export function rollupMonthly(lines: CommissionLineRec[]): CommissionMonthlyRec[] {
  const map = new Map<string, CommissionMonthlyRec>()
  for (const l of lines) {
    if (l.status !== "accrued" || !l.bucket || !l.beneficiary_master_id) continue
    const key = `${l.period}|${l.beneficiary_master_id}|${l.bucket}`
    const found = map.get(key)
    if (found) {
      found.qty += 1
      found.base = round2(found.base + l.base_amount)
      found.commission = round2(found.commission + l.commission)
    } else {
      map.set(key, {
        period: l.period,
        master_id: l.beneficiary_master_id,
        bucket: l.bucket,
        qty: 1,
        base: l.base_amount,
        rate: l.rate ?? 0,
        commission: l.commission,
      })
    }
  }
  return [...map.values()]
}

/** "2026-04-01" -> "2026-05-05" (the day the month was closed). */
function nextMonthOf(period: string): string {
  const y = Number(period.slice(0, 4))
  const m = Number(period.slice(5, 7))
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return `${ny}-${String(nm).padStart(2, "0")}-05`
}

/* -------------------------------- audit log ------------------------------- */

function buildAuditLog(state: DemoState): AuditRec[] {
  const entries: Omit<AuditRec, "id">[] = []
  const push = (
    at: string,
    user_email: string,
    action: string,
    entity: string,
    entity_id: string | null,
    old_value: unknown,
    new_value: unknown,
  ) => entries.push({ at, user_email, action, entity, entity_id, old_value, new_value })

  push("2025-10-21T09:16:00.000Z", "spravce@demo.clinic", "user.invite", "users", "hlavni.ucetni@demo.clinic", null, { full_name: "Jana Dostálová", role: "admin" })
  push("2025-10-22T10:31:00.000Z", "spravce@demo.clinic", "user.invite", "users", "hlavni.lekar@demo.clinic", null, { full_name: "MUDr. Filip Krejčí", role: "viewer" })
  push("2025-11-03T09:20:00.000Z", "spravce@demo.clinic", "bucket.create", "commission_buckets", "medlab", null, { label: "Laboratoř MEDLAB", beneficiary: "source", rate: 0.05, valid_from: "2025-11-01" })
  push("2025-11-03T09:24:00.000Z", "spravce@demo.clinic", "bucket.create", "commission_buckets", "uzd", null, { label: "Ultrazvuk", beneficiary: "source", rate: 0.08, valid_from: "2025-11-01" })
  push("2025-11-05T11:02:00.000Z", "spravce@demo.clinic", "category.map", "category_mapping", "835", null, { bucket: "medlab", valid_from: "2025-11-01" })
  push("2025-11-05T11:04:00.000Z", "spravce@demo.clinic", "category.map", "category_mapping", "684", null, { bucket: "uzd", valid_from: "2025-11-01" })
  push("2025-11-05T11:09:00.000Z", "spravce@demo.clinic", "category.map", "category_mapping", "1089", null, { bucket: null, valid_from: "2025-11-01" })
  push("2025-11-12T14:41:00.000Z", "hlavni.lekar@demo.clinic", "staff.flag", "staff", "111", { is_doctor: null }, { is_doctor: true })
  push("2025-11-12T14:42:00.000Z", "hlavni.lekar@demo.clinic", "staff.flag", "staff", "20", { is_doctor: null }, { is_doctor: false })
  push("2025-11-18T10:05:00.000Z", "spravce@demo.clinic", "specialization.create", "specializations", "14", null, { name: "Trichologie" })
  push("2025-11-18T10:07:00.000Z", "spravce@demo.clinic", "specialization.create", "specializations", "15", null, { name: "Estetická medicína" })
  push("2025-11-18T10:12:00.000Z", "spravce@demo.clinic", "staff.specializations", "staff_specializations", "111", { primary: null, additional: [] }, { primary: "11", additional: ["15"] })
  push("2025-11-25T13:40:00.000Z", "spravce@demo.clinic", "kpi_profile.create", "kpi_profiles", "1", null, { name: "Standardní KPI", maxBonus: 0.2, maxPenalty: 0.3, minSample: 10 })
  push("2025-12-01T09:00:00.000Z", "spravce@demo.clinic", "doctor.kpi_profile", "doctor_kpi_profiles", "101", { profile_id: null, valid_from: null }, { profile_id: "1", valid_from: "2025-12-01" })
  push("2025-12-02T09:30:00.000Z", "spravce@demo.clinic", "doctor_rate.update", "doctor_bucket_rates", "101:uzd", { enabled: true, rate: null }, { enabled: true, rate: 0.12 })
  push("2025-12-05T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2025-11-01", { status: "draft", total_commission: null }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2025-12-09T10:30:00.000Z", "spravce@demo.clinic", "service_exclusion.create", "service_exclusions", "303", null, { reason: "zapůjčení přístroje – bez provize", valid_from: "2025-12-01" })
  push("2026-01-05T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2025-12-01", { status: "draft" }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2026-01-21T13:15:00.000Z", "hlavni.lekar@demo.clinic", "source.map", "sources", "1006", { status: "unmapped", master_id: null }, { status: "doctor", master_id: "107" })
  push("2026-01-28T09:44:00.000Z", "spravce@demo.clinic", "rate.update", "bucket_rates", "inhouse", { rate: 0.06 }, { rate: 0.07, valid_from: "2026-02-01" })
  push("2026-02-05T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2026-01-01", { status: "draft" }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2026-02-11T16:05:00.000Z", "spravce@demo.clinic", "unmatched.add_service", "services_catalog", "246", null, { name: "Duplexní UZ cév dolních končetin", bucket: "uzd", valid_from: "2026-02-01" })
  push("2026-02-24T11:52:00.000Z", "hlavni.lekar@demo.clinic", "source.non_commission", "sources", "785", { status: "unmapped" }, { status: "non_commission", master_id: null })
  push("2026-03-02T09:31:00.000Z", "spravce@demo.clinic", "rate.update", "bucket_rates", "medlab", { rate: 0.05 }, { rate: 0.07, valid_from: "2026-03-01" })
  push("2026-03-05T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2026-02-01", { status: "draft" }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2026-03-17T15:20:00.000Z", "spravce@demo.clinic", "bucket.update", "commission_buckets", "consult", { label: "Konzultace specialistů" }, { label: "Konzultace jiných specialistů" })
  push("2026-04-06T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2026-03-01", { status: "draft" }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2026-04-14T10:07:00.000Z", "spravce@demo.clinic", "service_exclusion.end", "service_exclusions", "303", { valid_to: null }, { valid_to: "2026-04-01" })
  push("2026-04-22T12:36:00.000Z", "hlavni.lekar@demo.clinic", "staff.update", "staff", "114", { is_doctor: null, note: null }, { is_doctor: true, note: "tricholožka" })
  push("2026-04-29T14:18:00.000Z", "spravce@demo.clinic", "rate.update", "bucket_rates", "uzd", { rate: 0.08 }, { rate: 0.1, valid_from: "2026-05-01" })
  push("2026-05-05T08:12:00.000Z", "hlavni.ucetni@demo.clinic", "period.freeze", "periods", "2026-04-01", { status: "draft" }, { status: "frozen", frozen_by: "hlavni.ucetni@demo.clinic" })
  push("2026-05-06T13:05:00.000Z", "hlavni.ucetni@demo.clinic", "payout.mark", "doctor_payouts", "2026-04-01:101", null, { full_name: "MUDr. Jan Novák", period: "2026-04-01" })
  push("2026-06-08T09:14:00.000Z", "spravce@demo.clinic", "unmatched.ignore", "unmatched_ignored", "9010", null, { reason: "testovací položka v CRM" })
  push("2026-06-15T11:47:00.000Z", "hlavni.lekar@demo.clinic", "source.map", "sources", "1012", { status: "unmapped", master_id: null }, { status: "doctor", master_id: "113" })
  push("2026-06-20T15:32:00.000Z", "spravce@demo.clinic", "user.role_change", "users", "hlavni.lekar@demo.clinic", { role: "viewer" }, { role: "admin" })
  push("2026-06-20T15:41:00.000Z", "spravce@demo.clinic", "user.role_change", "users", "hlavni.lekar@demo.clinic", { role: "admin" }, { role: "viewer" })

  void state
  return entries
    .map((e, i) => ({ ...e, id: i + 1 }))
    .sort((a, b) => (a.at < b.at ? -1 : 1))
}
