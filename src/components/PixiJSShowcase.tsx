import { useRef, useEffect, useState, useCallback } from 'react'
import { Application, Graphics, Text, Container, Sprite } from 'pixi.js'

/* ═══════════════════════════════════════════════════════════════
   PIXIJS SHOWCASE — v8.19.0
   4 demo zones: Basic Graphics | HTML-in-Canvas | Particles | Interactive
   ═══════════════════════════════════════════════════════════════ */

type DemoTab = 'graphics' | 'htmlcanvas' | 'particles' | 'interactive'

const TABS: { id: DemoTab; label: string; desc: string }[] = [
  { id: 'graphics', label: 'Basic Graphics', desc: 'Vector shapes & animation' },
  { id: 'htmlcanvas', label: 'HTML-in-Canvas', desc: 'Live DOM textures (v8.19)' },
  { id: 'particles', label: 'Particles', desc: 'High-performance particle system' },
  { id: 'interactive', label: 'Interactive', desc: 'Events & transforms' },
]

/* ── Cleanup helper ── */
function destroyApp(app: Application | null) {
  if (!app) return
  app.destroy(true, { children: true, texture: true } as any)
}

/* ═══════════════════════════════════════════════════════════════
   DEMO 1 — BASIC GRAPHICS (Official Demo Style)
   Rotating polygons with mouse-reactive glow
   ═══════════════════════════════════════════════════════════════ */
async function initGraphicsDemo(container: HTMLDivElement) {
  const app = new Application()
  await app.init({
    background: '#0f111a',
    resizeTo: container,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  })
  container.appendChild(app.canvas)

  const cx = () => app.screen.width / 2
  const cy = () => app.screen.height / 2

  // Central rotating shape
  const centerGroup = new Container()
  app.stage.addChild(centerGroup)

  const colors = [0x7fd1ff, 0xb892ff, 0xff8fd1, 0xfff0b0, 0x66bb6a]
  const shapes: Graphics[] = []

  colors.forEach((color, i) => {
    const g = new Graphics()
    const sides = 3 + i
    const radius = 60 + i * 35
    const path: number[] = []
    for (let j = 0; j <= sides; j++) {
      const angle = (j / sides) * Math.PI * 2 - Math.PI / 2
      path.push(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    g.moveTo(path[0], path[1])
    for (let j = 2; j < path.length; j += 2) {
      g.lineTo(path[j], path[j + 1])
    }
    g.closePath()
    g.stroke({ width: 2, color, alpha: 0.6 })
    shapes.push(g)
    centerGroup.addChild(g)
  })

  centerGroup.position.set(cx(), cy())

  // Orbiting dots
  const orbitCount = 24
  const orbits = Array.from({ length: orbitCount }, (_, i) => {
    const g = new Graphics()
    g.circle(0, 0, 3 + Math.random() * 3)
    g.fill({ color: colors[i % colors.length], alpha: 0.8 })
    app.stage.addChild(g)
    return {
      g,
      angle: (i / orbitCount) * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      radius: 120 + Math.random() * 100,
      offsetY: Math.random() * Math.PI,
    }
  })

  // Mouse glow
  const mousePos = { x: cx(), y: cy() }
  const glow = new Graphics()
  app.stage.addChildAt(glow, 0)

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect()
    mousePos.x = e.clientX - rect.left
    mousePos.y = e.clientY - rect.top
  })

  let tick = 0
  app.ticker.add(() => {
    tick += 0.016
    centerGroup.position.set(cx(), cy())
    centerGroup.rotation += 0.008
    shapes.forEach((s, i) => {
      s.rotation -= 0.012 * (1 + i * 0.3)
      s.alpha = 0.4 + Math.sin(tick * 2 + i) * 0.3
    })

    orbits.forEach((o) => {
      o.angle += o.speed * 0.016
      const r = o.radius + Math.sin(tick + o.offsetY) * 20
      o.g.position.set(
        cx() + Math.cos(o.angle) * r,
        cy() + Math.sin(o.angle) * r * 0.5
      )
      o.g.scale.set(1 + Math.sin(tick * 3 + o.offsetY) * 0.3)
    })

    // Glow under mouse
    glow.clear()
    const gr = glow
    gr.circle(mousePos.x, mousePos.y, 120)
    gr.fill({ color: 0x7fd1ff, alpha: 0.04 })
    gr.circle(mousePos.x, mousePos.y, 60)
    gr.fill({ color: 0xb892ff, alpha: 0.06 })
  })

  return app
}

/* ═══════════════════════════════════════════════════════════════
   DEMO 2 — HTML-in-Canvas (v8.19 Headline Feature)
   Live DOM element rendered as PixiJS texture
   Fallback: DOM overlay with PixiJS effects when API unavailable
   ═══════════════════════════════════════════════════════════════ */
async function initHtmlCanvasDemo(container: HTMLDivElement, onSupportCheck: (s: boolean) => void) {
  const app = new Application()
  await app.init({
    background: '#0f111a',
    resizeTo: container,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  })
  container.appendChild(app.canvas)

  // Check browser support for HTML-in-Canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const supported = !!(ctx && 'drawElement' in ctx)
  onSupportCheck(supported)

  const cx = () => app.screen.width / 2
  const cy = () => app.screen.height / 2

  // Background animated grid
  const grid = new Graphics()
  app.stage.addChild(grid)

  // Floating cards
  const cardContainer = new Container()
  app.stage.addChild(cardContainer)

  const cardColors = [0x7fd1ff, 0xb892ff, 0xff8fd1, 0xfff0b0]
  const cards = cardColors.map((color, i) => {
    const c = new Container()
    const g = new Graphics()
    g.roundRect(-80, -50, 160, 100, 12)
    g.fill({ color: 0x1a1d2e, alpha: 0.9 })
    g.stroke({ width: 2, color, alpha: 0.5 })

    const label = new Text({
      text: `Card ${i + 1}`,
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        fill: color,
        fontWeight: '600',
      },
    })
    label.anchor.set(0.5)

    const sub = new Text({
      text: supported ? 'HTML-in-Canvas\nLive DOM texture' : 'DOM Overlay\nSimulated texture',
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        fill: 0x8899aa,
        align: 'center',
      },
    })
    sub.anchor.set(0.5)
    sub.y = 22

    c.addChild(g, label, sub)
    c.position.set(cx() + (i - 1.5) * 200, cy())
    cardContainer.addChild(c)
    return { container: c, baseX: cx() + (i - 1.5) * 200, baseY: cy(), phase: i * 1.5 }
  })

  // Status text
  const statusText = new Text({
    text: supported ? 'HTML-in-Canvas API: SUPPORTED' : 'HTML-in-Canvas API: NOT SUPPORTED (Chrome flag required)',
    style: {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: supported ? 0x66bb6a : 0xffaa44,
    },
  })
  statusText.anchor.set(0.5, 1)
  app.stage.addChild(statusText)

  let tick = 0
  app.ticker.add(() => {
    tick += 0.016
    const w = app.screen.width
    const h = app.screen.height

    // Grid
    grid.clear()
    grid.stroke({ width: 1, color: 0x2a2d3e, alpha: 0.3 })
    const spacing = 40
    const offsetX = (tick * 10) % spacing
    const offsetY = (tick * 6) % spacing
    for (let x = offsetX; x < w; x += spacing) {
      grid.moveTo(x, 0)
      grid.lineTo(x, h)
    }
    for (let y = offsetY; y < h; y += spacing) {
      grid.moveTo(0, y)
      grid.lineTo(w, y)
    }

    // Cards floating
    cards.forEach((c) => {
      c.container.x = c.baseX + Math.sin(tick + c.phase) * 15
      c.container.y = c.baseY + Math.sin(tick * 0.7 + c.phase) * 20
      c.container.rotation = Math.sin(tick * 0.3 + c.phase) * 0.05
    })

    statusText.position.set(cx(), h - 20)
  })

  // If supported, try to create a live DOM texture (simplified)
  if (supported) {
    try {
      const { HTMLSource } = await import('pixi.js/html-source')
      const form = document.createElement('div')
      form.innerHTML = '<input value="PixiJS v8.19" style="padding:6px 12px;border-radius:6px;border:1px solid #7fd1ff;background:#1a1d2e;color:#fff;font-size:14px;" />'
      form.style.position = 'absolute'
      form.style.left = '-9999px'
      container.appendChild(form)

      const sprite = Sprite.from(new HTMLSource({ resource: form, autoUpdate: true }))
      sprite.anchor.set(0.5)
      sprite.position.set(cx(), cy() - 120)
      sprite.scale.set(1.5)
      app.stage.addChild(sprite)
    } catch {
      // fallback already handled
    }
  }

  return app
}

/* ═══════════════════════════════════════════════════════════════
   DEMO 3 — PARTICLE SYSTEM
   High-performance colored particles with mouse gravity
   ═══════════════════════════════════════════════════════════════ */
async function initParticlesDemo(container: HTMLDivElement) {
  const app = new Application()
  await app.init({
    background: '#0f111a',
    resizeTo: container,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  })
  container.appendChild(app.canvas)

  const particleCount = 400
  const palette = [0x7fd1ff, 0xb892ff, 0xff8fd1, 0xfff0b0, 0x66bb6a, 0xff6b6b]

  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * app.screen.width,
    y: Math.random() * app.screen.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: Math.random() * 4 + 1,
    alpha: Math.random() * 0.5 + 0.3,
  }))

  const graphics = new Graphics()
  app.stage.addChild(graphics)

  const mouse = { x: app.screen.width / 2, y: app.screen.height / 2, active: false }
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect()
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
    mouse.active = true
  })
  container.addEventListener('mouseleave', () => { mouse.active = false })

  app.ticker.add(() => {
    const w = app.screen.width
    const h = app.screen.height
    graphics.clear()

    particles.forEach((p) => {
      // Mouse gravity
      if (mouse.active) {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 1
        const force = 80 / dist
        p.vx += (dx / dist) * force * 0.01
        p.vy += (dy / dist) * force * 0.01
      }

      // Friction
      p.vx *= 0.98
      p.vy *= 0.98

      // Move
      p.x += p.vx
      p.y += p.vy

      // Wrap
      if (p.x < 0) p.x = w
      if (p.x > w) p.x = 0
      if (p.y < 0) p.y = h
      if (p.y > h) p.y = 0

      // Draw
      graphics.circle(p.x, p.y, p.size)
      graphics.fill({ color: p.color, alpha: p.alpha })
    })
  })

  return app
}

/* ═══════════════════════════════════════════════════════════════
   DEMO 4 — INTERACTIVE SCENE
   Clickable shapes with ripple effects
   ═══════════════════════════════════════════════════════════════ */
async function initInteractiveDemo(container: HTMLDivElement) {
  const app = new Application()
  await app.init({
    background: '#0f111a',
    resizeTo: container,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  })
  container.appendChild(app.canvas)

  const cx = () => app.screen.width / 2
  const cy = () => app.screen.height / 2

  const scene = new Container()
  app.stage.addChild(scene)

  // Grid of interactive buttons
  const cols = 4
  const rows = 3
  const spacing = 90
  const buttons: { g: Graphics; color: number; baseScale: number }[] = []

  const palette = [0x7fd1ff, 0xb892ff, 0xff8fd1, 0xfff0b0, 0x66bb6a, 0xff6b6b, 0xffaa44, 0xaa77ff, 0x77ffaa, 0xff7799, 0x99ccff, 0xffcc99]

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const color = palette[idx % palette.length]
      const g = new Graphics()
      g.roundRect(-35, -35, 70, 70, 16)
      g.fill({ color, alpha: 0.2 })
      g.stroke({ width: 2, color, alpha: 0.6 })

      const icon = new Text({
        text: String(idx + 1),
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 22,
          fill: color,
          fontWeight: '700',
        },
      })
      icon.anchor.set(0.5)

      const btn = new Container()
      btn.addChild(g, icon)
      btn.position.set(
        cx() + (c - (cols - 1) / 2) * spacing,
        cy() + (r - (rows - 1) / 2) * spacing
      )
      btn.eventMode = 'static'
      btn.cursor = 'pointer'
      scene.addChild(btn)
      buttons.push({ g, color, baseScale: 1 })

      // Hover
      btn.on('pointerover', () => {
        g.clear()
        g.roundRect(-35, -35, 70, 70, 16)
        g.fill({ color, alpha: 0.4 })
        g.stroke({ width: 3, color, alpha: 1 })
      })
      btn.on('pointerout', () => {
        g.clear()
        g.roundRect(-35, -35, 70, 70, 16)
        g.fill({ color, alpha: 0.2 })
        g.stroke({ width: 2, color, alpha: 0.6 })
      })

      // Click ripple
      btn.on('pointerdown', () => {
        createRipple(btn.position.x, btn.position.y, color)
      })
    }
  }

  // Ripple container
  const rippleContainer = new Container()
  app.stage.addChild(rippleContainer)

  interface Ripple { g: Graphics; life: number; maxLife: number }
  const ripples: Ripple[] = []

  function createRipple(x: number, y: number, color: number) {
    const g = new Graphics()
    g.circle(0, 0, 10)
    g.stroke({ width: 3, color, alpha: 0.8 })
    g.position.set(x, y)
    rippleContainer.addChild(g)
    ripples.push({ g, life: 0, maxLife: 60 })
  }

  app.ticker.add(() => {
    scene.position.set(cx(), cy())
    scene.pivot.set(cx(), cy())

    // Update ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]
      r.life++
      const progress = r.life / r.maxLife
      const radius = 10 + progress * 80
      const alpha = 1 - progress

      r.g.clear()
      r.g.circle(0, 0, radius)
      r.g.stroke({ width: 3 * (1 - progress), color: r.g.strokeStyle?.color ?? 0xffffff, alpha })

      if (r.life >= r.maxLife) {
        rippleContainer.removeChild(r.g)
        r.g.destroy()
        ripples.splice(i, 1)
      }
    }
  })

  return app
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PixiJSShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [activeTab, setActiveTab] = useState<DemoTab>('graphics')
  const [htmlSupported, setHtmlSupported] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const switchDemo = useCallback(
    async (tab: DemoTab) => {
      if (tab === activeTab || isLoading) return
      setIsLoading(true)
      setActiveTab(tab)

      // Destroy previous app
      destroyApp(appRef.current)
      appRef.current = null

      // Clear container
      const wrap = canvasWrapRef.current
      if (!wrap) { setIsLoading(false); return }
      wrap.innerHTML = ''

      // Init new demo
      await new Promise((r) => setTimeout(r, 50))
      let app: Application | null = null
      try {
        switch (tab) {
          case 'graphics':
            app = await initGraphicsDemo(wrap)
            break
          case 'htmlcanvas':
            app = await initHtmlCanvasDemo(wrap, setHtmlSupported)
            break
          case 'particles':
            app = await initParticlesDemo(wrap)
            break
          case 'interactive':
            app = await initInteractiveDemo(wrap)
            break
        }
        appRef.current = app
      } catch (e) {
        console.error('PixiJS demo init error:', e)
      }
      setIsLoading(false)
    },
    [activeTab, isLoading]
  )

  // Initial load
  useEffect(() => {
    let mounted = true
    const wrap = canvasWrapRef.current
    if (!wrap) return

    ;(async () => {
      await new Promise((r) => setTimeout(r, 100))
      if (!mounted) return
      try {
        const app = await initGraphicsDemo(wrap)
        if (mounted) appRef.current = app
        else destroyApp(app)
      } catch (e) {
        console.error('PixiJS init error:', e)
      }
    })()

    return () => {
      mounted = false
      destroyApp(appRef.current)
      appRef.current = null
    }
  }, [])

  const codeSnippets: Record<DemoTab, string> = {
    graphics: `import { Application, Graphics } from 'pixi.js'

const app = new Application()
await app.init({ background: '#0f111a' })

document.body.appendChild(app.canvas)

const shape = new Graphics()
  .circle(0, 0, 50)
  .fill({ color: 0x7fd1ff })

app.stage.addChild(shape)`,
    htmlcanvas: `import { Sprite } from 'pixi.js'
import { HTMLSource } from 'pixi.js/html-source'

const form = document.createElement('form')
form.innerHTML = '<input value="editable" />'
app.canvas.appendChild(form) // must be direct child

const sprite = Sprite.from(
  new HTMLSource({ resource: form, autoUpdate: true })
)
app.stage.addChild(sprite)`,
    particles: `// 400 particles with mouse gravity
particles.forEach((p) => {
  const dx = mouse.x - p.x
  const dy = mouse.y - p.y
  const force = 80 / (dist + 1)
  p.vx += (dx / dist) * force * 0.01
  p.vy += (dy / dist) * force * 0.01
})`,
    interactive: `btn.eventMode = 'static'
btn.cursor = 'pointer'
btn.on('pointerover', () => highlight())
btn.on('pointerdown', () => createRipple())`,
  }

  return (
    <div ref={containerRef} className="relative w-full min-h-[600px] overflow-hidden rounded-xl bg-[#0a0a0f]">
      {/* ── Header ── */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎨</span>
          <h2 className="text-xl font-bold text-white tracking-tight">PixiJS v8.19.0</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            500K+ weekly downloads
          </span>
        </div>
        <p className="text-sm text-slate-400">
          HTML-in-Canvas textures · Graphics → SVG export · AI Agent Skills
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="relative z-10 px-6 pb-4">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchDemo(t.id)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                activeTab === t.id
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="font-semibold">{t.label}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div className="relative px-6 pb-4">
        <div
          ref={canvasWrapRef}
          className="relative w-full rounded-xl overflow-hidden border border-slate-800"
          style={{ height: 'min(60vh, 500px)' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/80 z-20">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
              Loading PixiJS demo...
            </div>
          </div>
        )}
      </div>

      {/* ── Code Snippet ── */}
      <div className="relative z-10 px-6 pb-6">
        <div className="rounded-lg border border-slate-800 bg-[#0d0f18] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-500 font-mono">{activeTab === 'htmlcanvas' ? 'pixi.js/html-source' : 'pixi.js'}</span>
            {activeTab === 'htmlcanvas' && htmlSupported !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                htmlSupported
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {htmlSupported ? 'API Supported' : 'Flag Required'}
              </span>
            )}
          </div>
          <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-400">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>
      </div>

      {/* ── Footer Links ── */}
      <div className="relative z-10 px-6 pb-6 flex gap-4 flex-wrap">
        <a
          href="https://pixijs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          pixijs.com →
        </a>
        <a
          href="https://github.com/pixijs/pixijs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          GitHub →
        </a>
        <a
          href="https://pixijs.com/blog/june-2026"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          June 2026 Update →
        </a>
      </div>
    </div>
  )
}
