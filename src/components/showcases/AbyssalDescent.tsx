import { useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   ABYSSAL DESCENT — 深渊下潜（图片驱动版）
   5 张电影感深海原画随滚动交叉淡化 + 缓速推拉（Ken Burns）
   叠一层上升气泡/浮游颗粒动态层；章节文字随滚动切换
   ═══════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  { img: '/abyss/01-surface.jpg', title: 'THE SURFACE', en: 'THE SURFACE', sub: 'Rays through the ripples · dive begins' },
  { img: '/abyss/02-twilight.jpg', title: 'TWILIGHT', en: 'TWILIGHT ZONE', sub: 'Light fades layer by layer' },
  { img: '/abyss/03-jellyfish.jpg', title: 'GLOW', en: 'BIOLUMINESCENCE', sub: 'Jellyfish breathing in the dark' },
  { img: '/abyss/04-abyss.jpg', title: 'ABYSS', en: 'THE ABYSS', sub: 'Black above, bubbles rising' },
  { img: '/abyss/05-vent.jpg', title: 'THE GLOW', en: 'THE GLOW', sub: 'A luminous deep-sea vent' },
] as const

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

export default function AbyssalDescent() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const bubbleRef = useRef<HTMLCanvasElement>(null)
  const [chapterIdx, setChapterIdx] = useState(0)

  /* ---- 背景层：滚动驱动交叉淡化 + 推拉 ---- */
  useEffect(() => {
    let raf = 0
    const apply = () => {
      raf = requestAnimationFrame(apply)
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const p = docH > 0 ? clamp01(window.scrollY / docH) : 0

      CHAPTERS.forEach((_, i) => {
        const el = layerRefs.current[i]
        if (!el) return
        const center = (i + 0.5) / CHAPTERS.length
        const dist = Math.abs(p - center)
        // 窗口宽度：距中心 ±0.13 内全显，±0.28 外全隐
        const opacity = smoothstep(0.28, 0.13, dist)
        el.style.opacity = opacity.toFixed(3)
        // Ken Burns：靠近中心时缓慢推近；下沉段再轻微下漂
        const zoom = 1.06 + (1 - Math.min(dist / 0.28, 1)) * 0.1
        const driftY = (p - center) * 6 // 视差微移
        el.style.transform = `scale(${zoom.toFixed(4)}) translate3d(0, ${driftY.toFixed(2)}%, 0)`
      })

      let idx = 0
      for (let i = 0; i < CHAPTERS.length; i++) {
        const c = (i + 0.5) / CHAPTERS.length
        if (p >= c - 0.1) idx = i
      }
      setChapterIdx(prev => (prev === idx ? prev : idx))
    }
    raf = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ---- 气泡/浮游颗粒层 ---- */
  useEffect(() => {
    const canvas = bubbleRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.width = Math.floor(window.innerWidth * dpr)
      h = canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    interface Bubble { x: number; y: number; r: number; speed: number; sway: number; phase: number }
    const bubbles: Bubble[] = []
    for (let i = 0; i < 70; i++) {
      bubbles.push({
        x: Math.random(), y: Math.random(),
        r: (0.6 + Math.random() * 2.2) * dpr,
        speed: 0.0004 + Math.random() * 0.0012,
        sway: 0.3 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
      })
    }

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      ctx.clearRect(0, 0, w, h)
      const t = performance.now() * 0.001
      for (const b of bubbles) {
        b.y -= b.speed
        if (b.y < -0.05) { b.y = 1.05; b.x = Math.random() }
        const x = (b.x + Math.sin(t * b.sway + b.phase) * 0.008) * w
        const y = b.y * h
        ctx.beginPath()
        ctx.arc(x, y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(160, 220, 255, 0.25)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(220, 245, 255, 0.5)'
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  const active = CHAPTERS[chapterIdx]

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem' }}>
      {/* 5 个全屏背景层 */}
      {CHAPTERS.map((c, i) => (
        <div
          key={i}
          ref={el => { layerRefs.current[i] = el }}
          className="fixed inset-0 overflow-hidden"
          style={{ zIndex: 1, opacity: 0, willChange: 'opacity, transform' }}
        >
          <img
            src={c.img}
            alt={c.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      ))}

      {/* 暗角 + 色温罩 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* 气泡层 */}
      <canvas ref={bubbleRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }} />

      {/* 章节文字 */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
        <div className="text-center transition-opacity duration-700">
          <div className="text-4xl md:text-6xl font-bold tracking-[0.5em] text-cyan-50 drop-shadow-[0_0_30px_rgba(120,220,255,0.5)] pl-[0.5em]">
            {active.title}
          </div>
          <div className="mt-4 text-xs md:text-sm tracking-[0.5em] text-cyan-200/60 pl-[0.5em]">{active.en}</div>
          <div className="mt-3 text-sm text-cyan-100/70">{active.sub}</div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 4 }}>
        <div className="text-cyan-100/40 text-xs tracking-[0.5em] animate-bounce">↓ DESCEND ↓</div>
      </div>

      {/* 滚动垫片 */}
      <div style={{ height: '600vh' }} />
    </div>
  )
}
