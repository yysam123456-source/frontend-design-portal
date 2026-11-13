import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ArrowLeft, LayoutGrid, Search as SearchIcon, X as XIcon } from 'lucide-react'
import MechaDisassembly from './showcases/MechaDisassembly'
import * as THREE from 'three'
import OrbitalViz from './OrbitalViz'
import { FABLE_SHOWCASES } from './fableCatalog'
import KeyboardConfigShowcase from './KeyboardConfigShowcase'
import PixiJSShowcase from './PixiJSShowcase'
import AbyssalDescent from './showcases/AbyssalDescent'
import AsciiSharksShowcase from './showcases/AsciiSharksShowcase'
import AsciiRestShowcase from './showcases/AsciiRestShowcase'
import AsciiMagicShowcase from './showcases/AsciiMagicShowcase'
import TextFireworksShowcase from './showcases/TextFireworksShowcase'
import NebulaGalaxyShowcase from './showcases/NebulaGalaxyShowcase'

/* 通用 iframe 容器：所有整页 demo 统一走这一处，切换时通过 onReady 收起 loading */
function IframeShowcase({
  src,
  title,
  background = '#000',
  onReady,
}: {
  src: string
  title: string
  background?: string
  onReady?: () => void
}) {
  return (
    <div className="relative w-full">
      <iframe
        src={src}
        title={title}
        className="fixed inset-0 w-full h-full border-0"
        style={{ zIndex: 1, background }}
        allow="autoplay; fullscreen; webgpu"
        onLoad={onReady}
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
   SHOWCASE CATALOG — 现有项目 + Fable 76，按一级分组 + 标签维护
   ═══════════════════════════════════════════════════════════════ */
const SHOWCASE_TAGS = [
  'Nature',
  'Fluid',
  'Architecture',
  'Particles',
  'Typography',
  'Interaction',
  'Scroll',
  'Space',
  'Mechanical',
  'Culture',
  'Atmosphere',
  'Generative',
  'Physics',
  'Interface',
  'Scene',
] as const

type ShowcaseTag = (typeof SHOWCASE_TAGS)[number]
type ShowcaseGroup = 'THREE.JS' | 'ASCII' | 'FABLE'
type BrowserGroup = ShowcaseGroup | 'OTHER' | 'ALL'

type ShowcaseEntry = {
  readonly id: string
  readonly label: string
  readonly desc: string
  readonly icon: string
  readonly group?: ShowcaseGroup
  readonly tags: readonly ShowcaseTag[]
  readonly keywords: readonly string[]
  readonly frame?: boolean
  readonly src?: string
  readonly credit?: string
}

const SHOWCASES = [
  /* Three.js 项目统一归入 THREE.JS 分组（含 three.js WebGPU 渲染器项目） */
  {
    id: 'nebula',
    label: 'Nebula Core',
    desc: 'Four-arm galaxy',
    icon: '✦',
    group: 'THREE.JS',
    tags: ['Space', 'Particles', 'Interaction'],
    keywords: ['星系', '星云', '螺旋', '银河', 'galaxy'],
  },
  {
    id: 'ssf-fog',
    label: 'SSF Screen-Space Fog',
    desc: 'Forest road · height fog · sun scattering',
    icon: '🌫',
    group: 'THREE.JS',
    tags: ['Nature', 'Atmosphere'],
    keywords: ['雾', '森林', '高度雾', '散射', 'fog', 'forest'],
    frame: true,
  },
  /* Sylva: 仅嵌入作者托管的线上体验；上游 README 明确不授予代码/设计/作品再分发许可 */
  {
    id: 'sylva',
    label: 'Sylva',
    desc: 'Procedural moss landscape · MengTo',
    icon: '🌿',
    group: 'THREE.JS',
    tags: ['Nature', 'Interaction'],
    keywords: ['苔藓', '根须', '自然', '指针', 'moss'],
    frame: true,
  },
  /* Sylva Bloom：以已授权 Sylva 源码为底，新增表面扎根花路、蕨叶萌发、
     孢子/花粉与叙事 HUD；本地静态 iframe，保留原版 Sylva 条目。 */
  {
    id: 'sylva-bloom',
    label: 'Sylva — Bloom Trail',
    desc: 'Ecological succession · pointer-woken bloom',
    icon: '🌸',
    group: 'THREE.JS',
    tags: ['Nature', 'Interaction', 'Generative'],
    keywords: ['苔藓', '花路', '生态演替', '指针', 'rewilding', 'bloom'],
    frame: true,
    credit: 'MengTo',
  },
  {
    id: 'fireworks',
    label: 'Text Fireworks',
    desc: 'Type → explode → return',
    icon: '✦',
    group: 'THREE.JS',
    tags: ['Particles', 'Typography'],
    keywords: ['烟花', '文字', '粒子', 'type'],
  },
  {
    id: 'planets',
    label: 'Three Planets',
    desc: '3D planet carousel',
    icon: '◐',
    group: 'THREE.JS',
    tags: ['Space', 'Interaction'],
    keywords: ['行星', '星球', '太阳系', 'planet'],
  },
  {
    id: 'orbits',
    label: 'Orbital Orbits',
    desc: 'Satellite orbit viz',
    icon: '⊕',
    group: 'THREE.JS',
    tags: ['Space', 'Interaction'],
    keywords: ['轨道', '卫星', 'orbit'],
  },
  {
    id: 'keyboard',
    label: 'Keyboard Config',
    desc: '3D keyboard configurator',
    icon: '⌨',
    group: 'THREE.JS',
    tags: ['Mechanical', 'Interaction'],
    keywords: ['键盘', '配置', '机械', 'keyboard'],
  },
  {
    id: 'kage',
    label: 'Kage',
    desc: 'MengTo single-file scroll 3D night Kyoto',
    icon: '⛩',
    group: 'THREE.JS',
    tags: ['Architecture', 'Scroll', 'Culture'],
    keywords: ['京都', '夜游', '建筑', '滚动', 'kyoto', 'japan'],
    frame: true,
  },
  {
    id: 'building',
    label: 'HK Building Gen',
    desc: 'Procedural Hong Kong buildings (achrefelouafi)',
    icon: '🏙',
    group: 'THREE.JS',
    tags: ['Architecture', 'Culture'],
    keywords: ['香港', '建筑', '程序化', '城市', 'building', 'hong kong'],
    frame: true,
  },
  {
    id: 'snow',
    label: 'Snowy Footprints',
    desc: 'Snow terrain + falling snow',
    icon: '❄️',
    group: 'THREE.JS',
    tags: ['Nature', 'Particles', 'Atmosphere'],
    keywords: ['雪', '脚印', '地形', 'snow'],
    frame: true,
  },
  {
    id: 'water',
    label: 'Cinematic Water',
    desc: 'Beach water body + dive-under',
    icon: '🌊',
    group: 'THREE.JS',
    tags: ['Fluid', 'Nature'],
    keywords: ['海', '水', '潜水', '海滩', 'water'],
    frame: true,
  },
  {
    id: 'ocean',
    label: 'FFT Ocean',
    desc: 'JONSWAP spectrum + FFT ocean',
    icon: '🌊',
    group: 'THREE.JS',
    tags: ['Fluid', 'Nature'],
    keywords: ['海洋', '海浪', 'FFT', 'ocean'],
    frame: true,
  },
  {
    id: 'grass',
    label: 'Soil Studio',
    desc: 'Moss grass wind + ground sculpt',
    icon: '🌿',
    group: 'THREE.JS',
    tags: ['Nature', 'Interaction'],
    keywords: ['草地', '苔藓', '土壤', '风', 'grass'],
    frame: true,
  },
  {
    id: 'vegetation',
    label: 'WebGPU Ivy',
    desc: 'Ivy grows along drawn paths',
    icon: '🌱',
    group: 'THREE.JS',
    tags: ['Nature', 'Interaction'],
    keywords: ['藤蔓', '植物', '绘制', 'WebGPU', 'ivy'],
    frame: true,
  },
  {
    id: 'crystal',
    label: 'WebGPU Crystal',
    desc: 'Amethyst cluster growth brush',
    icon: '💎',
    group: 'THREE.JS',
    tags: ['Nature', 'Interaction'],
    keywords: ['水晶', '紫水晶', '绘制', 'WebGPU', 'crystal'],
    frame: true,
  },
  {
    id: 'rain',
    label: 'Rain Studio',
    desc: 'Rain streaks + lightning + puddles',
    icon: '⛈',
    group: 'THREE.JS',
    tags: ['Nature', 'Atmosphere', 'Particles'],
    keywords: ['雨', '闪电', '水洼', 'rain'],
    frame: true,
  },
  {
    id: 'starfall',
    label: 'Starfall Town',
    desc: 'Living diorama: day-night, seasons, drifting villagers',
    icon: '🏘',
    group: 'THREE.JS',
    tags: ['Architecture', 'Nature', 'Particles', 'Atmosphere'],
    keywords: ['星落镇', '村庄', '昼夜', '季节', '萤火虫', '小镇', 'starfall'],
    frame: true,
  },
  {
    id: 'grand-atelier',
    label: 'Grand Atelier',
    desc: 'Playable 3D grand piano with visible mechanics',
    icon: '🎹',
    group: 'THREE.JS',
    tags: ['Interaction', 'Mechanical', 'Culture'],
    keywords: ['钢琴', '音乐', '机械', 'piano'],
    frame: true,
  },
  {
    id: 'looseleaf',
    label: 'Looseleaf Paper Desk',
    desc: 'Hand-drawn UI on a physical paper desk',
    icon: '📝',
    group: 'THREE.JS',
    tags: ['Interaction', 'Typography', 'Culture'],
    keywords: ['纸', '手绘', '桌面', 'paper'],
    frame: true,
  },
  {
    id: 'pixijs',
    label: 'PixiJS Playground',
    desc: '2D WebGL rendering engine',
    icon: '🎨',
    tags: ['Interaction', 'Particles'],
    keywords: ['2D', '渲染', 'PixiJS', 'playground'],
  },
  {
    id: 'mecha',
    label: 'Mecha Breakdown',
    desc: 'Mechanical disassembly',
    icon: '⚙',
    tags: ['Mechanical', 'Interaction'],
    keywords: ['机甲', '拆解', '机械', 'mecha'],
  },
  {
    id: 'abyss',
    label: 'Abyssal Descent',
    desc: 'Scroll-driven 3D deep-sea descent',
    icon: '🌊',
    tags: ['Nature', 'Scroll', 'Atmosphere'],
    keywords: ['深海', '下潜', '滚动', 'abyss'],
    frame: true,
  },
  {
    id: 'phoenix',
    label: 'Chinese Phoenix Crown',
    desc: 'Seven crowns with physics text curtains',
    icon: '👑',
    tags: ['Culture', 'Typography', 'Interaction'],
    keywords: ['凤冠', '中国', '文字', '帘', 'phoenix'],
    frame: true,
  },
  {
    id: 'ascii-rest',
    label: 'ASCII.Art',
    desc: '240 animated pieces · 15 categories · one tag',
    icon: '🅰',
    group: 'ASCII',
    tags: ['Typography', 'Culture'],
    keywords: ['ASCII', '字符', '动画', 'art'],
  },
  {
    id: 'ascii-magic',
    label: 'ASCII Magic',
    desc: '734 hand-built pieces · 24 categories · 11 looks',
    icon: '✦',
    group: 'ASCII',
    tags: ['Typography', 'Culture'],
    keywords: ['ASCII', '字符', '魔法', 'magic', '734'],
  },
  {
    id: 'ascii',
    label: 'ASCII Ocean',
    desc: '8 ASCII shark species + boids fish (stackedlol)',
    icon: '🦈',
    group: 'ASCII',
    tags: ['Typography', 'Nature'],
    keywords: ['ASCII', '鲨鱼', '鱼群', '海洋', 'shark'],
  },
  /* Fable 76：远程 iframe，作者 MiaAI-Lab；上游无 LICENSE，不复制源文件 */
  ...FABLE_SHOWCASES,
] as const

type ShowcaseId = (typeof SHOWCASES)[number]['id']

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[\s\-_/.·]+/g, '')

const groupKey = (entry: ShowcaseEntry): BrowserGroup => entry.group ?? 'OTHER'

const groupLabel = (group: BrowserGroup) =>
  group === 'ALL' ? 'All' : group === 'OTHER' ? 'Other' : group

const GRID_CLASS = 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'

function ShowcaseCard({
  entry,
  active,
  onSelect,
}: {
  entry: ShowcaseEntry
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      data-showcase-id={entry.id}
      aria-current={active ? 'true' : undefined}
      className={`group flex min-h-[96px] flex-col rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
        active
          ? 'border-cyan-300/55 bg-cyan-300/[0.08]'
          : 'border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.055]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-[22px] leading-none">{entry.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-white/[0.86]">
              {entry.label}
            </span>
            {active && (
              <span className="shrink-0 rounded bg-cyan-300/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-cyan-200">
                NOW
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/[0.42]">
            {entry.desc}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1 pt-2.5">
        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-white/[0.38]">
          {groupKey(entry)}
        </span>
        {entry.tags.slice(0, 3).map(tag => (
          <span key={tag} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/[0.32]">
            {tag}
          </span>
        ))}
        {entry.credit && (
          <span className="ml-auto text-[9px] tracking-[0.04em] text-white/[0.22]">
            {entry.credit}
          </span>
        )}
      </div>
    </button>
  )
}

function ShowcaseBrowser({
  open,
  entries,
  activeId,
  onClose,
  onSelect,
}: {
  open: boolean
  entries: readonly ShowcaseEntry[]
  activeId: string
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<BrowserGroup>('ALL')
  const [selectedTags, setSelectedTags] = useState<ShowcaseTag[]>([])
  const [sort, setSort] = useState<'curated' | 'az'>('curated')
  const searchRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 60)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const counts = useMemo<Record<BrowserGroup, number>>(
    () => ({
      ALL: entries.length,
      'THREE.JS': entries.filter(entry => entry.group === 'THREE.JS').length,
      ASCII: entries.filter(entry => entry.group === 'ASCII').length,
      FABLE: entries.filter(entry => entry.group === 'FABLE').length,
      OTHER: entries.filter(entry => !entry.group).length,
    }),
    [entries]
  )

  const tagCounts = useMemo(() => {
    const map = new Map<ShowcaseTag, number>()
    SHOWCASE_TAGS.forEach(tag => {
      map.set(tag, entries.filter(entry => entry.tags.includes(tag)).length)
    })
    return map
  }, [entries])

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return entries.filter(entry => {
      if (group !== 'ALL' && groupKey(entry) !== group) return false
      if (selectedTags.length > 0 && !selectedTags.some(tag => entry.tags.includes(tag))) {
        return false
      }
      if (terms.length === 0) return true
      const haystack = normalizeSearch(
        [
          entry.label,
          entry.desc,
          entry.group ?? 'OTHER',
          entry.group === 'THREE.JS' ? 'threejs treejs three 3d' : '',
          entry.credit ?? '',
          entry.tags.join(' '),
          entry.keywords.join(' '),
        ].join(' ')
      )
      return terms.every(term => haystack.includes(normalizeSearch(term)))
    })
  }, [entries, group, selectedTags, query])

  const sorted = useMemo(
    () =>
      sort === 'az'
        ? [...filtered].sort((a, b) => a.label.localeCompare(b.label))
        : filtered,
    [filtered, sort]
  )

  const showSections =
    group === 'ALL' && !query.trim() && selectedTags.length === 0 && sort === 'curated'

  const sections = useMemo(() => {
    if (!showSections) return []
    const order: BrowserGroup[] = ['THREE.JS', 'ASCII', 'FABLE', 'OTHER']
    return order
      .map(key => ({ key, items: sorted.filter(entry => groupKey(entry) === key) }))
      .filter(section => section.items.length > 0)
  }, [showSections, sorted])

  const hasFilters = Boolean(query.trim()) || group !== 'ALL' || selectedTags.length > 0

  const clearFilters = () => {
    setQuery('')
    setGroup('ALL')
    setSelectedTags([])
    setSort('curated')
  }

  const toggleTag = (tag: ShowcaseTag) => {
    setSelectedTags(current =>
      current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]
    )
  }

  const handleDialogKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const focusables = overlayRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )
    if (!focusables?.length) return
    const list = Array.from(focusables).filter(item => item.getClientRects().length > 0)
    if (list.length === 0) return
    const first = list[0]
    const last = list[list.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  if (!open) return null

  return (
    <div
      id="showcase-browser"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="showcase-browser-title"
      onKeyDown={handleDialogKeyDown}
      className="fixed inset-0 z-[300] flex flex-col bg-[#05070b] text-white"
    >
      <header
        className="shrink-0 border-b border-white/10 bg-[#05070b] pb-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto w-full max-w-[1168px] px-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="showcase-browser-title"
                className="text-[11px] font-semibold tracking-[0.26em] text-white/90"
              >
                SHOWCASES
              </h2>
              <p className="mt-1 text-[10px] tracking-[0.04em] text-white/[0.35]">
                {entries.length} live demos · one catalog · search and filter
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close showcase browser"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/45 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            >
              <XIcon size={16} />
            </button>
          </div>

          <div className="relative mt-3">
            <SearchIcon
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              aria-label="Search showcases"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search name, tag, author, 中文关键词…"
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-10 text-base text-white outline-none transition-colors placeholder:text-white/[0.28] focus:border-cyan-300/45 focus:bg-white/[0.06] sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-white/35 transition-colors hover:text-white"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {(['ALL', 'THREE.JS', 'ASCII', 'FABLE', 'OTHER'] as const).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setGroup(key)}
                data-group-filter={key}
                aria-pressed={group === key}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                  group === key
                    ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-white/[0.55] hover:border-white/25 hover:text-white/80'
                }`}
              >
                {groupLabel(key)}
                <span className="ml-1.5 text-[10px] text-white/[0.35]">{counts[key]}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 pb-1">
            {SHOWCASE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                data-tag-filter={tag}
                aria-pressed={selectedTags.includes(tag)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                  selectedTags.includes(tag)
                    ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100'
                    : 'border-white/[0.08] bg-transparent text-white/[0.42] hover:border-white/20 hover:text-white/70'
                }`}
              >
                {tag}
                <span className="ml-1 text-white/[0.25]">{tagCounts.get(tag) ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full max-w-[1168px] px-4 py-4 sm:px-6"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-white/[0.38]">
              <span className="text-white/[0.78]">{sorted.length}</span> of {entries.length}
            </p>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[10px] text-white/40 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/75"
                >
                  Clear filters
                </button>
              )}
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setSort('curated')}
                  aria-pressed={sort === 'curated'}
                  className={`rounded px-2 py-1 text-[10px] transition-colors ${
                    sort === 'curated' ? 'bg-white/10 text-white/80' : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  Curated
                </button>
                <button
                  type="button"
                  onClick={() => setSort('az')}
                  aria-pressed={sort === 'az'}
                  className={`rounded px-2 py-1 text-[10px] transition-colors ${
                    sort === 'az' ? 'bg-white/10 text-white/80' : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[10px] font-semibold tracking-[0.24em] text-white/25">
                NO MATCH
              </p>
              <p className="mt-2 text-sm text-white/50">
                换个关键词试试，例如「雾」「苔藓」「建筑」，或清除筛选。
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[11px] text-cyan-100 transition-colors hover:bg-cyan-300/15"
              >
                Clear filters
              </button>
            </div>
          ) : showSections ? (
            sections.map(section => (
              <section key={section.key} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.22em] text-cyan-200/50">
                    {section.key}
                  </span>
                  <span className="text-[10px] text-white/25">{section.items.length}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className={GRID_CLASS}>
                  {section.items.map(entry => (
                    <ShowcaseCard
                      key={entry.id}
                      entry={entry}
                      active={entry.id === activeId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className={GRID_CLASS}>
              {sorted.map(entry => (
                <ShowcaseCard
                  key={entry.id}
                  entry={entry}
                  active={entry.id === activeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShowcasesPage({ onNavigate }: { onNavigate?: OnNavigate }) {
  const [activeId, setActiveId] = useState<ShowcaseId>('nebula')
  const [transitioning, setTransitioning] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)
  const [loading, setLoading] = useState<{
    id: ShowcaseId
    label: string
    icon: string
  } | null>(null)
  const showcaseButtonRef = useRef<HTMLButtonElement>(null)
  const hasOpenedBrowserRef = useRef(false)
  const transitionTimerRef = useRef<number | null>(null)

  const markFrameReady = useCallback((id: ShowcaseId) => {
    setLoading(current => (current?.id === id ? null : current))
  }, [])

  const switchTo = useCallback(
    (id: ShowcaseId) => {
      if (id === activeId || transitioning) return
      const next = SHOWCASES.find(showcase => showcase.id === id)
      setLoading(null)
      setTransitioning(true)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      transitionTimerRef.current = window.setTimeout(() => {
        setActiveId(id)
        setTransitioning(false)
        const frame = (next as ShowcaseEntry | undefined)?.frame
        if (frame && next) {
          setLoading({ id, label: next.label, icon: next.icon })
        }
      }, 200)
    },
    [activeId, transitioning]
  )

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(null), 12000)
    return () => window.clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if (browserOpen) {
      hasOpenedBrowserRef.current = true
    } else if (hasOpenedBrowserRef.current) {
      showcaseButtonRef.current?.focus()
    }
  }, [browserOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || browserOpen) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      setBrowserOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [browserOpen])

  const handleSelect = useCallback(
    (id: string) => {
      setBrowserOpen(false)
      switchTo(id as ShowcaseId)
    },
    [switchTo]
  )

  const activeEntry = SHOWCASES.find(showcase => showcase.id === activeId) as
    | ShowcaseEntry
    | undefined

  return (
    <div className="relative w-full">
      {/* 左上角：Back + Showcase 浏览器入口 */}
      <div
        className="fixed left-4 top-4 z-[200] flex items-center gap-2"
        style={{
          top: 'max(16px, env(safe-area-inset-top))',
          left: 'max(16px, env(safe-area-inset-left))',
        }}
      >
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0 })
            if (onNavigate) onNavigate('official')
          }}
          aria-label="Back to official site"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2.5 text-xs font-medium text-white/50 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          ref={showcaseButtonRef}
          type="button"
          onClick={() => setBrowserOpen(true)}
          aria-label="Open showcase browser"
          aria-expanded={browserOpen}
          aria-controls="showcase-browser"
          className="flex h-9 items-center gap-2 rounded-lg border border-cyan-300/25 bg-black/40 px-2.5 text-xs font-medium text-white/75 backdrop-blur-md transition-colors hover:border-cyan-300/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
        >
          <LayoutGrid size={14} className="text-cyan-200/80" />
          <span className="hidden sm:inline">Showcases</span>
          <span className="rounded bg-cyan-300/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
            {SHOWCASES.length}
          </span>
        </button>
      </div>

      <ShowcaseBrowser
        open={browserOpen}
        entries={SHOWCASES}
        activeId={activeId}
        onClose={() => setBrowserOpen(false)}
        onSelect={handleSelect}
      />

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-[#05070b]"
        >
          <div className="px-6 text-center">
            <div className="text-2xl leading-none">{loading.icon}</div>
            <div className="mt-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/30">
              Loading showcase
            </div>
            <div className="mt-2 text-sm font-medium text-white/70">{loading.label}</div>
            <div className="mx-auto mt-5 h-px w-28 overflow-hidden bg-white/10">
              <div className="h-px w-1/3 animate-pulse bg-cyan-300/60" />
            </div>
          </div>
        </div>
      )}

      {/* Active showcase */}
      <div
        className={`transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ visibility: browserOpen ? 'hidden' : 'visible' }}
        aria-hidden={browserOpen || undefined}
      >
        {activeId === 'nebula' && <NebulaGalaxyShowcase />}
        {activeId === 'ssf-fog' && (
          <IframeShowcase
            src="/showcases/ssf-fog/"
            title="屏幕空间雾 — Screen Space Fog"
            onReady={() => markFrameReady('ssf-fog')}
          />
        )}
        {activeId === 'sylva' && (
          <IframeShowcase
            src="https://mengto.github.io/sylva/"
            title="Sylva — 程序化苔藓景观"
            background="#34382f"
            onReady={() => markFrameReady('sylva')}
          />
        )}
        {activeId === 'sylva-bloom' && (
          <IframeShowcase
            src="/showcases/sylva-bloom/"
            title="Sylva — Bloom Trail"
            background="#4a4d44"
            onReady={() => markFrameReady('sylva-bloom')}
          />
        )}
        {activeId === 'fireworks' && <TextFireworksShowcase />}
        {activeId === 'mecha' && <MechaDisassembly />}
        {activeId === 'planets' && <ThreePlanets />}
        {activeId === 'orbits' && <OrbitalViz />}
        {activeId === 'keyboard' && <KeyboardConfigShowcase />}
        {activeId === 'pixijs' && <PixiJSShowcase />}
        {activeId === 'kage' && (
          <IframeShowcase
            src="/kage.html"
            title="Kage — Night Kyoto"
            background="#05070a"
            onReady={() => markFrameReady('kage')}
          />
        )}
        {activeId === 'abyss' && <AbyssalDescent />}
        {activeId === 'building' && (
          <IframeShowcase
            src="/showcases/building/"
            title="香港程序化建筑生成"
            onReady={() => markFrameReady('building')}
          />
        )}
        {activeId === 'snow' && (
          <IframeShowcase
            src="/showcases/snow/"
            title="雪野脚印系统"
            onReady={() => markFrameReady('snow')}
          />
        )}
        {activeId === 'water' && (
          <IframeShowcase
            src="/showcases/water/"
            title="电影级海面"
            onReady={() => markFrameReady('water')}
          />
        )}
        {activeId === 'ocean' && (
          <IframeShowcase
            src="/showcases/ocean/"
            title="FFT 物理海洋"
            onReady={() => markFrameReady('ocean')}
          />
        )}
        {activeId === 'grass' && (
          <IframeShowcase
            src="/showcases/grass/"
            title="草地土壤工作室"
            onReady={() => markFrameReady('grass')}
          />
        )}
        {activeId === 'vegetation' && (
          <IframeShowcase
            src="/showcases/vegetation/"
            title="WebGPU 藤蔓生成"
            onReady={() => markFrameReady('vegetation')}
          />
        )}
        {activeId === 'crystal' && (
          <IframeShowcase
            src="/showcases/crystal/"
            title="WebGPU 水晶绘制"
            onReady={() => markFrameReady('crystal')}
          />
        )}
        {activeId === 'rain' && (
          <IframeShowcase
            src="/showcases/rain/"
            title="雨景工作室"
            onReady={() => markFrameReady('rain')}
          />
        )}
        {activeId === 'starfall' && (
          <IframeShowcase
            src="/showcases/starfall.html"
            title="星落镇 Starfall"
            background="#0b1026"
            onReady={() => markFrameReady('starfall')}
          />
        )}
        {activeId === 'ascii-rest' && <AsciiRestShowcase />}
        {activeId === 'ascii-magic' && <AsciiMagicShowcase />}
        {activeId === 'ascii' && <AsciiSharksShowcase />}
        {activeId === 'looseleaf' && (
          <IframeShowcase
            src="/looseleaf-showcase.html"
            title="Looseleaf Paper Desk"
            background="#a8c8bb"
            onReady={() => markFrameReady('looseleaf')}
          />
        )}
        {activeId === 'phoenix' && (
          <IframeShowcase
            src="/phoenix-crown.html"
            title="Chinese Phoenix Crown"
            background="#0f1420"
            onReady={() => markFrameReady('phoenix')}
          />
        )}
        {activeId === 'grand-atelier' && (
          <IframeShowcase
            src="/grand-atelier.html"
            title="Grand Atelier"
            background="#151713"
            onReady={() => markFrameReady('grand-atelier')}
          />
        )}
        {/* Fable 76：所有作品共用远程 iframe 分支；不复制上游代码 */}
        {activeEntry?.src && (
          <IframeShowcase
            src={activeEntry.src}
            title={`${activeEntry.label} — ${activeEntry.credit ?? 'Fable 76'}`}
            background="#0b1026"
            onReady={() => markFrameReady(activeEntry.id as ShowcaseId)}
          />
        )}
      </div>
    </div>
  )
}
