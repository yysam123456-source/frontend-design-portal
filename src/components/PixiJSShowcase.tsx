import { useRef, useEffect, useState } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'

/* ═══════════════════════════════════════════════════════════════
   PIXIJS v8 SHOWCASE — Comprehensive Visual Demo
   Based on official PixiJS examples: Graphics, Containers, Events,
   Filters, Particles, Text, Mesh — combined into one rich scene.
   ═══════════════════════════════════════════════════════════════ */

const PALETTE = {
  bg: 0x0a0e1a,
  primary: 0x7fd1ff,
  secondary: 0xb892ff,
  accent: 0xff8fd1,
  warm: 0xfff0b0,
  green: 0x66bb6a,
  orange: 0xffaa44,
  red: 0xff6b6b,
}

const PALETTE_ARR = [0x7fd1ff, 0xb892ff, 0xff8fd1, 0xfff0b0, 0x66bb6a, 0xffaa44, 0xff6b6b]

/* ─── Scene types ─── */
type SceneId = 'cosmos' | 'liquid' | 'geometry' | 'fireworks'

const SCENES: { id: SceneId; label: string; desc: string }[] = [
  { id: 'cosmos', label: 'Cosmos', desc: 'Particle galaxy with mouse gravity' },
  { id: 'liquid', label: 'Liquid Metal', desc: 'Metaball morphing with filters' },
  { id: 'geometry', label: 'Sacred Geometry', desc: 'Recursive rotating polygons' },
  { id: 'fireworks', label: 'Fireworks', desc: 'Click-to-explode particle bursts' },
]

/* ═══════════════════════════════════════════════════════════════
   SCENE 1 — COSMOS (Particle Galaxy)
   Hundreds of orbiting particles with mouse gravity well
   ═══════════════════════════════════════════════════════════════ */
function buildCosmos(app: Application) {
  const stage = app.stage
  const w = () => app.screen.width
  const h = () => app.screen.height

  // Background gradient stars
  const bgStars = new Graphics()
  stage.addChild(bgStars)
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 2000
    const y = Math.random() * 2000
    const s = Math.random() * 1.5 + 0.3
    bgStars.circle(x, y, s)
    bgStars.fill({ color: 0xffffff, alpha: Math.random() * 0.4 + 0.1 })
  }

  // Central glow
  const centerGlow = new Graphics()
  stage.addChild(centerGlow)

  // Orbital rings
  const rings = new Graphics()
  stage.addChild(rings)

  // Particle system
  interface Particle {
    g: Graphics
    angle: number
    speed: number
    radius: number
    radiusBase: number
    color: number
    size: number
    phase: number
  }
  const count = 350
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const color = PALETTE_ARR[i % PALETTE_ARR.length]
    const size = Math.random() * 3 + 1.5
    const g = new Graphics()
    g.circle(0, 0, size)
    g.fill({ color, alpha: 0.85 })
    // Glow halo
    g.circle(0, 0, size * 2.5)
    g.fill({ color, alpha: 0.12 })
    stage.addChild(g)

    particles.push({
      g,
      angle: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.6,
      radius: 80 + Math.random() * 200,
      radiusBase: 80 + Math.random() * 200,
      color,
      size,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // Mouse
  const mouse = { x: w() / 2, y: h() / 2, active: false }
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointermove', (e: any) => {
    mouse.x = e.global.x
    mouse.y = e.global.y
    mouse.active = true
  })
  app.stage.on('pointerout', () => { mouse.active = false })

  let tick = 0
  const update = () => {
    tick += 0.016
    const cx = w() / 2
    const cy = h() / 2

    // Central pulsing glow
    centerGlow.clear()
    const pulseR = 40 + Math.sin(tick * 2) * 8
    centerGlow.circle(cx, cy, pulseR * 3)
    centerGlow.fill({ color: PALETTE.primary, alpha: 0.04 })
    centerGlow.circle(cx, cy, pulseR * 1.8)
    centerGlow.fill({ color: PALETTE.secondary, alpha: 0.06 })
    centerGlow.circle(cx, cy, pulseR)
    centerGlow.fill({ color: PALETTE.primary, alpha: 0.15 })
    centerGlow.circle(cx, cy, pulseR * 0.5)
    centerGlow.fill({ color: 0xffffff, alpha: 0.3 })

    // Orbital rings
    rings.clear()
    rings.stroke({ width: 1, color: PALETTE.primary, alpha: 0.08 })
    for (let r = 60; r < 300; r += 40) {
      rings.circle(cx, cy, r)
    }
    rings.stroke({ width: 1, color: PALETTE.secondary, alpha: 0.05 })
    for (let r = 80; r < 300; r += 40) {
      rings.circle(cx, cy, r + 20)
    }

    // Particles
    particles.forEach((p) => {
      p.angle += p.speed * 0.008
      const r = p.radiusBase + Math.sin(tick * 0.5 + p.phase) * 30
      let px = cx + Math.cos(p.angle) * r
      let py = cy + Math.sin(p.angle) * r * 0.55 // ellipse

      // Mouse gravity
      if (mouse.active) {
        const dx = mouse.x - px
        const dy = mouse.y - py
        const dist = Math.sqrt(dx * dx + dy * dy) + 1
        if (dist < 200) {
          const force = (200 - dist) / 200 * 60
          px += (dx / dist) * force
          py += (dy / dist) * force
        }
      }

      p.g.position.set(px, py)
      const scale = 1 + Math.sin(tick * 3 + p.phase) * 0.3
      p.g.scale.set(scale)
      p.g.alpha = 0.5 + Math.sin(tick * 2 + p.phase) * 0.35
    })
  }

  app.ticker.add(update)

  return () => {
    app.ticker.remove(update)
    stage.removeChildren().forEach(c => c.destroy({ children: true }))
  }
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 2 — LIQUID METAL (Metaball Morphing)
   Soft circles that merge and flow, with color transitions
   ═══════════════════════════════════════════════════════════════ */
function buildLiquid(app: Application) {
  const stage = app.stage
  const w = () => app.screen.width
  const h = () => app.screen.height

  const container = new Container()
  stage.addChild(container)

  interface Blob {
    g: Graphics
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    color: number
    phase: number
  }

  const blobs: Blob[] = []
  const blobCount = 15
  for (let i = 0; i < blobCount; i++) {
    const color = PALETTE_ARR[i % PALETTE_ARR.length]
    const radius = 40 + Math.random() * 60
    const g = new Graphics()
    g.circle(0, 0, radius)
    g.fill({ color, alpha: 0.75 })
    // Outer glow
    g.circle(0, 0, radius * 1.4)
    g.fill({ color, alpha: 0.12 })
    container.addChild(g)

    blobs.push({
      g,
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius,
      color,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // Connection lines
  const lines = new Graphics()
  stage.addChildAt(lines, 0)

  // Background
  const bg = new Graphics()
  stage.addChildAt(bg, 0)

  const mouse = { x: w() / 2, y: h() / 2 }
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointermove', (e: any) => {
    mouse.x = e.global.x
    mouse.y = e.global.y
  })

  let tick = 0
  const update = () => {
    tick += 0.016
    const cw = w()
    const ch = h()

    bg.clear()
    bg.rect(0, 0, cw, ch)
    bg.fill({ color: PALETTE.bg })

    // Radial gradient background
    for (let r = 400; r > 0; r -= 40) {
      bg.circle(cw / 2, ch / 2, r)
      bg.fill({ color: PALETTE.secondary, alpha: 0.008 })
    }

    lines.clear()

    // Update blobs
    blobs.forEach((b) => {
      // Mouse attraction
      const dx = mouse.x - b.x
      const dy = mouse.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 1
      if (dist < 250) {
        b.vx += (dx / dist) * 0.08
        b.vy += (dy / dist) * 0.08
      }

      // Damping
      b.vx *= 0.97
      b.vy *= 0.97

      // Random wander
      b.vx += (Math.random() - 0.5) * 0.06
      b.vy += (Math.random() - 0.5) * 0.06

      b.x += b.vx
      b.y += b.vy

      // Bounce off edges
      if (b.x < b.radius) { b.x = b.radius; b.vx *= -0.8 }
      if (b.x > cw - b.radius) { b.x = cw - b.radius; b.vx *= -0.8 }
      if (b.y < b.radius) { b.y = b.radius; b.vy *= -0.8 }
      if (b.y > ch - b.radius) { b.y = ch - b.radius; b.vy *= -0.8 }

      // Morph radius
      const morphR = b.radius + Math.sin(tick * 2 + b.phase) * 8
      b.g.clear()
      b.g.circle(0, 0, morphR)
      b.g.fill({ color: b.color, alpha: 0.75 })
      b.g.circle(0, 0, morphR * 1.5)
      b.g.fill({ color: b.color, alpha: 0.08 })
      b.g.position.set(b.x, b.y)
    })

    // Draw connections
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const dx = blobs[i].x - blobs[j].x
        const dy = blobs[i].y - blobs[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.3
          lines.moveTo(blobs[i].x, blobs[i].y)
          lines.lineTo(blobs[j].x, blobs[j].y)
          lines.stroke({ width: 2, color: blobs[i].color, alpha })
        }
      }
    }
  }

  app.ticker.add(update)

  return () => {
    app.ticker.remove(update)
    stage.removeChildren().forEach(c => c.destroy({ children: true }))
  }
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 3 — SACRED GEOMETRY (Recursive Rotating Polygons)
   Multi-layered geometric patterns with rotation and scaling
   ═══════════════════════════════════════════════════════════════ */
function buildGeometry(app: Application) {
  const stage = app.stage
  const w = () => app.screen.width
  const h = () => app.screen.height

  const container = new Container()
  stage.addChild(container)

  // Background
  const bg = new Graphics()
  bg.rect(0, 0, w(), h())
  bg.fill({ color: PALETTE.bg })
  stage.addChildAt(bg, 0)

  // Concentric polygon layers
  interface GeoLayer {
    g: Graphics
    sides: number
    radius: number
    rotSpeed: number
    color: number
    fillAlpha: number
    lineWidth: number
  }
  const layers: GeoLayer[] = []

  const layerCount = 8
  for (let i = 0; i < layerCount; i++) {
    const sides = 3 + i
    const radius = 30 + i * 35
    const color = PALETTE_ARR[i % PALETTE_ARR.length]
    const g = new Graphics()
    container.addChild(g)
    layers.push({
      g,
      sides,
      radius,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.3 + i * 0.05),
      color,
      fillAlpha: i === 0 ? 0.15 : 0.03,
      lineWidth: 2,
    })
  }

  // Orbiting vertices
  const dotCount = 24
  const dots: { g: Graphics; angle: number; speed: number; radius: number; color: number }[] = []
  for (let i = 0; i < dotCount; i++) {
    const color = PALETTE_ARR[i % PALETTE_ARR.length]
    const g = new Graphics()
    g.circle(0, 0, 4)
    g.fill({ color, alpha: 0.9 })
    g.circle(0, 0, 8)
    g.fill({ color, alpha: 0.15 })
    stage.addChild(g)
    dots.push({
      g,
      angle: (i / dotCount) * Math.PI * 2,
      speed: 0.3 + (i % 3) * 0.2,
      radius: 180 + (i % 4) * 30,
      color,
    })
  }

  // Central text
  const centerText = new Text({
    text: 'PIXI\nv8.19',
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 24,
      fill: PALETTE.primary,
      align: 'center',
      fontWeight: '700',
    },
  })
  centerText.anchor.set(0.5)
  stage.addChild(centerText)

  // Mouse rotation influence
  const mouse = { x: 0, y: 0 }
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointermove', (e: any) => {
    mouse.x = (e.global.x / w() - 0.5) * 2
    mouse.y = (e.global.y / h() - 0.5) * 2
  })

  let tick = 0
  const update = () => {
    tick += 0.016
    const cx = w() / 2
    const cy = h() / 2
    container.position.set(cx, cy)

    // Draw polygon layers
    layers.forEach((layer, idx) => {
      layer.g.clear()
      const rotation = tick * layer.rotSpeed + mouse.x * 0.5
      const path: number[] = []
      for (let j = 0; j <= layer.sides; j++) {
        const angle = (j / layer.sides) * Math.PI * 2 + rotation
        const r = layer.radius + Math.sin(tick * 2 + idx) * 5
        path.push(Math.cos(angle) * r, Math.sin(angle) * r)
      }
      layer.g.moveTo(path[0], path[1])
      for (let j = 2; j < path.length; j += 2) {
        layer.g.lineTo(path[j], path[j + 1])
      }
      layer.g.closePath()
      layer.g.fill({ color: layer.color, alpha: layer.fillAlpha })
      layer.g.stroke({ width: layer.lineWidth, color: layer.color, alpha: 0.6 })
    })

    // Orbiting dots
    dots.forEach((d) => {
      d.angle += d.speed * 0.01
      const r = d.radius + Math.sin(tick + d.angle * 3) * 20
      d.g.position.set(
        cx + Math.cos(d.angle) * r,
        cy + Math.sin(d.angle) * r * 0.6
      )
      d.g.scale.set(1 + Math.sin(tick * 4 + d.angle) * 0.4)
    })

    // Center text pulse
    centerText.position.set(cx, cy)
    centerText.scale.set(1 + Math.sin(tick * 3) * 0.05)
    centerText.alpha = 0.7 + Math.sin(tick * 2) * 0.3
  }

  app.ticker.add(update)

  return () => {
    app.ticker.remove(update)
    stage.removeChildren().forEach(c => c.destroy({ children: true }))
  }
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 4 — FIREWORKS (Click-to-Explode Particle Bursts)
   Click anywhere to create a multi-colored firework explosion
   ═══════════════════════════════════════════════════════════════ */
function buildFireworks(app: Application) {
  const stage = app.stage
  const w = () => app.screen.width
  const h = () => app.screen.height

  // Background
  const bg = new Graphics()
  bg.rect(0, 0, w(), h())
  bg.fill({ color: PALETTE.bg })
  // Stars
  for (let i = 0; i < 80; i++) {
    bg.circle(Math.random() * 2000, Math.random() * 2000, Math.random() * 1.2 + 0.3)
    bg.fill({ color: 0xffffff, alpha: Math.random() * 0.3 + 0.05 })
  }
  stage.addChild(bg)

  // Trail particles (rising rockets)
  interface Spark {
    g: Graphics
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: number
    size: number
    gravity: number
  }
  const sparks: Spark[] = []
  const sparkContainer = new Container()
  stage.addChild(sparkContainer)

  function createBurst(x: number, y: number, color: number, count: number, power: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
      const speed = power * (0.5 + Math.random() * 0.8)
      const size = 2 + Math.random() * 3
      const g = new Graphics()
      g.circle(0, 0, size)
      g.fill({ color, alpha: 1 })
      g.circle(0, 0, size * 2)
      g.fill({ color, alpha: 0.2 })
      sparkContainer.addChild(g)
      sparks.push({
        g,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color,
        size,
        gravity: 0.05,
      })
    }
  }

  function launchRocket(targetX: number, targetY: number) {
    const startX = targetX + (Math.random() - 0.5) * 100
    const startY = h()
    const color = PALETTE_ARR[Math.floor(Math.random() * PALETTE_ARR.length)]
    const g = new Graphics()
    g.circle(0, 0, 3)
    g.fill({ color, alpha: 1 })
    g.circle(0, 0, 6)
    g.fill({ color, alpha: 0.3 })
    sparkContainer.addChild(g)
    sparks.push({
      g,
      x: startX,
      y: startY,
      vx: (targetX - startX) / 60,
      vy: (targetY - startY) / 60,
      life: 0,
      maxLife: 55,
      color,
      size: 3,
      gravity: 0,
    })
  }

  // Auto-launch
  let autoTimer = 0
  let mouseDown = false

  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointerdown', (e: any) => {
    mouseDown = true
    launchRocket(e.global.x, e.global.y)
  })
  app.stage.on('pointerup', () => { mouseDown = false })

  // Explosion when rocket reaches apex
  const update = () => {
    autoTimer++
    if (autoTimer > 80 && !mouseDown) {
      autoTimer = 0
      launchRocket(
        Math.random() * w() * 0.8 + w() * 0.1,
        Math.random() * h() * 0.5 + h() * 0.1
      )
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.life++
      s.x += s.vx
      s.y += s.vy
      s.vy += s.gravity
      s.vx *= 0.99

      const progress = s.life / s.maxLife
      const alpha = 1 - progress

      // Explode at apex for rockets (low gravity, reaching target)
      if (s.gravity === 0 && s.life >= s.maxLife - 2) {
        const burstCount = 40 + Math.floor(Math.random() * 30)
        createBurst(s.x, s.y, s.color, burstCount, 4 + Math.random() * 3)
        // Secondary burst with different color
        const color2 = PALETTE_ARR[Math.floor(Math.random() * PALETTE_ARR.length)]
        createBurst(s.x, s.y, color2, 20, 2 + Math.random() * 2)
        sparkContainer.removeChild(s.g)
        s.g.destroy()
        sparks.splice(i, 1)
        continue
      }

      s.g.position.set(s.x, s.y)
      s.g.alpha = alpha
      s.g.scale.set(1 - progress * 0.5)

      if (s.life >= s.maxLife) {
        sparkContainer.removeChild(s.g)
        s.g.destroy()
        sparks.splice(i, 1)
      }
    }

    // Cleanup if too many
    if (sparks.length > 800) {
      const excess = sparks.length - 800
      for (let i = 0; i < excess; i++) {
        const s = sparks[0]
        sparkContainer.removeChild(s.g)
        s.g.destroy()
        sparks.shift()
      }
    }
  }

  app.ticker.add(update)

  // Initial burst
  setTimeout(() => {
    createBurst(w() / 2, h() / 2, PALETTE.primary, 60, 5)
  }, 200)

  return () => {
    app.ticker.remove(update)
    stage.removeChildren().forEach(c => c.destroy({ children: true }))
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PixiJSShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [activeScene, setActiveScene] = useState<SceneId>('cosmos')
  const [fps, setFps] = useState(0)

  // Init PixiJS app once
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const app = new Application()
      await app.init({
        background: PALETTE.bg,
        resizeTo: wrapRef.current || undefined,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      })
      if (!mounted) {
        app.destroy(true)
        return
      }
      wrapRef.current?.appendChild(app.canvas)
      appRef.current = app

      // FPS counter
      let frameCount = 0
      let lastFpsTime = performance.now()
      const fpsTicker = () => {
        frameCount++
        const now = performance.now()
        if (now - lastFpsTime >= 1000) {
          setFps(frameCount)
          frameCount = 0
          lastFpsTime = now
        }
      }
      app.ticker.add(fpsTicker)

      // Start initial scene
      cleanupRef.current = buildCosmos(app)
    }

    init()

    return () => {
      mounted = false
      cleanupRef.current?.()
      cleanupRef.current = null
      if (appRef.current) {
        appRef.current.destroy(true, { children: true } as any)
        appRef.current = null
      }
    }
  }, [])

  // Switch scenes
  const switchScene = (scene: SceneId) => {
    if (scene === activeScene || !appRef.current) return
    setActiveScene(scene)

    // Cleanup previous
    cleanupRef.current?.()
    cleanupRef.current = null

    const app = appRef.current
    switch (scene) {
      case 'cosmos':
        cleanupRef.current = buildCosmos(app)
        break
      case 'liquid':
        cleanupRef.current = buildLiquid(app)
        break
      case 'geometry':
        cleanupRef.current = buildGeometry(app)
        break
      case 'fireworks':
        cleanupRef.current = buildFireworks(app)
        break
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0a0e1a]">
      {/* ── Header ── */}
      <div className="relative z-10 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">PixiJS v8.19.0</h2>
              <p className="text-xs text-slate-400">2D WebGL Rendering Engine · 500K+ weekly downloads</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {fps > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {fps} FPS
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              HTML-in-Canvas
            </span>
          </div>
        </div>
      </div>

      {/* ── Scene Tabs ── */}
      <div className="relative z-10 px-6 pb-3">
        <div className="flex gap-2 flex-wrap">
          {SCENES.map((s) => (
            <button
              key={s.id}
              onClick={() => switchScene(s.id)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                activeScene === s.id
                  ? 'bg-slate-800 text-white border-slate-600 shadow-lg'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              } cursor-pointer`}
            >
              <span className="font-bold">{s.label}</span>
              <span className="text-[10px] text-slate-500 hidden md:inline">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="relative px-6 pb-4">
        <div
          ref={wrapRef}
          className="relative w-full rounded-xl overflow-hidden border border-slate-800"
          style={{ height: 'min(65vh, 560px)' }}
        />
        {activeScene === 'fireworks' && (
          <div className="absolute top-4 right-8 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-[11px] text-slate-300 pointer-events-none">
            Click to launch fireworks
          </div>
        )}
        {activeScene === 'cosmos' && (
          <div className="absolute top-4 right-8 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-[11px] text-slate-300 pointer-events-none">
            Move mouse to attract particles
          </div>
        )}
      </div>

      {/* ── Info Panel ── */}
      <div className="relative z-10 px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Engine', value: 'WebGL 2' },
          { label: 'Version', value: '8.19.0' },
          { label: 'Scenes', value: '4 interactive' },
          { label: 'License', value: 'MIT' },
        ].map((item) => (
          <div key={item.label} className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
            <div className="text-sm text-slate-200 font-medium">{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Links ── */}
      <div className="relative z-10 px-6 pb-6 flex gap-4 flex-wrap">
        <a href="https://pixijs.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Official Site →</a>
        <a href="https://github.com/pixijs/pixijs" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">GitHub →</a>
        <a href="https://pixijs.com/8.x/examples" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Examples →</a>
        <a href="https://pixijs.com/blog/june-2026" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">June 2026 Update →</a>
      </div>
    </div>
  )
}
