import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ═══════════════════════════════════════════════════════════════
   3D KEYBOARD CONFIGURATOR SHOWCASE
   Three.js 60% keyboard visualizer inspired by MODKEYS
   Light-theme, detailed keycaps with labels, chamfered edges
   ═══════════════════════════════════════════════════════════════ */

interface ColorScheme {
  name: string
  caseColor: number
  capColor: number
  switchColor: number
  accentColor: number
  knobColor: number
  groundColor: number
  textColor: string
  sceneBg: number
}

/** 4 套配色方案 — 浅色背景适配 */
const SCHEMES: ColorScheme[] = [
  {
    name: 'Classic',
    caseColor: 0x4a4a4a,
    capColor: 0xf8f9fa,
    switchColor: 0x6c757d,
    accentColor: 0xdc3545,
    knobColor: 0xadb5bd,
    groundColor: 0xd0d5db,
    textColor: '#1a1a1a',
    sceneBg: 0xe8eaed,
  },
  {
    name: 'Sakura',
    caseColor: 0xc2185b,
    capColor: 0xfce4ec,
    switchColor: 0xf48fb1,
    accentColor: 0x880e4f,
    knobColor: 0xec407a,
    groundColor: 0xf3c4d7,
    textColor: '#4a1c2e',
    sceneBg: 0xfce4ec,
  },
  {
    name: 'Ocean',
    caseColor: 0x1565c0,
    capColor: 0xe3f2fd,
    switchColor: 0x42a5f5,
    accentColor: 0x0d47a1,
    knobColor: 0x0277bd,
    groundColor: 0xbbdefb,
    textColor: '#0d1b2a',
    sceneBg: 0xe0f7fa,
  },
  {
    name: 'Forest',
    caseColor: 0x2e7d32,
    capColor: 0xe8f5e9,
    switchColor: 0x66bb6a,
    accentColor: 0x1b5e20,
    knobColor: 0x43a047,
    groundColor: 0xc8e6c9,
    textColor: '#1b3a1b',
    sceneBg: 0xe8f5e9,
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

const UNIT = 1.0
const GAP = 0.08
const TOTAL_WIDTH_UNITS = 15

/** easeOutBack 缓动 */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** 将 0xRRGGBB 转为 CSS #rrggbb */
function hexToCss(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}

/** 创建键帽顶面文字纹理 */
function createKeycapTexture(
  label: string,
  bgColor: number,
  textColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // 背景
  ctx.fillStyle = hexToCss(bgColor)
  ctx.fillRect(0, 0, 512, 512)

  // 文字
  ctx.fillStyle = textColor
  // 根据标签长度调整字号
  const fontSize = label.length > 4 ? 140 : label.length > 2 ? 180 : 220
  ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 256, 256)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** 创建台形键帽几何体：顶部比底部窄，形成自然斜面 */
function makeKeycapGeometry(w: number, d: number, h: number): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w, h, d, 2, 1, 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y > 0) {
      // 顶面缩小 15%，形成台形
      pos.setX(i, pos.getX(i) * 0.85)
      pos.setZ(i, pos.getZ(i) * 0.85)
    }
  }
  geo.computeVertexNormals()
  return geo
}

/** 创建键帽侧面材质（纯色） */
function makeSideMaterial(color: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.02,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
  })
}

/** 创建键帽顶面材质（带文字纹理） */
function makeTopMaterial(
  texture: THREE.CanvasTexture
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness: 0.02,
    roughness: 0.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
  })
}

/** 创建机械轴体细节（housing + stem + spring） */
function createSwitchDetail(w: number, d: number, color: number): THREE.Group {
  const group = new THREE.Group()

  // Housing 底座外壳
  const housingGeo = new THREE.BoxGeometry(w * 0.72, 0.32, d * 0.72)
  const housingMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85,
  })
  const housing = new THREE.Mesh(housingGeo, housingMat)
  housing.position.y = 0.06
  housing.castShadow = true
  group.add(housing)

  // 轴心 Stem（十字形）
  const stemGroup = new THREE.Group()
  stemGroup.position.y = 0.26

  const stemMat = new THREE.MeshPhysicalMaterial({
    color: 0xdddddd,
    metalness: 0.05,
    roughness: 0.3,
  })

  // 中心柱
  const stemCenterGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8)
  const stemCenter = new THREE.Mesh(stemCenterGeo, stemMat)
  stemGroup.add(stemCenter)

  // 十字翼
  const wingGeo = new THREE.BoxGeometry(0.16, 0.16, 0.025)
  const wing1 = new THREE.Mesh(wingGeo, stemMat)
  const wing2 = new THREE.Mesh(wingGeo, stemMat)
  wing2.rotation.y = Math.PI / 2
  stemGroup.add(wing1)
  stemGroup.add(wing2)

  group.add(stemGroup)

  // 弹簧（细圆柱模拟）
  const springGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.22, 8)
  const springMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.7,
    roughness: 0.25,
  })
  const spring = new THREE.Mesh(springGeo, springMat)
  spring.position.y = 0.14
  group.add(spring)

  return group
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
  const switchDetailsRef = useRef<THREE.Group[]>([])

  /* ── Shared material refs ── */
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
    sceneBg: THREE.Color
  }>({
    case: new THREE.Color(SCHEMES[0].caseColor),
    cap: new THREE.Color(SCHEMES[0].capColor),
    capAccent: new THREE.Color(SCHEMES[0].accentColor),
    switch: new THREE.Color(SCHEMES[0].switchColor),
    knob: new THREE.Color(SCHEMES[0].knobColor),
    ground: new THREE.Color(SCHEMES[0].groundColor),
    sceneBg: new THREE.Color(SCHEMES[0].sceneBg),
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
    prevKey: THREE.Mesh | null
    defaultPos: THREE.Vector3
  }>({ key: null, prevKey: null, defaultPos: new THREE.Vector3(10, 12, 14) })
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

    const scheme = SCHEMES[0]

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(scheme.sceneBg)
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
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

    // ── Lights (adapted for light background) ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.65)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3)
    dirLight.position.set(8, 18, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 60
    dirLight.shadow.camera.left = -14
    dirLight.shadow.camera.right = 14
    dirLight.shadow.camera.top = 14
    dirLight.shadow.camera.bottom = -14
    dirLight.shadow.bias = -0.0003
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-6, 10, -6)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.25)
    rimLight.position.set(0, 5, -12)
    scene.add(rimLight)

    // ── Ground ──
    const groundGeo = new THREE.PlaneGeometry(80, 80)
    const groundMat = new THREE.MeshStandardMaterial({
      color: scheme.groundColor,
      roughness: 0.85,
      metalness: 0.05,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -2.2
    ground.receiveShadow = true
    scene.add(ground)
    groundMeshRef.current = ground
    matsRef.current.ground = groundMat

    // ── Case (机壳) ──
    const caseGeo = new THREE.BoxGeometry(16.2, 0.55, 6.2)
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: scheme.caseColor,
      metalness: 0.25,
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    })
    const caseMesh = new THREE.Mesh(caseGeo, caseMat)
    caseMesh.position.y = -0.275
    caseMesh.castShadow = true
    caseMesh.receiveShadow = true
    scene.add(caseMesh)
    caseMeshRef.current = caseMesh
    matsRef.current.case = caseMat

    // ── Build Switches & Key Caps ──
    const keyMeshes: THREE.Mesh[] = []
    const switchMeshes: THREE.Mesh[] = []

    KEYBOARD_ROWS.forEach((row, rowIdx) => {
      const zBase = -2.0 + rowIdx * UNIT
      let xCursor = -TOTAL_WIDTH_UNITS / 2

      row.forEach(([w, label], colIdx) => {
        const isAccent =
          (rowIdx === 0 && colIdx === 0) ||
          (rowIdx === 2 && colIdx === row.length - 1) ||
          (rowIdx === 4 && colIdx === 3)

        const keyW = w * UNIT - GAP
        const keyD = UNIT - GAP
        const keyH = 0.55
        const x = xCursor + (w * UNIT) / 2

        // Switch detail (housing + stem + spring)
        const switchDetail = createSwitchDetail(keyW, keyD, scheme.switchColor)
        switchDetail.position.set(x, 0, zBase)
        scene.add(switchDetail)
        switchDetailsRef.current.push(switchDetail)

        // Keep housing material ref for color transitions
        const housingMesh = switchDetail.children[0] as THREE.Mesh
        switchMeshes.push(housingMesh)

        // Key cap — 台形主体 + 顶面文字
        const capColor = isAccent ? scheme.accentColor : scheme.capColor
        const capGeo = makeKeycapGeometry(keyW, keyD, keyH)

        // 顶面纹理
        const topTex = createKeycapTexture(
          label,
          capColor,
          scheme.textColor
        )
        // 侧面/底面材质
        const sideMat = makeSideMaterial(capColor)
        // 顶面材质
        const topMat = makeTopMaterial(topTex)

        // 多材质数组: 右,左,上,下,前,后
        const capMaterials: THREE.MeshPhysicalMaterial[] = [
          sideMat, sideMat, topMat, sideMat, sideMat, sideMat,
        ]

        const capMesh = new THREE.Mesh(capGeo, capMaterials)
        const targetY = 0.35 + keyH / 2
        capMesh.position.set(x, targetY, zBase)
        capMesh.castShadow = true
        capMesh.receiveShadow = true
        capMesh.userData = {
          targetY,
          isAccent,
          label,
          topTex,     // 保存引用，切换颜色时更新
          sideMat,    // 保存引用
          topMat,     // 保存引用
        }
        scene.add(capMesh)
        keyMeshes.push(capMesh)

        xCursor += w * UNIT
      })
    })

    keyMeshesRef.current = keyMeshes
    switchMeshesRef.current = switchMeshes

    // ── Knob ──
    const knobGroup = new THREE.Group()
    const knobGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.8, 32)
    const knobMat = new THREE.MeshPhysicalMaterial({
      color: scheme.knobColor,
      metalness: 0.35,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    })
    const knobMesh = new THREE.Mesh(knobGeo, knobMat)
    knobMesh.position.y = 0.4
    knobMesh.castShadow = true
    knobGroup.add(knobMesh)

    const indGeo = new THREE.BoxGeometry(0.1, 0.5, 0.45)
    const indMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
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
      delay: Math.random() * 500,
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

    let prevHovered: THREE.Mesh | null = null
    const defaultEmissive = new THREE.Color(0x000000)
    const hoverEmissive = new THREE.Color(0x66aaff)

    // ── Animation Loop ──
    const animate = () => {
      const t = targetsRef.current
      const m = matsRef.current
      const lerpSpeed = 0.06

      // 1) 颜色过渡
      if (m.case) m.case.color.lerp(t.case, lerpSpeed)
      if (m.knob) m.knob.color.lerp(t.knob, lerpSpeed)
      if (m.ground) m.ground.color.lerp(t.ground, lerpSpeed)
      if (scene.background) (scene.background as THREE.Color).lerp(t.sceneBg, lerpSpeed)

      // 2) 键帽/开关颜色过渡
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
          if (progress <= 0) { allDone = false; return }
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

      // 4) Raycaster hover detection — single key fly-out + zoom + tilt
      if (!isUserDragging.current) {
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(keyMeshes)
        const hit = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null

        // 当 hover 对象变化时，把旧对象移入 prevKey 持续恢复
        if (prevHovered && prevHovered !== hit) {
          hoverRef.current.prevKey = prevHovered
        }

        // 持续恢复 prevKey（每帧执行直到完全归位）
        const pk = hoverRef.current.prevKey
        if (pk) {
          const mats = pk.material as THREE.MeshPhysicalMaterial[]
          mats.forEach((mat) => {
            mat.emissive.lerp(defaultEmissive, 0.15)
            mat.emissiveIntensity = Math.max(0, mat.emissiveIntensity - 0.05)
          })
          const ty = pk.userData.targetY as number
          pk.position.y += (ty - pk.position.y) * 0.15
          const s = pk.scale.x + (1 - pk.scale.x) * 0.15
          pk.scale.set(s, s, s)
          pk.rotation.x += (0 - pk.rotation.x) * 0.15
          pk.rotation.z += (0 - pk.rotation.z) * 0.15

          // 判断是否已完全归位
          const isHome =
            Math.abs(pk.position.y - ty) < 0.001 &&
            Math.abs(pk.scale.x - 1) < 0.001 &&
            Math.abs(pk.rotation.x) < 0.001 &&
            Math.abs(pk.rotation.z) < 0.001
          if (isHome) {
            pk.position.y = ty
            pk.scale.set(1, 1, 1)
            pk.rotation.x = 0
            pk.rotation.z = 0
            mats.forEach((mat) => {
              mat.emissive.copy(defaultEmissive)
              mat.emissiveIntensity = 0
            })
            hoverRef.current.prevKey = null
          }
        }

        if (hit) {
          const mats = hit.material as THREE.MeshPhysicalMaterial[]
          mats.forEach((mat) => {
            mat.emissive.lerp(hoverEmissive, 0.1)
            mat.emissiveIntensity = 0.35
          })

          // 飞出：向上露出轴体
          const ty = (hit.userData.targetY as number) + 1.0
          hit.position.y += (ty - hit.position.y) * 0.1

          // 放大
          const ts = 1.4
          const s = hit.scale.x + (ts - hit.scale.x) * 0.1
          hit.scale.set(s, s, s)

          // 微微倾斜展示侧面和底部
          hit.rotation.x += (0.3 - hit.rotation.x) * 0.1
          hit.rotation.z += (0.08 - hit.rotation.z) * 0.1

          // 相机轻微拉近但不完全聚焦
          const kp = hit.position
          cameraGoalRef.current.pos.set(kp.x + 2.5, kp.y + 3.5, kp.z + 5)
          cameraGoalRef.current.target.set(kp.x, kp.y * 0.3, kp.z)

          setHoveredLabel(hit.userData.label as string || null)
          hoverRef.current.key = hit
        } else {
          cameraGoalRef.current.pos.set(10, 12, 14)
          cameraGoalRef.current.target.set(0, 0.5, 0)
          setHoveredLabel(null)
          hoverRef.current.key = null
        }

        prevHovered = hit
      }

      // 5) Smooth camera interpolation
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

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const mat = obj.material
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if ((m as THREE.MeshPhysicalMaterial).map) {
                ;(m as THREE.MeshPhysicalMaterial).map!.dispose()
              }
              m.dispose()
            })
          } else {
            if ((mat as THREE.MeshPhysicalMaterial).map) {
              ;(mat as THREE.MeshPhysicalMaterial).map!.dispose()
            }
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
    targetsRef.current.sceneBg.setHex(s.sceneBg)

    // Update keycap textures for new color scheme
    keyMeshesRef.current.forEach((mesh) => {
      const isAccent = mesh.userData.isAccent as boolean
      const label = mesh.userData.label as string
      const capColor = isAccent ? s.accentColor : s.capColor

      // Dispose old texture
      const mats = mesh.material as THREE.MeshPhysicalMaterial[]
      const oldTopMat = mats[2] // top face
      if (oldTopMat.map) oldTopMat.map.dispose()

      // Create new texture
      const newTex = createKeycapTexture(label, capColor, s.textColor)
      oldTopMat.map = newTex
      oldTopMat.needsUpdate = true

      // Update side materials color
      mats.forEach((mat, i) => {
        if (i !== 2) mat.color.setHex(capColor)
      })
    })
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

  const scheme = SCHEMES[schemeIdx]
  const panelText = '#1a1a2e'
  const panelSub = 'rgba(26,26,46,0.5)'

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl"
      style={{ background: hexToCss(scheme.sceneBg) }}>
      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Hovered key label (top-center) ── */}
      {hoveredLabel && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl select-none pointer-events-none transition-opacity duration-200"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            color: scheme.textColor,
          }}
        >
          <span className="text-lg font-bold tracking-wide">{hoveredLabel}</span>
        </div>
      )}

      {/* ── Control Panel (top-right) ── */}
      <div
        className="absolute top-4 right-4 z-10 w-64 rounded-2xl p-5 select-none"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          color: panelText,
        }}
      >
        <h2 className="text-base font-bold mb-0.5 tracking-tight">Keyboard Configurator</h2>
        <p className="text-[11px] mb-4" style={{ color: panelSub }}>MODKEYS inspired showcase</p>

        {/* Colorway selector */}
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider mb-2 font-semibold" style={{ color: panelSub }}>
            Colorway
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SCHEMES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => applyScheme(i)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border"
                style={{
                  borderColor: schemeIdx === i ? 'rgba(0,0,0,0.15)' : 'transparent',
                  background: schemeIdx === i ? 'rgba(0,0,0,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (schemeIdx !== i) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (schemeIdx !== i) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="w-3 h-3 rounded-full border shrink-0"
                  style={{ backgroundColor: hexToCss(s.accentColor), borderColor: 'rgba(0,0,0,0.15)' }}
                />
                <span className="truncate" style={{ color: panelText }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider mb-2 font-semibold" style={{ color: panelSub }}>
            Actions
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerPop}
              disabled={isPopping}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isPopping ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.08)',
                color: isPopping ? 'rgba(26,26,46,0.3)' : panelText,
                cursor: isPopping ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPopping) e.currentTarget.style.background = 'rgba(0,0,0,0.14)'
              }}
              onMouseLeave={(e) => {
                if (!isPopping) e.currentTarget.style.background = 'rgba(0,0,0,0.08)'
              }}
            >
              {isPopping ? 'Popping…' : 'Pop Keys'}
            </button>
            <button
              onClick={() => setShowKnob((v) => !v)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(0,0,0,0.08)', color: panelText }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.14)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)' }}
            >
              {showKnob ? 'Hide Knob' : 'Show Knob'}
            </button>
          </div>
        </div>

        {/* Stats footer */}
        <div className="pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between text-[11px]" style={{ color: panelSub }}>
            <span>Keys: 61</span>
            <span>60% Layout</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left hint ── */}
      <div
        className="absolute bottom-4 left-4 z-10 rounded-xl px-4 py-3 text-xs select-none"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.06)',
          color: 'rgba(26,26,46,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(26,26,46,0.25)' }} />
          <span>Left drag to rotate</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(26,26,46,0.25)' }} />
          <span>Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(26,26,46,0.25)' }} />
          <span>Right drag to pan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(25,118,210,0.5)' }} />
          <span>Hover key for close-up</span>
        </div>
      </div>
    </div>
  )
}
