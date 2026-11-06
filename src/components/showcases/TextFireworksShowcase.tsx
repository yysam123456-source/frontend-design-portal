import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════════
   TEXT FIREWORKS
   Canvas 采样文字 → 四组粒子升空 → 橘/金/蓝/紫绽放 → 回落成原字
   单条时间线驱动全部粒子，主层 + 0.105s 拖尾层
   ═══════════════════════════════════════════════════════════════ */

const TIMELINE_END = 5.6
const MAX_CHARS = 12
const DEFAULT_TEXT = 'GOOD THINGS'

const VERTEX = `
attribute vec3 aCenter;
attribute vec2 aBurst;
attribute float aDelay;
attribute vec3 aColor;
attribute float aSize;

uniform float uPhase;
uniform float uTrail;
uniform float uPixelRatio;
uniform float uSize;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float phase = uPhase - uTrail;
  float local = phase - aDelay;

  // 1. 从字形升向各自爆点
  float lift = smoothstep(0.0, 0.86, local);
  vec3 pos = mix(position, aCenter, lift);

  // 2. 爆开并下坠
  float burstTime = max(local - 0.86, 0.0);
  float spread = 1.0 - exp(-burstTime * 2.7);
  pos.xy += aBurst * spread;
  pos.y -= burstTime * burstTime * 0.18;

  // 3. 回到原来的笔画
  float returnProgress = smoothstep(4.25, 5.45, phase);
  pos = mix(pos, position, returnProgress);

  float colorMix = smoothstep(0.15, 1.0, local) * (1.0 - returnProgress);
  vColor = mix(vec3(1.0, 0.83, 0.68), aColor, colorMix);
  vAlpha = 1.0;

  gl_PointSize = aSize * uSize * uPixelRatio * (1.0 + burstTime * 0.35);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const FRAGMENT = `
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float radius = length(p);
  float core = 1.0 - smoothstep(0.04, 0.24, radius);
  float glow = exp(-radius * radius * 15.0) * 0.38;
  float alpha = (core * 0.72 + glow) * vAlpha * uOpacity;
  gl_FragColor = vec4(vColor * (0.85 + core * 0.6), alpha);
}
`

const COLORS: [number, number, number][] = [
  [1.0, 0.42, 0.16], // orange
  [1.0, 0.78, 0.25], // gold
  [0.30, 0.72, 1.0], // blue
  [0.72, 0.42, 1.0], // purple
]

const CENTERS: [number, number][] = [
  [-1.5, 0.72],
  [-0.5, 0.95],
  [0.5, 0.95],
  [1.5, 0.72],
]

interface SampledText {
  positions: Float32Array
  centers: Float32Array
  bursts: Float32Array
  delays: Float32Array
  colors: Float32Array
  sizes: Float32Array
  count: number
}

function buildTextGeometry(text: string, fireworkScale: number): SampledText {
  const canvas = document.createElement('canvas')
  canvas.width = 1400
  canvas.height = 380
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D unavailable')

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'

  const narrow = window.innerWidth < 640
  const lines: string[] = []
  if (narrow && text.length > 6) {
    const mid = Math.ceil(text.length / 2)
    const space = text.lastIndexOf(' ', mid)
    if (space > 0 && space < text.length - 1) {
      lines.push(text.slice(0, space), text.slice(space + 1))
    } else {
      lines.push(text.slice(0, mid), text.slice(mid))
    }
  } else {
    lines.push(text)
  }

  let fontSize = lines.length > 1 ? 132 : 164
  ctx.font = `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif`
  const measured = Math.max(...lines.map(line => ctx.measureText(line).width))
  if (measured > 1300) {
    fontSize = Math.max(56, Math.floor(fontSize * (1300 / measured)))
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif`
  }

  const lineHeight = fontSize * 0.94
  lines.forEach((line, i) => {
    const y = canvas.height / 2 + (i - (lines.length - 1) / 2) * lineHeight
    ctx.fillText(line, canvas.width / 2, y)
  })

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const step = 3
  const rawX: number[] = []
  const rawY: number[] = []
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const alpha = pixels[(y * canvas.width + x) * 4 + 3]
      if (alpha < 110) continue
      rawX.push((x - canvas.width / 2) * 0.007)
      rawY.push((canvas.height / 2 - y) * 0.007)
    }
  }

  if (!rawX.length) {
    return buildTextGeometry('HI', fireworkScale)
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < rawX.length; i++) {
    minX = Math.min(minX, rawX[i]); maxX = Math.max(maxX, rawX[i])
    minY = Math.min(minY, rawY[i]); maxY = Math.max(maxY, rawY[i])
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const targetWidth = 3.0
  const scale = targetWidth / Math.max(0.001, maxX - minX)

  const count = rawX.length
  const positions = new Float32Array(count * 3)
  const centers = new Float32Array(count * 3)
  const bursts = new Float32Array(count * 2)
  const delays = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const x = (rawX[i] - cx) * scale
    const y = (rawY[i] - cy) * scale + 0.02
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.015

    const group = Math.min(3, Math.floor(((rawX[i] - minX) / Math.max(0.001, maxX - minX)) * 4))
    centers[i * 3] = (CENTERS[group][0] + (Math.random() - 0.5) * 0.05) * fireworkScale
    centers[i * 3 + 1] = (CENTERS[group][1] + (Math.random() - 0.5) * 0.05) * fireworkScale
    centers[i * 3 + 2] = 0

    const angle = Math.random() * Math.PI * 2
    const shell = (Math.random() < 0.77 ? 0.62 + Math.random() * 0.16 : 0.28 + Math.random() * 0.24) * fireworkScale
    bursts[i * 2] = Math.cos(angle) * shell
    bursts[i * 2 + 1] = Math.sin(angle) * shell

    delays[i] = group * 0.22 + Math.random() * 0.2
    const jitter = 0.88 + Math.random() * 0.18
    colors[i * 3] = COLORS[group][0] * jitter
    colors[i * 3 + 1] = COLORS[group][1] * jitter
    colors[i * 3 + 2] = COLORS[group][2] * jitter

    sizes[i] = 0.75 + Math.random() * 0.75
  }

  return { positions, centers, bursts, delays, colors, sizes, count }
}

export default function TextFireworksShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const materialsRef = useRef<THREE.ShaderMaterial[]>([])
  const pointsRef = useRef<THREE.Points[]>([])
  const phaseRef = useRef(TIMELINE_END)
  const runningRef = useRef(false)
  const startRef = useRef(0)
  const rafRef = useRef(0)

  const [input, setInput] = useState(DEFAULT_TEXT)
  const [headline, setHeadline] = useState(DEFAULT_TEXT)

  const launch = useCallback(() => {
    startRef.current = performance.now()
    phaseRef.current = 0
    runningRef.current = true
  }, [])

  /* renderer + camera + stars */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x03030a, 1)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.OrthographicCamera(-2.2, 2.2, 1.4, -1.4, 0.1, 20)
    camera.position.z = 5

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const aspect = w / Math.max(1, h)
      camera.left = -2.2
      camera.right = 2.2
      camera.top = 2.2 / aspect
      camera.bottom = -2.2 / aspect
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    /* 固定星点 */
    const starCount = 160
    const starPos = new Float32Array(starCount * 3)
    const starColor = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 5.2
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 3.4
      starPos[i * 3 + 2] = -0.5
      const tint = 0.55 + Math.random() * 0.4
      starColor[i * 3] = tint
      starColor[i * 3 + 1] = tint * 0.92
      starColor[i * 3 + 2] = tint * 0.78
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3))
    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: false,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (runningRef.current) {
        const elapsed = (performance.now() - startRef.current) / 1000
        phaseRef.current = Math.min(elapsed, TIMELINE_END)
        if (elapsed >= TIMELINE_END) runningRef.current = false
      }
      for (const mat of materialsRef.current) {
        mat.uniforms.uPhase.value = phaseRef.current
      }
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      for (const points of pointsRef.current) scene.remove(points)
      geometryRef.current?.dispose()
      for (const material of materialsRef.current) material.dispose()
      pointsRef.current = []
      materialsRef.current = []
      geometryRef.current = null
      starGeo.dispose()
      starMat.dispose()
      renderer.dispose()
      rendererRef.current = null
      sceneRef.current = null
    }
  }, [])

  /* rebuild geometry when headline changes */
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const fireworkScale = window.innerWidth < 640 ? 0.8 : 1
    const sample = buildTextGeometry(headline, fireworkScale)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3))
    geometry.setAttribute('aCenter', new THREE.BufferAttribute(sample.centers, 3))
    geometry.setAttribute('aBurst', new THREE.BufferAttribute(sample.bursts, 2))
    geometry.setAttribute('aDelay', new THREE.BufferAttribute(sample.delays, 1))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(sample.colors, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sample.sizes, 1))
    geometry.computeBoundingSphere()

    for (const points of pointsRef.current) {
      points.geometry = geometry
    }

    if (!pointsRef.current.length) {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const mainMat = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uPhase: { value: phaseRef.current },
          uTrail: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uSize: { value: 3.0 },
          uOpacity: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const trailMat = mainMat.clone()
      trailMat.uniforms.uTrail.value = 0.105
      trailMat.uniforms.uSize.value = 3.9
      trailMat.uniforms.uOpacity.value = 0.38

      const mainPoints = new THREE.Points(geometry, mainMat)
      mainPoints.frustumCulled = false
      const trailPoints = new THREE.Points(geometry, trailMat)
      trailPoints.frustumCulled = false
      pointsRef.current = [mainPoints, trailPoints]
      materialsRef.current = [mainMat, trailMat]
      scene.add(mainPoints)
      scene.add(trailPoints)
    }

    if (geometryRef.current && geometryRef.current !== geometry) geometryRef.current.dispose()
    geometryRef.current = geometry

    phaseRef.current = TIMELINE_END
    runningRef.current = false
  }, [headline])

  /* first auto launch (respect reduced motion) */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const timer = window.setTimeout(launch, 1600)
    return () => window.clearTimeout(timer)
  }, [launch])

  const submit = () => {
    const next = (input.trim() || DEFAULT_TEXT).slice(0, MAX_CHARS)
    if (next === headline) {
      launch()
    } else {
      setHeadline(next)
      window.setTimeout(launch, 80)
    }
  }

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem', background: '#03030a' }}>
      <canvas
        ref={canvasRef}
        onClick={launch}
        className="fixed inset-0"
        style={{ zIndex: 1, cursor: 'crosshair', display: 'block' }}
      />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at 50% 38%, rgba(30,26,55,0.20) 0%, rgba(3,3,10,0.65) 62%, rgba(0,0,0,0.9) 100%)',
        }}
      />

      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] text-center pointer-events-none select-none">
        <div className="text-[10px] tracking-[0.46em] text-amber-200/55 font-mono">THREE.JS · CANVAS SAMPLING · GPU PARTICLES</div>
        <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[0.22em] text-white/85">TEXT FIREWORKS</div>
        <div className="mt-2 text-[10px] tracking-[0.18em] text-white/35 font-mono">EVERY LETTER LEAVES · BURSTS · COMES HOME</div>
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[90] w-[min(92vw,540px)]">
        <div
          className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-black/55 px-3 py-2 backdrop-blur-xl"
          style={{ boxShadow: '0 0 30px rgba(255,180,90,0.08)' }}
        >
          <span className="text-[9px] font-mono tracking-[0.2em] text-amber-200/60 shrink-0">01 / TEXT</span>
          <input
            value={input}
            maxLength={MAX_CHARS}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="TYPE UP TO 12 CHARACTERS"
            aria-label="Fireworks text"
            className="min-w-0 flex-1 bg-transparent text-white/90 text-sm tracking-[0.08em] outline-none placeholder:text-white/25"
          />
          <span className="text-[9px] font-mono text-white/25 shrink-0">{input.length}/{MAX_CHARS}</span>
          <button
            onClick={submit}
            className="shrink-0 rounded-md border border-amber-300/35 px-3 py-1.5 text-[10px] font-mono tracking-[0.16em] text-amber-100/90 hover:bg-amber-300/15 hover:border-amber-200/60 transition-colors"
          >
            IGNITE ↗
          </button>
        </div>
        <div className="mt-2 text-center text-[9px] font-mono tracking-[0.22em] text-white/30">
          PRESS ENTER OR CLICK THE NIGHT SKY
        </div>
      </div>

      <div style={{ height: '100vh' }} />
    </div>
  )
}
