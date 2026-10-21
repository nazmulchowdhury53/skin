// Live API client. Calls POST {BASE}/predict (multipart field "file").
// If the backend is unreachable, optionally falls back to DEMO data that is flagged result.demo = true.
const BASE = import.meta.env.VITE_API_URL ?? '/api'
const ALLOW_MOCK = import.meta.env.VITE_ALLOW_MOCK !== 'false'

export async function checkHealth() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(4000) })
    const j = await r.json()
    return j.status === 'ok' ? { live: true, device: j.device } : { live: false }
  } catch { return { live: false } }
}

export async function predict(file, signal) {
  const fd = new FormData()
  fd.append('file', file)
  let res
  try { res = await fetch(`${BASE}/predict`, { method: 'POST', body: fd, signal }) }
  catch (e) {
    if (e.name === 'AbortError') throw e
    if (ALLOW_MOCK) return mockPredict(file)
    throw new Error('Cannot reach the analysis server. Please try again later.')
  }
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(typeof j.detail === 'string' ? j.detail : `Server error (${res.status})`)
  }
  return { ...(await res.json()), demo: false }
}

// ---------- mock (UI works before the backend is connected) ----------
function blobHeat() {
  const c = document.createElement('canvas'); c.width = c.height = 224
  const g = c.getContext('2d'), grad = g.createRadialGradient(112, 104, 4, 112, 104, 95)
  grad.addColorStop(0, 'rgb(255,40,0)'); grad.addColorStop(.4, 'rgb(255,220,0)'); grad.addColorStop(.7, 'rgb(0,200,255)'); grad.addColorStop(1, 'rgb(20,30,140)')
  g.fillStyle = grad; g.fillRect(0, 0, 224, 224)
  return c.toDataURL('image/png').split(',')[1]
}
const MOCKS = [
  { top: 'Nevus', cat: 'Benign Skin Lesions', conf: .91, rest: [['Melanoma', .05], ['Pigmented Benign Keratosis', .02], ['Seborrheic Keratosis', .01]], mal: .06 },
  { top: 'Melanoma', cat: 'Skin Cancer', conf: .84, rest: [['Nevus', .09], ['Pigmented Benign Keratosis', .04], ['Basal Cell Carcinoma', .02]], mal: .87 },
  { top: 'Ringworm', cat: 'Infectious Skin Diseases', conf: .96, rest: [['Dyshidrotic Eczema', .02], ['Acne', .01], ['Normal Skin', .005]], mal: .003 },
  { top: 'Acne', cat: 'Inflammatory Skin Diseases', conf: .43, rest: [['Dyshidrotic Eczema', .31], ['Normal Skin', .14], ['Ringworm', .06]], mal: .01 },
]
async function mockPredict(file) {
  await new Promise(r => setTimeout(r, 1400))
  const m = MOCKS[file.size % MOCKS.length], heat = blobHeat()
  return { top_class: m.top, confidence: m.conf, category: m.cat, malignancy_score: m.mal,
    top5: [{ label: m.top, prob: m.conf }, ...m.rest.map(([label, prob]) => ({ label, prob }))],
    gradcam_overlay_base64: heat, gradcam_heatmap_base64: heat, low_confidence: m.conf < .5, demo: true }
}
