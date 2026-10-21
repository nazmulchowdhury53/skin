import { useEffect, useRef, useState } from 'react'
import { predict } from './api.js'
import { downloadReport } from './report.js'
import { CATEGORY, INFO, NEEDS_PROMPT, RISK_COLOR, RISK_STYLE } from './data.js'

const TIPS = ['Good, even lighting (daylight is best)', 'Close-up, with the lesion filling most of the frame', 'In focus, hold the camera steady', 'No filters, makeup or editing']

function Ring({ value, color }) {
  const [v, setV] = useState(0)
  useEffect(() => { const t = setTimeout(() => setV(value), 80); return () => clearTimeout(t) }, [value])
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`Confidence ${(value * 100).toFixed(1)} percent`}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke={color}
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{(value * 100).toFixed(1)}%</span><span className="text-xs muted">confidence</span>
      </div>
    </div>)
}

function Panel({ title, children }) {
  return <figure className="space-y-1.5"><div className="aspect-square overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">{children}</div>
    <figcaption className="text-center text-xs font-medium muted">{title}</figcaption></figure>
}

function Results({ r, previewUrl, onReset }) {
  const [opacity, setOpacity] = useState(55)
  const cat = CATEGORY[r.category] ?? { label: r.category, risk: 'amber' }
  const info = INFO[r.top_class]
  const heat = `data:image/png;base64,${r.gradcam_heatmap_base64 ?? r.gradcam_overlay_base64}`
  const mal = r.malignancy_score
  return (
    <section aria-live="polite" className="fade-up space-y-5">
      {r.demo && <div role="alert" className="rounded-xl border border-violet-300 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200"><b>Demo data.</b> The analysis server is not connected, so this result is a placeholder, not a real prediction.</div>}
      {r.low_confidence && <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">Low confidence, result unreliable. The top probability is below 50%. Try a clearer photo.</div>}
      {NEEDS_PROMPT.has(r.category) && !r.low_confidence && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"><b>Please seek professional evaluation.</b> This result falls in the {cat.label.toLowerCase()} group. Only a qualified dermatologist can examine and diagnose a skin lesion.</div>}

      <div className="card flex flex-col items-center gap-6 sm:flex-row">
        <Ring value={r.confidence} color={RISK_COLOR[cat.risk]} />
        <div className="w-full space-y-3 text-center sm:text-left">
          <p className="text-sm muted">Top prediction</p>
          <h3 className="text-2xl font-bold">{r.top_class}</h3>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${RISK_STYLE[cat.risk]}`}>{cat.label}</span>
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="font-medium">Malignancy score</span><span>{(mal * 100).toFixed(1)}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(mal * 100)} aria-label="Malignancy score">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${mal * 100}%`, background: mal > .5 ? '#dc2626' : mal > .15 ? '#d97706' : '#059669' }} />
            </div>
            <p className="mt-1 text-xs muted">P(melanoma) + P(BCC) + P(SCC)</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">Top-5 probabilities</h3>
        <ul className="space-y-2.5">{r.top5.map((t, i) => (
          <li key={t.label}><div className="mb-1 flex justify-between text-sm"><span className={i === 0 ? 'font-semibold' : ''}>{t.label}</span><span>{(t.prob * 100).toFixed(1)}%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-full rounded-full ${i === 0 ? 'bg-teal-600' : 'bg-sky-400'} transition-all duration-700`} style={{ width: `${Math.max(t.prob * 100, 0.5)}%` }} /></div></li>))}
        </ul>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">Grad-CAM explanation</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Panel title="Original"><img src={previewUrl} alt="Your uploaded photo, resized to the model's 224 by 224 view" className="h-full w-full object-fill" /></Panel>
          <Panel title="Grad-CAM heatmap"><img src={heat} alt="Heatmap of the image regions that influenced the prediction" className="h-full w-full object-fill" /></Panel>
          <Panel title="Overlay"><div className="relative h-full w-full"><img src={previewUrl} alt="" className="h-full w-full object-fill" /><img src={heat} alt="Heatmap overlaid on your photo" className="absolute inset-0 h-full w-full object-fill" style={{ opacity: opacity / 100 }} /></div></Panel>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm"><span className="shrink-0 font-medium">Overlay opacity</span>
          <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full accent-teal-700" /><span className="w-10 text-right tabular-nums">{opacity}%</span></label>
        <p className="mt-2 text-xs muted">Warm colours mark regions that influenced the model most. This shows where the model looked, not why a condition is present.</p>
      </div>

      {info && <div className="card space-y-4">
        <div><h3 className="font-semibold">What is this?</h3><p className="mt-1 text-sm muted">{info.what}</p></div>
        <div><h3 className="font-semibold">When to see a dermatologist</h3><p className="mt-1 text-sm muted">{info.see}</p></div>
        <p className="text-xs muted">General information only. This tool does not give treatment or medication advice.</p>
      </div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" onClick={() => downloadReport(r, previewUrl)}>Download report (PDF)</button>
        <button className="btn-ghost" onClick={onReset}>Analyze another image</button>
      </div>
    </section>)
}

export default function Analyzer() {
  const [file, setFile] = useState(null), [url, setUrl] = useState(null)
  const [agree, setAgree] = useState(false), [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null), [error, setError] = useState(''), [drag, setDrag] = useState(false)
  const input = useRef(), cam = useRef(), box = useRef(), abort = useRef()

  useEffect(() => () => url && URL.revokeObjectURL(url), [url])
  const pick = f => {
    if (!f) return
    if (!/^image\/(jpe?g|png|webp)$/i.test(f.type)) return setError('Please choose a JPG, PNG or WebP image.')
    if (f.size > 10 * 1024 * 1024) return setError('Image is larger than 10 MB.')
    setError(''); setResult(null); setFile(f); setUrl(URL.createObjectURL(f))
  }
  const reset = () => { abort.current?.abort(); setFile(null); setUrl(null); setResult(null); setError(''); setBusy(false) }
  const run = async () => {
    if (!agree) { setError('Please tick the "I understand" box first.'); box.current?.focus(); return }
    setBusy(true); setError(''); setResult(null)
    abort.current = new AbortController()
    try { setResult(await predict(file, abort.current.signal)) }
    catch (e) { if (e.name !== 'AbortError') setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <section id="analyzer" className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="h2">Analyzer</h2>
      <p className="mt-2 muted">Upload a clear photo of a skin area. Images are processed in memory and are not stored.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="card space-y-4">
          <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
            className={`flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition ${drag ? 'border-teal-600 bg-teal-50 dark:bg-teal-950' : 'border-slate-300 dark:border-slate-700'}`}>
            {url ? <img src={url} alt="Preview of the selected photo" className="max-h-72 rounded-xl object-contain" /> : <>
              <svg aria-hidden className="mb-2 h-10 w-10 text-teal-700 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
              <p className="font-medium">Drag and drop a photo here</p><p className="text-sm muted">JPG, PNG or WebP, up to 10 MB</p></>}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose an image file" onChange={e => pick(e.target.files[0])} />
          <input ref={cam} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a photo with the camera" onChange={e => pick(e.target.files[0])} />
          <div className="flex flex-wrap gap-3">
            <button className="btn-ghost" onClick={() => input.current.click()}>Choose file</button>
            <button className="btn-ghost sm:hidden" onClick={() => cam.current.click()}>Use camera</button>
            {file && <button className="btn-ghost" onClick={reset}>Remove</button>}
          </div>
          <ul className="space-y-1.5 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">
            <li className="font-semibold">Photo quality tips</li>{TIPS.map(t => <li key={t} className="flex gap-2"><span aria-hidden className="text-teal-700 dark:text-teal-400">&#10003;</span>{t}</li>)}
          </ul>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input ref={box} type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setError('') }} className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700" />
            <span><b>I understand</b> this is a research and education demo, not a medical diagnosis, and I will consult a qualified dermatologist about any skin concern.</span>
          </label>
          {error && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={!file || busy} onClick={run}>{busy ? 'Analyzing...' : 'Analyze'}</button>
        </div>
        <div>
          {busy && <div className="card space-y-4" aria-busy="true" aria-label="Loading results"><div className="skeleton h-36 w-full" /><div className="skeleton h-24 w-full" /><div className="grid grid-cols-3 gap-3"><div className="skeleton aspect-square" /><div className="skeleton aspect-square" /><div className="skeleton aspect-square" /></div></div>}
          {!busy && result && <Results r={result} previewUrl={url} onReset={reset} />}
          {!busy && !result && <div className="card text-center muted">Results will appear here after you upload a photo and press Analyze.</div>}
        </div>
      </div>
    </section>)
}
