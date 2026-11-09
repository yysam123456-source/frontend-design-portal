import { Fragment, useEffect, useRef, useState, useCallback } from 'react'
import MechaDisassembly from './showcases/MechaDisassembly'
import * as THREE from 'three'
import OrbitalViz from './OrbitalViz'
import KeyboardConfigShowcase from './KeyboardConfigShowcase'
import PixiJSShowcase from './PixiJSShowcase'
import AbyssalDescent from './showcases/AbyssalDescent'
import AsciiSharksShowcase from './showcases/AsciiSharksShowcase'
import AsciiRestShowcase from './showcases/AsciiRestShowcase'
import TextFireworksShowcase from './showcases/TextFireworksShowcase'

/* ═══════════════════════════════════════════════════════════════
   KAGE — MengTo 单文件滚动 3D 夜游（公众号爆火项目，整页 iframe）
   ═══════════════════════════════════════════════════════════════ */
function KageShowcase() {
  return (
    <div className="relative w-full">
      <iframe
        src="/kage.html"
        title="Kage — Night Kyoto"
        className="fixed inset-0 w-full h-full border-0"
        style={{ zIndex: 1, background: '#05070a' }}
        allow="autoplay; fullscreen; webgpu"
      />
      <div style={{ height: '100vh' }} />
    </div>
  )
}

/* 通用 iframe 容器：achrefelouafi 8 个 Three.js 项目（构建产物已部署到 public/showcases/） */
function IframeShowcase({ src, title, background = '#000' }: { src: string; title: string; background?: string }) {
  return (
    <div className="relative w-full">
      <iframe
        src={src}
        title={title}
        className="fixed inset-0 w-full h-full border-0"
        style={{ zIndex: 1, background }}
        allow="autoplay; fullscreen; webgpu"
      />
      <div style={{ height: '100vh' }} />
    </div>
  )
}

/* 浅色 iframe 容器：Looseleaf 纸面主题，避免黑色底在加载瞬间闪一下 */
function LightIframeShowcase({ src, title, background }: { src: string; title: string; background: string }) {
  return (
    <div className="relative w-full">
      <iframe
        src={src}
        title={title}
        className="fixed inset-0 w-full h-full border-0"
        style={{ zIndex: 1, background }}
      />
      <div style={{ height: '100vh' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASES PAGE — 6 Immersive Fullscreen Effects
   ═══════════════════════════════════════════════════════════════ */

/* ─── Shared Math helpers ─── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

type OnNavigate = (page: 'official' | 'components') => void

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE 1 — NEBULA CORE
   Particle cosmos with scroll-driven stage transitions
   ═══════════════════════════════════════════════════════════════ */
function NebulaCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })
  const scrollRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0, cx = 0, cy = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.width = Math.floor(window.innerWidth * dpr)
      h = canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      cx = w / 2; cy = h / 2
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX) * dpr, y: (e.clientY) * dpr, active: true }
    }
    const onMouseLeave = () => { mouseRef.current.active = false }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Stars
    const stars = Array.from({ length: 2000 }, () => {
      const x = Math.random() * w, y = Math.random() * h
      return {
        baseX: x, baseY: y, z: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.15, size: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.3 + 0.1,
        hue: Math.random() > 0.7 ? Math.random() * 60 + 300 : Math.random() * 40 + 180,
        twinklePhase: Math.random() * Math.PI * 2,
      }
    })

    // Nebula particles
    const nebula = Array.from({ length: 350 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * Math.min(w, h) * 0.7
      const x = cx + Math.cos(angle) * dist, y = cy + Math.sin(angle) * dist
      return {
        x, y, originX: x, originY: y, vx: 0, vy: 0,
        size: Math.random() * 5 + 2, hue: Math.random() * 120 + 240,
        pulsePhase: Math.random() * Math.PI * 2, brightness: Math.random() * 0.35 + 0.15, idx: i,
      }
    })

    // Satellites on orbital rings
    interface Sat { orbitIndex: number; angle: number; baseRadius: number; radius: number; speed: number; size: number; hue: number; glowHue: number; pulsePhase: number; trail: { x: number; y: number; alpha: number }[] }
    const satellites: Sat[] = []
    const SATS_PER_ORBIT = [10, 14, 18, 22, 26, 30]
    for (let o = 0; o < 6; o++) {
      const count = SATS_PER_ORBIT[o]
      for (let i = 0; i < count; i++) {
        const hue = (o * 50 + i * (360 / count)) % 360
        satellites.push({
          orbitIndex: o, angle: (i / count) * Math.PI * 2 + Math.random() * 0.2,
          baseRadius: 50 + o * 50, radius: 50 + o * 50,
          speed: (o % 2 === 0 ? 1 : -1) * (0.0004 + o * 0.00012),
          size: 2.5 + Math.random() * 3.5, hue, glowHue: (hue + 20) % 360,
          pulsePhase: Math.random() * Math.PI * 2, trail: [],
        })
      }
    }

    // Text particles
    const textParticles: { x: number; y: number; targetX: number; targetY: number; size: number; hue: number; phase: number; speed: number }[] = []
    let textReady = false
    const buildText = () => {
      const off = document.createElement('canvas')
      const offCtx = off.getContext('2d')
      if (!offCtx) return
      off.width = w; off.height = h
      const fs = Math.min(w, h) / 6
      offCtx.fillStyle = '#fff'
      offCtx.font = `900 ${fs}px system-ui, sans-serif`
      offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle'
      offCtx.fillText('DESIGN', cx, cy)
      const img = offCtx.getImageData(0, 0, w, h).data
      textParticles.length = 0
      for (let y = 0; y < h; y += 5) {
        for (let x = 0; x < w; x += 5) {
          if (img[(y * w + x) * 4 + 3] > 128) {
            const a = Math.random() * Math.PI * 2, d = 100 + Math.random() * 300
            textParticles.push({
              x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
              targetX: x, targetY: y,
              size: Math.random() * 2.5 + 0.8, hue: (x / w) * 60 + 300,
              phase: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03,
            })
          }
        }
      }
      textReady = true
    }
    buildText()

    let time = 0, lastRing = 0
    interface Ring { radius: number; alpha: number; width: number; hue: number }
    let rings: Ring[] = []

    const animate = () => {
      time++
      const scroll = scrollRef.current
      const mouse = mouseRef.current
      const s1 = smoothstep(0, 0.22, scroll)
      const s2 = smoothstep(0.18, 0.42, scroll)
      const s3 = smoothstep(0.38, 0.62, scroll)
      const s4 = smoothstep(0.58, 0.82, scroll)
      const s5 = smoothstep(0.78, 1.0, scroll)
      const pulse = 1 + Math.sin(time * 0.03) * 0.12

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(3, 3, 10, 0.25)'
      ctx.fillRect(0, 0, w, h)

      if (scroll > 0.05 && time - lastRing > 150) {
        lastRing = time
        rings.push({ radius: 10, alpha: 0.4, width: 1.5, hue: (time * 2) % 360 })
      }

      // Stars
      ctx.globalCompositeOperation = 'lighter'
      for (const s of stars) {
        s.twinklePhase += s.speed * 0.02
        const tw = 0.5 + Math.sin(s.twinklePhase) * 0.5
        const alpha = s.brightness * tw * (1 - s4 * 0.3)
        let px = s.baseX, py = s.baseY
        if (mouse.active) { px -= (mouse.x - cx) * 0.015 * s.z; py -= (mouse.y - cy) * 0.015 * s.z }
        const da = s.baseX * 0.001 + s.baseY * 0.001 + time * 0.0001
        px += Math.cos(da) * s3 * 40 * s.z; py += Math.sin(da) * s3 * 40 * s.z
        ctx.fillStyle = `hsla(${s.hue}, 50%, 85%, ${alpha})`
        ctx.beginPath(); ctx.arc(px, py, s.size * dpr * 0.4, 0, Math.PI * 2); ctx.fill()
      }

      // Nebula
      for (const p of nebula) {
        p.pulsePhase += 0.015
        let tx = p.originX, ty = p.originY
        if (s1 > 0 && s2 < 1) { const t = s1 * (1 - s2); tx = lerp(p.originX, cx + (p.originX - cx) * 0.3, t); ty = lerp(p.originY, cy + (p.originY - cy) * 0.3, t) }
        if (s2 > 0 && s3 < 1) { const t = s2 * (1 - s3); const oa = Math.atan2(p.originY - cy, p.originX - cx) + time * 0.0002 * (p.idx % 2 === 0 ? 1 : -1); const or = 100 + (p.idx % 5) * 60; tx = lerp(tx, cx + Math.cos(oa) * or, t); ty = lerp(ty, cy + Math.sin(oa) * or, t) }
        if (s3 > 0) { const t = s3; const ea = Math.atan2(p.originY - cy, p.originX - cx) + time * 0.0003; const er = (100 + (p.idx % 5) * 60) * (1 + t * 2); tx = lerp(tx, cx + Math.cos(ea) * er, t); ty = lerp(ty, cy + Math.sin(ea) * er, t) }
        if (mouse.active) { const dx = mouse.x - p.x, dy = mouse.y - p.y; const d = Math.sqrt(dx * dx + dy * dy); if (d < 250 * dpr) { const f = (1 - d / (250 * dpr)) * 0.025; p.vx += dx * f; p.vy += dy * f } }
        p.vx += (tx - p.x) * 0.007; p.vy += (ty - p.y) * 0.007; p.vx *= 0.94; p.vy *= 0.94; p.x += p.vx; p.y += p.vy
        const sz = p.size * (1 + Math.sin(p.pulsePhase) * 0.25) * pulse
        const al = p.brightness * (0.22 + s1 * 0.18) * (1 - s4 * 0.2)
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 5)
        gr.addColorStop(0, `hsla(${p.hue}, 75%, 65%, ${al * 0.5})`); gr.addColorStop(0.15, `hsla(${p.hue}, 65%, 50%, ${al * 0.25})`); gr.addColorStop(1, 'transparent')
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, sz * 5, 0, Math.PI * 2); ctx.fill()
      }

      // Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.radius += 2.5; r.alpha -= 0.003
        if (r.alpha <= 0) { rings.splice(i, 1); continue }
        ctx.strokeStyle = `hsla(${r.hue}, 70%, 55%, ${r.alpha})`; ctx.lineWidth = r.width * dpr
        ctx.beginPath(); ctx.arc(cx, cy, r.radius, 0, Math.PI * 2); ctx.stroke()
      }

      // Satellites
      for (const sat of satellites) {
        sat.pulsePhase += 0.02
        let orbitScale = 1
        if (s1 > 0 && s2 < 1) orbitScale = lerp(0.3, 1, s1)
        if (s3 > 0) orbitScale = lerp(1, 2.2, s3)
        if (s4 > 0) orbitScale = lerp(2.2, 0.1, s4)
        sat.radius = sat.baseRadius * orbitScale * pulse
        sat.angle += sat.speed * (1 + s2 * 1.5)
        let tiltX = 0, tiltY = 0
        if (s3 > 0 && s4 < 1) { const t = s3 * (1 - s4); tiltX = Math.sin(time * 0.005 + sat.orbitIndex) * t * 0.4; tiltY = Math.cos(time * 0.004 + sat.orbitIndex) * t * 0.25 }
        const px = cx + Math.cos(sat.angle + tiltX) * sat.radius, py = cy + Math.sin(sat.angle + tiltY) * sat.radius
        sat.trail.push({ x: px, y: py, alpha: 0.5 }); if (sat.trail.length > 10) sat.trail.shift()
        for (let t = 0; t < sat.trail.length - 1; t++) { sat.trail[t].alpha *= 0.88; ctx.strokeStyle = `hsla(${sat.hue}, 70%, 55%, ${sat.trail[t].alpha * (1 - s4 * 0.4)})`; ctx.lineWidth = sat.size * 0.25 * dpr; ctx.beginPath(); ctx.moveTo(sat.trail[t].x, sat.trail[t].y); ctx.lineTo(sat.trail[t + 1].x, sat.trail[t + 1].y); ctx.stroke() }
        let sz = sat.size
        if (mouse.active) { const dx = px - mouse.x, dy = py - mouse.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 120 * dpr) { const inf = Math.max(0, 1 - d / (120 * dpr)); sz = sat.size * (1 + inf); const gg = ctx.createRadialGradient(px, py, 0, px, py, sz * 4); gg.addColorStop(0, `hsla(${sat.hue}, 75%, 65%, ${0.25 + inf * 0.1})`); gg.addColorStop(1, 'transparent'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, sz * 4, 0, Math.PI * 2); ctx.fill() } }
        const p = 1 + Math.sin(sat.pulsePhase) * 0.15
        const gs = sz * 3.5 * p
        const g = ctx.createRadialGradient(px, py, 0, px, py, gs)
        g.addColorStop(0, `hsla(${sat.hue}, 75%, 65%, ${0.35 * (1 - s4 * 0.3)})`); g.addColorStop(0.3, `hsla(${sat.glowHue}, 65%, 45%, ${0.15 * (1 - s4 * 0.3)})`); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, gs, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, sz * p * 0.3, 0, Math.PI * 2); ctx.fill()
      }

      // Core
      const cs = (22 + s2 * 12 + s5 * 25) * pulse
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 4)
      cg.addColorStop(0, `hsla(${280 + scroll * 80}, 75%, 55%, ${0.18 + s2 * 0.12})`); cg.addColorStop(0.3, `hsla(${260 + scroll * 60}, 65%, 40%, 0.05)`); cg.addColorStop(1, 'transparent')
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, cs * 4, 0, Math.PI * 2); ctx.fill()
      const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 1.3)
      ig.addColorStop(0, `hsla(${320 + scroll * 40}, 85%, 75%, ${0.5 + s5 * 0.1})`); ig.addColorStop(0.3, `hsla(${300 + scroll * 50}, 75%, 50%, ${0.3 + s2 * 0.12})`); ig.addColorStop(1, 'transparent')
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(cx, cy, cs * 1.3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${0.6 - s4 * 0.35})`; ctx.beginPath(); ctx.arc(cx, cy, cs * 0.25, 0, Math.PI * 2); ctx.fill()

      // Text
      if (textReady && s4 > 0) {
        const ta = s4 * (1 - s5 * 0.5)
        for (const tp of textParticles) {
          tp.phase += tp.speed
          const wx = Math.sin(tp.phase + time * 0.02) * 4 * s5, wy = Math.cos(tp.phase + time * 0.015) * 3 * s5
          tp.x += (tp.targetX + wx - tp.x) * tp.speed * 2; tp.y += (tp.targetY + wy - tp.y) * tp.speed * 2
          const sz = tp.size * (1 + Math.sin(tp.phase) * 0.25) * (0.5 + s4 * 0.5)
          const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, sz * 2)
          g.addColorStop(0, `hsla(${tp.hue}, 75%, 60%, ${ta * 0.5})`); g.addColorStop(0.5, `hsla(${tp.hue + 20}, 65%, 40%, ${ta * 0.2})`); g.addColorStop(1, 'transparent')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tp.x, tp.y, sz * 2, 0, Math.PI * 2); ctx.fill()
        }
      }

      if (s5 > 0) { const na = s5 * 0.12; const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45); ng.addColorStop(0, `hsla(40, 85%, 75%, ${na})`); ng.addColorStop(0.1, `hsla(30, 75%, 55%, ${na * 0.4})`); ng.addColorStop(1, 'transparent'); ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h) }

      // Overlay text
      ctx.globalCompositeOperation = 'source-over'
      if (s1 < 1) {
        const a = (1 - s1) * 0.9
        ctx.font = `bold ${Math.min(w, h) / 16}px system-ui, sans-serif`; ctx.textAlign = 'center'
        ctx.shadowColor = `rgba(180, 140, 255, ${a * 0.4})`; ctx.shadowBlur = 30
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText('NEBULA CORE', cx, cy + Math.min(w, h) / 35)
        ctx.shadowBlur = 0; ctx.font = `${Math.min(w, h) / 48}px system-ui, sans-serif`
        ctx.fillStyle = `rgba(190,190,255,${a * 0.5})`; ctx.fillText('Scroll to forge the cosmos', cx, cy + Math.min(w, h) / 16)
      }
      if (s5 > 0.3) { const a = (s5 - 0.3) / 0.7; ctx.font = `bold ${Math.min(w, h) / 22}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.shadowColor = `rgba(255,200,100,${a * 0.3})`; ctx.shadowBlur = 25; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText('FRONTEND DESIGN PORTAL', cx, cy + Math.min(w, h) * 0.32); ctx.shadowBlur = 0 }

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); window.removeEventListener('scroll', onScroll); canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mouseleave', onMouseLeave) }
  }, [])

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem' }}>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ background: '#03030a', cursor: 'crosshair', zIndex: 1 }} />
      <div style={{ height: '600vh' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE 3 — MECHA DISASSEMBLY
   原创大型机甲拆解秀：多零件、装甲层、骨架、管线、HUD
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE 4 — THREE PLANETS
   Three.js planet carousel with atmosphere scattering
   ═══════════════════════════════════════════════════════════════ */
function ThreePlanets() {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(1)
  const hoveredRef = useRef<number | null>(null)
  const [planetName, setPlanetName] = useState('Aether Prime')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030308)

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0.8, 10)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Stars
    const starsGeo = new THREE.BufferGeometry()
    const starCount = 3000
    const posArr = new Float32Array(starCount * 3)
    const sizeArr = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 90
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 60
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10
      sizeArr[i] = 0.03 + Math.random() * 0.1
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    starsGeo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1))
    const starsMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float size; varying float vAlpha; void main(){ vAlpha=0.4+0.6*size*10.0; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*(300.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vAlpha; void main(){ float d=distance(gl_PointCoord,vec2(0.5)); if(d>0.5)discard; float a=smoothstep(0.5,0.2,d)*vAlpha; gl_FragColor=vec4(1.0,1.0,1.0,a); }`,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Points(starsGeo, starsMat))

    // Planet shaders — real texture + view-space diffuse + rim light
    const vShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main(){
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `
    const fShader = `
      uniform sampler2D uTex;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main(){
        vec3 texColor = texture2D(uTex, vUv).rgb;
        // Minimal lighting: preserve texture's natural baked appearance
        // while adding subtle spherical depth cue via view-space normal
        float facing = max(dot(normalize(vNormal), normalize(vec3(0.0, 0.0, 1.0))), 0.0);
        vec3 litColor = texColor * (0.55 + facing * 0.45);
        // Refined rim light — thin edge glow only
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
        rim = pow(rim, 4.0) * uRimStrength * 0.5;
        vec3 finalColor = litColor + uRimColor * rim;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const geo = new THREE.SphereGeometry(1, 80, 80)

    const texLoader = new THREE.TextureLoader()
    const data = [
      { name: 'Aether Prime', rim: new THREE.Vector3(0.25, 0.6, 1.0), texPath: '/assets/showcases/planet-tex-1.jpg' },
      { name: 'Crimson Nova', rim: new THREE.Vector3(1.0, 0.45, 0.15), texPath: '/assets/showcases/planet-tex-2.jpg' },
      { name: 'Void Echo', rim: new THREE.Vector3(0.7, 0.25, 1.0), texPath: '/assets/showcases/planet-tex-3.jpg' },
    ]

    type Ball = { m: THREE.Mesh; s: number; t: THREE.Vector3; ts: number }
    const balls: Ball[] = []
    let loadedCount = 0

    // 3D arc layout: center ball is front & large, side balls are back & small
    function getLayout(active: number) {
      // active ball: center front
      // left ball: back-left, right ball: back-right
      const layouts: Record<number, { x: number; y: number; z: number; scale: number }[]> = {
        1: [
          { x: 0, y: 0, z: 1.8, scale: 1.3 },   // 0 active
          { x: -3.6, y: 0.25, z: -1.2, scale: 0.82 }, // 1 left-back
          { x: 3.6, y: 0.25, z: -1.2, scale: 0.82 },  // 2 right-back
        ],
        2: [
          { x: 3.6, y: 0.25, z: -1.2, scale: 0.82 },  // 0 right-back
          { x: 0, y: 0, z: 1.8, scale: 1.3 },   // 1 active
          { x: -3.6, y: 0.25, z: -1.2, scale: 0.82 }, // 2 left-back
        ],
        3: [
          { x: -3.6, y: 0.25, z: -1.2, scale: 0.82 }, // 0 left-back
          { x: 3.6, y: 0.25, z: -1.2, scale: 0.82 },  // 1 right-back
          { x: 0, y: 0, z: 1.8, scale: 1.3 },   // 2 active
        ],
      }
      return layouts[active] || layouts[1]
    }

    function setPos(active: number) {
      const layout = getLayout(active)
      balls.forEach((b, i) => {
        b.t.set(layout[i].x, layout[i].y, layout[i].z)
        b.ts = layout[i].scale
      })
      setPlanetName(data[active - 1].name)
    }

    data.forEach((d, i) => {
      texLoader.load(d.texPath, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        const mat = new THREE.ShaderMaterial({
          vertexShader: vShader,
          fragmentShader: fShader,
          uniforms: {
            uTex: { value: tex },
            uRimColor: { value: d.rim },
            uRimStrength: { value: 0.7 },
          },
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.userData.idx = i + 1
        scene.add(mesh)
        const layout = getLayout(1)[i]
        balls.push({ m: mesh, s: 0.0015 + i * 0.0008, t: new THREE.Vector3(layout.x, layout.y, layout.z), ts: layout.scale })
        mesh.scale.setScalar(layout.scale)
        mesh.position.copy(balls[balls.length - 1].t)

        loadedCount++
        if (loadedCount === data.length) {
          setLoaded(true)
          setPos(1)
        }
      })
    })

    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      ray.setFromCamera(mouse, camera)
      const hits = ray.intersectObjects(balls.map(b => b.m))
      hoveredRef.current = hits.length ? hits[0].object.userData.idx : null
      container.style.cursor = hits.length ? 'pointer' : 'default'
    }
    const onClick = () => {
      if (hoveredRef.current) {
        activeRef.current = hoveredRef.current
        setPos(activeRef.current)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)

    const timer = setInterval(() => {
      activeRef.current = activeRef.current >= 3 ? 1 : activeRef.current + 1
      setPos(activeRef.current)
    }, 6000)

    let raf = 0
    const clock = new THREE.Clock()
    const animate = () => {
      const elapsed = clock.getElapsedTime()
      starsMat.uniforms.uTime.value = elapsed

      balls.forEach((b, i) => {
        b.m.rotation.y += b.s
        // Smooth position lerp
        b.m.position.lerp(b.t, 0.035)
        // Smooth scale lerp
        const cs = b.m.scale.x
        const hoverScale = hoveredRef.current === i + 1 ? 1.12 : 1.0
        const targetScale = b.ts * hoverScale
        const ns = cs + (targetScale - cs) * 0.05
        b.m.scale.setScalar(ns)
        // Subtle floating motion
        b.m.position.y += Math.sin(elapsed * 0.8 + i * 2.1) * 0.0008
      })

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(timer)
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white/50 text-sm tracking-[0.3em]">LOADING WORLDS...</div>
        </div>
      )}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h2 className="text-4xl font-black tracking-[0.2em] text-white/90 drop-shadow-lg">THREE PLANETS</h2>
        <p className="mt-2 text-sm tracking-[0.3em] text-cyan-200/50">CLICK TO SWITCH · REAL TEXTURES · 3D ARC</p>
      </div>
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <div className="text-2xl font-bold tracking-wider text-white/80 drop-shadow-md">{planetName}</div>
        <div className="mt-1 text-xs tracking-[0.2em] text-white/30">ACTIVE SPHERE</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE PAGE — Selector + 4 effects
   ═══════════════════════════════════════════════════════════════ */
const SHOWCASES = [
  { id: 'nebula', label: 'Nebula Core', desc: 'Particle cosmos', icon: '✦' },
  { id: 'fireworks', label: 'Text Fireworks', desc: 'Type → explode → return', icon: '✦' },
  { id: 'mecha', label: 'Mecha Breakdown', desc: 'Mechanical disassembly', icon: '⚙' },
  { id: 'planets', label: 'Three Planets', desc: '3D planet carousel', icon: '◐' },
  { id: 'orbits', label: 'Orbital Orbits', desc: 'Satellite orbit viz', icon: '⊕' },
  { id: 'keyboard', label: 'Keyboard Config', desc: '3D keyboard configurator', icon: '⌨' },
  { id: 'pixijs', label: 'PixiJS Playground', desc: '2D WebGL rendering engine', icon: '🎨' },
  { id: 'kage', label: 'Kage', desc: 'MengTo single-file scroll 3D night Kyoto', icon: '⛩' },
  { id: 'abyss', label: 'Abyssal Descent', desc: 'Scroll-driven 3D deep-sea descent', icon: '🌊' },
  { id: 'building', label: 'HK Building Gen', desc: 'Procedural Hong Kong buildings (achrefelouafi)', icon: '🏙' },
  { id: 'snow', label: 'Snowy Footprints', desc: 'Snow terrain + falling snow', icon: '❄️' },
  { id: 'water', label: 'Cinematic Water', desc: 'Beach water body + dive-under', icon: '🌊' },
  { id: 'ocean', label: 'FFT Ocean', desc: 'JONSWAP spectrum + FFT ocean', icon: '🌊' },
  { id: 'grass', label: 'Soil Studio', desc: 'Moss grass wind + ground sculpt', icon: '🌿' },
  { id: 'vegetation', label: 'WebGPU Ivy', desc: 'Ivy grows along drawn paths', icon: '🌱' },
  { id: 'crystal', label: 'WebGPU Crystal', desc: 'Amethyst cluster growth brush', icon: '💎' },
  { id: 'rain', label: 'Rain Studio', desc: 'Rain streaks + lightning + puddles', icon: '⛈' },
  { id: 'looseleaf', label: 'Looseleaf Paper Desk', desc: 'Hand-drawn UI on a physical paper desk', icon: '📝' },
  { id: 'phoenix', label: 'Chinese Phoenix Crown', desc: 'Seven crowns with physics text curtains', icon: '👑' },
  { id: 'grand-atelier', label: 'Grand Atelier', desc: 'Playable 3D grand piano with visible mechanics', icon: '🎹' },
  { id: 'ascii-rest', label: 'ASCII.Art', desc: '240 animated pieces · 15 categories · one tag', icon: '🅰', group: 'ASCII' },
  { id: 'ascii', label: 'ASCII Ocean', desc: '8 ASCII shark species + boids fish (stackedlol)', icon: '🦈', group: 'ASCII' },
] as const

type ShowcaseId = typeof SHOWCASES[number]['id']

export default function ShowcasesPage({ onNavigate }: { onNavigate?: OnNavigate }) {
  const [activeId, setActiveId] = useState<ShowcaseId>('nebula')
  const [transitioning, setTransitioning] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)

  const switchTo = useCallback((id: ShowcaseId) => {
    if (id === activeId || transitioning) return
    setTransitioning(true)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setTimeout(() => {
      setActiveId(id)
      setTransitioning(false)
    }, 200)
  }, [activeId, transitioning])

  const activeShowcase = SHOWCASES.find(s => s.id === activeId)

  return (
    <div className="relative w-full">
      {/* Back button — 左上角 */}
      <button
        onClick={() => { window.scrollTo({ top: 0 }); if (onNavigate) onNavigate('official') }}
        className="fixed top-4 left-4 z-[200] px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 hover:text-white transition-all"
      >
        ← Back
      </button>

      {/* Showcase selector — 左下角可收起 */}
      <div className="fixed bottom-4 left-4 z-[200]">
        {/* Toggle button */}
        <button
          onClick={() => setSelectorOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-xl border border-cyan-300/25 text-white/80 text-xs font-medium hover:bg-white/12 hover:text-white hover:border-cyan-300/50 transition-all"
          style={{
            boxShadow: '0 0 16px rgba(65,230,255,0.2), 0 0 32px rgba(65,230,255,0.08), inset 0 0 12px rgba(65,230,255,0.06)',
          }}
        >
          <span className="text-base">{activeShowcase?.icon}</span>
          <span className="max-w-[120px] truncate">{activeShowcase?.label}</span>
          <span className={`ml-1 transition-transform duration-200 ${selectorOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Dropdown */}
        {selectorOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 flex flex-col gap-1 p-1.5 rounded-xl bg-black/70 backdrop-blur-xl border border-cyan-300/20 overflow-y-auto"
            style={{
              boxShadow: '0 0 24px rgba(65,230,255,0.15), 0 -4px 16px rgba(65,230,255,0.08)',
              maxHeight: 'min(60vh, 480px)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(65,230,255,0.35) transparent',
            }}
          >
            {SHOWCASES.map((sc, index) => {
              const group = (sc as any).group as string | undefined
              const previousGroup = index > 0 ? ((SHOWCASES[index - 1] as any).group as string | undefined) : undefined
              return (
                <Fragment key={sc.id}>
                  {group && group !== previousGroup && (
                    <div className="mt-1 px-3 pt-1 pb-0.5 text-[9px] font-semibold tracking-[0.34em] text-cyan-200/50">
                      {group}
                    </div>
                  )}
                  <button
                    onClick={() => { switchTo(sc.id); setSelectorOpen(false) }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      activeId === sc.id
                        ? 'text-white bg-white/15'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-base">{sc.icon}</span>
                    <span>{sc.label}</span>
                  </button>
                </Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* Active showcase */}
      <div className={`transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {activeId === 'nebula' && <NebulaCore />}
        {activeId === 'fireworks' && <TextFireworksShowcase />}
        {activeId === 'mecha' && <MechaDisassembly />}
        {activeId === 'planets' && <ThreePlanets />}
        {activeId === 'orbits' && <OrbitalViz />}
        {activeId === 'keyboard' && <KeyboardConfigShowcase />}
        {activeId === 'pixijs' && <PixiJSShowcase />}
        {activeId === 'kage' && <KageShowcase />}
        {activeId === 'abyss' && <AbyssalDescent />}
        {activeId === 'building' && <IframeShowcase src="/showcases/building/" title="香港程序化建筑生成" />}
        {activeId === 'snow' && <IframeShowcase src="/showcases/snow/" title="雪野脚印系统" />}
        {activeId === 'water' && <IframeShowcase src="/showcases/water/" title="电影级海面" />}
        {activeId === 'ocean' && <IframeShowcase src="/showcases/ocean/" title="FFT 物理海洋" />}
        {activeId === 'grass' && <IframeShowcase src="/showcases/grass/" title="草地土壤工作室" />}
        {activeId === 'vegetation' && <IframeShowcase src="/showcases/vegetation/" title="WebGPU 藤蔓生成" />}
        {activeId === 'crystal' && <IframeShowcase src="/showcases/crystal/" title="WebGPU 水晶绘制" />}
        {activeId === 'rain' && <IframeShowcase src="/showcases/rain/" title="雨景工作室" />}
        {activeId === 'ascii-rest' && <AsciiRestShowcase />}
        {activeId === 'ascii' && <AsciiSharksShowcase />}
        {activeId === 'looseleaf' && (
          <LightIframeShowcase src="/looseleaf-showcase.html" title="Looseleaf Paper Desk" background="#a8c8bb" />
        )}
        {activeId === 'phoenix' && (
          <IframeShowcase src="/phoenix-crown.html" title="Chinese Phoenix Crown" background="#0f1420" />
        )}
        {activeId === 'grand-atelier' && (
          <IframeShowcase src="/grand-atelier.html" title="Grand Atelier" background="#151713" />
        )}
      </div>
    </div>
  )
}
