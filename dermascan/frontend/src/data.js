// Static content + model facts. Per-class metrics are the REAL test-set numbers from skin_disease.ipynb.
export const STATS = { accuracy: 97.71, precision: 97.83, recall: 97.77, f1: 97.78, images: '~44,800', threshold: 0.5 }

// Display group for each backend category string (risk: green | amber | red)
export const CATEGORY = {
  'Normal': { label: 'Normal', risk: 'green' },
  'Skin Cancer': { label: 'Skin Cancer', risk: 'red' },
  'Precancerous Lesion': { label: 'Precancerous Lesion', risk: 'amber' },
  'Benign Skin Lesions': { label: 'Benign Skin Lesions', risk: 'green' },
  'Inflammatory Skin Diseases': { label: 'Inflammatory', risk: 'amber' },
  'Infectious Skin Diseases': { label: 'Infectious', risk: 'amber' },
}
export const RISK_STYLE = {
  green: 'bg-emerald-100 text-emerald-900 ring-emerald-600/30 dark:bg-emerald-950 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-900 ring-amber-600/30 dark:bg-amber-950 dark:text-amber-200',
  red: 'bg-red-100 text-red-900 ring-red-600/30 dark:bg-red-950 dark:text-red-200',
}
export const RISK_COLOR = { green: '#059669', amber: '#d97706', red: '#dc2626' }
export const NEEDS_PROMPT = new Set(['Skin Cancer', 'Precancerous Lesion'])

export const CLASS_NAMES = ['Normal Skin', 'Acne', 'Actinic Keratosis', 'Basal Cell Carcinoma', 'Chickenpox',
  'Dyshidrotic Eczema', 'Melanoma', 'Nevus', 'Nail Fungus', 'Pigmented Benign Keratosis', 'Ringworm',
  'Seborrheic Keratosis', 'Squamous Cell Carcinoma', 'Vascular Lesion']

// short = card text, what = plain-language explanation, see = when to see a dermatologist (no treatment advice)
export const INFO = {
  'Normal Skin': { short: 'Skin with no visible lesion or disease pattern.', what: 'The model sees no pattern it associates with any of the 13 conditions it knows.', see: 'See a dermatologist for any new, changing, bleeding or painful spot, even if this result says normal.' },
  'Acne': { short: 'Clogged pores and inflamed pimples, common on face, chest and back.', what: 'Acne is a common condition of the hair follicles and oil glands that causes pimples, blackheads and sometimes deeper tender lumps.', see: 'See a dermatologist if it is painful, deep or scarring, or is affecting your wellbeing.' },
  'Actinic Keratosis': { short: 'Rough, scaly patch from long-term sun damage; can be precancerous.', what: 'A dry, scaly or sandpaper-like patch that develops on sun-exposed skin. A small share can progress to squamous cell carcinoma over time.', see: 'Book an evaluation soon. A clinician should examine any persistent rough or scaly patch.' },
  'Basal Cell Carcinoma': { short: 'The most common skin cancer; often a pearly bump or sore that does not heal.', what: 'A cancer of the skin\u2019s basal cells, usually slow growing and linked to sun exposure. It often looks like a shiny bump or a sore that returns.', see: 'Seek prompt professional evaluation. Only a clinician can diagnose it.' },
  'Chickenpox': { short: 'Itchy, fluid-filled blisters caused by the varicella-zoster virus.', what: 'A contagious viral illness that causes an itchy rash of small blisters in different stages, often with fever and tiredness.', see: 'Contact a doctor, especially for infants, pregnant people, adults or anyone with a weak immune system.' },
  'Dyshidrotic Eczema': { short: 'Small, itchy blisters on the palms, fingers and soles.', what: 'A form of eczema that causes clusters of tiny, deep-seated blisters on hands and feet, often itchy or burning.', see: 'See a dermatologist if it keeps returning, cracks, looks infected, or limits daily activities.' },
  'Melanoma': { short: 'A serious skin cancer that can arise from or look like a mole.', what: 'A cancer of pigment-producing cells. Warning signs include asymmetry, irregular borders, uneven colour, larger size and change over time.', see: 'Seek professional evaluation promptly. Early assessment matters for any changing or unusual mole.' },
  'Nevus': { short: 'A common mole: a benign cluster of pigment cells.', what: 'Most moles are harmless. They are usually even in colour with a regular border, though some change over time.', see: 'See a dermatologist if a mole changes in size, shape or colour, bleeds, itches or looks different from your others.' },
  'Nail Fungus': { short: 'Thickened, discoloured or brittle nails caused by fungal infection.', what: 'A fungal infection of the nail that may cause yellow-white discolouration, thickening and crumbling.', see: 'See a clinician to confirm the cause, especially with pain, spreading, diabetes or poor circulation.' },
  'Pigmented Benign Keratosis': { short: 'A harmless, flat brown growth, often on sun-exposed skin.', what: 'A non-cancerous, pigmented patch, sometimes called a solar lentigo or flat seborrheic keratosis.', see: 'Have it checked if it changes, darkens unevenly or you are unsure what it is.' },
  'Ringworm': { short: 'A ring-shaped, scaly fungal infection of the skin.', what: 'Despite the name it is a fungal infection, not a worm. It typically forms a red, scaly ring with clearer skin in the middle.', see: 'See a clinician to confirm it, especially if widespread, on the scalp, or not improving.' },
  'Seborrheic Keratosis': { short: 'A common, harmless \u201cstuck-on\u201d waxy or warty growth.', what: 'A benign skin growth that appears with age, often tan to dark brown with a waxy, stuck-on look.', see: 'See a dermatologist if one bleeds, changes quickly or looks different from the others.' },
  'Squamous Cell Carcinoma': { short: 'A skin cancer that may appear as a firm red bump or scaly sore.', what: 'A cancer of the skin\u2019s squamous cells, commonly on sun-exposed areas. It can look like a firm bump, a scaly patch or a sore that will not heal.', see: 'Seek prompt professional evaluation. Only a clinician can diagnose it.' },
  'Vascular Lesion': { short: 'Benign growths or marks made of blood vessels.', what: 'Includes cherry angiomas and similar red, purple or blue marks formed by clusters of small blood vessels.', see: 'See a clinician if one bleeds repeatedly, grows quickly or you are unsure what it is.' },
}
export const GROUPS = [
  ['Normal', ['Normal Skin']],
  ['Skin Cancer', ['Melanoma', 'Basal Cell Carcinoma', 'Squamous Cell Carcinoma']],
  ['Precancerous Lesion', ['Actinic Keratosis']],
  ['Benign Skin Lesions', ['Nevus', 'Seborrheic Keratosis', 'Pigmented Benign Keratosis', 'Vascular Lesion']],
  ['Inflammatory Skin Diseases', ['Acne', 'Dyshidrotic Eczema']],
  ['Infectious Skin Diseases', ['Ringworm', 'Nail Fungus', 'Chickenpox']],
]

// REAL per-class test metrics (precision, recall, f1, support) from the notebook output
export const PER_CLASS = [
  ['Normal Skin', 1.0, 1.0, 1.0, 501], ['Acne', .992, .983, .988, 528], ['Actinic Keratosis', .965, .951, .958, 487],
  ['Basal Cell Carcinoma', .989, .998, .994, 466], ['Chickenpox', 1.0, 1.0, 1.0, 495], ['Dyshidrotic Eczema', .979, .993, .986, 430],
  ['Melanoma', .947, .893, .919, 476], ['Nevus', .907, .948, .927, 596], ['Nail Fungus', 1.0, 1.0, 1.0, 468],
  ['Pigmented Benign Keratosis', .977, .945, .961, 452], ['Ringworm', 1.0, 1.0, 1.0, 485], ['Seborrheic Keratosis', .989, 1.0, .994, 432],
  ['Squamous Cell Carcinoma', .951, .977, .964, 436], ['Vascular Lesion', 1.0, 1.0, 1.0, 467],
].map(([label, precision, recall, f1, support]) => ({ label, precision, recall, f1, support }))

// ---- ILLUSTRATIVE charts (replace by exporting real data: see README "Export real charts") ----
// Confusion matrix rebuilt from real per-class recall + support; errors go to plausible look-alikes.
const LOOKALIKE = { Melanoma: ['Nevus', 'Pigmented Benign Keratosis'], Nevus: ['Melanoma', 'Pigmented Benign Keratosis'],
  'Actinic Keratosis': ['Squamous Cell Carcinoma'], 'Squamous Cell Carcinoma': ['Actinic Keratosis'],
  'Pigmented Benign Keratosis': ['Nevus', 'Melanoma'], Acne: ['Dyshidrotic Eczema'], 'Dyshidrotic Eczema': ['Acne'],
  'Basal Cell Carcinoma': ['Squamous Cell Carcinoma'], 'Seborrheic Keratosis': ['Nevus'] }
export function buildConfusion() {
  const idx = Object.fromEntries(CLASS_NAMES.map((c, i) => [c, i]))
  const m = CLASS_NAMES.map(() => CLASS_NAMES.map(() => 0))
  PER_CLASS.forEach(({ label, recall, support }) => {
    const i = idx[label], right = Math.round(recall * support), wrong = support - right
    m[i][i] = right
    const to = (LOOKALIKE[label] || []).map(l => idx[l])
    to.forEach((j, k) => { m[i][j] += k === to.length - 1 ? wrong - Math.floor(wrong / to.length) * (to.length - 1) : Math.floor(wrong / to.length) })
    if (!to.length) m[i][i] += wrong
  })
  return m
}
// Anchored on the real point: threshold 0.50 -> 99.6% coverage, 97.95% accuracy on kept samples.
export function buildThresholdCurve() {
  return Array.from({ length: 50 }, (_, k) => {
    const t = (k / 49) * 0.98, hi = Math.max(0, (t - 0.5) / 0.5)
    return { t, acc: 0.9771 + 0.0024 * Math.pow(t / 0.5, 1.5) + 0.015 * Math.pow(hi, 1.5),
      cov: 1 - 0.004 * Math.pow(t / 0.5, 2) - 0.12 * Math.pow(hi, 2) }
  })
}
export function buildTsne() {
  let s = 42; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd())
  return CLASS_NAMES.flatMap((c, i) => {
    const a = (i / CLASS_NAMES.length) * 2 * Math.PI, cx = Math.cos(a) * 38, cy = Math.sin(a) * 38
    return Array.from({ length: 40 }, () => ({ c: i, x: cx + gauss() * 5, y: cy + gauss() * 5 }))
  })
}
