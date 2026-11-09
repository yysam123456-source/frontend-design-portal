// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   ASCII MAGIC — kailashsr38/ascii-magic-art 全屏剧场
   734 件手写 ASCII 动画，24 个分类，11 种字符风格。
   运行时自托管在 public/ascii-magic/（无 CDN 依赖），
   自定义元素改名为 <ascii-magic-art>，避免与 ASCII.Art 的
   <ascii-art> 注册冲突。
   ═══════════════════════════════════════════════════════════════ */

const LOOKS = [
  { id: 'original', label: 'Original' },
  { id: 'dots', label: 'Halftone dots' },
  { id: 'ascii', label: 'ASCII' },
  { id: 'dense', label: 'Dense' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'binary', label: 'Binary' },
  { id: 'letters', label: 'Letters' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'squares', label: 'Squares' },
  { id: 'lines', label: 'Lines' },
  { id: 'dither', label: 'Dither' },
]

const AUTO_ADVANCE_MS = 11000

export default function AsciiMagicShowcase() {
  const [pieces, setPieces] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [look, setLook] = useState('original')
  const [fontSize, setFontSize] = useState(16)
  const [maxWidth, setMaxWidth] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the catalogue and the 24 category labels from the same generated data
  // that powers the gallery cards.
  useEffect(() => {
    let live = true
    Promise.all([
      fetch('/data/ascii-magic.json').then((res) => res.json()),
      fetch('/data/ascii-magic-categories.json').then((res) => res.json()),
    ])
      .then(([list, cats]) => {
        if (!live || !Array.isArray(list)) return
        setPieces(list)
        setCategories(Array.isArray(cats) ? cats : [])
        const start = list.findIndex((item) => item.id === 'ascii-magic-cloud-drift')
        setActive(start >= 0 ? start : 0)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [])

  // Define the custom element once. The runtime resolves pieces relative to
  // itself, so the whole collection ships inside /ascii-magic/.
  useEffect(() => {
    if (document.querySelector('script[data-ascii-magic-element]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = '/ascii-magic/runtime/ascii.js'
    script.dataset.asciiMagicElement = '1'
    document.head.append(script)
  }, [])

  const piece = pieces[active]
  const slug = piece?.id?.replace('ascii-magic-', '') || ''

  const categoryMeta = useMemo(() => {
    const map = new Map<string, any>()
    for (const item of categories) map.set(item.id, item)
    return map
  }, [categories])

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

  const cycleLook = useCallback(() => {
    setLook((current) => {
      const at = LOOKS.findIndex((item) => item.id === current)
      return LOOKS[(at + 1) % LOOKS.length].id
    })
  }, [])

  // Auto-advance, unless the visitor asked for motion to be reduced.
  useEffect(() => {
    if (!playing || !pieces.length) return
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => step(1), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [playing, step, pieces.length])

  // Fit every piece inside the stage. The runtime draws each cell at
  // 0.602em wide; square-cell photo pieces are 1:1, text pieces are 1.66:1.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () => {
      const style = getComputedStyle(stage)
      const width =
        stage.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0)
      const height =
        stage.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0)
      const cols = piece?.cols || 100
      const rows = piece?.rows || 32
      const cell = piece?.cell || 1.66
      if (!width || !height) return
      const font = Math.max(2, Math.floor(Math.min(width / (cols * 0.602), height / (rows * 0.602 * cell))))
      setFontSize(font)
      setMaxWidth(Math.floor(cols * 0.602 * font))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [piece?.cols, piece?.rows, piece?.cell])

  // Keyboard control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key.toLowerCase() === 'r') random()
      else if (event.key.toLowerCase() === 'l') cycleLook()
      else if (event.key === 'Escape') setPickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, random, cycleLook])

  const copyTag = useCallback(() => {
    const lookAttr = look === 'original' ? '' : ` look="${look}"`
    const tag = `<ascii-magic-art piece="${slug}"${lookAttr}></ascii-magic-art>`
    navigator.clipboard?.writeText(tag).then(() => {
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1600)
    })
  }, [slug, look])

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    []
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of pieces) counts.set(item.pieceCategory, (counts.get(item.pieceCategory) || 0) + 1)
    return counts
  }, [pieces])

  const label = piece?.name || 'ASCII MAGIC'
  const category = piece?.pieceCategory || ''
  const currentCategory = categoryMeta.get(category)
  const currentLook = LOOKS.find((item) => item.id === look)?.label || look

  return (
    <div className="fixed inset-0 z-10 overflow-hidden" style={{ background: '#05040a', color: '#e8e8e8' }}>
      <style>{`
        @keyframes magic-scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
        .magic-stage::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.026) 0 1px, transparent 1px 3px);
          mix-blend-mode: screen;
        }
      `}</style>

      {/* backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(167,139,250,0.10), transparent 58%), radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.06), transparent 52%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(196,181,253,0.55), transparent)' }}
      />

      {/* header */}
      <div className="pointer-events-none absolute left-6 top-[76px] z-20 select-none md:left-10">
        <div className="text-[11px] tracking-[0.5em] text-violet-200/60">ASCII MAGIC</div>
        <h1 className="mt-2 text-2xl font-black tracking-[0.16em] text-white/92 md:text-3xl">
          THE 734 THEATER
        </h1>
        <p className="mt-2 max-w-[460px] text-[11px] leading-relaxed tracking-[0.16em] text-white/40">
          734 ANIMATED PIECES · 24 CATEGORIES · 11 CHARACTER LOOKS
        </p>
      </div>

      {/* source links */}
      <div className="absolute right-5 top-[76px] z-20 hidden text-right text-[11px] leading-relaxed sm:block">
        <a
          href="https://www.ascii-magic.com/ascii"
          target="_blank"
          rel="noreferrer"
          className="block text-violet-300/75 transition-colors hover:text-violet-200"
        >
          ascii-magic.com/ascii ↗
        </a>
        <a
          href="https://github.com/kailashsr38/ascii-magic-art"
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-white/35 transition-colors hover:text-white/70"
        >
          github.com/kailashsr38/ascii-magic-art
        </a>
        <div className="mt-1 text-white/25">MIT licensed · self-hosted runtime</div>
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        className="magic-stage absolute inset-0 flex items-center justify-center px-5 md:px-14"
        style={{ paddingTop: '176px', paddingBottom: '260px' }}
      >
        {failed && (
          <div className="text-center text-sm text-white/50">
            The ASCII Magic catalogue could not be loaded. Check /data/ascii-magic.json.
          </div>
        )}
        {!failed && !piece && (
          <div className="text-center text-[11px] tracking-[0.4em] text-white/30">LOADING 734 PIECES…</div>
        )}
        {piece && (
          <ascii-magic-art
            key={`${slug}-${look}`}
            piece={slug}
            size={fontSize}
            look={look === 'original' ? undefined : look}
            style={{
              width: maxWidth ? `${maxWidth}px` : '100%',
              maxWidth: '100%',
              color: 'rgba(232,240,255,0.92)',
            }}
          />
        )}
      </div>

      {/* caption + controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-20 sm:pb-5">
        <div className="pointer-events-auto max-w-[min(92vw,820px)] text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.32em] text-violet-200/55">
            <span>{(currentCategory?.name || category || 'ASCII').toUpperCase()}</span>
            <span className="text-white/20">/</span>
            <span>{piece?.cols} × {piece?.rows}</span>
            <span className="text-white/20">/</span>
            <span>{piece?.fps} FPS</span>
            <span className="text-white/20">/</span>
            <span>{currentLook.toUpperCase()}</span>
          </div>
          <div className="mt-1 truncate text-lg font-semibold tracking-[0.2em] text-white/90 md:text-xl">
            {label}
          </div>
          <div className="mx-auto mt-1 line-clamp-1 max-w-[600px] text-[11px] text-white/35">
            {currentCategory?.blurb || piece?.description}
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
          <label className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] tracking-[0.12em] text-white/40">
            LOOK
            <select
              value={look}
              onChange={(event) => setLook(event.target.value)}
              className="max-w-[132px] rounded border border-white/10 bg-[#0b0912] px-1.5 py-1 text-[10px] text-violet-100/85 outline-none"
              title="Redraw the piece in another character set (L)"
            >
              {LOOKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={copyTag} className="rounded-md px-3 py-1.5 text-[11px] tracking-[0.18em] text-violet-200/75 transition-colors hover:bg-violet-300/10 hover:text-violet-100" title="Copy the one-line embed">
            {copied ? 'COPIED ✓' : 'COPY TAG'}
          </button>
          <button
            onClick={() => setPickerOpen((value) => !value)}
            className="rounded-md border border-violet-300/20 bg-violet-300/5 px-3 py-1.5 text-[11px] tracking-[0.18em] text-violet-100/85 transition-colors hover:bg-violet-300/15"
          >
            BROWSE 734
          </button>
        </div>
      </div>

      {/* piece browser */}
      {pickerOpen && (
        <div className="absolute inset-y-0 right-0 z-40 flex w-[min(440px,94vw)] flex-col border-l border-violet-300/15 bg-[#080610]/95 backdrop-blur-2xl">
          <div className="flex items-start justify-between px-5 pb-3 pt-5">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-violet-200/55">PIECE INDEX</div>
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
                filter === 'all' ? 'bg-violet-300/20 text-violet-100' : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              ALL {pieces.length}
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.08em] transition-colors ${
                  filter === item.id ? 'bg-violet-300/20 text-violet-100' : 'bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                {item.name.toUpperCase()} {categoryCounts.get(item.id) || 0}
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
                    isActive ? 'bg-violet-300/12 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <span className="truncate text-[12px] tracking-[0.04em]">{item.name}</span>
                  <span className="shrink-0 text-[9px] uppercase tracking-[0.16em] text-white/25">
                    {categoryMeta.get(item.pieceCategory)?.name || item.pieceCategory}
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
