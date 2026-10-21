import { useEffect, useState } from 'react'
import Analyzer from './Analyzer.jsx'
import Performance from './Performance.jsx'
import { checkHealth } from './api.js'
import { CATEGORY, GROUPS, INFO, RISK_STYLE, STATS } from './data.js'

const NAV = [['analyzer', 'Analyzer'], ['performance', 'Performance'], ['conditions', 'Conditions'], ['how', 'How it works'], ['ethics', 'Limitations']]

function Header() {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'))
  const [api, setApi] = useState(null)
  useEffect(() => { checkHealth().then(setApi) }, [])
  const toggle = () => { const d = !dark; setDark(d); document.documentElement.classList.toggle('dark', d); localStorage.setItem('theme', d ? 'dark' : 'light') }
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <a href="#top" className="flex items-center gap-2 font-bold"><span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-teal-700 text-white">D</span>DermaScan AI</a>
        <nav aria-label="Main" className="hidden gap-5 text-sm md:flex">{NAV.map(([id, l]) => <a key={id} href={`#${id}`} className="muted hover:text-teal-700 dark:hover:text-teal-400">{l}</a>)}</nav>
        <div className="flex items-center gap-2">
          {api && <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset sm:inline ${api.live ? RISK_STYLE.green : RISK_STYLE.amber}`} title={api.live ? `Backend on ${api.device}` : 'Backend not reachable: demo data will be used'}>{api.live ? 'Live API' : 'Demo mode'}</span>}
          <button onClick={toggle} aria-pressed={dark} aria-label="Toggle dark mode" className="btn-ghost !px-3 !py-2">{dark ? 'Light' : 'Dark'}</button>
        </div>
      </div>
    </header>)
}

const Section = ({ id, title, intro, children, alt }) => (
  <section id={id} className={alt ? 'bg-white dark:bg-slate-900/40' : ''}><div className="mx-auto max-w-5xl px-4 py-16"><h2 className="h2">{title}</h2>{intro && <p className="mt-2 max-w-2xl muted">{intro}</p>}<div className="mt-8">{children}</div></div></section>)

export default function App() {
  return (
    <div id="top">
      <a href="#analyzer" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2 focus:text-black">Skip to analyzer</a>
      <div role="note" className="sticky top-0 z-40 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:text-sm dark:bg-amber-950 dark:text-amber-100">For research and educational use only. Not a medical diagnosis. Consult a qualified dermatologist.</div>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-teal-50 to-slate-50 dark:from-teal-950/40 dark:to-slate-950">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">AI-assisted skin lesion analysis</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg muted">A ResNet50 research demo that classifies skin images into 14 conditions and shows, with Grad-CAM, where the model looked.</p>
            <a href="#analyzer" className="btn-primary mt-8 !px-8 !py-4 text-base">Upload a photo</a>
            <ul className="mt-10 flex flex-wrap justify-center gap-3 text-sm font-medium">
              {['97.7% accuracy', '14 conditions', 'Grad-CAM explainability'].map(c => <li key={c} className="rounded-full border border-teal-200 bg-white px-4 py-1.5 text-teal-900 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-200">{c}</li>)}
            </ul>
          </div>
        </section>

        <Analyzer />
        <Performance />

        <Section id="conditions" title="Supported conditions" intro="The model recognises these 14 classes, grouped by category." alt>
          <div className="space-y-8">{GROUPS.map(([g, names]) => { const c = CATEGORY[g]; return (
            <div key={g}><h3 className="mb-3 flex items-center gap-2 font-semibold"><span className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset ${RISK_STYLE[c.risk]}`}>{c.label}</span></h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{names.map(n => <li key={n} className="card !p-4"><p className="font-semibold">{n}</p><p className="mt-1 text-sm muted">{INFO[n].short}</p></li>)}</ul></div>) })}</div>
        </Section>

        <Section id="how" title="How it works">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Upload', 'You add a photo. It stays in memory and is never saved.'], ['Preprocess', 'Resized to 224\u00d7224 and normalised with ImageNet statistics.'], ['ResNet50 classification', 'A fine-tuned ResNet50 scores 14 classes, averaging the image and its mirror (flip TTA).'], ['Grad-CAM explanation', 'A heatmap from the last convolutional block shows influential regions.']]
              .map(([t, d], i) => <li key={t} className="card relative"><span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">{i + 1}</span><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm muted">{d}</p></li>)}
          </ol>
        </Section>

        <Section id="ethics" title="Limitations and ethics" alt>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Dataset bias', 'The model only knows what its roughly 44,800 training images showed. Conditions, devices and settings that are under-represented are likely to be handled worse.'],
              ['Skin-tone variation', 'Skin datasets often under-represent darker skin tones, and appearance of the same condition varies across tones. Performance may be lower for under-represented groups and has not been validated here.'],
              ['Photo-quality dependence', 'Blur, poor lighting, filters, hair, jewellery or unusual angles can change the result. Low-confidence results (below 50%) are flagged as unreliable.'],
              ['Not a replacement for a clinician', 'Test accuracy comes from a curated dataset, not from real-world screening. Diagnosis needs an in-person examination, and sometimes a biopsy. This tool never gives treatment advice.']]
              .map(([t, d]) => <div key={t} className="card"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm muted">{d}</p></div>)}
          </div>
        </Section>
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="mx-auto max-w-5xl space-y-3 px-4 py-10 text-sm muted">
        <p className="font-semibold text-slate-900 dark:text-slate-100">For research and educational use only. Not a medical diagnosis. Consult a qualified dermatologist.</p>
        <p>Privacy: images are processed in memory and not stored.</p>
        <p><a className="underline hover:text-teal-700" href="https://github.com/">GitHub</a> &middot; <a className="underline hover:text-teal-700" href="mailto:contact@example.com">Contact</a></p>
      </div></footer>
    </div>)
}
