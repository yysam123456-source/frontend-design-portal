import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ═══════════════════════════════════════════════════════════════
   ORBITAL VIZ — Three.js Satellite Orbit Visualization
   ═══════════════════════════════════════════════════════════════ */

const EARTH_RADIUS = 6371 // km
const MU = 398600.4418 // Earth gravitational constant km³/s²

interface OrbitConfig {
  name: string
  color: number
  a: number // semi-major axis km
  e: number // eccentricity
  i: number // inclination degrees
  omega: number // argument of periapsis degrees
  Omega: number // right ascension of ascending node degrees
  speed: number
  tubeRadius: number
}

const orbitConfigs: OrbitConfig[] = [
  { name: 'LEO', color: 0x4ade80, a: 6700, e: 0.001, i: 51.6, omega: 0, Omega: 0, speed: 1.0, tubeRadius: 120 },
  { name: 'MEO', color: 0x60a5fa, a: 15000, e: 0.01, i: 55, omega: 0, Omega: 45, speed: 0.5, tubeRadius: 150 },
  { name: 'GEO', color: 0xf472b6, a: 42164, e: 0.0001, i: 0, omega: 0, Omega: 0, speed: 0.1, tubeRadius: 200 },
  { name: 'HEO', color: 0xfbbf24, a: 20000, e: 0.6, i: 63.4, omega: 270, Omega: 90, speed: 0.3, tubeRadius: 150 },
  { name: 'Lunar', color: 0xc0c8d8, a: 384400, e: 0.0549, i: 5.145, omega: 318, Omega: 125, speed: 0.01, tubeRadius: 600 },
]

function coe2rv(a: number, e: number, i: number, omega: number, Omega: number, nu: number) {
  const ir = (i * Math.PI) / 180
  const wr = (omega * Math.PI) / 180
  const Or = (Omega * Math.PI) / 180
  const nr = (nu * Math.PI) / 180
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nr))
  const x_pqw = r * Math.cos(nr)
  const y_pqw = r * Math.sin(nr)
  const cosO = Math.cos(Or)
  const sinO = Math.sin(Or)
  const cosi = Math.cos(ir)
  const sini = Math.sin(ir)
  const cosw = Math.cos(wr)
  const sinw = Math.sin(wr)
  const x = (cosO * cosw - sinO * sinw * cosi) * x_pqw + (-cosO * sinw - sinO * cosw * cosi) * y_pqw
  const y = (sinO * cosw + cosO * sinw * cosi) * x_pqw + (-sinO * sinw + cosO * cosw * cosi) * y_pqw
  const z = sinw * sini * x_pqw + cosw * sini * y_pqw
  return new THREE.Vector3(x, y, z)
}

export default function OrbitalViz() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [timeScale, setTimeScale] = useState(100)
  const [simTime, setSimTime] = useState(0)
  const [fps, setFps] = useState(60)
  const [activeCount, setActiveCount] = useState(5)
  const [orbitVis, setOrbitVis] = useState<boolean[]>(orbitConfigs.map(() => true))
  const [loaded, setLoaded] = useState(false)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const earthRef = useRef<THREE.Mesh | null>(null)
  interface OrbitObject {
    line: THREE.Line
    particles: THREE.Points
    satellite: THREE.Mesh
    glowRing: THREE.Mesh
    label: HTMLDivElement
  }
  const orbitObjectsRef = useRef<OrbitObject[]>([])
  const simTimeRef = useRef(0)
  const timeScaleRef = useRef(100)
  const isPlayingRef = useRef(true)
  const orbitVisRef = useRef(orbitVis)
  const rafRef = useRef(0)

  useEffect(() => { timeScaleRef.current = timeScale }, [timeScale])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { orbitVisRef.current = orbitVis }, [orbitVis])

  const resetSim = useCallback(() => {
    simTimeRef.current = 0
    setSimTime(0)
    setTimeScale(100)
    setIsPlaying(true)
    orbitObjectsRef.current.forEach((obj) => {
      obj.satellite.userData.angle = Math.random() * 360
    })
  }, [])

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000000)
    camera.position.set(0, 50000, 100000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true
    controls.minDistance = 1000
    controls.maxDistance = 500000
    controlsRef.current = controls

    // Stars
    const starsGeo = new THREE.BufferGeometry()
    const starCount = 8000
    const posArr = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) posArr[i] = (Math.random() - 0.5) * 1000000
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 80, sizeAttenuation: true, transparent: true, opacity: 0.7 })
    scene.add(new THREE.Points(starsGeo, starsMat))

    // Earth
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64)
    const earthMat = new THREE.MeshPhongMaterial({ shininess: 15, specular: 0x333333 })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)
    earthRef.current = earth

    // Earth texture with 3s timeout fallback
    const texLoader = new THREE.TextureLoader()
    let textureLoaded = false
    const markLoaded = () => {
      if (!textureLoaded) {
        textureLoaded = true
        setLoaded(true)
      }
    }
    texLoader.load(
      'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg',
      (texture) => {
        earthMat.map = texture
        earthMat.needsUpdate = true
        markLoaded()
      },
      undefined,
      () => markLoaded()
    )
    setTimeout(markLoaded, 3000)

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(6450, 64, 64)
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.15, side: THREE.BackSide })
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat)
    earth.add(atmosphere)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sunLight = new THREE.DirectionalLight(0xffffff, 1)
    sunLight.position.set(100000, 50000, 100000)
    scene.add(sunLight)

    // Create orbits and satellites
    const orbitObjects: OrbitObject[] = []

    orbitConfigs.forEach((config) => {
      // Orbit path points
      const points: THREE.Vector3[] = []
      for (let nu = 0; nu <= 360; nu += 0.6) {
        points.push(coe2rv(config.a, config.e, config.i, config.omega, config.Omega, nu))
      }

      const color = new THREE.Color(config.color)

      // ── 1. Thin core line (skeleton) ──
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({ color: config.color, transparent: true, opacity: 0.4 })
      const lineOrbit = new THREE.Line(lineGeo, lineMat)
      scene.add(lineOrbit)

      // ── 2. Glowing particle orbit (stardust energy trail) ──
      const particleCount = 350
      const pPositions = new Float32Array(particleCount * 3)
      const pSizes = new Float32Array(particleCount)
      const pAlphas = new Float32Array(particleCount)
      const pPhases = new Float32Array(particleCount)
      const curve = new THREE.CatmullRomCurve3(points, true)
      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount
        const pt = curve.getPoint(t)
        pPositions[i * 3] = pt.x
        pPositions[i * 3 + 1] = pt.y
        pPositions[i * 3 + 2] = pt.z
        pSizes[i] = 250 + Math.random() * 350
        pAlphas[i] = 0.3 + Math.random() * 0.4
        pPhases[i] = Math.random() * Math.PI * 2
      }
      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
      pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1))
      pGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pAlphas, 1))
      pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhases, 1))

      const pMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aPhase;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            float pulse = 0.6 + 0.4 * sin(uTime * 2.5 + aPhase);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float distFactor = 2000.0 / max(-mvPosition.z, 2000.0);
            float size = aSize * pulse * uPixelRatio * distFactor;
            gl_PointSize = max(size, 3.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.0, 0.5, d);
            glow = pow(glow, 1.5);
            gl_FragColor = vec4(uColor, glow * vAlpha * 0.65);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const particles = new THREE.Points(pGeo, pMat)
      scene.add(particles)

      // Satellite (glowing sphere)
      const satSize = Math.max(150, config.a * 0.004)
      const satGeo = new THREE.SphereGeometry(satSize, 16, 16)
      const satMat = new THREE.MeshBasicMaterial({ color: config.color })
      const satellite = new THREE.Mesh(satGeo, satMat)
      satellite.userData = { config, angle: Math.random() * 360 }
      scene.add(satellite)

      // Glow ring around satellite
      const ringGeo = new THREE.RingGeometry(satSize * 1.8, satSize * 3.2, 32)
      const ringMat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      const glowRing = new THREE.Mesh(ringGeo, ringMat)
      glowRing.lookAt(camera.position)
      scene.add(glowRing)

      // Label (HTML overlay)
      const labelDiv = document.createElement('div')
      labelDiv.className = 'absolute text-white text-xs font-semibold whitespace-nowrap pointer-events-none'
      labelDiv.style.textShadow = '0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)'
      labelDiv.style.color = '#' + config.color.toString(16).padStart(6, '0')
      labelDiv.textContent = config.name
      container.appendChild(labelDiv)

      orbitObjects.push({ line: lineOrbit, particles, satellite, glowRing, label: labelDiv })
    })

    orbitObjectsRef.current = orbitObjects

    // Animation
    const clock = new THREE.Clock()
    let frameCount = 0
    let lastFpsUpdate = performance.now()

    const animate = () => {
      const delta = clock.getDelta()
      frameCount++
      const now = performance.now()
      if (now - lastFpsUpdate >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastFpsUpdate = now
      }

      if (isPlayingRef.current) {
        const ts = timeScaleRef.current
        const deltaDays = (delta * ts) / 86400
        simTimeRef.current += deltaDays
        setSimTime(simTimeRef.current)

        orbitObjects.forEach((obj, idx) => {
          const sat = obj.satellite
          const cfg: OrbitConfig = sat.userData.config
          const T = 2 * Math.PI * Math.sqrt(Math.pow(cfg.a, 3) / MU)
          const T_days = T / 86400
          const angularSpeed = 360 / T_days
          let angle: number = sat.userData.angle
          angle += angularSpeed * deltaDays
          if (angle > 360) angle -= 360
          sat.userData.angle = angle
          const pos = coe2rv(cfg.a, cfg.e, cfg.i, cfg.omega, cfg.Omega, angle)
          sat.position.copy(pos)

          // Glow ring follows satellite and faces camera
          obj.glowRing.position.copy(pos)
          obj.glowRing.lookAt(camera.position)

          // Update label position (project 3D to screen)
          const vis = orbitVisRef.current[idx]
          if (obj.label) {
            if (!vis) {
              obj.label.style.display = 'none'
            } else {
              obj.label.style.display = 'block'
              const tempV = pos.clone()
              tempV.project(camera)
              const sx = (tempV.x * 0.5 + 0.5) * window.innerWidth
              const sy = (-tempV.y * 0.5 + 0.5) * window.innerHeight
              if (tempV.z < 1) {
                obj.label.style.transform = `translate(${sx + 16}px, ${sy - 6}px)`
                obj.label.style.opacity = '1'
              } else {
                obj.label.style.opacity = '0'
              }
            }
          }
        })
      }

      // Visibility toggle
      orbitObjects.forEach((obj, idx) => {
        const vis = orbitVisRef.current[idx]
        obj.line.visible = vis
        obj.particles.visible = vis
        obj.satellite.visible = vis
        obj.glowRing.visible = vis
        if (obj.label) obj.label.style.display = vis ? 'block' : 'none'
      })

      const active = orbitVisRef.current.filter(Boolean).length
      setActiveCount(active)

      // Update particle orbit pulse animation
      orbitObjects.forEach((obj) => {
        const mat = obj.particles.material as THREE.ShaderMaterial
        if (mat.uniforms?.uTime) {
          mat.uniforms.uTime.value += delta
        }
      })

      if (earthRef.current) earthRef.current.rotation.y += delta * 0.05
      controls.update()
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      orbitObjects.forEach((obj) => { if (container.contains(obj.label)) container.removeChild(obj.label) })
    }
  }, [])

  const toggleOrbit = (idx: number) => {
    setOrbitVis((prev) => {
      const next = [...prev]
      next[idx] = !next[idx]
      return next
    })
  }

  // Stats
  const heights = orbitConfigs.map((c) => c.a - EARTH_RADIUS)
  const avgHeight = Math.round(heights.reduce((a, b) => a + b, 0) / heights.length)
  const maxHeight = Math.round(Math.max(...heights))
  const minHeight = Math.round(Math.min(...heights))
  const totalLength = Math.round(
    orbitConfigs.reduce((sum, c) => {
      const b = c.a * Math.sqrt(1 - c.e * c.e)
      return sum + 2 * Math.PI * Math.sqrt((c.a * c.a + b * b) / 2)
    }, 0)
  )

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
      <div ref={canvasRef} className="absolute inset-0" />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
          <div className="text-blue-400 text-sm tracking-[0.2em]">Loading Orbital Visualization...</div>
        </div>
      )}

      {/* Control Panel */}
      <div className="fixed top-5 right-5 z-50 w-[300px] rounded-2xl p-5 text-white"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2 text-blue-400 text-lg font-semibold mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Orbit Control System
        </div>

        {/* Time scale */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Time Scale</div>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="1000" value={timeScale}
              onChange={(e) => setTimeScale(Number(e.target.value))}
              className="flex-1 h-1.5 rounded cursor-pointer accent-blue-400"
              style={{ background: '#334155' }} />
            <span className="min-w-[50px] text-right text-sm text-slate-200 font-medium">{timeScale.toFixed(1)}x</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={resetSim}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-slate-600 hover:bg-slate-500 text-white">
            Reset
          </button>
        </div>

        {/* Orbit list */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Orbit List</div>
          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {orbitConfigs.map((cfg, idx) => (
              <div key={idx} onClick={() => toggleOrbit(idx)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#' + cfg.color.toString(16).padStart(6, '0') }} />
                <span className="flex-1 text-xs text-slate-200">{cfg.name}</span>
                <input type="checkbox" checked={orbitVis[idx]} readOnly className="accent-blue-400 w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="text-xs text-slate-400 mb-2">Statistics</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Orbits', value: `${activeCount}/5` },
              { label: 'FPS', value: `${fps}` },
              { label: 'Days', value: simTime.toFixed(1) },
              { label: 'Time Scale', value: `${timeScale.toFixed(1)}x` },
              { label: 'Avg Altitude', value: `${avgHeight.toLocaleString()} km` },
              { label: 'Max Altitude', value: `${maxHeight.toLocaleString()} km` },
              { label: 'Min Altitude', value: `${minHeight.toLocaleString()} km` },
              { label: 'Total Perimeter', value: `${totalLength.toLocaleString()} km` },
            ].map((s, i) => (
              <div key={i} className="text-center rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-blue-400 text-sm font-semibold">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="fixed bottom-5 left-5 z-50 rounded-xl p-4 text-xs text-slate-400"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex gap-2 mb-1"><span className="text-blue-400">Controls:</span><span>Left drag rotate | Scroll zoom | Right drag pan</span></div>
        <div className="flex gap-2 mb-1"><span className="text-blue-400">Three.js:</span><span>v0.185.1</span></div>
        <div className="flex gap-2"><span className="text-blue-400">Time:</span><span>{simTime.toFixed(1)} days</span></div>
      </div>
    </div>
  )
}
