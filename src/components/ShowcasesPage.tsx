import { Fragment, useEffect, useRef, useState, useCallback } from 'react'
import MechaDisassembly from './showcases/MechaDisassembly'
import * as THREE from 'three'
import OrbitalViz from './OrbitalViz'
import KeyboardConfigShowcase from './KeyboardConfigShowcase'
import PixiJSShowcase from './PixiJSShowcase'
import AbyssalDescent from './showcases/AbyssalDescent'
import AsciiSharksShowcase from './showcases/AsciiSharksShowcase'
import AsciiRestShowcase from './showcases/AsciiRestShowcase'
import AsciiMagicShowcase from './showcases/AsciiMagicShowcase'
import TextFireworksShowcase from './showcases/TextFireworksShowcase'
import NebulaGalaxyShowcase from './showcases/NebulaGalaxyShowcase'

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

type OnNavigate = (page: 'official' | 'components') => void

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
  /* Three.js 项目统一归入 THREE.JS 分组（含 three.js WebGPU 渲染器项目） */
  { id: 'nebula', label: 'Nebula Core', desc: 'Four-arm galaxy', icon: '✦', group: 'THREE.JS' },
  { id: 'ssf-fog', label: 'SSF Screen-Space Fog', desc: 'Forest road · height fog · sun scattering', icon: '🌫', group: 'THREE.JS' },
  /* Sylva: 仅嵌入作者托管的线上体验；上游 README 明确不授予代码/设计/作品再分发许可 */
  { id: 'sylva', label: 'Sylva', desc: 'Procedural moss landscape · MengTo', icon: '🌿', group: 'THREE.JS' },
  { id: 'fireworks', label: 'Text Fireworks', desc: 'Type → explode → return', icon: '✦', group: 'THREE.JS' },
  { id: 'planets', label: 'Three Planets', desc: '3D planet carousel', icon: '◐', group: 'THREE.JS' },
  { id: 'orbits', label: 'Orbital Orbits', desc: 'Satellite orbit viz', icon: '⊕', group: 'THREE.JS' },
  { id: 'keyboard', label: 'Keyboard Config', desc: '3D keyboard configurator', icon: '⌨', group: 'THREE.JS' },
  { id: 'kage', label: 'Kage', desc: 'MengTo single-file scroll 3D night Kyoto', icon: '⛩', group: 'THREE.JS' },
  { id: 'building', label: 'HK Building Gen', desc: 'Procedural Hong Kong buildings (achrefelouafi)', icon: '🏙', group: 'THREE.JS' },
  { id: 'snow', label: 'Snowy Footprints', desc: 'Snow terrain + falling snow', icon: '❄️', group: 'THREE.JS' },
  { id: 'water', label: 'Cinematic Water', desc: 'Beach water body + dive-under', icon: '🌊', group: 'THREE.JS' },
  { id: 'ocean', label: 'FFT Ocean', desc: 'JONSWAP spectrum + FFT ocean', icon: '🌊', group: 'THREE.JS' },
  { id: 'grass', label: 'Soil Studio', desc: 'Moss grass wind + ground sculpt', icon: '🌿', group: 'THREE.JS' },
  { id: 'vegetation', label: 'WebGPU Ivy', desc: 'Ivy grows along drawn paths', icon: '🌱', group: 'THREE.JS' },
  { id: 'crystal', label: 'WebGPU Crystal', desc: 'Amethyst cluster growth brush', icon: '💎', group: 'THREE.JS' },
  { id: 'rain', label: 'Rain Studio', desc: 'Rain streaks + lightning + puddles', icon: '⛈', group: 'THREE.JS' },
  { id: 'grand-atelier', label: 'Grand Atelier', desc: 'Playable 3D grand piano with visible mechanics', icon: '🎹', group: 'THREE.JS' },
  { id: 'looseleaf', label: 'Looseleaf Paper Desk', desc: 'Hand-drawn UI on a physical paper desk', icon: '📝', group: 'THREE.JS' },
  { id: 'pixijs', label: 'PixiJS Playground', desc: '2D WebGL rendering engine', icon: '🎨' },
  { id: 'mecha', label: 'Mecha Breakdown', desc: 'Mechanical disassembly', icon: '⚙' },
  { id: 'abyss', label: 'Abyssal Descent', desc: 'Scroll-driven 3D deep-sea descent', icon: '🌊' },
  { id: 'phoenix', label: 'Chinese Phoenix Crown', desc: 'Seven crowns with physics text curtains', icon: '👑' },
  { id: 'ascii-rest', label: 'ASCII.Art', desc: '240 animated pieces · 15 categories · one tag', icon: '🅰', group: 'ASCII' },
  { id: 'ascii-magic', label: 'ASCII Magic', desc: '734 hand-built pieces · 24 categories · 11 looks', icon: '✦', group: 'ASCII' },
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
        {activeId === 'nebula' && <NebulaGalaxyShowcase />}
        {activeId === 'ssf-fog' && <IframeShowcase src="/showcases/ssf-fog/" title="屏幕空间雾 — Screen Space Fog" />}
        {activeId === 'sylva' && <IframeShowcase src="https://mengto.github.io/sylva/" title="Sylva — 程序化苔藓景观" background="#34382f" />}
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
        {activeId === 'ascii-magic' && <AsciiMagicShowcase />}
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
