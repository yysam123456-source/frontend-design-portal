// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   ASCII.ART — bas3line/ascii 全屏剧场
   240 个逐帧动画 ASCII 作品，本地自托管运行时（无 CDN 依赖），
   一个 <ascii-art> 标签即可播放；与 ASCII Ocean（鲨鱼）同属
   SHOWCASE 的 ASCII 分类。
   ═══════════════════════════════════════════════════════════════ */

const CATEGORY_LABELS: Record<string, string> = {
  scenes: 'Scenes',
  ui: 'UI',
  data: 'Data',
  type: 'Type',
  logos: 'Logos',
  companies: 'Companies',
  distros: 'Distros',
  shapes: 'Shapes',
  space: 'Space',
  physics: 'Physics',
  nature: 'Nature',
  creatures: 'Creatures',
  objects: 'Objects',
  generative: 'Generative',
  effects: 'Effects',
}

const CATEGORY_BLURBS: Record<string, string> = {
  scenes: 'landscapes drawn a character at a time',
  ui: 'interfaces that type themselves',
  data: 'charts, gauges and meters',
  type: 'letters that move',
  logos: 'language and tool marks',
  companies: 'brand marks in monospace',
  distros: 'operating-system mascots',
  shapes: 'geometry turning in the dark',
  space: 'orbits, eclipses and starfields',
  physics: 'simulations with visible forces',
  nature: 'weather, plants and light',
  creatures: 'animals built from glyphs',
  objects: 'everyday things in motion',
  generative: 'rules that draw themselves',
  effects: 'fire, rain, tunnels and glitch',
}

const AUTO_ADVANCE_MS = 11000

export default function AsciiRestShowcase() {
  const [pieces, setPieces] = useState<any[]>([])
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [fontSize, setFontSize] = useState(16)
  const [maxWidth, setMaxWidth] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the catalogue (same data that powers the gallery cards).
  useEffect(() => {
    let live = true
    fetch('/data/ascii-rest.json')
      .then((res) => res.json())
      .then((list: any[]) => {
        if (!live || !Array.isArray(list)) return
        setPieces(list)
        const start = list.findIndex((item) => item.id === 'ascii-rest-kyoto-dusk')
        setActive(start >= 0 ? start : 0)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [])

  // Define the custom element once; the module also installs the local font.
  useEffect(() => {
    if (document.querySelector('script[data-ascii-rest-element]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = '/ascii-rest/ascii-art.js'
    script.dataset.asciiRestElement = '1'
    document.head.append(script)
  }, [])

  const piece = pieces[active]
  const slug = piece?.id?.replace('ascii-rest-', '') || ''

  const filtered = useMemo(
    () => (filter === 'all' ? pieces : pieces.filter((item) => item.pieceCategory === filter)),
    [pieces, filter]
  )

  const step = useCallback(
    (direction: number) => {
      const pool = filtered.length ? filtered : pieces
      if (!pool.length) return
      const at = pool.findIndex((item) => item.id === piece?.id)
      const next = pool[(at + direction + pool.length) % pool.length]
      setActive(pieces.indexOf(next))
    },
    [filtered, pieces, piece?.id]
  )

  const random = useCallback(() => {
    const pool = filtered.length ? filtered : pieces
    if (!pool.length) return
    const next = pool[Math.floor(Math.random() * pool.length)]
    setActive(pieces.indexOf(next))
  }, [filtered, pieces])

  // Auto-advance, unless the visitor asked for motion to be reduced.
  useEffect(() => {
    if (!playing || !pieces.length) return
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => step(1), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [playing, step, pieces.length])

  // Fit each piece inside the stage in both directions: monospace cells are
  // 0.6em wide and 1.2em tall; canvases keep cols / (rows * cell) aspect.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () => {
      const style = getComputedStyle(stage)
      const width =
        stage.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0)
      const height =
        stage.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0)
      const cols = piece?.cols || 80
      const rows = piece?.rows || 24
      const cell = piece?.cell || 2
      if (!width || !height) return
      if (piece?.palette) {
        setFontSize(12)
        setMaxWidth(Math.min(width, Math.floor((height * cols) / (rows * cell))))
      } else {
        const byWidth = width / cols / 0.6
        const byHeight = height / rows / 1.2
        const font = Math.max(2, Math.floor(Math.min(byWidth, byHeight)))
        setFontSize(font)
        setMaxWidth(Math.floor(cols * 0.6 * font))
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [piece?.cols, piece?.rows, piece?.cell, piece?.palette])

  // Keyboard control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key.toLowerCase() === 'r') random()
      else if (event.key === 'Escape') setPickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, random])

  const copyTag = useCallback(() => {
    const tag = `<ascii-art piece="${slug}"></ascii-art>`
    navigator.clipboard?.writeText(tag).then(() => {
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1600)
    })
  }, [slug])

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of pieces) counts.set(item.pieceCategory, (counts.get(item.pieceCategory) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [pieces])

  const label = piece?.name || 'ASCII.ART'
  const category = piece?.pieceCategory || ''

  return (
    <div className="fixed inset-0 z-10 overflow-hidden" style={{ background: '#04050a', color: '#e8e8e8' }}>
      <style>{`
        @keyframes ascii-scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
        .ascii-stage::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.028) 0 1px, transparent 1px 3px);
          mix-blend-mode: screen;
        }
      `}</style>

      {/* backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(56,189,248,0.09), transparent 58%), radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.06), transparent 52%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(125,211,252,0.55), transparent)' }}
      />

      {/* header */}
      <div className="pointer-events-none absolute left-6 top-[76px] z-20 select-none md:left-10">
        <div className="text-[11px] tracking-[0.5em] text-cyan-200/60">ASCII.ART</div>
        <h1 className="mt-2 text-2xl font-black tracking-[0.18em] text-white/92 md:text-3xl">
          THE ASCII THEATER
        </h1>
        <p className="mt-2 max-w-[420px] text-[11px] leading-relaxed tracking-[0.18em] text-white/40">
          240 ANIMATED PIECES · 15 CATEGORIES · ONE TAG EACH
        </p>
      </div>

      {/* source links */}
      <div className="absolute right-5 top-[76px] z-20 hidden text-right text-[11px] leading-relaxed sm:block">
        <a
          href="https://ascii.rest"
          target="_blank"
          rel="noreferrer"
          className="block text-cyan-300/75 transition-colors hover:text-cyan-200"
        >
          ascii.rest ↗
        </a>
        <a
          href="https://github.com/bas3line/ascii"
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-white/35 transition-colors hover:text-white/70"
        >
          github.com/bas3line/ascii
        </a>
        <div className="mt-1 text-white/25">MIT licensed · self-hosted runtime</div>
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        className="ascii-stage absolute inset-0 flex items-center justify-center px-5 md:px-14"
        style={{ paddingTop: '176px', paddingBottom: '250px' }}
      >
        {failed && (
          <div className="text-center text-sm text-white/50">
            The ASCII catalogue could not be loaded. Check /data/ascii-rest.json.
          </div>
        )}
        {!failed && !piece && (
          <div className="text-center text-[11px] tracking-[0.4em] text-white/30">LOADING 240 PIECES…</div>
        )}
        {piece && (
          <ascii-art
            key={slug}
            piece={slug}
            label={`${label} — animated ASCII art`}
            style={{
              width: maxWidth ? `${maxWidth}px` : '100%',
              maxWidth: '100%',
              fontSize: `${fontSize}px`,
              lineHeight: 1.05,
              color: 'rgba(232,240,255,0.92)',
            }}
          />
        )}
      </div>

      {/* caption + controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-20 sm:pb-5">
        <div className="pointer-events-auto max-w-[min(92vw,760px)] text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.32em] text-cyan-200/55">
            <span>{CATEGORY_LABELS[category] || category || 'ASCII'}</span>
            <span className="text-white/20">/</span>
            <span>{piece?.cols} × {piece?.rows}</span>
            <span className="text-white/20">/</span>
            <span>{piece?.fps} FPS</span>
          </div>
          <div className="mt-1 truncate text-lg font-semibold tracking-[0.2em] text-white/90 md:text-xl">
            {label}
          </div>
          <div className="mx-auto mt-1 line-clamp-1 max-w-[560px] text-[11px] text-white/35">
            {CATEGORY_BLURBS[category] || piece?.description}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/45 px-2 py-1.5 backdrop-blur-xl">
          <button onClick={() => step(-1)} className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-white/55 transition-colors hover:bg-white/10 hover:text-white" title="Previous piece (←)">
            ◀ PREV
          </button>
          <button
            onClick={() => setPlaying((value) => !value)}
            className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-white/80 transition-colors hover:bg-white/10"
            title="Pause or resume auto-advance (space)"
          >
            {playing ? '❚❚ PAUSE' : '▶ PLAY'}
          </button>
          <button onClick={() => step(1)} className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-white/55 transition-colors hover:bg-white/10 hover:text-white" title="Next piece (→)">
            NEXT ▶
          </button>
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button onClick={random} className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-white/55 transition-colors hover:bg-white/10 hover:text-white" title="Random piece (R)">
            RANDOM
          </button>
          <button onClick={copyTag} className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-cyan-200/75 transition-colors hover:bg-cyan-300/10 hover:text-cyan-100" title="Copy the one-line embed">
            {copied ? 'COPIED ✓' : 'COPY TAG'}
          </button>
          <button
            onClick={() => setPickerOpen((value) => !value)}
            className="rounded-md border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-[11px] tracking-[0.18em] text-cyan-100/85 transition-colors hover:bg-cyan-300/15"
          >
            BROWSE 240
          </button>
        </div>
      </div>

      {/* piece browser */}
      {pickerOpen && (
        <div className="absolute inset-y-0 right-0 z-40 flex w-[min(420px,92vw)] flex-col border-l border-cyan-300/15 bg-[#070a12]/95 backdrop-blur-2xl">
          <div className="flex items-start justify-between px-5 pb-3 pt-5">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-cyan-200/55">PIECE INDEX</div>
              <div className="mt-1 text-lg font-semibold tracking-[0.12em] text-white/90">
                {filtered.length} pieces
              </div>
            </div>
            <button
              onClick={() => setPickerOpen(false)}
              className="rounded-md px-2 py-1 text-sm text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close piece browser"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-1 px-4 pb-3">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.08em] transition-colors ${
                filter === 'all' ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              ALL {pieces.length}
            </button>
            {categories.map(([key, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.08em] transition-colors ${
                  filter === key ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                {(CATEGORY_LABELS[key] || key).toUpperCase()} {count}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6" style={{ scrollbarWidth: 'thin' }}>
            {filtered.map((item) => {
              const isActive = item.id === piece?.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActive(pieces.indexOf(item))
                    setPickerOpen(false)
                  }}
                  className={`mb-0.5 flex w-full items-baseline justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-cyan-300/12 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <span className="truncate text-[12px] tracking-[0.04em]">{item.name}</span>
                  <span className="shrink-0 text-[9px] uppercase tracking-[0.16em] text-white/25">
                    {(CATEGORY_LABELS[item.pieceCategory] || item.pieceCategory)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
