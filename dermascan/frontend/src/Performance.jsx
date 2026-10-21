import { useEffect, useMemo, useState } from 'react'
import { CLASS_NAMES, PER_CLASS, STATS, buildConfusion, buildThresholdCurve, buildTsne } from './data.js'

const TABS = [['table', 'Per-class metrics'], ['cm', 'Confusion matrix'], ['thr', 'Accuracy vs threshold'], ['tsne', 't-SNE']]
const PAL = ['#0f766e', '#0284c7', '#7c3aed', '#dc2626', '#d97706', '#65a30d', '#db2777', '#475569', '#0891b2', '#9333ea', '#ea580c', '#16a34a', '#be123c', '#4f46e5']
const pct = v => (v * 100).toFixed(1)

function Note({ real }) {
  return <p className="mt-3 text-xs muted">{real ? 'Loaded from your exported results.' : 'Illustrative chart reconstructed from the real per-class metrics. Export the notebook\u2019s real data to replace it (see README).'}</p>
}

function Table() {
  return (<div className="overflow-x-auto"><table className="w-full min-w-[32rem] text-sm">
    <caption className="sr-only">Per-class test metrics</caption>
    <thead><tr className="border-b border-slate-200 text-left dark:border-slate-700"><th scope="col" className="py-2 pr-3">Class</th><th scope="col">Precision</th><th scope="col">Recall</th><th scope="col">F1</th><th scope="col" className="text-right">Test images</th></tr></thead>
    <tbody>{PER_CLASS.map(c => <tr key={c.label} className="border-b border-slate-100 dark:border-slate-800"><th scope="row" className="py-2 pr-3 text-left font-medium">{c.label}</th><td>{pct(c.precision)}%</td><td>{pct(c.recall)}%</td><td>{pct(c.f1)}%</td><td className="text-right">{c.support}</td></tr>)}</tbody>
    <tfoot><tr className="font-semibold"><th scope="row" className="py-2 text-left">Macro average</th><td>{STATS.precision}%</td><td>{STATS.recall}%</td><td>{STATS.f1}%</td><td className="text-right">6,719</td></tr></tfoot>
  </table></div>)
}

function Confusion({ m }) {
  const rowMax = m.map(r => r.reduce((a, b) => a + b, 0) || 1)
  return (<div className="overflow-x-auto"><div className="min-w-[36rem]">
    <div className="grid" style={{ gridTemplateColumns: `8rem repeat(14, 1fr)` }}>
      <div />{CLASS_NAMES.map((c, j) => <div key={c} className="h-24 text-[10px] leading-tight muted" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{c}</div>)}
      {m.map((row, i) => <FragmentRow key={i} i={i} row={row} max={rowMax[i]} />)}
    </div></div>
    <p className="mt-2 text-xs muted">Rows: true class. Columns: predicted class. Colour = share of the row.</p></div>)
}
function FragmentRow({ i, row, max }) {
  return (<>
    <div className="truncate pr-2 text-right text-[11px] leading-6 muted">{CLASS_NAMES[i]}</div>
    {row.map((v, j) => <div key={j} title={`True ${CLASS_NAMES[i]} \u2192 predicted ${CLASS_NAMES[j]}: ${v}`} className="flex h-6 items-center justify-center text-[9px]"
      style={{ background: `rgba(15,118,110,${Math.min(1, v / max)})`, color: v / max > .5 ? '#fff' : 'inherit' }}>{v > 0 ? v : ''}</div>)}
  </>)
}

function Threshold({ pts }) {
  const W = 520, H = 280, P = 40, x = t => P + t * (W - P - 12), y = v => H - 28 - ((v - 0.5) / 0.5) * (H - 48)
  const path = k => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ')
  return (<div><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart of accuracy and coverage versus confidence threshold" className="w-full">
    {[.5, .6, .7, .8, .9, 1].map(v => <g key={v}><line x1={P} x2={W - 12} y1={y(v)} y2={y(v)} className="stroke-slate-200 dark:stroke-slate-800" /><text x={P - 6} y={y(v) + 3} textAnchor="end" fontSize="10" className="fill-slate-500">{v.toFixed(1)}</text></g>)}
    {[0, .25, .5, .75, 1].map(t => <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize="10" className="fill-slate-500">{t}</text>)}
    <line x1={x(.5)} x2={x(.5)} y1={20} y2={H - 28} stroke="#64748b" strokeDasharray="4 3" /><text x={x(.5) + 4} y={30} fontSize="10" className="fill-slate-500">threshold 0.50</text>
    <path d={path('acc')} fill="none" stroke="#0f766e" strokeWidth="2.5" /><path d={path('cov')} fill="none" stroke="#0284c7" strokeWidth="2.5" />
    <text x={W - 14} y={18} textAnchor="end" fontSize="11" fill="#0f766e">Accuracy (kept)</text><text x={W - 14} y={H - 40} textAnchor="end" fontSize="11" fill="#0284c7">Coverage</text>
  </svg><p className="text-sm muted">At the 0.50 threshold, 99.6% of test images are kept, with 97.95% accuracy on those.</p></div>)
}

function Tsne({ pts }) {
  const [on, setOn] = useState(null)
  return (<div><svg viewBox="-60 -60 120 120" role="img" aria-label="t-SNE scatter of test-set embeddings coloured by class" className="mx-auto w-full max-w-md">
    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.1" fill={PAL[p.c]} opacity={on === null || on === p.c ? .85 : .08} />)}</svg>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">{CLASS_NAMES.map((c, i) => <button key={c} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)} className="flex items-center gap-1.5 rounded focus-visible:ring-2 focus-visible:ring-teal-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PAL[i] }} />{c}</button>)}</div></div>)
}

export default function Performance() {
  const [tab, setTab] = useState('table'), [real, setReal] = useState(null)
  // Optional: drop real exports into frontend/public/metrics.json (see README)
  useEffect(() => { fetch('/metrics.json').then(r => r.json()).then(setReal).catch(() => {}) }, [])
  const cm = useMemo(() => real?.confusion ?? buildConfusion(), [real])
  const thr = useMemo(() => real?.threshold_curve ?? buildThresholdCurve(), [real])
  const ts = useMemo(() => real?.tsne ?? buildTsne(), [real])
  return (
    <section id="performance" className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="h2">Model performance</h2>
      <p className="mt-2 muted">Held-out test set (15% of about 44,800 images, 70/15/15 split): accuracy {STATS.accuracy}%, macro precision {STATS.precision}%, recall {STATS.recall}%, F1 {STATS.f1}%.</p>
      <div className="card mt-6">
        <div role="tablist" aria-label="Performance views" className="mb-5 flex flex-wrap gap-2">
          {TABS.map(([k, l]) => <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls="perf-panel" onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${tab === k ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100'}`}>{l}</button>)}
        </div>
        <div id="perf-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
          {tab === 'table' && <Table />}
          {tab === 'cm' && <><Confusion m={cm} /><Note real={!!real?.confusion} /></>}
          {tab === 'thr' && <><Threshold pts={thr} /><Note real={!!real?.threshold_curve} /></>}
          {tab === 'tsne' && <><Tsne pts={ts} /><Note real={!!real?.tsne} /></>}
        </div>
      </div>
    </section>)
}
