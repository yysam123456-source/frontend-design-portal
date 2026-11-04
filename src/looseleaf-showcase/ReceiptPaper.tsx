import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * A physically simulated paper receipt.
 *
 * The simulation follows the "paper, not CSS" approach: a Verlet particle grid,
 * four classes of distance constraints, the whole top row pinned, and a
 * smoothstep-weighted grab area so the sheet bends instead of denting. Text is
 * baked into a CanvasTexture so it deforms with the paper instead of floating
 * above it as DOM.
 */

const COLS = 27
const ROWS = 50
const PAPER_W = 2.15
const PAPER_H = 3.34

const DAMPING = 0.92
const GRAVITY = 0.00032
const ITERATIONS = 6
const FIXED_DT = 1 / 60

type Grab = {
  pointerId: number
  col: number
  row: number
  weights: Float32Array
  offsetX: Float32Array
  offsetY: Float32Array
}

function drawReceipt(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const ink = '#2a2420'
  const pencil = '#6b6660'
  const red = '#c2412d'
  const paper = '#fbfaf2'

  ctx.clearRect(0, 0, w, h)

  // Pinked top and bottom edges.
  const tooth = 22
  const teeth = 32
  const step = w / teeth
  ctx.beginPath()
  ctx.moveTo(0, tooth)
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(i * step + step / 2, 2)
    ctx.lineTo((i + 1) * step, tooth)
  }
  ctx.lineTo(w, h - tooth)
  for (let i = teeth - 1; i >= 0; i--) {
    ctx.lineTo(i * step + step / 2, h - 2)
    ctx.lineTo(i * step, h - tooth)
  }
  ctx.closePath()
  ctx.fillStyle = paper
  ctx.fill()

  ctx.save()
  ctx.clip()

  // Paper grain: a very light scatter of fibres and speckles.
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const a = Math.random() * 0.045
    ctx.fillStyle = `rgba(120, 104, 78, ${a})`
    ctx.fillRect(x, y, Math.random() * 2 + 0.6, Math.random() * 2 + 0.6)
  }
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * w
    ctx.strokeStyle = `rgba(120, 104, 78, ${Math.random() * 0.035})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, Math.random() * h * 0.5)
    ctx.lineTo(x + Math.random() * 4 - 2, Math.random() * h * 0.6 + h * 0.4)
    ctx.stroke()
  }

  // A faint fold down the middle.
  const fold = ctx.createLinearGradient(w / 2 - 26, 0, w / 2 + 26, 0)
  fold.addColorStop(0, 'rgba(90, 78, 58, 0)')
  fold.addColorStop(0.5, 'rgba(90, 78, 58, 0.06)')
  fold.addColorStop(1, 'rgba(90, 78, 58, 0)')
  ctx.fillStyle = fold
  ctx.fillRect(w / 2 - 26, tooth, 52, h - tooth * 2)

  // Coffee ring, top right, almost gone.
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#7a5a3a'
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.ellipse(w - 118, 196, 92, 86, -0.25, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  const center = w / 2
  ctx.textAlign = 'center'
  ctx.fillStyle = ink

  ctx.font = '700 60px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillText('LOOSELEAF MART', center, 150)
  ctx.font = '400 26px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillStyle = pencil
  ctx.fillText('HAND-DRAWN UI, SOLD BY THE SHEET', center, 196)
  ctx.font = '400 21px "IBM Plex Mono", monospace'
  ctx.fillStyle = pencil
  ctx.fillText('kevintngo.github.io/looseleaf', center, 232)

  // Dashed rule.
  ctx.strokeStyle = '#8e887f'
  ctx.lineWidth = 2
  ctx.setLineDash([11, 9])
  ctx.beginPath()
  ctx.moveTo(84, 278)
  ctx.lineTo(w - 84, 278)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.font = '400 23px "IBM Plex Mono", monospace'
  ctx.fillStyle = pencil
  ctx.fillText('ORDER #0123    04 NOV 2026    CASHIER: KEVIN', center, 322)

  const items: Array<[string, string]> = [
    ['HAND-DRAWN COMPONENTS', '123'],
    ['SKETCHED ICONS', '160'],
    ['STICKER DESIGNS', '58'],
    ['BLOCKS & PATTERNS', '62'],
    ['HANDWRITING FONTS', '2'],
    ['MIT LICENSE', '1'],
  ]
  ctx.font = '400 29px "Kevin Sans", "Bradley Hand", cursive'
  items.forEach(([label, value], i) => {
    const y = 408 + i * 72
    ctx.textAlign = 'left'
    ctx.fillStyle = ink
    ctx.fillText(label, 96, y)
    ctx.textAlign = 'right'
    ctx.font = '400 27px "IBM Plex Mono", monospace'
    ctx.fillStyle = pencil
    ctx.fillText(value, w - 96, y)
    ctx.font = '400 29px "Kevin Sans", "Bradley Hand", cursive'
  })

  ctx.strokeStyle = '#8e887f'
  ctx.setLineDash([11, 9])
  ctx.beginPath()
  ctx.moveTo(84, 878)
  ctx.lineTo(w - 84, 878)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  ctx.font = '700 34px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillText('TOTAL', 96, 936)

  ctx.textAlign = 'right'
  ctx.font = '700 46px "Kevin Sans", "Bradley Hand", cursive'
  const totalText = 'ALL FREE'
  ctx.fillText(totalText, w - 108, 944)
  const tw = ctx.measureText(totalText).width
  ctx.save()
  ctx.strokeStyle = red
  ctx.lineWidth = 5
  ctx.globalAlpha = 0.85
  ctx.translate(w - 108 - tw / 2, 932)
  ctx.rotate(-0.05)
  ctx.beginPath()
  ctx.ellipse(0, 0, tw / 2 + 18, 42, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Paid stamp.
  ctx.save()
  ctx.translate(w - 246, 1088)
  ctx.rotate(-0.2)
  ctx.globalAlpha = 0.78
  ctx.strokeStyle = red
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(0, 0, 92, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 76, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = red
  ctx.textAlign = 'center'
  ctx.font = '700 44px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillText('PAID', 0, 4)
  ctx.font = '400 22px "IBM Plex Mono", monospace'
  ctx.fillText('$ 0.00', 0, 38)
  ctx.restore()

  ctx.textAlign = 'left'
  ctx.fillStyle = pencil
  ctx.font = '400 23px "IBM Plex Mono", monospace'
  ctx.fillText('PAID BY:', 96, 1016)
  ctx.fillStyle = ink
  ctx.font = '400 29px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillText('YOUR NEXT PROJECT', 96, 1052)
  ctx.fillStyle = pencil
  ctx.font = '400 21px "IBM Plex Mono", monospace'
  ctx.fillText('NO REFUNDS ON GOOD TASTE', 96, 1092)

  // Barcode.
  const bars = 56
  const barW = 4
  const gap = 3
  const totalW = bars * (barW + gap)
  let x = (w - totalW) / 2
  let seed = 1234567
  for (let i = 0; i < bars; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const tall = 40 + (seed % 44)
    ctx.fillStyle = ink
    ctx.fillRect(x, 1160, barW, tall)
    x += barW + gap + (seed % 2 === 0 ? 2 : 0)
  }
  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  ctx.font = '400 24px "IBM Plex Mono", monospace'
  ctx.fillText('0123 4567 8901', center, 1262)

  ctx.fillStyle = ink
  ctx.font = '400 27px "Kevin Sans", "Bradley Hand", cursive'
  ctx.fillText('THANK YOU — GO MAKE SOMETHING.', center, 1336)
  ctx.fillStyle = pencil
  ctx.font = '400 21px "IBM Plex Mono", monospace'
  ctx.fillText('MIT · REACT 19 · TAILWIND V4', center, 1374)

  ctx.restore()

  // A hairline around the cut edge.
  ctx.strokeStyle = 'rgba(90, 78, 58, 0.16)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

export default function ReceiptPaper({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 1024
    textureCanvas.height = 1536
    drawReceipt(textureCanvas)

    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40)
    camera.position.set(0, 0.04, 6.25)
    camera.lookAt(0, -0.04, 0)

    // ── Particle sheet ─────────────────────────────────────────────
    const count = COLS * ROWS
    const pos = new Float32Array(count * 3)
    const old = new Float32Array(count * 3)
    const rest = new Float32Array(count * 3)

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = (row * COLS + col) * 3
        const x = (col / (COLS - 1) - 0.5) * PAPER_W
        const y = (0.5 - row / (ROWS - 1)) * PAPER_H
        pos[i] = rest[i] = old[i] = x
        pos[i + 1] = rest[i + 1] = old[i + 1] = y
        pos[i + 2] = rest[i + 2] = old[i + 2] = 0
      }
    }

    const geometry = new THREE.BufferGeometry()
    const positionAttr = new THREE.BufferAttribute(pos, 3)
    positionAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', positionAttr)

    const uv = new Float32Array(count * 2)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const n = row * COLS + col
        uv[n * 2] = col / (COLS - 1)
        uv[n * 2 + 1] = 1 - row / (ROWS - 1)
      }
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))

    const index: number[] = []
    for (let row = 0; row < ROWS - 1; row++) {
      for (let col = 0; col < COLS - 1; col++) {
        const a = row * COLS + col
        const b = a + 1
        const c = a + COLS
        const d = c + 1
        index.push(a, c, b, b, c, d)
      }
    }
    geometry.setIndex(index)
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.86,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.45,
      envMapIntensity: 0.18,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: texture,
      alphaTest: 0.45,
    })
    scene.add(mesh)

    // Shadow catcher, a hand's width behind the sheet.
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 5),
      new THREE.ShadowMaterial({ color: 0x2c2a25, opacity: 0.24 }),
    )
    shadowPlane.position.set(0, -0.15, -0.62)
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    scene.add(new THREE.HemisphereLight(0xfff7e6, 0x6c897c, 1.55))
    const key = new THREE.DirectionalLight(0xfff2d8, 2.45)
    key.position.set(-2.4, 3.4, 4.2)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3
    key.shadow.camera.right = 3
    key.shadow.camera.top = 3
    key.shadow.camera.bottom = -3
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 12
    key.shadow.bias = -0.0012
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xcfe6ff, 0.85)
    rim.position.set(3.2, 1.2, -2.5)
    scene.add(rim)

    // ── Constraints ────────────────────────────────────────────────
    type Constraint = { a: number; b: number; rest: number; stiffness: number; pinnedA: boolean; pinnedB: boolean }
    const constraints: Constraint[] = []
    const add = (a: number, b: number, stiffness: number) => {
      const ax = rest[a * 3], ay = rest[a * 3 + 1], az = rest[a * 3 + 2]
      const bx = rest[b * 3], by = rest[b * 3 + 1], bz = rest[b * 3 + 2]
      constraints.push({
        a,
        b,
        rest: Math.hypot(bx - ax, by - ay, bz - az),
        stiffness,
        pinnedA: a < COLS,
        pinnedB: b < COLS,
      })
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col
        if (col + 1 < COLS) add(i, i + 1, 0.98)
        if (row + 1 < ROWS) add(i, i + COLS, 0.965)
        if (col + 1 < COLS && row + 1 < ROWS) {
          add(i, i + COLS + 1, 0.52)
          add(i + 1, i + COLS, 0.52)
        }
        if (col + 2 < COLS) add(i, i + 2, 0.34)
        if (row + 2 < ROWS) add(i, i + COLS * 2, 0.42)
      }
    }

    const pinTop = () => {
      for (let col = 0; col < COLS; col++) {
        const i = col * 3
        pos[i] = rest[i]
        pos[i + 1] = rest[i + 1]
        pos[i + 2] = rest[i + 2]
        old[i] = rest[i]
        old[i + 1] = rest[i + 1]
        old[i + 2] = rest[i + 2]
      }
    }

    const grab: { current: Grab | null } = { current: null }
    const dragTarget = new THREE.Vector3()
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    const weights = new Float32Array(count)
    const offsetX = new Float32Array(count)
    const offsetY = new Float32Array(count)

    const updateTarget = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      raycaster.ray.intersectPlane(dragPlane, dragTarget)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(mesh, false)[0]
      if (!hit || !hit.uv) return

      const gc = hit.uv.x * (COLS - 1)
      const gr = (1 - hit.uv.y) * (ROWS - 1)
      const radius = 4.6
      const baseX = (gc / (COLS - 1) - 0.5) * PAPER_W
      const baseY = (0.5 - gr / (ROWS - 1)) * PAPER_H

      weights.fill(0)
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const n = row * COLS + col
          const d = Math.hypot(col - gc, row - gr)
          if (d >= radius) continue
          let t = 1 - d / radius
          t = t * t * (3 - 2 * t)
          const flex = 0.62 + (row / (ROWS - 1)) * 0.72
          weights[n] = t * flex
          offsetX[n] = rest[n * 3] - baseX
          offsetY[n] = rest[n * 3 + 1] - baseY
        }
      }

      updateTarget(e.clientX, e.clientY)
      grab.current = { pointerId: e.pointerId, col: gc, row: gr, weights, offsetX, offsetY }
      renderer.domElement.style.cursor = 'grabbing'
      try {
        renderer.domElement.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      e.preventDefault()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!grab.current || grab.current.pointerId !== e.pointerId) return
      updateTarget(e.clientX, e.clientY)
      e.preventDefault()
    }

    const endGrab = () => {
      grab.current = null
      renderer.domElement.style.cursor = 'grab'
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!grab.current || grab.current.pointerId !== e.pointerId) return
      endGrab()
    }

    const onPointerCancel = () => endGrab()
    const onPointerLeave = (e: PointerEvent) => {
      if (e.buttons === 0) endGrab()
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerCancel)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)

    // ── Simulation ─────────────────────────────────────────────────
    const stepPhysics = () => {
      for (let i = 0; i < count; i++) {
        if (i < COLS) continue
        const k = i * 3
        const vx = (pos[k] - old[k]) * DAMPING
        const vy = (pos[k + 1] - old[k + 1]) * DAMPING
        const vz = (pos[k + 2] - old[k + 2]) * DAMPING
        old[k] = pos[k]
        old[k + 1] = pos[k + 1]
        old[k + 2] = pos[k + 2]
        pos[k] += vx
        pos[k + 1] += vy + GRAVITY
        pos[k + 2] += vz
      }

      const g = grab.current
      if (g) {
        for (let i = 0; i < count; i++) {
          const w = g.weights[i]
          if (w <= 0) continue
          const k = i * 3
          const tx = dragTarget.x + g.offsetX[i]
          const ty = dragTarget.y + g.offsetY[i]
          const dx = (tx - pos[k]) * 0.55 * w
          const dy = (ty - pos[k + 1]) * 0.55 * w
          const dz = (0.34 - pos[k + 2]) * 0.42 * w
          pos[k] += dx
          pos[k + 1] += dy
          pos[k + 2] += dz
          old[k] += dx
          old[k + 1] += dy
          old[k + 2] += dz
        }
      }

      pinTop()

      for (let iteration = 0; iteration < ITERATIONS; iteration++) {
        for (let c = 0; c < constraints.length; c++) {
          const con = constraints[c]
          const a = con.a * 3
          const b = con.b * 3
          const dx = pos[b] - pos[a]
          const dy = pos[b + 1] - pos[a + 1]
          const dz = pos[b + 2] - pos[a + 2]
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6
          if (len === 0) continue
          const diff = ((len - con.rest) / len) * con.stiffness
          const half = con.pinnedA || con.pinnedB ? 1 : 0.5
          const ax = dx * diff * half
          const ay = dy * diff * half
          const az = dz * diff * half
          if (!con.pinnedA) {
            pos[a] += ax
            pos[a + 1] += ay
            pos[a + 2] += az
          }
          if (!con.pinnedB) {
            pos[b] -= ax
            pos[b + 1] -= ay
            pos[b + 2] -= az
          }
        }
        pinTop()
      }
    }

    const resize = () => {
      const w = Math.max(1, host.clientWidth)
      const h = Math.max(1, host.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    let raf = 0
    let last = performance.now()
    let accumulator = 0
    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now
      accumulator += delta
      let steps = 0
      while (accumulator >= FIXED_DT && steps < 3) {
        stepPhysics()
        accumulator -= FIXED_DT
        steps++
      }
      positionAttr.needsUpdate = true
      geometry.computeVertexNormals()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const redraw = () => {
      drawReceipt(textureCanvas)
      texture.needsUpdate = true
    }
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts) {
      Promise.all([
        fonts.load('700 60px "Kevin Sans"'),
        fonts.load('400 29px "Kevin Sans"'),
        fonts.load('400 24px "IBM Plex Mono"'),
      ])
        .then(redraw)
        .catch(() => undefined)
    }

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} className={className} aria-label="A draggable paper receipt printed with the Looseleaf inventory" role="img" />
}
