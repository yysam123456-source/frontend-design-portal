import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ═══════════════════════════════════════════════════════════════
   3D KEYBOARD CONFIGURATOR SHOWCASE
   Three.js 60% keyboard visualizer inspired by MODKEYS
   ═══════════════════════════════════════════════════════════════ */

interface ColorScheme {
  name: string
  caseColor: number
  capColor: number
  switchColor: number
  accentColor: number
  knobColor: number
  groundColor: number
}

/** 4 套配色方案 */
const SCHEMES: ColorScheme[] = [
  {
    name: 'Classic B&W',
    caseColor: 0x2a2a2a,
    capColor: 0xe8e8e8,
    switchColor: 0x444444,
    accentColor: 0x888888,
    knobColor: 0xcccccc,
    groundColor: 0x111111,
  },
  {
    name: 'Sakura Pink',
    caseColor: 0xfce4ec,
    capColor: 0xfff0f5,
    switchColor: 0xf8bbd0,
    accentColor: 0xec407a,
    knobColor: 0xf48fb1,
    groundColor: 0x2a0a1a,
  },
  {
    name: 'Ocean Blue',
    caseColor: 0x0d1b2a,
    capColor: 0x1b263b,
    switchColor: 0x415a77,
    accentColor: 0x00b4d8,
    knobColor: 0x0077b6,
    groundColor: 0x050a14,
  },
  {
    name: 'Cyber Purple',
    caseColor: 0x1a0b2e,
    capColor: 0x2d1b4e,
    switchColor: 0x7b2cbf,
    accentColor: 0xe0aaff,
    knobColor: 0x9d4edd,
    groundColor: 0x0d0518,
  },
]

/** 简化 60% 键盘布局：每行是一组 [宽度, 标签] */
const KEYBOARD_ROWS: [number, string][][] = [
  [[1,'Esc'],[1,'1'],[1,'2'],[1,'3'],[1,'4'],[1,'5'],[1,'6'],[1,'7'],[1,'8'],[1,'9'],[1,'0'],[1,'-'],[1,'='],[2,'Bksp']],
  [[1.5,'Tab'],[1,'Q'],[1,'W'],[1,'E'],[1,'R'],[1,'T'],[1,'Y'],[1,'U'],[1,'I'],[1,'O'],[1,'P'],[1,'['],[1,']'],[1.5,'\\']],
  [[1.75,'Caps'],[1,'A'],[1,'S'],[1,'D'],[1,'F'],[1,'G'],[1,'H'],[1,'J'],[1,'K'],[1,'L'],[1,';'],[1,"'"],[2.25,'Enter']],
  [[2.25,'Shift'],[1,'Z'],[1,'X'],[1,'C'],[1,'V'],[1,'B'],[1,'N'],[1,'M'],[1,','],[1,'.'],[1,'/'],[2.75,'Shift']],
  [[1.25,'Ctrl'],[1.25,'Win'],[1.25,'Alt'],[6.25,'Space'],[1.25,'Alt'],[1.25,'Fn'],[1.25,'Menu'],[1.25,'Ctrl']],
]

const UNIT = 1.0          // 单位键宽对应的场景单位
const GAP = 0.08          // 键帽间微小间隙
const TOTAL_WIDTH_UNITS = 15

/** easeOutBack 缓动 —— 让键帽弹入带有轻微的回弹感 */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** 将 0xRRGGBB 转为 CSS #rrggbb */
function hexToCss(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}

export default function KeyboardConfigShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [schemeIdx, setSchemeIdx] = useState(0)
  const [showKnob, setShowKnob] = useState(true)
  const [isPopping, setIsPopping] = useState(false)

  /* ── Three.js core refs ── */
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rafRef = useRef(0)

  /* ── Object refs ── */
  const caseMeshRef = useRef<THREE.Mesh | null>(null)
  const knobGroupRef = useRef<THREE.Group | null>(null)
  const groundMeshRef = useRef<THREE.Mesh | null>(null)
  const keyMeshesRef = useRef<THREE.Mesh[]>([])
  const switchMeshesRef = useRef<THREE.Mesh[]>([])

  /* ── Shared material refs (for direct-use objects) ── */
  const matsRef = useRef<{
    case: THREE.MeshPhysicalMaterial | null
    knob: THREE.MeshPhysicalMaterial | null
    ground: THREE.MeshStandardMaterial | null
  }>({ case: null, knob: null, ground: null })

  /* ── Color transition targets ── */
  const targetsRef = useRef<{
    case: THREE.Color
    cap: THREE.Color
    capAccent: THREE.Color
    switch: THREE.Color
    knob: THREE.Color
    ground: THREE.Color
  }>({
    case: new THREE.Color(SCHEMES[0].caseColor),
    cap: new THREE.Color(SCHEMES[0].capColor),
    capAccent: new THREE.Color(SCHEMES[0].accentColor),
    switch: new THREE.Color(SCHEMES[0].switchColor),
    knob: new THREE.Color(SCHEMES[0].knobColor),
    ground: new THREE.Color(SCHEMES[0].groundColor),
  })

  /* ── Pop animation state ── */
  const popRef = useRef<{
    active: boolean
    startTime: number
    items: { mesh: THREE.Mesh; targetY: number; delay: number; done: boolean }[]
  } | null>(null)

  /* ── Hover zoom state ── */
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const hoverRef = useRef<{
    key: THREE.Mesh | null
    defaultPos: THREE.Vector3
  }>({ key: null, defaultPos: new THREE.Vector3(10, 12, 14) })
  const mouseRef = useRef(new THREE.Vector2(-999, -999))
  const raycasterRef = useRef(new THREE.Raycaster())
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 }>({
    pos: new THREE.Vector3(10, 12, 14),
    target: new THREE.Vector3(0, 0.5, 0),
  })
  const isUserDragging = useRef(false)

  /* ═══════════════════════════════════════════════════════════
     INIT: build the entire Three.js scene
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(10, 12, 14)
    camera.lookAt(0, 0.5, 0)
    cameraRef.current = camera

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── OrbitControls ──
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 5
    controls.maxDistance = 40
    controls.target.set(0, 0.5, 0)
    controlsRef.current = controls

    // ── Lights ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(8, 15, 8)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 50
    dirLight.shadow.camera.left = -12
    dirLight.shadow.camera.right = 12
    dirLight.shadow.camera.top = 12
    dirLight.shadow.camera.bottom = -12
    dirLight.shadow.bias = -0.0005
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 8, -5)
    scene.add(fillLight)

    // ── Ground (shadow catcher) ──
    const groundGeo = new THREE.PlaneGeometry(60, 60)
    const groundMat = new THREE.MeshStandardMaterial({
      color: SCHEMES[0].groundColor,
      roughness: 0.9,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -2
    ground.receiveShadow = true
    scene.add(ground)
    groundMeshRef.current = ground
    matsRef.current.ground = groundMat

    // ── Case (机壳) ──
    const caseGeo = new THREE.BoxGeometry(16.2, 0.5, 6.2)
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: SCHEMES[0].caseColor,
      metalness: 0.3,
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    })
    const caseMesh = new THREE.Mesh(caseGeo, caseMat)
    caseMesh.position.y = -0.25
    caseMesh.castShadow = true
    caseMesh.receiveShadow = true
    scene.add(caseMesh)
    caseMeshRef.current = caseMesh
    matsRef.current.case = caseMat

    // ── Prepare shared key materials (will be cloned per mesh) ──
    const capMatProto = new THREE.MeshPhysicalMaterial({
      color: SCHEMES[0].capColor,
      metalness: 0.05,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    })
    const capAccentProto = new THREE.MeshPhysicalMaterial({
      color: SCHEMES[0].accentColor,
      metalness: 0.05,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    })
    const switchProto = new THREE.MeshPhysicalMaterial({
      color: SCHEMES[0].switchColor,
      metalness: 0.5,
      roughness: 0.55,
    })

    // ── Build Switches & Key Caps ──
    const keyMeshes: THREE.Mesh[] = []
    const switchMeshes: THREE.Mesh[] = []

    KEYBOARD_ROWS.forEach((row, rowIdx) => {
      const zBase = -2.0 + rowIdx * UNIT
      let xCursor = -TOTAL_WIDTH_UNITS / 2

      row.forEach(([w, label], colIdx) => {
        // 标记特殊键（Esc / Enter / Space）使用 accent 色
        const isAccent =
          (rowIdx === 0 && colIdx === 0) ||   // Esc
          (rowIdx === 2 && colIdx === row.length - 1) || // Enter
          (rowIdx === 4 && colIdx === 3)      // Space

        const keyW = w * UNIT - GAP
        const keyD = UNIT - GAP
        const keyH = 0.5
        const x = xCursor + (w * UNIT) / 2

        // Switch（开关）— 位于键帽下方的小长方体
        const swGeo = new THREE.BoxGeometry(keyW * 0.75, 0.35, keyD * 0.75)
        const swMat = switchProto.clone()
        const swMesh = new THREE.Mesh(swGeo, swMat)
        swMesh.position.set(x, 0.075, zBase)
        swMesh.castShadow = true
        scene.add(swMesh)
        switchMeshes.push(swMesh)

        // Key cap（键帽）
        const capGeo = new THREE.BoxGeometry(keyW, keyH, keyD)
        const capMat = isAccent ? capAccentProto.clone() : capMatProto.clone()
        const capMesh = new THREE.Mesh(capGeo, capMat)
        const targetY = 0.35 + keyH / 2 // 0.6
        capMesh.position.set(x, targetY, zBase)
        capMesh.castShadow = true
        capMesh.receiveShadow = true
        capMesh.userData = { targetY, isAccent, label }
        scene.add(capMesh)
        keyMeshes.push(capMesh)

        xCursor += w * UNIT
      })
    })

    keyMeshesRef.current = keyMeshes
    switchMeshesRef.current = switchMeshes

    // ── Knob（旋钮）— 右上角圆柱体配件 ──
    const knobGroup = new THREE.Group()
    const knobGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.8, 32)
    const knobMat = new THREE.MeshPhysicalMaterial({
      color: SCHEMES[0].knobColor,
      metalness: 0.4,
      roughness: 0.3,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
    })
    const knobMesh = new THREE.Mesh(knobGeo, knobMat)
    knobMesh.position.y = 0.4
    knobMesh.castShadow = true
    knobGroup.add(knobMesh)

    // 旋钮上的指示刻线
    const indGeo = new THREE.BoxGeometry(0.1, 0.5, 0.45)
    const indMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    const indMesh = new THREE.Mesh(indGeo, indMat)
    indMesh.position.set(0, 0.4, 0.55)
    knobGroup.add(indMesh)

    knobGroup.position.set(6.5, 0, -2.2)
    scene.add(knobGroup)
    knobGroupRef.current = knobGroup
    matsRef.current.knob = knobMat

    // ── 首次加载：触发键帽弹入动画 ──
    const initialItems = keyMeshes.map((mesh) => ({
      mesh,
      targetY: mesh.userData.targetY as number,
      delay: Math.random() * 500, // 0~500ms 随机延迟，形成波浪
      done: false,
    }))
    initialItems.forEach((item) => {
      item.mesh.position.y = item.targetY - 4
      item.mesh.scale.set(0, 0, 0)
    })
    popRef.current = {
      active: true,
      startTime: performance.now(),
      items: initialItems,
    }
    setIsPopping(true)

    // ── Raycaster for hover detection ──
    const raycaster = raycasterRef.current
    const mouse = mouseRef.current

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    const onPointerDown = () => { isUserDragging.current = true }
    const onPointerUp = () => { isUserDragging.current = false }
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    // Track previous hovered key for un-highlight
    let prevHovered: THREE.Mesh | null = null
    const defaultEmissive = new THREE.Color(0x000000)
    const hoverEmissive = new THREE.Color(0x3388ff)

    // ── Animation Loop ──
    const animate = () => {
      const t = targetsRef.current
      const m = matsRef.current
      const lerpSpeed = 0.06

      // 1) 颜色过渡（直接引用的材质）
      if (m.case) m.case.color.lerp(t.case, lerpSpeed)
      if (m.knob) m.knob.color.lerp(t.knob, lerpSpeed)
      if (m.ground) m.ground.color.lerp(t.ground, lerpSpeed)

      // 2) 颜色过渡（clone 出来的键帽/开关材质）
      keyMeshes.forEach((km) => {
        const mat = km.material as THREE.MeshPhysicalMaterial
        const target = km.userData.isAccent ? t.capAccent : t.cap
        mat.color.lerp(target, lerpSpeed)
      })
      switchMeshes.forEach((sm) => {
        const mat = sm.material as THREE.MeshPhysicalMaterial
        mat.color.lerp(t.switch, lerpSpeed)
      })

      // 3) 键帽弹出动画
      if (popRef.current?.active) {
        const elapsed = performance.now() - popRef.current.startTime
        let allDone = true
        popRef.current.items.forEach((item) => {
          if (item.done) return
          const progress = Math.max(0, Math.min(1, (elapsed - item.delay) / 700))
          if (progress <= 0) {
            allDone = false
            return
          }
          if (progress >= 1) {
            item.mesh.position.y = item.targetY
            item.mesh.scale.set(1, 1, 1)
            item.done = true
          } else {
            const ease = easeOutBack(progress)
            item.mesh.position.y = item.targetY - 4 + 4 * ease
            const s = Math.max(0, ease)
            item.mesh.scale.set(s, s, s)
            allDone = false
          }
        })
        if (allDone) {
          popRef.current.active = false
          setIsPopping(false)
        }
      }

      // 4) Raycaster: detect hovered key
      if (!isUserDragging.current) {
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(keyMeshes)
        const hit = hits.length > 0 ? hits[0].object as THREE.Mesh : null

        // Un-highlight previous
        if (prevHovered && prevHovered !== hit) {
          const mat = prevHovered.material as THREE.MeshPhysicalMaterial
          mat.emissive.copy(defaultEmissive)
          mat.emissiveIntensity = 0
          // Smoothly return position
          const ty = prevHovered.userData.targetY as number
          prevHovered.position.y += (ty - prevHovered.position.y) * 0.15
        }

        if (hit) {
          const mat = hit.material as THREE.MeshPhysicalMaterial
          mat.emissive.lerp(hoverEmissive, 0.12)
          mat.emissiveIntensity = 0.35
          // Slight lift effect
          const ty = (hit.userData.targetY as number) + 0.15
          hit.position.y += (ty - hit.position.y) * 0.12

          // Set camera goal to focus on this key
          const kp = hit.position
          cameraGoalRef.current.pos.set(kp.x + 2, kp.y + 4, kp.z + 5)
          cameraGoalRef.current.target.copy(kp)

          setHoveredLabel(hit.userData.label as string || null)
          hoverRef.current.key = hit
        } else {
          // Reset camera to default
          cameraGoalRef.current.pos.set(10, 12, 14)
          cameraGoalRef.current.target.set(0, 0.5, 0)
          setHoveredLabel(null)
          hoverRef.current.key = null
        }

        prevHovered = hit
      }

      // 5) Smooth camera interpolation (only when not dragging)
      if (!isUserDragging.current) {
        camera.position.lerp(cameraGoalRef.current.pos, 0.04)
        controls.target.lerp(cameraGoalRef.current.target, 0.04)
      }

      controls.update()
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    // ── Resize handler ──
    const onResize = () => {
      if (!container || !camera || !renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()

      // 遍历场景，安全 dispose 所有 geometry / material
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const mat = obj.material
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose())
          } else {
            mat.dispose()
          }
        }
      })

      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  /* ═══════════════════════════════════════════════════════════
     INTERACTION: color scheme switching
     ═══════════════════════════════════════════════════════════ */
  const applyScheme = useCallback((idx: number) => {
    setSchemeIdx(idx)
    const s = SCHEMES[idx]
    targetsRef.current.case.setHex(s.caseColor)
    targetsRef.current.cap.setHex(s.capColor)
    targetsRef.current.capAccent.setHex(s.accentColor)
    targetsRef.current.switch.setHex(s.switchColor)
    targetsRef.current.knob.setHex(s.knobColor)
    targetsRef.current.ground.setHex(s.groundColor)
  }, [])

  /* ── Toggle knob visibility ── */
  useEffect(() => {
    if (knobGroupRef.current) {
      knobGroupRef.current.visible = showKnob
    }
  }, [showKnob])

  /* ── Pop keys trigger ── */
  const triggerPop = useCallback(() => {
    if (isPopping) return
    const items = keyMeshesRef.current.map((mesh) => ({
      mesh,
      targetY: mesh.userData.targetY as number,
      delay: Math.random() * 500,
      done: false,
    }))
    items.forEach((item) => {
      item.mesh.position.y = item.targetY - 4
      item.mesh.scale.set(0, 0, 0)
    })
    popRef.current = {
      active: true,
      startTime: performance.now(),
      items,
    }
    setIsPopping(true)
  }, [isPopping])

  /* ═══════════════════════════════════════════════════════════
     RENDER: canvas + glassmorphism UI overlay
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0a0a0a] overflow-hidden rounded-xl">
      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Hovered key label (top-center) ── */}
      {hoveredLabel && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-white select-none pointer-events-none transition-opacity duration-200"
          style={{
            background: 'rgba(51,136,255,0.2)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(51,136,255,0.3)',
            boxShadow: '0 0 20px rgba(51,136,255,0.15)',
          }}
        >
          <span className="text-lg font-bold tracking-wide">{hoveredLabel}</span>
        </div>
      )}

      {/* ── Control Panel (top-right) ── */}
      <div
        className="absolute top-4 right-4 z-10 w-64 rounded-2xl p-5 text-white select-none"
        style={{
          background: 'rgba(20,20,30,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h2 className="text-base font-bold mb-0.5 tracking-tight">3D Keyboard Configurator</h2>
        <p className="text-[11px] text-white/40 mb-4">MODKEYS inspired showcase</p>

        {/* Colorway selector */}
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider text-white/50 mb-2 font-semibold">
            Colorway
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SCHEMES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => applyScheme(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  schemeIdx === i
                    ? 'border-white/30 bg-white/10'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: hexToCss(s.accentColor) }}
                />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider text-white/50 mb-2 font-semibold">
            Actions
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerPop}
              disabled={isPopping}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                isPopping
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isPopping ? 'Popping…' : 'Pop Keys'}
            </button>
            <button
              onClick={() => setShowKnob((v) => !v)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all bg-white/10 hover:bg-white/20 text-white"
            >
              {showKnob ? 'Hide Knob' : 'Show Knob'}
            </button>
          </div>
        </div>

        {/* Stats footer */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>Keys: 61</span>
            <span>60% Layout</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left hint ── */}
      <div
        className="absolute bottom-4 left-4 z-10 rounded-xl px-4 py-3 text-xs text-white/40 select-none"
        style={{
          background: 'rgba(20,20,30,0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span>Left drag to rotate</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span>Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span>Right drag to pan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
          <span>Hover key for close-up</span>
        </div>
      </div>
    </div>
  )
}
