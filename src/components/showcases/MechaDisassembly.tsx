import { useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   MECHA DISASSEMBLY — Gundam-class armor breakdown v2
   借鉴「钢铁侠 Mark III 三维体验」方法论升级：
   ① 线框启动序列（骨架线束汇聚 → 装甲显现 → 反应炉点火）
   ② 点击聚焦镜头（局部特写 + 部件规格面板，ESC 退出）
   ③ 视角预设（正视 / 侧倾 / 俯瞰）
   ④ 姿态切换（陈列 / 战斗）+ 发光开关（眼部 / 核心 / 推进）
   ⑤ 灰模对照（CLAY 模式检查几何与甲片关系）
   ═══════════════════════════════════════════════════════════════ */

type MechaPart = {
  id: string
  label: string
  code: string
  desc: string
  spec: string
  x: number
  y: number
  w: number
  h: number
  dx: number
  dy: number
  rot: number
  color: string
  accent: string
  clip: string
  z: number
  phase: number
  conduit?: 'h' | 'v'
}

const smoothstep = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

const MECHA_IMG = '/assets/showcases/original-mecha-fullbody.jpg'
const FRAME_IMG = '/assets/showcases/mecha-internal-frame.jpg'

const parts: MechaPart[] = [
  { id: 'head', label: '光学头部', code: 'HD-01', desc: '复合传感器阵列、青色全息面罩、红白头盔装甲与主火神炮基座。', spec: 'SENSOR ×12 / HOLO VISOR', x: 50, y: 14, w: 24, h: 18, dx: 0, dy: -38, rot: 0, color: '#d8e3ee', accent: '#41e6ff', clip: 'polygon(14% 0, 86% 0, 100% 42%, 82% 100%, 18% 100%, 0 42%)', z: 10, phase: 0.06, conduit: 'v' },
  { id: 'chest', label: '胸部主装甲', code: 'CR-12', desc: '主胸甲、肩部连接轴、反应炉外环装甲结构，曲面分层冲压成型。', spec: 'ARMOR 420mm EQ', x: 50, y: 33, w: 44, h: 22, dx: 0, dy: -24, rot: 0, color: '#cdd7e2', accent: '#41e6ff', clip: 'polygon(8% 0, 92% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%)', z: 8, phase: 0.12, conduit: 'h' },
  { id: 'core', label: '能量核心', code: 'RX-77', desc: '中央超高亮反应炉，拆解时保留在骨架层持续供能发光。', spec: 'OUTPUT 3,480kW', x: 50, y: 33, w: 14, h: 11, dx: 0, dy: -8, rot: 0, color: '#21d4ff', accent: '#7df3ff', clip: 'circle(48% at 50% 50%)', z: 12, phase: 0.16 },
  { id: 'shoulderL', label: '左肩重甲', code: 'SL-21', desc: '红白复合肩甲，内含圆形关节轴、液压缓冲器与挂载导轨。', spec: 'JOINT ∅480 / DAMPER ×2', x: 24, y: 30, w: 22, h: 18, dx: -44, dy: -18, rot: -26, color: '#e33847', accent: '#ff7a84', clip: 'polygon(0 20%, 78% 0, 100% 48%, 76% 100%, 10% 86%)', z: 9, phase: 0.18, conduit: 'h' },
  { id: 'shoulderR', label: '右肩重甲', code: 'SR-21', desc: '红白复合肩甲，外侧装甲板可独立拆出维护。', spec: 'JOINT ∅480 / RAIL ×1', x: 76, y: 30, w: 22, h: 18, dx: 44, dy: -18, rot: 26, color: '#e33847', accent: '#ff7a84', clip: 'polygon(22% 0, 100% 20%, 90% 86%, 24% 100%, 0 48%)', z: 9, phase: 0.18, conduit: 'h' },
  { id: 'armL', label: '左臂总成', code: 'LA-34', desc: '上臂护甲、肘部液压杆、前臂装甲与三指机械手掌。', spec: 'ACTUATOR ×6 / GRIP 22t', x: 15, y: 52, w: 22, h: 34, dx: -56, dy: 12, rot: -36, color: '#dce7f0', accent: '#e33847', clip: 'polygon(28% 0, 84% 6%, 100% 58%, 74% 100%, 12% 88%, 0 32%)', z: 7, phase: 0.24, conduit: 'v' },
  { id: 'armR', label: '右臂总成', code: 'RA-34', desc: '上臂护甲、肘部液压杆、前臂装甲与机械手掌。', spec: 'ACTUATOR ×6 / GRIP 22t', x: 85, y: 52, w: 22, h: 34, dx: 56, dy: 12, rot: 36, color: '#dce7f0', accent: '#e33847', clip: 'polygon(16% 6%, 72% 0, 100% 32%, 88% 88%, 26% 100%, 0 58%)', z: 7, phase: 0.24, conduit: 'v' },
  { id: 'abdomen', label: '腹部动力舱', code: 'AB-09', desc: '可见液压管束、橙色能量线缆与分层腹甲结构。', spec: 'COOLANT LOOP ×4', x: 50, y: 48, w: 30, h: 16, dx: 0, dy: 14, rot: 0, color: '#b9c3cd', accent: '#f2c94c', clip: 'polygon(20% 0, 80% 0, 100% 86%, 50% 100%, 0 86%)', z: 6, phase: 0.3, conduit: 'v' },
  { id: 'backpack', label: '背部推进系统', code: 'BT-88', desc: '双侧矢量推进器、散热格栅与背包骨架，战斗姿态主点火。', spec: 'THRUST 2×52,000kg', x: 50, y: 34, w: 56, h: 40, dx: 0, dy: -34, rot: 0, color: '#5f6d7a', accent: '#41e6ff', clip: 'polygon(6% 8%, 94% 8%, 88% 100%, 12% 100%)', z: 2, phase: 0.26 },
  { id: 'pelvis', label: '髋部裙板', code: 'PV-18', desc: '腰部装甲、腿部动力连接器与前后裙甲。', spec: 'LINK ×2 / SKIRT 4p', x: 50, y: 60, w: 32, h: 14, dx: 0, dy: 20, rot: 0, color: '#e33847', accent: '#ffb3b8', clip: 'polygon(16% 0, 84% 0, 100% 52%, 70% 100%, 30% 100%, 0 52%)', z: 7, phase: 0.36, conduit: 'h' },
  { id: 'thighL', label: '左大腿装甲', code: 'TL-55', desc: '大腿主护甲、膝部轴承外罩与液压支撑杆。', spec: 'PISTON ×2', x: 38, y: 74, w: 24, h: 20, dx: -36, dy: 40, rot: -16, color: '#d8e3ee', accent: '#f2c94c', clip: 'polygon(24% 0, 82% 0, 100% 70%, 78% 100%, 14% 96%, 0 66%)', z: 6, phase: 0.42, conduit: 'v' },
  { id: 'thighR', label: '右大腿装甲', code: 'TR-55', desc: '大腿主护甲、膝部轴承外罩与液压支撑杆。', spec: 'PISTON ×2', x: 62, y: 74, w: 24, h: 20, dx: 36, dy: 40, rot: 16, color: '#d8e3ee', accent: '#f2c94c', clip: 'polygon(18% 0, 76% 0, 100% 66%, 86% 96%, 22% 100%, 0 70%)', z: 6, phase: 0.42, conduit: 'v' },
  { id: 'shinL', label: '左小腿推进器', code: 'SL-67', desc: '小腿装甲、侧面矢量喷口与踝部关节。', spec: 'VERNIER ×3', x: 38, y: 94, w: 22, h: 22, dx: -30, dy: 54, rot: -12, color: '#c5d0db', accent: '#41e6ff', clip: 'polygon(20% 0, 80% 0, 100% 72%, 76% 100%, 16% 96%, 0 68%)', z: 5, phase: 0.5, conduit: 'v' },
  { id: 'shinR', label: '右小腿推进器', code: 'SR-67', desc: '小腿装甲、侧面矢量喷口与踝部关节。', spec: 'VERNIER ×3', x: 62, y: 94, w: 22, h: 22, dx: 30, dy: 54, rot: 12, color: '#c5d0db', accent: '#41e6ff', clip: 'polygon(20% 0, 80% 0, 100% 68%, 84% 96%, 24% 100%, 0 72%)', z: 5, phase: 0.5, conduit: 'v' },
  { id: 'footL', label: '左脚稳定器', code: 'FL-09', desc: '脚部装甲、足底抓地爪与姿态稳定喷射口。', spec: 'GRIP CLAW ×5', x: 38, y: 112, w: 18, h: 12, dx: -24, dy: 44, rot: -8, color: '#a8b5c4', accent: '#f2c94c', clip: 'polygon(18% 0, 82% 0, 100% 60%, 80% 100%, 20% 100%, 0 60%)', z: 4, phase: 0.58 },
  { id: 'footR', label: '右脚稳定器', code: 'FR-09', desc: '脚部装甲、足底抓地爪与姿态稳定喷射口。', spec: 'GRIP CLAW ×5', x: 62, y: 112, w: 18, h: 12, dx: 24, dy: 44, rot: 8, color: '#a8b5c4', accent: '#f2c94c', clip: 'polygon(18% 0, 82% 0, 100% 60%, 80% 100%, 20% 100%, 0 60%)', z: 4, phase: 0.58 },
]

/* 内部骨架管线（SVG 线束） */
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

/* 机库尘埃粒子 */
const dust = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: (i * 37.7) % 100,
  y: (i * 53.3) % 100,
  s: 1 + (i % 3),
  dur: 7 + (i % 5) * 2.4,
  delay: (i * 0.83) % 6,
}))

/* HUD 引线标注（只保留 6 个关键部位，替代旧的 16 块浮窗） */
const LEADER_PARTS = ['head', 'chest', 'shoulderL', 'armR', 'backpack', 'shinR']

type ViewMode = 'front' | 'profile' | 'top'
type Pose = 'display' | 'combat'

const VIEW_ROT: Record<ViewMode, { rx: number; ry: number }> = {
  front: { rx: 0, ry: 0 },
  profile: { rx: 2, ry: -34 },
  top: { rx: 44, ry: 0 },
}

export default function MechaDisassembly() {
  const [scroll, setScroll] = useState(0)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [hotPart, setHotPart] = useState<string | null>(null)
  const [intro, setIntro] = useState(0) // 0→1 启动序列
  const [focus, setFocus] = useState<string | null>(null)
  const [pose, setPose] = useState<Pose>('display')
  const [view, setView] = useState<ViewMode>('front')
  const [clay, setClay] = useState(false)
  const [glows, setGlows] = useState({ eyes: true, core: true, thrust: true })
  const mouseRaf = useRef(false)

  /* 启动序列：骨架线束 → 装甲显现 → 反应炉点火 */
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 3000)
      setIntro(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setScroll(docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0)
    }
    const onMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth
      const ny = e.clientY / window.innerHeight
      if (!mouseRaf.current) {
        mouseRaf.current = true
        requestAnimationFrame(() => {
          setMouse({ x: nx, y: ny })
          mouseRaf.current = false
        })
      }
      const container = document.querySelector('[data-mecha-container]') as HTMLElement | null
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
          const sizeWeight = 0.4 + 0.6 * Math.min(1, (part.w * part.h) / 600)
          const d = Math.sqrt(dx * dx + dy * dy) / sizeWeight
          if (d < best) {
            best = d
            nearest = part.id
          }
        }
        if (best > 0.18) nearest = null
      }
      setHotPart(nearest)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(null)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKey)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const scan = smoothstep(0, 0.14, scroll)
  const reveal = smoothstep(0.38, 0.72, scroll)
  const assemble = smoothstep(0.82, 1.0, scroll)
  const globalSplit = smoothstep(0.06, 0.72, scroll) * (1 - assemble)
  const combat = pose === 'combat' ? 1 : 0
  const booted = intro >= 1
  const combatPose = assemble > 0.5 || pose === 'combat'
  const hot = parts.find((p) => p.id === hotPart)
  const focusPart = parts.find((p) => p.id === focus)

  /* 相机（聚焦 + 视角预设），CSS transition 平滑运镜 */
  const W = 'min(78vw, 68vh)'
  const camScale = focusPart ? 2.05 : 1 + combat * 0.05
  const camTx = focusPart ? `calc((50 - ${focusPart.x}) * ${W} / 100)` : '0px'
  const camTy = focusPart ? `calc((70 - ${focusPart.y}) * 1.4 * ${W} / 100)` : '0px'
  const viewRot = VIEW_ROT[view]
  const parallaxDamp = focusPart ? 0.25 : 1

  const containerTransform = `scale(${camScale}) translate(${camTx}, ${camTy})`
  const parallaxTransform = `rotateX(${viewRot.rx + (mouse.y - 0.5) * 7 * parallaxDamp}deg) rotateY(${viewRot.ry + (mouse.x - 0.5) * -9 * parallaxDamp}deg)`

  /* 点击部件或列表 → 聚焦；点击空白退出 */
  const toggleFocus = (id: string) => setFocus((f) => (f === id ? null : id))

  const bootLines = [
    'MECHA OS v2.1 // GUNDAM-CLASS FRAME',
    'MOUNTING ARMOR MODULES ......... OK',
    'ENERGY CORE PRE-IGNITION ....... OK',
    'AWAITING OPERATOR INPUT ________',
  ]

  return (
    <div className="relative w-full" style={{ marginTop: '-3.5rem' }}>
      <style>{`
        @keyframes mecha-draw { from { stroke-dashoffset: 320; } to { stroke-dashoffset: 0; } }
        @keyframes mecha-idle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.6%); } }
        @keyframes mecha-flicker { 0%,100% { transform: scaleY(1) scaleX(1); opacity: .85; } 30% { transform: scaleY(1.18) scaleX(.92); opacity: 1; } 60% { transform: scaleY(.9) scaleX(1.06); opacity: .7; } }
        @keyframes mecha-corepulse { 0%,100% { box-shadow: 0 0 18px 4px rgba(65,230,255,.55), 0 0 60px 18px rgba(65,230,255,.22), inset 0 0 12px rgba(200,255,255,.8); } 50% { box-shadow: 0 0 30px 9px rgba(65,230,255,.8), 0 0 110px 34px rgba(65,230,255,.35), inset 0 0 18px rgba(220,255,255,1); } }
        @keyframes mecha-spin { to { transform: rotate(360deg); } }
        @keyframes mecha-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes mecha-sweep { to { transform: rotate(360deg); } }
        @keyframes mecha-scanring { 0% { transform: translate(-50%,-50%) scale(.55); opacity: .75; } 100% { transform: translate(-50%,-50%) scale(1.65); opacity: 0; } }
        @keyframes mecha-shake { 0%,100% { transform: translate(0,0); } 20% { transform: translate(1.5px,-1px); } 40% { transform: translate(-1.5px,1px); } 60% { transform: translate(1px,1.5px); } 80% { transform: translate(-1px,-1.5px); } }
        @keyframes mecha-float { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: .5; } 88% { opacity: .4; } 100% { transform: translateY(-46vh); opacity: 0; } }
        @keyframes mecha-alert { 0%,100% { opacity: .12; } 50% { opacity: .3; } }
        @keyframes mecha-blink { 0%,92%,100% { opacity: 1; } 96% { opacity: .2; } }
        @keyframes mecha-bootbar { from { width: 0; } to { width: 100%; } }
        .mecha-btn { font-family: ui-monospace, monospace; letter-spacing: .14em; border: 1px solid rgba(65,230,255,.28); background: rgba(3,12,20,.55); backdrop-filter: blur(8px); color: rgba(190,235,255,.75); transition: all .18s ease; cursor: pointer; }
        .mecha-btn:hover { border-color: rgba(65,230,255,.7); color: #cff7ff; box-shadow: 0 0 14px rgba(65,230,255,.25); }
        .mecha-btn.on { background: rgba(65,230,255,.16); border-color: rgba(65,230,255,.85); color: #eafcff; box-shadow: 0 0 16px rgba(65,230,255,.35), inset 0 0 10px rgba(65,230,255,.15); }
        .mecha-btn.warn.on { background: rgba(227,56,71,.2); border-color: rgba(255,122,132,.9); color: #ffd9dd; box-shadow: 0 0 16px rgba(227,56,71,.4), inset 0 0 10px rgba(227,56,71,.18); }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 45%, #18202b 0%, #070a10 42%, #020309 100%)',
          cursor: focusPart ? 'zoom-out' : 'crosshair',
          zIndex: 1,
        }}
        onClick={() => setFocus(null)}
      >
        {/* 机库背景网格 */}
        <div className="absolute inset-0 opacity-35" style={{
          backgroundImage: 'linear-gradient(rgba(65,230,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(65,230,255,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          transform: `perspective(900px) rotateX(${58 - scroll * 12}deg) translateY(${scroll * 80}px)`,
          transformOrigin: '50% 100%',
        }} />
        <div className="absolute left-1/2 top-1/2 w-[84vmin] h-[84vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" style={{ boxShadow: `0 0 ${80 + scan * 80}px rgba(65,230,255,0.08)` }} />
        <div className="absolute inset-x-0 top-[48%] h-px bg-cyan-300/20" style={{ opacity: scan }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-300/20" style={{ opacity: scan }} />

        {/* 机库尘埃 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {dust.map((d) => (
            <div key={d.id} className="absolute rounded-full bg-cyan-100/50" style={{
              left: `${d.x}%`, top: `${d.y}%`,
              width: d.s, height: d.s,
              animation: `mecha-float ${d.dur}s linear ${d.delay}s infinite`,
            }} />
          ))}
        </div>

        {/* 战斗警戒红光 */}
        {combatPose && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 52%, rgba(227,56,71,.5) 100%)',
            animation: 'mecha-alert 1.6s ease-in-out infinite',
            mixBlendMode: 'screen',
          }} />
        )}

        {/* 标题 */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ opacity: (1 - globalSplit * 0.45) * smoothstep(0.5, 0.9, intro) }}>
          <h2 className="text-3xl font-black tracking-[0.22em] text-white/90">MECHA DISASSEMBLY</h2>
          <p className="mt-2 text-[10px] tracking-[0.35em] text-cyan-200/45">RX-NULL GUNDAM-CLASS FRAME / SCROLL · CLICK · SWITCH</p>
        </div>

        {/* 启动遮罩 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 1 - smoothstep(0.82, 1, intro), background: '#020309' }}>
          <div className="font-mono text-cyan-200/70 text-[11px] tracking-[0.2em] w-72">
            {bootLines.map((l, i) => (
              <div key={i} className="mb-1.5" style={{ opacity: smoothstep(i * 0.18, i * 0.18 + 0.14, intro) }}>{l}</div>
            ))}
            <div className="mt-3 h-px bg-cyan-300/20"><div className="h-full bg-cyan-300/80" style={{ animation: 'mecha-bootbar 2.6s ease-out forwards' }} /></div>
          </div>
        </div>

        {/* ═══ 相机层：聚焦/视角切换带平滑运镜 ═══ */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 'min(78vw, 68vh)',
            aspectRatio: '100/140',
            transform: `translate(-50%, -50%) ${containerTransform}`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* 待机浮动层（CSS 动画独立层，避免覆盖视差 transform） */}
          <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', animation: combatPose ? 'mecha-shake .34s linear infinite' : 'mecha-idle 5.2s ease-in-out infinite' }}>
          {/* ═══ 视差层：鼠标微倾 ═══ */}
          <div
            data-mecha-container
            className="absolute inset-0"
            style={{
              transform: parallaxTransform,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 内部骨架图片 */}
            <img
              src={FRAME_IMG}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                opacity: Math.max(smoothstep(0.28, 0.55, intro) * 0.35, reveal * 0.92) * (1 - smoothstep(0.3, 0.6, intro) * 0.28),
                filter: `contrast(1.1) saturate(1.15) brightness(${0.85 + reveal * 0.2}) drop-shadow(0 0 ${12 + reveal * 16}px rgba(65,230,255,0.25))`,
                objectFit: 'cover',
              }}
            />

            {/* 扫描光带 */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, rgba(65,230,255,0.16), transparent)',
              opacity: Math.max(scan * (1 - globalSplit * 0.4), smoothstep(0.7, 0.9, intro) * (1 - smoothstep(0.9, 1, intro))),
              transform: `translateX(${(Math.max(scroll, intro * 0.9) * 220 - 110)}%)`,
              mixBlendMode: 'screen',
            }} />

            {/* 外部原图底层 */}
            <img
              src={MECHA_IMG}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                opacity: (0.85 * (1 - globalSplit * 0.85) + combat * 0.2) * smoothstep(0.34, 0.72, intro),
                filter: clay
                  ? 'grayscale(1) contrast(1.2) brightness(1.04)'
                  : `contrast(1.08) saturate(1.08) drop-shadow(0 0 ${18 + scan * 18}px rgba(65,230,255,0.18))`,
                objectFit: 'cover',
                clipPath: 'polygon(3% 0, 97% 0, 100% 100%, 0 100%)',
              }}
            />

            {/* ═══ 内部骨架 SVG（线束汇聚 = 线框启动） ═══ */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 140"
              style={{ opacity: Math.max(smoothstep(0.04, 0.3, intro) * (1 - smoothstep(0.42, 0.7, intro)), reveal * (1 - combat * 0.35)) }}
            >
              {pipes.map((p, i) => (
                <line key={`pipe-${i}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.color} strokeWidth="0.7" opacity="0.6" strokeDasharray="2 2" style={{ animation: `mecha-blink ${2 + i * 0.3}s linear infinite` }} />
              ))}
              {/* 头部 */}
              <path d="M42 8 L58 8 L62 16 L60 24 L50 26 L40 24 L38 16 Z" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.6" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out forwards' }} />
              <circle cx="50" cy="14" r="4" fill="none" stroke="rgba(65,230,255,0.5)" strokeWidth="0.5" />
              <circle cx="50" cy="14" r="2.5" fill="rgba(65,230,255,0.2)" />
              <line x1="45" y1="8" x2="43" y2="3" stroke="rgba(210,230,240,0.4)" strokeWidth="0.5" />
              <line x1="55" y1="8" x2="57" y2="3" stroke="rgba(210,230,240,0.4)" strokeWidth="0.5" />
              <circle cx="43" cy="3" r="1" fill="rgba(65,230,255,0.5)" />
              <circle cx="57" cy="3" r="1" fill="rgba(65,230,255,0.5)" />
              <path d="M46 24 L46 28 M54 24 L54 28" stroke="rgba(210,230,240,0.4)" strokeWidth="0.6" />
              {/* 脊柱 */}
              <path d="M50 28 L50 64" fill="none" stroke="rgba(210,230,240,0.5)" strokeWidth="1.5" strokeDasharray="320" style={{ animation: 'mecha-draw 1.8s ease-out .2s forwards' }} />
              {[30, 34, 38, 42, 46, 50, 54, 58, 62].map((y, i) => (
                <g key={`spine-${i}`}>
                  <line x1="48" y1={y} x2="52" y2={y} stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
                  <circle cx="50" cy={y} r="1.2" fill="rgba(65,230,255,0.3)" />
                </g>
              ))}
              {/* 胸廓 + 反应炉 */}
              <path d="M36 30 Q32 36 36 42 Q40 46 50 46 Q60 46 64 42 Q68 36 64 30" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" strokeDasharray="320" style={{ animation: 'mecha-draw 1.7s ease-out .3s forwards' }} />
              {[32, 36, 40, 44].map((y, i) => (
                <line key={`rib-${i}`} x1="38" y1={y} x2="62" y2={y} stroke="rgba(210,230,240,0.25)" strokeWidth="0.4" />
              ))}
              <circle cx="50" cy="33" r="7.5" fill="none" stroke="rgba(65,230,255,0.25)" strokeWidth="0.6" />
              <circle cx="50" cy="33" r="6" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.8" />
              <circle cx="50" cy="33" r="4.5" fill="none" stroke="rgba(65,230,255,0.55)" strokeWidth="1" />
              <circle cx="50" cy="33" r="3" fill="rgba(65,230,255,0.35)" stroke="rgba(65,230,255,0.8)" strokeWidth="0.6" style={{ animation: 'mecha-corepulse 2.2s ease-in-out infinite' }} />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                return <line key={`fin-${i}`} x1={50 + Math.cos(rad) * 3} y1={33 + Math.sin(rad) * 3} x2={50 + Math.cos(rad) * 6} y2={33 + Math.sin(rad) * 6} stroke="rgba(65,230,255,0.35)" strokeWidth="0.5" />
              })}
              {/* 肩/臂/腿骨架 */}
              <circle cx="30" cy="30" r="4" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
              <circle cx="70" cy="30" r="4" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
              <path d="M26 34 L18 46 L16 58" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.9" strokeDasharray="320" style={{ animation: 'mecha-draw 1.7s ease-out .45s forwards' }} />
              <path d="M74 34 L82 46 L84 58" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.9" strokeDasharray="320" style={{ animation: 'mecha-draw 1.7s ease-out .45s forwards' }} />
              <circle cx="16" cy="58" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
              <circle cx="84" cy="58" r="2.5" fill="none" stroke="rgba(65,230,255,0.4)" strokeWidth="0.6" />
              <path d="M16 58 L14 68 L12 76" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
              <path d="M84 58 L86 68 L88 76" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" />
              <path d="M40 48 L38 56 L42 62 L50 64 L58 62 L62 56 L60 48" fill="none" stroke="rgba(210,230,240,0.35)" strokeWidth="0.7" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .6s forwards' }} />
              <path d="M38 60 L36 66 L42 70 L50 72 L58 70 L64 66 L62 60" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.8" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .7s forwards' }} />
              <path d="M38 74 L34 82 L32 90" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="1" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .8s forwards' }} />
              <path d="M62 74 L66 82 L68 90" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="1" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .8s forwards' }} />
              <circle cx="36" cy="90" r="3" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
              <circle cx="64" cy="90" r="3" fill="none" stroke="rgba(65,230,255,0.45)" strokeWidth="0.7" />
              <path d="M36 92 L34 100 L34 108" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="0.9" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .95s forwards' }} />
              <path d="M64 92 L66 100 L66 108" fill="none" stroke="rgba(210,230,240,0.45)" strokeWidth="0.9" strokeDasharray="320" style={{ animation: 'mecha-draw 1.6s ease-out .95s forwards' }} />
              <path d="M34 110 L32 114 L30 116 L34 118 L38 116 L38 112" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
              <path d="M66 110 L68 114 L70 116 L66 118 L62 116 L62 112" fill="none" stroke="rgba(210,230,240,0.4)" strokeWidth="0.7" />
            </svg>

            {/* ═══ 装甲零件 ═══ */}
            {parts.map((part) => {
              const isHot = hotPart === part.id
              const isFocus = focus === part.id
              const isDim = focus !== null && !isFocus
              const partSplit = smoothstep(part.phase, part.phase + 0.13, scroll) * (1 - assemble)
              const introIn = smoothstep(0.3 + part.phase * 0.55, 0.5 + part.phase * 0.55, intro)
              /* 战斗姿态偏移：手臂抬起、双腿张开 */
              const poseTx = combatPose ? (part.id.includes('arm') ? (part.id.endsWith('L') ? -6 : 6) : part.id.includes('thigh') || part.id.includes('shin') || part.id.includes('foot') ? (part.id.endsWith('L') ? -4 : 4) : 0) : 0
              const poseRot = combatPose ? (part.id === 'armL' ? -16 : part.id === 'armR' ? 16 : part.id === 'shoulderL' ? -8 : part.id === 'shoulderR' ? 8 : 0) : 0
              const tx = part.dx * partSplit + (assemble > 0.5 ? (part.id.includes('L') ? -2 : part.id.includes('R') ? 2 : 0) : 0) + poseTx * (combatPose ? 0.35 : 0)
              const ty = part.dy * partSplit
              const rotate = part.rot * partSplit + poseRot * (combatPose ? 0.8 : 0)
              const imageLeft = -((part.x - part.w / 2) / part.w) * 100
              const imageTop = -((part.y - part.h / 2) / part.h) * 100
              const imageWidth = (100 / part.w) * 100
              const imageHeight = (140 / part.h) * 100
              const big = part.w * part.h >= 200
              return (
                <div
                  key={part.id}
                  className="absolute"
                  onClick={(e) => { e.stopPropagation(); toggleFocus(part.id) }}
                  style={{
                    left: `${part.x}%`,
                    top: `${(part.y / 140) * 100}%`,
                    width: `${part.w}%`,
                    height: `${(part.h / 140) * 100}%`,
                    zIndex: isFocus ? 30 : part.z + (isHot ? 5 : 0),
                    transform: `translate(-50%, -50%) translate(${tx * 0.46}vmin, ${ty * 0.46}vmin) rotate(${rotate}deg) translateZ(${part.z * 5}px)`,
                    transition: 'opacity 0.3s ease, filter 0.25s ease',
                    cursor: 'pointer',
                    filter: isFocus
                      ? `drop-shadow(0 0 26px ${part.accent}) brightness(1.28)`
                      : isHot
                        ? `drop-shadow(0 0 18px ${part.accent}) brightness(1.22)`
                        : isDim
                          ? `grayscale(.65) brightness(.5) blur(1.2px)`
                          : `drop-shadow(0 0 ${4 + scan * 5}px ${part.accent}24)`,
                    opacity: introIn * (0.92 + partSplit * 0.08) * (isDim ? 0.42 : 1),
                  }}
                >
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      clipPath: part.clip,
                      border: `1px solid ${part.accent}${isHot || isFocus ? 'aa' : '44'}`,
                      boxShadow: `inset 0 0 22px rgba(255,255,255,0.10), inset 0 -18px 26px rgba(0,0,0,0.42)${isFocus ? `, 0 0 34px ${part.accent}55` : ''}`,
                      background: '#111821',
                    }}
                  >
                    <img
                      src={MECHA_IMG}
                      alt=""
                      className="absolute max-w-none object-cover"
                      style={{
                        left: `${imageLeft}%`,
                        top: `${imageTop}%`,
                        width: `${imageWidth}%`,
                        height: `${imageHeight}%`,
                        filter: clay ? 'grayscale(1) contrast(1.18) brightness(1.05)' : 'contrast(1.08) saturate(1.12)',
                      }}
                    />
                    {/* 甲片斜面高光 + 暗部（精细化） */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(155deg, rgba(255,255,255,.16) 0%, transparent 26%, transparent 68%, rgba(0,0,0,.5) 100%)',
                    }} />
                    {/* 面板刻线 */}
                    <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                      background: `repeating-linear-gradient(${(part.x * 7) % 180}deg, transparent 0 14px, ${part.accent}18 14px 15px)`,
                    }} />
                    {/* 能量导管脉冲 */}
                    {part.conduit && (
                      <div className="absolute pointer-events-none" style={
                        part.conduit === 'h'
                          ? { left: '12%', right: '12%', top: '48%', height: 2, background: `linear-gradient(90deg, transparent, ${part.accent}, transparent)`, animation: 'mecha-blink 2.4s linear infinite', boxShadow: `0 0 6px ${part.accent}` }
                          : { top: '14%', bottom: '14%', left: '48%', width: 2, background: `linear-gradient(180deg, transparent, ${part.accent}, transparent)`, animation: 'mecha-blink 2.4s linear infinite', boxShadow: `0 0 6px ${part.accent}` }
                      } />
                    )}
                    {/* 角部铆钉 */}
                    {big && (
                      <>
                        <div className="absolute rounded-full" style={{ left: 5, top: 5, width: 3, height: 3, background: 'rgba(220,240,255,.55)', boxShadow: '0 0 3px rgba(180,230,255,.5)' }} />
                        <div className="absolute rounded-full" style={{ right: 5, top: 5, width: 3, height: 3, background: 'rgba(220,240,255,.55)', boxShadow: '0 0 3px rgba(180,230,255,.5)' }} />
                        <div className="absolute rounded-full" style={{ left: 5, bottom: 5, width: 3, height: 3, background: 'rgba(220,240,255,.4)' }} />
                        <div className="absolute rounded-full" style={{ right: 5, bottom: 5, width: 3, height: 3, background: 'rgba(220,240,255,.4)' }} />
                      </>
                    )}
                    {/* 眼部发光（头部专用） */}
                    {part.id === 'head' && glows.eyes && (
                      <div className="absolute pointer-events-none" style={{
                        left: '30%', right: '30%', top: '50%', height: '7%',
                        background: 'linear-gradient(90deg, transparent, #d9fbff 18%, #7df3ff 50%, #d9fbff 82%, transparent)',
                        filter: 'blur(1.2px)',
                        borderRadius: 3,
                        animation: 'mecha-blink 3.4s linear infinite',
                        boxShadow: '0 0 14px 4px rgba(65,230,255,.8), 0 0 40px 12px rgba(65,230,255,.35)',
                      }} />
                    )}
                    {/* 扫描 tint */}
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(135deg, transparent 0%, ${part.accent}1a 48%, rgba(0,0,0,0.38) 100%)`,
                      mixBlendMode: 'screen',
                      opacity: scan * 0.8 + (isHot || isFocus ? 0.35 : 0),
                    }} />
                  </div>
                  {/* 顶部状态灯条 */}
                  <div className="absolute left-[16%] top-[18%] w-[68%] h-[5%] rounded-full" style={{ background: part.accent, opacity: 0.18 + scan * 0.18 + (isHot ? 0.3 : 0) }} />
                </div>
              )
            })}

            {/* ═══ CSS 反应炉核心（多层旋转环 + 呼吸辉光） ═══ */}
            <div
              className="absolute pointer-events-none"
              onClick={(e) => { e.stopPropagation(); toggleFocus('core') }}
              style={{
                left: '50%', top: `${(33 / 140) * 100}%`, width: '9%', aspectRatio: '1',
                transform: `translate(-50%,-50%) translate(0, ${-8 * smoothstep(0.16, 0.29, scroll) * (1 - assemble) * 0.46}vmin)`,
                zIndex: 31,
                opacity: smoothstep(0.68, 0.92, intro),
                cursor: 'pointer',
              }}
            >
              {glows.core && (
                <>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'conic-gradient(from 0deg, transparent 0 40deg, rgba(125,243,255,.9) 60deg, transparent 90deg 220deg, rgba(125,243,255,.55) 250deg, transparent 280deg)',
                    WebkitMaskImage: 'radial-gradient(circle, transparent 58%, black 60%, black 72%, transparent 74%)',
                    maskImage: 'radial-gradient(circle, transparent 58%, black 60%, black 72%, transparent 74%)',
                    animation: 'mecha-spin 6s linear infinite',
                  }} />
                  <div className="absolute inset-[14%] rounded-full border border-dashed border-cyan-200/60" style={{ animation: 'mecha-spin-rev 9s linear infinite' }} />
                  <div className="absolute inset-[26%] rounded-full" style={{
                    background: 'radial-gradient(circle, #eafcff 0%, #7df3ff 34%, #1db8e8 62%, rgba(29,120,200,.25) 100%)',
                    animation: 'mecha-corepulse 2.2s ease-in-out infinite',
                  }} />
                  {[0, 45, 90, 135].map((a) => (
                    <div key={a} className="absolute left-1/2 top-1/2 origin-left" style={{
                      width: '50%', height: 1.5, transform: `rotate(${a + 22}deg)`,
                      background: 'linear-gradient(90deg, rgba(125,243,255,.85), transparent)',
                    }} />
                  ))}
                  {/* 核心光晕外溢 */}
                  <div className="absolute rounded-full" style={{
                    inset: '-120%',
                    background: 'radial-gradient(circle, rgba(65,230,255,.16) 0%, transparent 55%)',
                    mixBlendMode: 'screen',
                    animation: 'mecha-corepulse 2.2s ease-in-out infinite',
                  }} />
                </>
              )}
            </div>

            {/* 推进器火焰 */}
            {[34, 61].map((lx, i) => (
              <div key={lx} className="absolute rounded-full" style={{
                left: `${lx}%`, top: '54%', width: '5%', height: '30%',
                background: combatPose || glows.thrust
                  ? 'linear-gradient(#41e6ff33, #41e6ffbb 30%, #f2c94caa 62%, transparent)'
                  : 'linear-gradient(#41e6ff00, #41e6ff55 55%, #f2c94c00)',
                filter: 'blur(5px)',
                opacity: glows.thrust ? (0.35 + globalSplit * 0.3 + combat * 0.45) : 0.18,
                transformOrigin: '50% 0',
                animation: glows.thrust ? `mecha-flicker ${0.34 + i * 0.09}s linear infinite` : 'none',
                transition: 'opacity .4s ease, background .4s ease',
              }} />
            ))}
            {/* 推进器辉光 */}
            {glows.thrust && (
              <>
                <div className="absolute rounded-full pointer-events-none" style={{ left: '31%', top: '52%', width: '11%', height: '10%', background: 'radial-gradient(circle, rgba(65,230,255,.4), transparent 70%)', filter: 'blur(6px)', mixBlendMode: 'screen' }} />
                <div className="absolute rounded-full pointer-events-none" style={{ left: '58%', top: '52%', width: '11%', height: '10%', background: 'radial-gradient(circle, rgba(65,230,255,.4), transparent 70%)', filter: 'blur(6px)', mixBlendMode: 'screen' }} />
              </>
            )}
          </div>
          </div>
        </div>

        {/* 扫描波纹环 */}
        <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{
          width: '60vmin', height: '60vmin', borderRadius: '50%',
          border: '1px solid rgba(65,230,255,.5)',
          opacity: scan * 0.8,
          animation: 'mecha-scanring 3.4s linear infinite',
        }} />

        {/* HUD 引线（6 个关键部位） */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: scan * smoothstep(0.5, 0.9, intro) }}>
          {parts.filter((p) => LEADER_PARTS.includes(p.id)).map((p, i) => {
            const side = p.x < 50 ? 'left' : 'right'
            const x1 = `${p.x}%`
            const y1 = `${(p.y / 140) * 100}%`
            const x2 = side === 'left' ? `${3 + (i % 3) * 1.5}%` : `${97 - (i % 3) * 1.5}%`
            const isHot = hotPart === p.id
            return (
              <g key={p.id} opacity={isHot ? 0.95 : 0.3 + reveal * 0.3}>
                <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={isHot ? p.accent : 'rgba(65,230,255,0.55)'} strokeWidth={isHot ? 1.4 : 1} strokeDasharray="4 4" />
                <circle cx={x1} cy={y1} r="3" fill="none" stroke={isHot ? p.accent : 'rgba(65,230,255,0.7)'} />
                <circle cx={x2} cy={y1} r="1.6" fill={isHot ? p.accent : 'rgba(65,230,255,0.7)'} />
              </g>
            )
          })}
        </svg>

        {/* ═══ 左侧：部件清单（点击聚焦）+ 遥测 ═══ */}
        <div className={`absolute left-3 top-[13%] w-52 font-mono pointer-events-none ${focus ? 'opacity-0' : ''}`} style={{ opacity: booted ? undefined : 0, transition: 'opacity .5s ease' }}>
          <div className="text-[9px] tracking-wider text-cyan-100/55 pointer-events-auto" style={{ opacity: scan }}>
            <div className="border border-cyan-300/20 bg-black/35 backdrop-blur-md p-2 space-y-1">
              <div className="text-cyan-200/90 text-[9px] tracking-[0.2em] mb-1">FRAME TELEMETRY</div>
              <div className="flex justify-between"><span className="text-white/35">SPLIT</span><span className="text-cyan-200/80">{(globalSplit * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-white/35">INNER</span><span className="text-cyan-200/80">{(reveal * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-white/35">POSE</span><span className={combatPose ? 'text-red-300' : 'text-cyan-200/80'}>{combatPose ? 'COMBAT' : 'DISPLAY'}</span></div>
              <div className="mt-1.5 h-1 bg-cyan-300/10"><div className="h-full bg-cyan-300/60 transition-all" style={{ width: `${45 + scan * 45}%` }} /></div>
            </div>
          </div>
        </div>

        {/* ═══ 右侧：ACTIVE COMPONENT 规格面板 ═══ */}
        <div className="absolute right-3 top-[13%] w-56 font-mono pointer-events-none">
          <div className="border border-cyan-300/20 bg-black/35 p-2.5 backdrop-blur-md" style={{ opacity: booted ? (hot || focusPart ? 1 : scan * 0.55) : 0, transition: 'opacity .3s ease' }}>
            <div className="text-cyan-200/90 text-[9px] tracking-[0.2em]">{focusPart ? 'FOCUS TARGET' : 'ACTIVE COMPONENT'}</div>
            {(focusPart || hot) && (
              <>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-white/90 text-[11px] font-bold">{(focusPart || hot)!.code}</span>
                  <span className="text-[9px]" style={{ color: (focusPart || hot)!.accent }}>{(focusPart || hot)!.label}</span>
                </div>
                <div className="mt-1 text-white/45 text-[9px] leading-relaxed">{(focusPart || hot)!.desc}</div>
                <div className="mt-1.5 text-[8px] tracking-[0.18em] px-1.5 py-0.5 inline-block border" style={{ color: (focusPart || hot)!.accent, borderColor: `${(focusPart || hot)!.accent}55` }}>{(focusPart || hot)!.spec}</div>
                {focusPart && <div className="mt-1.5 text-[8px] text-white/30 tracking-[0.2em] animate-pulse">ESC / CLICK VOID TO EXIT</div>}
              </>
            )}
            {!focusPart && !hot && <div className="mt-1.5 text-white/35 text-[9px]">移动鼠标扫描部件 · 点击聚焦</div>}
            <div className="mt-2 h-1 bg-cyan-300/10"><div className="h-full bg-cyan-300/60" style={{ width: `${45 + scan * 45}%` }} /></div>
          </div>
        </div>

        {/* ═══ 控制台：视角 / 姿态 / 发光 / 灰模 ═══ */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-10 md:bottom-4 flex flex-wrap justify-center gap-1.5 px-3 max-w-[96vw]"
          style={{ opacity: booted ? 1 : 0, transition: 'opacity .6s ease' }}
          onClick={(e) => e.stopPropagation()}
        >
          {(['front', 'profile', 'top'] as ViewMode[]).map((v) => (
            <button key={v} className={`mecha-btn rounded px-2.5 py-1 text-[9px] uppercase ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
          <span className="w-2" />
          <button className={`mecha-btn rounded px-2.5 py-1 text-[9px] ${pose === 'combat' ? 'warn on' : ''}`} onClick={() => setPose(pose === 'combat' ? 'display' : 'combat')}>{pose === 'combat' ? '◉ COMBAT' : 'DISPLAY'}</button>
          <span className="w-2" />
          {(['eyes', 'core', 'thrust'] as const).map((g) => (
            <button key={g} className={`mecha-btn rounded px-2.5 py-1 text-[9px] uppercase ${glows[g] ? 'on' : ''}`} onClick={() => setGlows({ ...glows, [g]: !glows[g] })}>{g}</button>
          ))}
          <span className="w-2" />
          <button className={`mecha-btn rounded px-2.5 py-1 text-[9px] uppercase ${clay ? 'on' : ''}`} onClick={() => setClay(!clay)}>CLAY</button>
        </div>

        {/* 雷达小部件 */}
        <div className="absolute right-4 bottom-14 md:bottom-16 w-24 h-24 pointer-events-none hidden sm:block" style={{ opacity: booted ? scan * 0.9 : 0, transition: 'opacity .5s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(65,230,255,.2)" strokeWidth="1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(65,230,255,.14)" strokeWidth="1" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(65,230,255,.1)" strokeWidth="1" />
            <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(65,230,255,.12)" strokeWidth="1" />
            <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(65,230,255,.12)" strokeWidth="1" />
            <g style={{ animation: 'mecha-sweep 3.2s linear infinite', transformOrigin: '50px 50px' }}>
              <path d="M50 50 L50 6 A44 44 0 0 1 78 16 Z" fill="rgba(65,230,255,.18)" />
              <line x1="50" y1="50" x2="50" y2="6" stroke="rgba(125,243,255,.8)" strokeWidth="1.2" />
            </g>
            {parts.filter((_, i) => i % 4 === 0).map((p) => (
              <circle key={p.id} cx={50 + ((p.x - 50) / 50) * 38} cy={50 + ((p.y - 70) / 70) * 38} r="1.8" fill={hotPart === p.id ? '#7df3ff' : 'rgba(65,230,255,.5)'} style={hotPart === p.id ? { filter: 'drop-shadow(0 0 3px #7df3ff)' } : undefined} />
            ))}
          </svg>
          <div className="text-center text-[8px] tracking-[0.3em] text-cyan-200/40 mt-0.5">RADAR</div>
        </div>

        {/* 底部提示 */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] text-white/28 pointer-events-none whitespace-nowrap">
          SCROLL: SCAN → DISASSEMBLE → INNER FRAME → COMBAT READY · CLICK PART TO FOCUS
        </div>
      </div>
      <div style={{ height: '600vh' }} />
    </div>
  )
}
