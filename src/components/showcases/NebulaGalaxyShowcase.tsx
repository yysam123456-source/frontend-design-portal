import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════════
   NEBULA CORE — FOUR-ARM GALAXY
   35,200 GPU particles · drag to tilt · pinch to zoom · tap pulse
   保留原 SHOWCASE 的滚动叙事：从致密星核展开成可探索的旋臂。
   ═══════════════════════════════════════════════════════════════ */

const PALETTES = {
  'VIOLET GOLD': {
    core: '#ffd9a0',
    arm: '#c4b5fd',
    edge: '#7dd3fc',
    fog: '#8b5cf6',
  },
  AURORA: {
    core: '#d1fae5',
    arm: '#5eead4',
    edge: '#60a5fa',
    fog: '#2dd4bf',
  },
  EMBER: {
    core: '#ffe4b5',
    arm: '#fb923c',
    edge: '#f43f5e',
    fog: '#f97316',
  },
} as const

type PaletteName = keyof typeof PALETTES
const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[]

const ARM_COUNT = 4
const ARM_PARTICLES = 26000
const CORE_PARTICLES = 4800
const DUST_PARTICLES = 4400
const TOTAL_PARTICLES = ARM_PARTICLES + CORE_PARTICLES + DUST_PARTICLES
const BACKGROUND_STARS = 780

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

const VERTEX = `
attribute float aSize;
attribute float aMix;
attribute float aOpacity;
attribute float aSeed;

uniform float uTime;
uniform float uFormation;
uniform float uPulse;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOpacity;
uniform vec3 uCore;
uniform vec3 uArm;
uniform vec3 uEdge;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float radius = length(position.xy);
  float spin = uTime * (0.022 + 0.15 / (radius + 0.45));
  float c = cos(spin);
  float s = sin(spin);
  vec3 pos = vec3(
    position.x * c - position.y * s,
    position.x * s + position.y * c,
    position.z
  );

  // 0 → 1：从中心致密核展开成四旋臂盘
  float form = clamp(uFormation, 0.0, 1.0);
  vec3 compact = vec3(position.x * 0.12, position.y * 0.12, position.z * 0.25);
  pos = mix(compact, pos, form);

  // 点击后从星核向外扩散的光波
  float wave = 0.0;
  if (uPulse >= 0.0) {
    float front = uPulse * 3.3;
    wave = exp(-pow((radius - front) * 2.3, 2.0)) * exp(-uPulse * 0.23);
  }
  pos.xy *= 1.0 + wave * 0.075;
  pos.z += wave * 0.48;

  float mixCore = smoothstep(0.0, 0.30, aMix);
  vec3 col = mix(uCore, uArm, mixCore);
  col = mix(col, uEdge, smoothstep(0.55, 1.0, aMix));
  // 未展开时偏暖白，展开后回到预置色谱
  col = mix(vec3(1.0, 0.85, 0.68), col, smoothstep(0.10, 0.95, form));

  vColor = col;
  vAlpha = aOpacity * (0.55 + 0.45 * form) * (0.80 + aSeed * 0.40) * (1.0 + wave * 0.70);

  gl_PointSize = aSize * uSize * uPixelRatio * (1.0 + wave * 0.40);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const FRAGMENT = `
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p) * 2.0;
  float core = 1.0 - smoothstep(0.06, 0.28, r);
  float halo = exp(-r * r * 5.0);
  float alpha = (core * 0.70 + halo * 0.30) * vAlpha * uOpacity;
  gl_FragColor = vec4(vColor * (0.85 + core * 0.60), alpha);
}
`

const FOG_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FOG_FRAGMENT = `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uArm;
uniform vec3 uEdge;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float angle = atan(p.y, p.x) - r * 5.4 - uTime * 0.025;
  float arms = pow(0.5 + 0.5 * cos(angle * 4.0), 5.0);
  float haze = exp(-r * r * 5.0) * (0.12 + arms * 0.55);
  vec3 col = mix(uArm, uEdge, clamp(r, 0.0, 1.0));
  gl_FragColor = vec4(col, haze * 0.45);
}
`

const RING_FRAGMENT = `
varying vec2 vUv;
uniform float uPulse;
uniform vec3 uColor;

void main() {
  float r = length(vUv * 2.0 - 1.0);
  float front = uPulse * 0.78;
  float ring = exp(-pow((r - front) * 10.0, 2.0)) * exp(-uPulse * 0.23);
  gl_FragColor = vec4(uColor, ring * 0.40);
}
`

function buildGalaxyGeometry() {
  const positions = new Float32Array(TOTAL_PARTICLES * 3)
  const sizes = new Float32Array(TOTAL_PARTICLES)
  const mixes = new Float32Array(TOTAL_PARTICLES)
  const opacities = new Float32Array(TOTAL_PARTICLES)
  const seeds = new Float32Array(TOTAL_PARTICLES)
  let i = 0

  const push = (x: number, y: number, z: number, size: number, mix: number, opacity: number, seed: number) => {
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    sizes[i] = size
    mixes[i] = mix
    opacities[i] = opacity
    seeds[i] = seed
    i += 1
  }

  // 四条旋臂：极坐标半径 + 随半径增大的角偏移，再叠加散布噪声
  for (let n = 0; n < ARM_PARTICLES; n++) {
    const arm = n % ARM_COUNT
    const radius = Math.pow(Math.random(), 0.78) * 5.15
    const spread = (Math.random() - 0.5) * (0.28 + radius * 0.16)
    const angle = arm * Math.PI / 2 + radius * 1.12 + spread
    const z = (Math.random() - 0.5) * (0.04 + radius * 0.02)
    push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      z,
      0.85 + Math.random() * 1.45,
      radius / 5.15,
      0.70 + Math.random() * 0.25,
      Math.random(),
    )
  }

  // 星核：pow(rand, 1.7) 让更多点落在中心
  for (let n = 0; n < CORE_PARTICLES; n++) {
    const radius = Math.pow(Math.random(), 1.7) * 1.55
    const angle = Math.random() * Math.PI * 2
    push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (Math.random() - 0.5) * 0.28,
      1.10 + Math.random() * 1.55,
      radius / 5.15,
      0.82 + Math.random() * 0.18,
      Math.random(),
    )
  }

  // 弥散星尘：更淡更大，揉开旋臂硬边
  for (let n = 0; n < DUST_PARTICLES; n++) {
    const radius = Math.pow(Math.random(), 0.62) * 5.70
    const angle = Math.random() * Math.PI * 2
    push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (Math.random() - 0.5) * (0.25 + radius * 0.04),
      1.60 + Math.random() * 2.20,
      radius / 5.15,
      0.12 + Math.random() * 0.18,
      Math.random(),
    )
  }

  return { positions, sizes, mixes, opacities, seeds }
}

export default function NebulaGalaxyShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const finalRef = useRef<HTMLDivElement>(null)
  const [palette, setPalette] = useState<PaletteName>('VIOLET GOLD')
  const paletteRef = useRef<PaletteName>(palette)
  const targetColorsRef = useRef({
    core: new THREE.Color(PALETTES['VIOLET GOLD'].core),
    arm: new THREE.Color(PALETTES['VIOLET GOLD'].arm),
    edge: new THREE.Color(PALETTES['VIOLET GOLD'].edge),
  })
  const controlsRef = useRef({
    zoomIn: () => {},
    zoomOut: () => {},
    reset: () => {},
  })

  useEffect(() => {
    paletteRef.current = palette
    const next = PALETTES[palette]
    targetColorsRef.current.core.set(next.core)
    targetColorsRef.current.arm.set(next.arm)
    targetColorsRef.current.edge.set(next.edge)
  }, [palette])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch {
      // WebGL 不可用时保留标题层，不让异常冒泡到 React 导致整页白屏
      canvas.style.display = 'none'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x03030a, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0.7, 10.5)
    camera.lookAt(0, 0, 0)

    const galaxy = new THREE.Group()
    galaxy.rotation.x = -0.42
    galaxy.rotation.y = 0.25
    scene.add(galaxy)

    const { positions, sizes, mixes, opacities, seeds } = buildGalaxyGeometry()
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1))
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const uniforms: any = {
      uTime: { value: 0 },
      uFormation: { value: 0.55 },
      uPulse: { value: -1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSize: { value: 1.55 },
      uOpacity: { value: 0.92 },
      uCore: { value: new THREE.Color(PALETTES['VIOLET GOLD'].core) },
      uArm: { value: new THREE.Color(PALETTES['VIOLET GOLD'].arm) },
      uEdge: { value: new THREE.Color(PALETTES['VIOLET GOLD'].edge) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    galaxy.add(points)

    const fogGeometry = new THREE.PlaneGeometry(13, 13)
    const fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: uniforms.uTime,
        uCore: uniforms.uCore,
        uArm: uniforms.uArm,
        uEdge: uniforms.uEdge,
      },
      vertexShader: FOG_VERTEX,
      fragmentShader: FOG_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const fog = new THREE.Mesh(fogGeometry, fogMaterial)
    fog.position.z = -0.75
    fog.renderOrder = -1
    galaxy.add(fog)

    const ringGeometry = new THREE.PlaneGeometry(12, 12)
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPulse: uniforms.uPulse,
        uColor: uniforms.uEdge,
      },
      vertexShader: FOG_VERTEX,
      fragmentShader: RING_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.z = -0.35
    ring.renderOrder = 1
    galaxy.add(ring)

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(BACKGROUND_STARS * 3)
    for (let i = 0; i < BACKGROUND_STARS; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 18
      starPositions[i * 3 + 2] = -4 - Math.random() * 14
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMaterial = new THREE.PointsMaterial({
      color: 0x9fb4ff,
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const backgroundStars = new THREE.Points(starGeometry, starMaterial)
    scene.add(backgroundStars)

    let width = 0
    let height = 0
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      uniforms.uPixelRatio.value = dpr
      uniforms.uSize.value = clamp(height / 900 * 1.55, 1.15, 1.95)
    }
    resize()
    window.addEventListener('resize', resize)

    const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointers = new Map<number, { x: number; y: number }>()
    let targetTiltX = -0.42
    let targetTiltY = 0.25
    let targetDistance = 10.5
    let dragging = false
    let moved = 0
    let downAt = 0
    let lastX = 0
    let lastY = 0
    let pinchDistance = 0
    let pulseStart = 0
    let pulseActive = false

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      canvas.setPointerCapture(event.pointerId)
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size === 1) {
        dragging = true
        moved = 0
        downAt = performance.now()
        lastX = event.clientX
        lastY = event.clientY
        canvas.style.cursor = 'grabbing'
      } else if (pointers.size === 2) {
        dragging = false
        const [a, b] = Array.from(pointers.values())
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const pointer = pointers.get(event.pointerId)
      if (!pointer) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      if (pointers.size === 1 && dragging) {
        const dx = event.clientX - lastX
        const dy = event.clientY - lastY
        moved += Math.abs(dx) + Math.abs(dy)
        targetTiltY = clamp(targetTiltY + dx * 0.005, -1.25, 1.25)
        targetTiltX = clamp(targetTiltX + dy * 0.005, -1.15, 1.15)
        lastX = event.clientX
        lastY = event.clientY
      } else if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values())
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        targetDistance = clamp(targetDistance - (distance - pinchDistance) * 0.02, 7.5, 20)
        pinchDistance = distance
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      const wasSingle = pointers.size === 1
      pointers.delete(event.pointerId)
      if (wasSingle && moved < 8 && performance.now() - downAt < 650) {
        pulseStart = performance.now()
        pulseActive = true
      }
      if (pointers.size === 0) {
        dragging = false
        canvas.style.cursor = 'grab'
      }
    }

    const onWheel = (event: WheelEvent) => {
      // 普通滚轮交给页面形成星系；Ctrl/触控板捏合才缩放，避免劫持滚动
      if (!event.ctrlKey) return
      event.preventDefault()
      targetDistance = clamp(targetDistance + event.deltaY * 0.02, 7.5, 20)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    controlsRef.current.zoomIn = () => { targetDistance = clamp(targetDistance - 1.2, 7.5, 20) }
    controlsRef.current.zoomOut = () => { targetDistance = clamp(targetDistance + 1.2, 7.5, 20) }
    controlsRef.current.reset = () => {
      targetTiltX = -0.42
      targetTiltY = 0.25
      targetDistance = 10.5
    }

    let raf = 0
    let last = performance.now()
    let time = 0

    const readScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      return docHeight > 0 ? clamp(window.scrollY / docHeight, 0, 1) : 0
    }

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      time += dt * (motionOK ? 1 : 0)
      uniforms.uTime.value = time

      const scroll = readScroll()
      const formation = 0.55 + 0.45 * smoothstep(0, 0.22, scroll)
      uniforms.uFormation.value += (formation - uniforms.uFormation.value) * 0.06

      const follow = Math.min(1, dt * 5.8)
      galaxy.rotation.x += (targetTiltX - galaxy.rotation.x) * follow
      galaxy.rotation.y += (targetTiltY - galaxy.rotation.y) * follow
      camera.position.z += (targetDistance - camera.position.z) * follow

      uniforms.uCore.value.lerp(targetColorsRef.current.core, follow)
      uniforms.uArm.value.lerp(targetColorsRef.current.arm, follow)
      uniforms.uEdge.value.lerp(targetColorsRef.current.edge, follow)

      if (pulseActive) {
        const age = (now - pulseStart) / 1000
        uniforms.uPulse.value = age
        if (age > 2.8) {
          pulseActive = false
          uniforms.uPulse.value = -1
        }
      } else {
        uniforms.uPulse.value = -1
      }

      backgroundStars.rotation.y += dt * 0.002
      if (introRef.current) {
        introRef.current.style.opacity = String(1 - smoothstep(0.04, 0.25, scroll))
      }
      if (finalRef.current) {
        finalRef.current.style.opacity = String(smoothstep(0.72, 0.95, scroll))
      }

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      geometry.dispose()
      material.dispose()
      fogGeometry.dispose()
      fogMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full" style={{ background: '#03030a' }}>
      <canvas
        ref={canvasRef}
        aria-label="Interactive four-arm galaxy: drag to tilt, tap to send a light pulse"
        className="fixed inset-0 w-full h-full"
        style={{ background: '#03030a', cursor: 'grab', zIndex: 1, touchAction: 'pan-y' }}
      />

      <div
        ref={introRef}
        className="fixed inset-x-0 top-0 z-[90] pointer-events-none flex flex-col items-center pt-[9vh] text-center px-4"
      >
        <div className="text-[9px] font-mono tracking-[0.42em] text-amber-100/55">
          THREE.JS · 35,200 STARS · FOUR-ARM SPIRAL
        </div>
        <div className="mt-3 text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[0.16em] text-white drop-shadow-[0_0_32px_rgba(196,181,253,0.35)]">
          NEBULA CORE
        </div>
        <div className="mt-3 text-[10px] font-mono tracking-[0.20em] text-white/45">
          SCROLL TO FORGE · DRAG TO TILT · TAP TO PULSE
        </div>
      </div>

      <div
        ref={finalRef}
        className="fixed inset-x-0 bottom-[22vh] z-[90] pointer-events-none text-center px-4 opacity-0"
      >
        <div className="text-[9px] font-mono tracking-[0.34em] text-cyan-100/45">YOU ARE AT THE EDGE</div>
        <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[0.16em] text-white/85">
          FRONTEND DESIGN PORTAL
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-[120] pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/50 p-1 backdrop-blur-xl">
          <span className="px-1 text-[8px] font-mono tracking-[0.18em] text-white/30">PALETTE</span>
          {PALETTE_NAMES.map(name => (
            <button
              key={name}
              onClick={() => setPalette(name)}
              className={`rounded px-2 py-1 text-[9px] font-mono tracking-[0.12em] transition-colors ${
                palette === name
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/75 hover:bg-white/8'
              }`}
              aria-pressed={palette === name}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
          <span className="px-1 text-[8px] font-mono tracking-[0.18em] text-white/30">ZOOM</span>
          <button
            onClick={() => controlsRef.current.zoomIn()}
            className="rounded px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => controlsRef.current.zoomOut()}
            className="rounded px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/10"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => controlsRef.current.reset()}
            className="rounded px-2 py-1 text-[9px] font-mono tracking-[0.12em] text-white/40 hover:text-white hover:bg-white/10"
          >
            RESET
          </button>
        </div>
      </div>

      <div style={{ height: '600vh' }} />
    </div>
  )
}
