import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import OrbitalViz from './OrbitalViz'
import KeyboardConfigShowcase from './KeyboardConfigShowcase'

/* ═══════════════════════════════════════════════════════════════
   SHOWCASES PAGE — 3 Immersive Fullscreen Effects
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
   SHOWCASE 2 — ORBITAL MODULES
   Anime.js-style CSS 3D satellite animation
   ═══════════════════════════════════════════════════════════════ */
function OrbitalModules() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(0)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef(0)

  const modules = [
    { name: 'Animation', color: '#FF6B6B', icon: '◈' },
    { name: 'Timeline', color: '#4ECDC4', icon: '⟐' },
    { name: 'WAAPI', color: '#45B7D1', icon: '◇' },
    { name: 'Scroll', color: '#96CEB4', icon: '↕' },
    { name: 'SVG', color: '#FFEAA7', icon: '△' },
    { name: 'Spring', color: '#DDA0DD', icon: '∿' },
    { name: 'Draggable', color: '#98D8C8', icon: '✥' },
    { name: 'Stagger', color: '#F7DC6F', icon: '≡' },
    { name: 'Easing', color: '#BB8FCE', icon: '∼' },
    { name: 'Scope', color: '#85C1E9', icon: '⊙' },
    { name: 'Events', color: '#F8C471', icon: '⚡' },
    { name: 'Timer', color: '#82E0AA', icon: '◷' },
  ]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0
    }
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)

    const modEls = container.querySelectorAll<HTMLElement>('[data-mod]')
    const labelEls = container.querySelectorAll<HTMLElement>('[data-label]')
    const lineEls = container.querySelectorAll<HTMLElement>('[data-orbit-line]')
    const coreEl = container.querySelector<HTMLElement>('[data-core]')
    const titleEl = container.querySelector<HTMLElement>('[data-title]')
    const subtitleEl = container.querySelector<HTMLElement>('[data-subtitle]')

    const animate = () => {
      const s = scrollRef.current
      const m = mouseRef.current
      const time = performance.now() * 0.001

      // Stages
      const flyIn = smoothstep(0, 0.15, s)       // 0->1: modules fly in from edges
      const formOrbit = smoothstep(0.12, 0.35, s)  // 0->1: modules arrange into orbits
      const rotate = smoothstep(0.3, 0.6, s)       // 0->1: orbits rotate, speed up
      const tilt3D = smoothstep(0.45, 0.7, s)      // 0->1: 3D tilt
      const shrink = smoothstep(0.65, 0.85, s)     // 0->1: shrink to center
      const caseOpen = smoothstep(0.8, 1.0, s)     // 0->1: final display

      // Core
      if (coreEl) {
        const coreScale = 0.3 + flyIn * 0.7 + caseOpen * 0.5
        const coreGlow = flyIn * 0.6 + caseOpen * 0.4
        coreEl.style.transform = `translate(-50%, -50%) scale(${coreScale})`
        coreEl.style.opacity = `${Math.min(1, flyIn * 2)}`
        coreEl.style.boxShadow = `0 0 ${60 * coreGlow}px rgba(200,150,255,${coreGlow * 0.4}), 0 0 ${120 * coreGlow}px rgba(150,100,255,${coreGlow * 0.15})`
      }

      // Title
      if (titleEl) {
        titleEl.style.opacity = `${(1 - flyIn) * 0.9 + caseOpen * 0.8}`
        titleEl.style.transform = `translateY(${(1 - flyIn) * -20 + caseOpen * 40}px)`
      }
      if (subtitleEl) {
        subtitleEl.style.opacity = `${(1 - flyIn * 1.5) * 0.7 + caseOpen * 0.6}`
        subtitleEl.style.transform = `translateY(${(1 - flyIn * 1.5) * 10}px)`
      }

      // Modules
      modEls.forEach((mod, i) => {
        const orbit = parseInt(mod.dataset.orbit || '0')
        const baseAngle = parseFloat(mod.dataset.angle || '0')

        // Mouse-driven rotation offset
        const mouseRotation = (m.x - 0.5) * 0.3 + (m.y - 0.5) * 0.15
        const timeRotation = time * (0.15 + orbit * 0.08) * (orbit % 2 === 0 ? 1 : -1)

        // Stage-based positioning
        let x = 0, y = 0, scale = 1, opacity = 1, rotX = 0, rotY = 0, rotZ = 0

        if (flyIn < 1) {
          // Fly in from random directions
          const flyAngle = (i / modules.length) * Math.PI * 2 + i * 1.7
          const flyDist = (1 - flyIn) * 800
          x = Math.cos(flyAngle) * flyDist
          y = Math.sin(flyAngle) * flyDist
          scale = 0.2 + flyIn * 0.8
          opacity = flyIn
        } else {
          const angle = baseAngle + timeRotation * rotate + mouseRotation
          const orbitR = 120 + orbit * 80

          // Shrink orbits
          const currentR = orbitR * (1 - shrink * 0.7)
          const currentAngle = angle + shrink * Math.PI * 0.5 * orbit

          x = Math.cos(currentAngle) * currentR
          y = Math.sin(currentAngle) * currentR * (1 - tilt3D * 0.35) // Flatten Y for 3D effect

          scale = 1 - shrink * 0.3 + caseOpen * 0.2
          opacity = 1 - shrink * 0.1

          // 3D tilt
          rotX = tilt3D * (m.y - 0.5) * 40
          rotY = tilt3D * (m.x - 0.5) * 40
          rotZ = tilt3D * Math.sin(time + i) * 5
        }

        mod.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
        mod.style.opacity = `${Math.max(0, opacity)}`
      })

      // Orbit lines
      lineEls.forEach((line) => {
        const orbit = parseInt(line.dataset.orbit || '0')
        const r = 120 + orbit * 80
        const currentR = r * (1 - shrink * 0.7)
        const lineOpacity = formOrbit * 0.15 * (1 - shrink * 0.5)
        line.style.width = `${currentR * 2}px`
        line.style.height = `${currentR * 2 * (1 - tilt3D * 0.35)}px`
        line.style.opacity = `${lineOpacity}`
        line.style.transform = `translate(-50%, -50%) rotateX(${tilt3D * (m.y - 0.5) * 40}deg) rotateY(${tilt3D * (m.x - 0.5) * 40}deg)`
      })

      // Labels
      labelEls.forEach((label) => {
        const delay = parseFloat(label.dataset.delay || '0')
        const labelProgress = smoothstep(0.2 + delay, 0.5 + delay, s)
        label.style.opacity = `${labelProgress * (1 - shrink * 0.5) * (1 - (1 - flyIn) * 2)}`
        label.style.transform = `translateY(${(1 - labelProgress) * 30}px)`
      })

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouseMove) }
  }, [])

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem' }}>
      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #0f0f1a 0%, #060610 50%, #020208 100%)',
          perspective: '1200px',
        }}
      >
        {/* Title */}
        <div data-title className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <h2 className="text-5xl font-bold text-white/90 tracking-wider" style={{ fontFamily: 'system-ui, sans-serif' }}>ORBITAL MODULES</h2>
        </div>
        <div data-subtitle className="absolute top-[22%] left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <p className="text-lg text-white/40" style={{ fontFamily: 'system-ui, sans-serif' }}>Modular API Architecture — Scroll to animate</p>
        </div>

        {/* Core */}
        <div
          data-core
          className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full"
          style={{
            transform: 'translate(-50%, -50%) scale(0.3)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(180,140,255,0.4) 35%, transparent 70%)',
            boxShadow: '0 0 60px rgba(200,150,255,0.3)',
            opacity: 0,
          }}
        />

        {/* Orbit lines */}
        {[0, 1, 2].map(orbit => (
          <div
            key={`line-${orbit}`}
            data-orbit-line
            data-orbit={orbit}
            className="absolute top-1/2 left-1/2 rounded-full border border-white/5"
            style={{ transform: 'translate(-50%, -50%)', opacity: 0 }}
          />
        ))}

        {/* Module container */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {modules.map((mod, i) => {
            const orbit = Math.floor(i / 4)
            const angleInOrbit = (i % 4) * (Math.PI * 2 / 4)
            return (
              <div
                key={mod.name}
                data-mod
                data-orbit={orbit}
                data-angle={angleInOrbit}
                className="absolute top-1/2 left-1/2 flex items-center justify-center"
                style={{
                  width: 56, height: 56,
                  marginLeft: -28, marginTop: -28,
                  borderRadius: 14,
                  background: `${mod.color}15`,
                  border: `1.5px solid ${mod.color}40`,
                  color: mod.color,
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s',
                  boxShadow: `0 0 15px ${mod.color}15`,
                  backdropFilter: 'blur(8px)',
                  userSelect: 'none' as const,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${mod.color}35, inset 0 0 15px ${mod.color}15`
                  ;(e.currentTarget as HTMLElement).style.background = `${mod.color}25`
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 15px ${mod.color}15`
                  ;(e.currentTarget as HTMLElement).style.background = `${mod.color}15`
                }}
              >
                {mod.name[0]}
              </div>
            )
          })}
        </div>

        {/* Labels */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex gap-8 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          {['Animation', 'Timeline', 'WAAPI', 'Scroll'].map((name, i) => (
            <div key={name} data-label data-delay={i * 0.05} className="text-center opacity-0">
              <div className="text-xs font-medium text-white/60 tracking-wider" style={{ fontFamily: 'system-ui, sans-serif' }}>{name.toUpperCase()}</div>
              <div className="text-[10px] text-white/25 mt-1">{['Core engine', 'Sequence control', 'Native performance', 'Viewport trigger'][i]}</div>
            </div>
          ))}
        </div>

        {/* Size display */}
        <div data-label data-delay="0.2" className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-center opacity-0 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="text-xs text-white/20 tracking-widest">24.50 KB TOTAL</div>
          <div className="flex gap-3 mt-2 justify-center">
            {modules.map(m => (
              <div key={m.name} className="w-6 h-1.5 rounded-full" style={{ background: `${m.color}50` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll spacer */}
      <div style={{ height: '500vh' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE 3 — MECHA DISASSEMBLY
   原创大型机甲拆解秀：多零件、装甲层、骨架、管线、HUD
   ═══════════════════════════════════════════════════════════════ */
type MechaPart = {
  id: string
  label: string
  desc: string
  x: number
  y: number
  w: number
  h: number
  dx: number
  dy: number
  rot: number
  color: string
  accent: string
  clip?: string
  z: number
  phase: number
}

function MechaDisassembly() {
  const [scroll, setScroll] = useState(0)
  const [mouse, setMouse] = useState({ x: -1, y: -1 })
  const [hotPart, setHotPart] = useState<string | null>(null)
  const mechaImage = '/assets/showcases/original-mecha-fullbody.jpg'
  const internalFrameImage = '/assets/showcases/mecha-internal-frame.jpg'

  const parts: MechaPart[] = [
    { id: 'head', label: 'HD-01 光学头部', desc: '复合传感器阵列、青色全息面罩、红白头盔装甲。', x: 50, y: 14, w: 24, h: 18, dx: 0, dy: -36, rot: 0, color: '#d8e3ee', accent: '#41e6ff', clip: 'polygon(14% 0, 86% 0, 100% 42%, 82% 100%, 18% 100%, 0 42%)', z: 10, phase: 0.06 },
    { id: 'chest', label: 'CR-12 胸部主装甲', desc: '主胸甲、肩部连接轴、反应炉外环装甲结构。', x: 50, y: 33, w: 44, h: 22, dx: 0, dy: -22, rot: 0, color: '#cdd7e2', accent: '#41e6ff', clip: 'polygon(8% 0, 92% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%)', z: 8, phase: 0.12 },
    { id: 'core', label: 'RX-77 胸部能量核心', desc: '中央高亮反应炉，拆解时保留在骨架层发光。', x: 50, y: 33, w: 14, h: 11, dx: 0, dy: -8, rot: 0, color: '#21d4ff', accent: '#ffffff', clip: 'circle(48% at 50% 50%)', z: 12, phase: 0.16 },
    { id: 'shoulderL', label: 'SL-21 左肩重甲', desc: '红白复合肩甲，内含圆形关节轴和液压缓冲器。', x: 24, y: 30, w: 22, h: 18, dx: -42, dy: -18, rot: -26, color: '#e33847', accent: '#ff7a84', clip: 'polygon(0 20%, 78% 0, 100% 48%, 76% 100%, 10% 86%)', z: 9, phase: 0.18 },
    { id: 'shoulderR', label: 'SR-21 右肩重甲', desc: '红白复合肩甲，外侧装甲板独立拆出。', x: 76, y: 30, w: 22, h: 18, dx: 42, dy: -18, rot: 26, color: '#e33847', accent: '#ff7a84', clip: 'polygon(22% 0, 100% 20%, 90% 86%, 24% 100%, 0 48%)', z: 9, phase: 0.18 },
    { id: 'armL', label: 'LA-34 左臂总成', desc: '上臂护甲、肘部液压杆、前臂装甲与机械手掌。', x: 15, y: 52, w: 22, h: 34, dx: -54, dy: 12, rot: -36, color: '#dce7f0', accent: '#e33847', clip: 'polygon(28% 0, 84% 6%, 100% 58%, 74% 100%, 12% 88%, 0 32%)', z: 7, phase: 0.24 },
    { id: 'armR', label: 'RA-34 右臂总成', desc: '上臂护甲、肘部液压杆、前臂装甲与机械手掌。', x: 85, y: 52, w: 22, h: 34, dx: 54, dy: 12, rot: 36, color: '#dce7f0', accent: '#e33847', clip: 'polygon(16% 6%, 72% 0, 100% 32%, 88% 88%, 26% 100%, 0 58%)', z: 7, phase: 0.24 },
    { id: 'abdomen', label: 'AB-09 腹部动力管线', desc: '可见液压管、橙色线束和分层腹甲结构。', x: 50, y: 48, w: 30, h: 16, dx: 0, dy: 14, rot: 0, color: '#b9c3cd', accent: '#f2c94c', clip: 'polygon(20% 0, 80% 0, 100% 86%, 50% 100%, 0 86%)', z: 6, phase: 0.30 },
    { id: 'backpack', label: 'BT-88 背部推进系统', desc: '双侧矢量推进器、散热格栅和背包骨架。', x: 50, y: 34, w: 56, h: 40, dx: 0, dy: -32, rot: 0, color: '#5f6d7a', accent: '#41e6ff', clip: 'polygon(6% 8%, 94% 8%, 88% 100%, 12% 100%)', z: 2, phase: 0.26 },
    { id: 'pelvis', label: 'PV-18 髋部装甲裙板', desc: '腰部装甲和腿部动力连接器、裙甲。', x: 50, y: 60, w: 32, h: 14, dx: 0, dy: 20, rot: 0, color: '#e33847', accent: '#ffb3b8', clip: 'polygon(16% 0, 84% 0, 100% 52%, 70% 100%, 30% 100%, 0 52%)', z: 7, phase: 0.36 },
    { id: 'thighL', label: 'TL-55 左大腿装甲', desc: '大腿主护甲、膝部轴承外罩、液压支撑杆。', x: 38, y: 74, w: 24, h: 20, dx: -34, dy: 38, rot: -16, color: '#d8e3ee', accent: '#f2c94c', clip: 'polygon(24% 0, 82% 0, 100% 70%, 78% 100%, 14% 96%, 0 66%)', z: 6, phase: 0.42 },
    { id: 'thighR', label: 'TR-55 右大腿装甲', desc: '大腿主护甲、膝部轴承外罩、液压支撑杆。', x: 62, y: 74, w: 24, h: 20, dx: 34, dy: 38, rot: 16, color: '#d8e3ee', accent: '#f2c94c', clip: 'polygon(18% 0, 76% 0, 100% 66%, 86% 96%, 22% 100%, 0 70%)', z: 6, phase: 0.42 },
    { id: 'shinL', label: 'SL-67 左小腿推进器', desc: '小腿装甲、侧面推进喷口、踝部关节。', x: 38, y: 94, w: 22, h: 22, dx: -28, dy: 52, rot: -12, color: '#c5d0db', accent: '#41e6ff', clip: 'polygon(20% 0, 80% 0, 100% 72%, 76% 100%, 16% 96%, 0 68%)', z: 5, phase: 0.50 },
    { id: 'shinR', label: 'SR-67 右小腿推进器', desc: '小腿装甲、侧面推进喷口、踝部关节。', x: 62, y: 94, w: 22, h: 22, dx: 28, dy: 52, rot: 12, color: '#c5d0db', accent: '#41e6ff', clip: 'polygon(20% 0, 80% 0, 100% 68%, 84% 96%, 24% 100%, 0 72%)', z: 5, phase: 0.50 },
    { id: 'footL', label: 'FL-09 左脚稳定器', desc: '脚部装甲、足底抓地爪、姿态稳定喷射口。', x: 38, y: 112, w: 18, h: 12, dx: -22, dy: 42, rot: -8, color: '#a8b5c4', accent: '#f2c94c', clip: 'polygon(18% 0, 82% 0, 100% 60%, 80% 100%, 20% 100%, 0 60%)', z: 4, phase: 0.58 },
    { id: 'footR', label: 'FR-09 右脚稳定器', desc: '脚部装甲、足底抓地爪、姿态稳定喷射口。', x: 62, y: 112, w: 18, h: 12, dx: 22, dy: 42, rot: 8, color: '#a8b5c4', accent: '#f2c94c', clip: 'polygon(18% 0, 82% 0, 100% 60%, 80% 100%, 20% 100%, 0 60%)', z: 4, phase: 0.58 },
  ]

  const armorDetails = Array.from({ length: 88 }, (_, i) => ({
    id: i,
    x: 18 + (i * 17 % 64),
    y: 12 + (i * 29 % 98),
    w: 1.1 + (i % 4) * 0.35,
    h: 0.35 + (i % 3) * 0.2,
    delay: (i % 9) * 0.04,
  }))

  const pipes = [
    { x1: 42, y1: 25, x2: 34, y2: 42, color: '#41e6ff' },
    { x1: 58, y1: 25, x2: 66, y2: 42, color: '#41e6ff' },
    { x1: 43, y1: 44, x2: 38, y2: 68, color: '#f2c94c' },
    { x1: 57, y1: 44, x2: 62, y2: 68, color: '#f2c94c' },
    { x1: 29, y1: 36, x2: 20, y2: 58, color: '#e33847' },
    { x1: 71, y1: 36, x2: 80, y2: 58, color: '#e33847' },
    { x1: 40, y1: 68, x2: 36, y2: 92, color: '#e33847' },
    { x1: 60, y1: 68, x2: 64, y2: 92, color: '#e33847' },
  ]

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setScroll(docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0)
    }
    const onMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth
      const ny = e.clientY / window.innerHeight
      setMouse({ x: nx, y: ny })

      // 精确检测：使用容器实际位置计算部件中心
      const container = document.querySelector('[data-mecha-container]') as HTMLElement
      let nearest: string | null = null
      let best = Infinity
      if (container) {
        const rect = container.getBoundingClientRect()
        const mx = (e.clientX - rect.left) / rect.width
        const my = (e.clientY - rect.top) / rect.height
        for (const part of parts) {
          const px = part.x / 100
          const py = part.y / 140
          const dx = mx - px
          const dy = my - py
          // 根据部件大小加权：大部件更容易命中
          const sizeWeight = 0.4 + 0.6 * Math.min(1, (part.w * part.h) / 600)
          const d = Math.sqrt(dx * dx + dy * dy) / sizeWeight
          if (d < best) {
            best = d
            nearest = part.id
          }
        }
        // 阈值：相对于容器尺寸的命中半径
        if (best > 0.18) nearest = null
      }
      setHotPart(nearest)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  const scan = smoothstep(0, 0.14, scroll)
  const reveal = smoothstep(0.38, 0.72, scroll)
  const assemble = smoothstep(0.82, 1.0, scroll)
  const globalSplit = smoothstep(0.06, 0.72, scroll) * (1 - assemble)
  const combat = assemble
  const hot = parts.find(p => p.id === hotPart)

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem' }}>
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 45%, #18202b 0%, #070a10 42%, #020309 100%)',
          cursor: 'crosshair',
          zIndex: 1,
        }}
      >
        {/* 机库背景 */}
        <div className="absolute inset-0 opacity-35" style={{
          backgroundImage: 'linear-gradient(rgba(65,230,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(65,230,255,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          transform: `perspective(900px) rotateX(${58 - scroll * 12}deg) translateY(${scroll * 80}px)`,
          transformOrigin: '50% 100%',
        }} />
        <div className="absolute left-1/2 top-1/2 w-[84vmin] h-[84vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" style={{ boxShadow: `0 0 ${80 + scan * 80}px rgba(65,230,255,0.08)` }} />
        <div className="absolute inset-x-0 top-[48%] h-px bg-cyan-300/20" style={{ opacity: scan }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-300/20" style={{ opacity: scan }} />

        {/* 标题 */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ opacity: 1 - globalSplit * 0.45 }}>
          <h2 className="text-3xl font-black tracking-[0.22em] text-white/90">MECHA DISASSEMBLY</h2>
          <p className="mt-2 text-[10px] tracking-[0.35em] text-cyan-200/45">RX-NULL ORIGINAL FRAME / SCROLL TO DECONSTRUCT</p>
        </div>

        {/* 机甲主体坐标系 */}
        <div
          data-mecha-container
          className="absolute left-1/2 top-1/2"
          style={{
            width: 'min(78vw, 68vh)',
            aspectRatio: '100/140',
            transform: `translate(-50%, -50%) scale(${0.92 + combat * 0.06}) rotateX(${(mouse.y - 0.5) * 8}deg) rotateY(${(mouse.x - 0.5) * -10}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 内部骨架图片：最底层，拆解后展现真实内部结构 */}
          <img
            src={internalFrameImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              opacity: reveal * 0.92,
              filter: `contrast(1.1) saturate(1.15) brightness(${0.85 + reveal * 0.2}) drop-shadow(0 0 ${12 + reveal * 16}px rgba(65,230,255,0.25))`,
              objectFit: 'cover',
            }}
          />

          {/* 扫描线效果 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(65,230,255,0.16), transparent)',
              opacity: scan * (1 - globalSplit * 0.4),
              transform: `translateX(${(scroll * 220 - 110)}%)`,
              mixBlendMode: 'screen',
            }}
          />

          {/* 外部原图底层：初始展示，拆解时逐步淡出 */}
          <img
            src={mechaImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              opacity: 0.85 * (1 - globalSplit * 0.85) + combat * 0.2,
              filter: `contrast(1.08) saturate(1.08) drop-shadow(0 0 ${18 + scan * 18}px rgba(65,230,255,0.18))`,
              objectFit: 'cover',
              clipPath: 'polygon(3% 0, 97% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* 内部骨架 — 复杂机甲内构 */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 140" style={{ opacity: reveal * (1 - combat * 0.35) }}>
            {/* 液压管线 */}
            {pipes.map((p, i) => (
              <line key={`pipe-${i}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.color} strokeWidth="0.7" opacity="0.6" strokeDasharray="2 2" />
            ))}

            {/* ═══════ 头部内构 ═══════ */}
            {/* 颅骨框架 */}
            <path d="M42 8 L58 8 L62 16 L60 24 L50 26 L40 24 L38 16 Z" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.6" />
            {/* 光学传感器阵列 */}
            <circle cx="50" cy="14" r="4" fill="none" stroke="rgba(65,230,255,0.5)" strokeWidth="0.5" />
            <circle cx="50" cy="14" r="2.5" fill="rgba(65,230,255,0.2)" />
            <line x1="46" y1="14" x2="42" y2="12" stroke="rgba(65,230,255,0.4)" strokeWidth="0.4" />
            <line x1="54" y1="14" x2="58" y2="12" stroke="rgba(65,230,255,0.4)" strokeWidth="0.4" />
            {/* 天线/传感器杆 */}
            <line x1="45" y1="8" x2="43" y2="3" stroke="rgba(210,230,240,0.4)" strokeWidth="0.5" />
            <line x1="55" y1="8" x2="57" y2="3" stroke="rgba(210,230,240,0.4)" strokeWidth="0.5" />
            <circle cx="43" cy="3" r="1" fill="rgba(65,230,255,0.5)" />
            <circle cx="57" cy="3" r="1" fill="rgba(65,230,255,0.5)" />
            {/* 颈部连接 */}
            <path d="M46 24 L46 28 M54 24 L54 28" stroke="rgba(210,230,240,0.4)" strokeWidth="0.6" />
            <circle cx="50" cy="28" r="3" fill="none" stroke="rgba(65,230,255,0.35)" strokeWidth="0.5" />

            {/* ═══════ 脊柱主干 ═══════ */}
            <path d="M50 28 L50 64" fill="none" stroke="rgba(210,230,240,0.5)" strokeWidth="1.5" />
            {/* 脊椎节段 */}
            {[30, 34, 38, 42, 46, 50, 54, 58, 62].map((y, i) => (
              <g key={`spine-${i}`}>
                <line x1="48" y1={y} x2="52" y2={y} stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
                <circle cx="50" cy={y} r="1.2" fill="rgba(65,230,255,0.3)" />
              </g>
            ))}

            {/* ═══════ 胸部骨架 ═══════ */}
            {/* 主肋骨框架 */}
            <path d="M36 30 Q32 36 36 42 Q40 46 50 46 Q60 46 64 42 Q68 36 64 30" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
            <path d="M38 34 Q35 38 38 42 Q42 44 50 44 Q58 44 62 42 Q65 38 62 34" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.6" />
            {/* 肋骨横条 */}
            {[32, 36, 40, 44].map((y, i) => (
              <line key={`rib-${i}`} x1="38" y1={y} x2="62" y2={y} stroke="rgba(210,230,240,0.25)" strokeWidth="0.4" />
            ))}
            {/* 反应炉核心 — 多层 */}
            <circle cx="50" cy="33" r="7.5" fill="none" stroke="rgba(65,230,255,0.25)" strokeWidth="0.6" />
            <circle cx="50" cy="33" r="6" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.8" />
            <circle cx="50" cy="33" r="4.5" fill="none" stroke="rgba(65,230,255,0.55)" strokeWidth="1" />
            <circle cx="50" cy="33" r="3" fill="rgba(65,230,255,0.35)" stroke="rgba(65,230,255,0.8)" strokeWidth="0.6" />
            <circle cx="50" cy="33" r="1.5" fill="rgba(200,255,255,0.6)" />
            {/* 核心散热鳍片 */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = angle * Math.PI / 180
              const x1 = 50 + Math.cos(rad) * 3
              const y1 = 33 + Math.sin(rad) * 3
              const x2 = 50 + Math.cos(rad) * 6
              const y2 = 33 + Math.sin(rad) * 6
              return <line key={`fin-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(65,230,255,0.35)" strokeWidth="0.5" />
            })}

            {/* ═══════ 肩部关节 ═══════ */}
            {/* 左肩关节 */}
            <circle cx="30" cy="30" r="4" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
            <circle cx="30" cy="30" r="2.5" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.5" />
            <circle cx="30" cy="30" r="1.2" fill="rgba(65,230,255,0.35)" />
            {/* 右肩关节 */}
            <circle cx="70" cy="30" r="4" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
            <circle cx="70" cy="30" r="2.5" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.5" />
            <circle cx="70" cy="30" r="1.2" fill="rgba(65,230,255,0.35)" />
            {/* 肩甲连接杆 */}
            <line x1="34" y1="28" x2="38" y2="26" stroke="rgba(210,230,240,0.35)" strokeWidth="0.5" />
            <line x1="66" y1="28" x2="62" y2="26" stroke="rgba(210,230,240,0.35)" strokeWidth="0.5" />

            {/* ═══════ 手臂骨架 ═══════ */}
            {/* 左上臂骨 */}
            <path d="M26 34 L18 46 L16 58" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.9" />
            <path d="M28 36 L22 48 L20 56" fill="none" stroke="rgba(210,230,240,0.25)" strokeWidth="0.5" />
            {/* 左肘关节 */}
            <circle cx="16" cy="58" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
            <circle cx="16" cy="58" r="1.3" fill="rgba(65,230,255,0.3)" />
            {/* 左前臂 */}
            <path d="M16 58 L14 68 L12 76" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
            {/* 左手掌骨架 */}
            <path d="M12 76 L10 80 L8 82 M12 76 L12 82 M12 76 L14 80 L16 82" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.4" />
            {/* 左上臂液压杆 */}
            <line x1="24" y1="38" x2="20" y2="52" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            <line x1="22" y1="40" x2="18" y2="54" stroke="rgba(243,201,76,0.2)" strokeWidth="0.4" />

            {/* 右上臂骨 */}
            <path d="M74 34 L82 46 L84 58" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.9" />
            <path d="M72 36 L78 48 L80 56" fill="none" stroke="rgba(210,230,240,0.25)" strokeWidth="0.5" />
            {/* 右肘关节 */}
            <circle cx="84" cy="58" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
            <circle cx="84" cy="58" r="1.3" fill="rgba(65,230,255,0.3)" />
            {/* 右前臂 */}
            <path d="M84 58 L86 68 L88 76" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
            {/* 右手掌骨架 */}
            <path d="M88 76 L90 80 L92 82 M88 76 L88 82 M88 76 L86 80 L84 82" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.4" />
            {/* 右上臂液压杆 */}
            <line x1="76" y1="38" x2="80" y2="52" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            <line x1="78" y1="40" x2="82" y2="54" stroke="rgba(243,201,76,0.2)" strokeWidth="0.4" />

            {/* ═══════ 腹部内构 ═══════ */}
            {/* 腹部框架 */}
            <path d="M40 48 L38 56 L42 62 L50 64 L58 62 L62 56 L60 48" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.7" />
            {/* 液压管线束 */}
            <path d="M44 48 Q42 54 44 60" fill="none" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            <path d="M48 48 Q46 54 48 62" fill="none" stroke="rgba(243,201,76,0.25)" strokeWidth="0.4" />
            <path d="M52 48 Q54 54 52 62" fill="none" stroke="rgba(243,201,76,0.25)" strokeWidth="0.4" />
            <path d="M56 48 Q58 54 56 60" fill="none" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            {/* 能量导管 */}
            <line x1="46" y1="50" x2="46" y2="60" stroke="rgba(65,230,255,0.3)" strokeWidth="0.6" />
            <line x1="54" y1="50" x2="54" y2="60" stroke="rgba(65,230,255,0.3)" strokeWidth="0.6" />
            {/* 腹部分层节点 */}
            {[50, 54, 58].map((y, i) => (
              <circle key={`abd-node-${i}`} cx="50" cy={y} r="1" fill="rgba(65,230,255,0.35)" />
            ))}

            {/* ═══════ 背包推进系统 ═══════ */}
            {/* 背包框架 */}
            <path d="M30 22 L28 50 L32 54 L36 50 L38 22" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.6" />
            <path d="M70 22 L72 50 L68 54 L64 50 L62 22" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.6" />
            {/* 矢量喷口 */}
            <path d="M32 50 L30 56 L34 56 Z" fill="rgba(65,230,255,0.15)" stroke="rgba(65,230,255,0.4)" strokeWidth="0.5" />
            <path d="M68 50 L66 56 L70 56 Z" fill="rgba(65,230,255,0.15)" stroke="rgba(65,230,255,0.4)" strokeWidth="0.5" />
            {/* 燃料管线 */}
            <line x1="34" y1="44" x2="38" y2="40" stroke="rgba(243,201,76,0.25)" strokeWidth="0.4" />
            <line x1="66" y1="44" x2="62" y2="40" stroke="rgba(243,201,76,0.25)" strokeWidth="0.4" />

            {/* ═══════ 骨盆/髋部 ═══════ */}
            {/* 髋骨框架 */}
            <path d="M38 60 L36 66 L42 70 L50 72 L58 70 L64 66 L62 60" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
            {/* 裙甲支撑架 */}
            <line x1="42" y1="66" x2="42" y2="72" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            <line x1="50" y1="68" x2="50" y2="74" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            <line x1="58" y1="66" x2="58" y2="72" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            {/* 腿部连接器 */}
            <circle cx="42" cy="72" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.5" />
            <circle cx="58" cy="72" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.5" />
            <circle cx="42" cy="72" r="1.2" fill="rgba(65,230,255,0.3)" />
            <circle cx="58" cy="72" r="1.2" fill="rgba(65,230,255,0.3)" />

            {/* ═══════ 大腿骨架 ═══════ */}
            {/* 左大腿 */}
            <path d="M38 74 L34 82 L32 90" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="1" />
            <path d="M42 74 L40 82 L40 90" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            {/* 左膝关节 */}
            <circle cx="36" cy="90" r="3" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
            <circle cx="36" cy="90" r="1.5" fill="rgba(65,230,255,0.3)" />
            {/* 左大腿液压杆 */}
            <line x1="38" y1="76" x2="36" y2="86" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            {/* 左大腿装甲内衬 */}
            <path d="M32 78 L30 84 L32 88" fill="none" stroke="rgba(210,230,240,0.25)" strokeWidth="0.4" />

            {/* 右大腿 */}
            <path d="M62 74 L66 82 L68 90" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="1" />
            <path d="M58 74 L60 82 L60 90" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            {/* 右膝关节 */}
            <circle cx="64" cy="90" r="3" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
            <circle cx="64" cy="90" r="1.5" fill="rgba(65,230,255,0.3)" />
            {/* 右大腿液压杆 */}
            <line x1="62" y1="76" x2="64" y2="86" stroke="rgba(243,201,76,0.3)" strokeWidth="0.5" />
            {/* 右大腿装甲内衬 */}
            <path d="M68 78 L70 84 L68 88" fill="none" stroke="rgba(210,230,240,0.25)" strokeWidth="0.4" />

            {/* ═══════ 小腿骨架 ═══════ */}
            {/* 左小腿 */}
            <path d="M36 92 L34 100 L34 108" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="0.9" />
            <path d="M38 92 L38 100 L38 108" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            {/* 左踝关节 */}
            <circle cx="36" cy="108" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
            <circle cx="36" cy="108" r="1.2" fill="rgba(65,230,255,0.3)" />
            {/* 左小腿推进器内部 */}
            <path d="M32 96 L30 104 L32 106" fill="none" stroke="rgba(65,230,255,0.25)" strokeWidth="0.4" />
            <circle cx="33" cy="100" r="1.5" fill="rgba(65,230,255,0.15)" stroke="rgba(65,230,255,0.35)" strokeWidth="0.4" />

            {/* 右小腿 */}
            <path d="M64 92 L66 100 L66 108" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="0.9" />
            <path d="M62 92 L62 100 L62 108" fill="none" stroke="rgba(210,230,240,0.3)" strokeWidth="0.5" />
            {/* 右踝关节 */}
            <circle cx="64" cy="108" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
            <circle cx="64" cy="108" r="1.2" fill="rgba(65,230,255,0.3)" />
            {/* 右小腿推进器内部 */}
            <path d="M68 96 L70 104 L68 106" fill="none" stroke="rgba(65,230,255,0.25)" strokeWidth="0.4" />
            <circle cx="67" cy="100" r="1.5" fill="rgba(65,230,255,0.15)" stroke="rgba(65,230,255,0.35)" strokeWidth="0.4" />

            {/* ═══════ 脚部骨架 ═══════ */}
            {/* 左脚 */}
            <path d="M34 110 L32 114 L30 116 L34 118 L38 116 L38 112" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
            {/* 左足底稳定器 */}
            <line x1="30" y1="116" x2="28" y2="118" stroke="rgba(243,201,76,0.3)" strokeWidth="0.4" />
            <line x1="34" y1="118" x2="34" y2="120" stroke="rgba(243,201,76,0.3)" strokeWidth="0.4" />
            {/* 左脚抓地爪 */}
            <path d="M30 118 L28 120 M34 120 L32 122 M38 118 L36 120" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.4" />

            {/* 右脚 */}
            <path d="M66 110 L68 114 L70 116 L66 118 L62 116 L62 112" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
            {/* 右足底稳定器 */}
            <line x1="70" y1="116" x2="72" y2="118" stroke="rgba(243,201,76,0.3)" strokeWidth="0.4" />
            <line x1="66" y1="118" x2="66" y2="120" stroke="rgba(243,201,76,0.3)" strokeWidth="0.4" />
            {/* 右脚抓地爪 */}
            <path d="M70 118 L72 120 M66 120 L68 122 M62 118 L64 120" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.4" />

            {/* ═══════ 电路纹理装饰 — 全身网格 ═══════ */}
            {/* 胸部电路 */}
            <path d="M44 32 L46 36 L44 40 M56 32 L54 36 L56 40" fill="none" stroke="rgba(65,230,255,0.15)" strokeWidth="0.3" />
            {/* 腹部电路 */}
            <path d="M44 52 L48 56 L52 54 L56 56" fill="none" stroke="rgba(65,230,255,0.15)" strokeWidth="0.3" />
            {/* 大腿电路 */}
            <path d="M36 78 L38 82 L36 86 M64 78 L62 82 L64 86" fill="none" stroke="rgba(65,230,255,0.12)" strokeWidth="0.3" />
            {/* 小腿电路 */}
            <path d="M36 96 L34 100 L36 104 M64 96 L66 100 L64 104" fill="none" stroke="rgba(65,230,255,0.12)" strokeWidth="0.3" />
          </svg>

          {/* 机甲零件 */}
          {parts.map((part) => {
            const isHot = hotPart === part.id
            const partSplit = smoothstep(part.phase, part.phase + 0.13, scroll) * (1 - assemble)
            const tx = part.dx * partSplit + (combat ? (part.id.includes('L') ? -2 : part.id.includes('R') ? 2 : 0) : 0)
            const ty = part.dy * partSplit + (combat ? (part.id.includes('leg') ? 2 : 0) : 0)
            const rotate = part.rot * partSplit + (combat * (part.id.includes('armL') ? -7 : part.id.includes('armR') ? 7 : 0))
            const imageLeft = -((part.x - part.w / 2) / part.w) * 100
            const imageTop = -((part.y - part.h / 2) / part.h) * 100
            const imageWidth = (100 / part.w) * 100
            const imageHeight = (140 / part.h) * 100
            return (
              <div
                key={part.id}
                className="absolute"
                style={{
                  left: `${part.x}%`,
                  top: `${(part.y / 140) * 100}%`,
                  width: `${part.w}%`,
                  height: `${(part.h / 140) * 100}%`,
                  zIndex: part.z,
                  transform: `translate(-50%, -50%) translate(${tx * 0.46}vmin, ${ty * 0.46}vmin) rotate(${rotate}deg) translateZ(${part.z * 5}px)`,
                  transition: 'filter 0.18s ease',
                  filter: isHot ? `drop-shadow(0 0 18px ${part.accent}) brightness(1.22)` : `drop-shadow(0 0 ${4 + scan * 5}px ${part.accent}24)`,
                  opacity: 0.92 + partSplit * 0.08,
                }}
              >
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: part.clip,
                    border: `1px solid ${part.accent}${isHot ? 'aa' : '44'}`,
                    boxShadow: `inset 0 0 22px rgba(255,255,255,0.10), inset 0 -18px 26px rgba(0,0,0,0.42)`,
                    background: '#111821',
                  }}
                >
                  <img
                    src={mechaImage}
                    alt=""
                    className="absolute max-w-none object-cover"
                    style={{
                      left: `${imageLeft}%`,
                      top: `${imageTop}%`,
                      width: `${imageWidth}%`,
                      height: `${imageHeight}%`,
                      filter: 'contrast(1.08) saturate(1.12)',
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, ${part.accent}1a 48%, rgba(0,0,0,0.38) 100%)`,
                      mixBlendMode: 'screen',
                      opacity: scan * 0.8 + (isHot ? 0.35 : 0),
                    }}
                  />
                </div>
                <div className="absolute left-[16%] top-[18%] w-[68%] h-[5%] rounded-full" style={{ background: part.accent, opacity: 0.18 + scan * 0.18 }} />
              </div>
            )
          })}

          {/* 细节层：铆钉、装甲刻线、小面板 */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 + scan * 0.22 }}>
            {armorDetails.map((d) => (
              <div
                key={d.id}
                className="absolute rounded-full bg-cyan-200/45"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.w}%`,
                  height: `${d.h}%`,
                  opacity: Math.max(0.08, scan - d.delay),
                  transform: `translate(-50%, -50%) rotate(${(d.id * 37) % 180}deg) translate(${globalSplit * ((d.id % 5) - 2) * 2}px, ${globalSplit * ((d.id % 7) - 3) * 2}px)`,
                }}
              />
            ))}
          </div>

          {/* 推进器火焰 */}
          <div className="absolute left-[34%] top-[54%] w-[5%] h-[26%] rounded-full blur-md" style={{ background: 'linear-gradient(#41e6ff00, #41e6ff66, #f2c94c00)', opacity: (globalSplit + combat) * 0.55 }} />
          <div className="absolute left-[61%] top-[54%] w-[5%] h-[26%] rounded-full blur-md" style={{ background: 'linear-gradient(#41e6ff00, #41e6ff66, #f2c94c00)', opacity: (globalSplit + combat) * 0.55 }} />
        </div>

        {/* HUD 标注 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: scan }}>
          {parts.filter((_, i) => i % 3 === 0).map((p, i) => {
            const side = p.x < 50 ? 'left' : 'right'
            const x1 = `${p.x}%`
            const y1 = `${(p.y / 140) * 100}%`
            const x2 = side === 'left' ? `${2 + i % 3 * 1.5}%` : `${98 - i % 3 * 1.5}%`
            return (
              <g key={p.id} opacity={0.22 + reveal * 0.45}>
                <line x1={x1} y1={y1} x2={x2} y2={y1} stroke="rgba(65,230,255,0.55)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx={x1} cy={y1} r="3" fill="none" stroke="rgba(65,230,255,0.7)" />
              </g>
            )
          })}
        </svg>
        <div className="absolute inset-0 pointer-events-none font-mono">
          {parts.map((p, i) => {
            const sideLeft = p.x < 50
            const top = Math.max(8, Math.min(88, 6 + (p.y / 140) * 86))
            const isHot = hotPart === p.id
            const show = Math.min(1, scan * 0.6 + reveal * 0.55 + (isHot ? 0.6 : 0))
            return (
              <div
                key={`label-${p.id}`}
                className="absolute w-40 border bg-black/35 p-1.5 backdrop-blur-md"
                style={{
                  left: sideLeft ? `${1 + (i % 2) * 1.5}%` : 'auto',
                  right: sideLeft ? 'auto' : `${1 + (i % 2) * 1.5}%`,
                  top: `${top}%`,
                  borderColor: isHot ? `${p.accent}aa` : 'rgba(65,230,255,0.18)',
                  opacity: show,
                  transform: `translateY(${(1 - show) * 12}px)`,
                  boxShadow: isHot ? `0 0 22px ${p.accent}33` : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-[0.18em]" style={{ color: p.accent }}>{p.label}</span>
                  <span className="text-[9px] text-white/30">#{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mt-1 text-[9px] leading-relaxed text-white/45">{p.desc}</div>
              </div>
            )
          })}
        </div>
        <div className="absolute left-3 top-[14%] space-y-1.5 font-mono text-[9px] tracking-wider text-cyan-100/55 pointer-events-none" style={{ opacity: scan }}>
          <div>FRAME: RX-NULL / ORIGINAL INDUSTRIAL MECHA</div>
          <div>IMAGE SOURCE: ORIGINAL GENERATED HIGH-DETAIL MECHA</div>
          <div>ARMOR PARTS: {parts.length} IMAGE SLICES / 88 DETAIL NODES</div>
          <div>DECONSTRUCT: {(globalSplit * 100).toFixed(0)}%</div>
          <div>INNER FRAME: {(reveal * 100).toFixed(0)}%</div>
        </div>
        <div className="absolute right-3 top-[14%] w-48 font-mono text-[9px] tracking-wider text-cyan-100/55 pointer-events-none" style={{ opacity: hot ? 1 : scan * 0.55 }}>
          <div className="border border-cyan-300/20 bg-black/25 p-2 backdrop-blur-md">
            <div className="text-cyan-200/90">ACTIVE COMPONENT</div>
            <div className="mt-1.5 text-white/75">{hot?.label || '移动鼠标扫描部件'}</div>
            <div className="mt-0.5 text-white/35">{hot?.desc || '滚动时原图零件会按结构分离，露出内部骨架。'}</div>
            <div className="mt-1.5 h-1 bg-cyan-300/10"><div className="h-full bg-cyan-300/60" style={{ width: `${45 + scan * 45}%` }} /></div>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] text-white/28 pointer-events-none">
          SCROLL: ASSEMBLE / SCAN / DISASSEMBLE / INNER FRAME / COMBAT READY
        </div>
      </div>
      <div style={{ height: '600vh' }} />
    </div>
  )
}

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
  { id: 'orbital', label: 'Orbital Modules', desc: 'CSS 3D satellite', icon: '◎' },
  { id: 'mecha', label: 'Mecha Breakdown', desc: 'Mechanical disassembly', icon: '⚙' },
  { id: 'planets', label: 'Three Planets', desc: '3D planet carousel', icon: '◐' },
  { id: 'orbits', label: 'Orbital Orbits', desc: 'Satellite orbit viz', icon: '⊕' },
  { id: 'keyboard', label: 'Keyboard Config', desc: '3D keyboard configurator', icon: '⌨' },
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
            className="absolute bottom-full left-0 mb-2 flex flex-col gap-1 p-1.5 rounded-xl bg-black/70 backdrop-blur-xl border border-cyan-300/20"
            style={{
              boxShadow: '0 0 24px rgba(65,230,255,0.15), 0 -4px 16px rgba(65,230,255,0.08)',
            }}
          >
            {SHOWCASES.map(sc => (
              <button
                key={sc.id}
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
            ))}
          </div>
        )}
      </div>

      {/* Active showcase */}
      <div className={`transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {activeId === 'nebula' && <NebulaCore />}
        {activeId === 'orbital' && <OrbitalModules />}
        {activeId === 'mecha' && <MechaDisassembly />}
        {activeId === 'planets' && <ThreePlanets />}
        {activeId === 'orbits' && <OrbitalViz />}
        {activeId === 'keyboard' && <KeyboardConfigShowcase />}
      </div>
    </div>
  )
}
