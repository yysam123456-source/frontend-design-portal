// @ts-nocheck
"use client"

import * as React from "react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { Paper, type PaperProps } from ".//paper"
import { useEnsureInkDefs, useInk, useInkSeed, useMergedRef } from "../lib/ink/react"
import { HANDLE, composeBoardSvg, stickerBoardItemRecipe, wholeItems, type StickerBoardItem } from "../lib/ink/recipes/sticker-board-ink"
import { stickerFace, stickerLabel } from "../lib/ink/recipes/sticker-ink"
import { clamp, hashSeed } from "../lib/ink/rng"
import { cn } from "../lib/utils"

const STEP = 8
const BIG_STEP = 32
const TURN = 5
const BIG_TURN = 15
const ZOOM = 1.1
const BIG_ZOOM = 1.25
const DEFAULT_MIN = 0.3
const DEFAULT_MAX = 3

const turnTo = (deg: number): number => {
  const a = Math.round((((deg + 180) % 360) + 360) % 360 * 10) / 10 - 180
  return a === -180 ? 180 : Math.round(a * 10) / 10
}
const round2 = (v: number): number => Math.round(v * 100) / 100

type Reorder = "front" | "back" | "forward" | "backward"

function reorderSticker(items: readonly StickerBoardItem[], id: string, how: Reorder): StickerBoardItem[] {
  const zOf = (s: StickerBoardItem) => (Number.isFinite(s.z) ? s.z : 0)
  const sorted = [...items].sort((a, b) => zOf(a) - zOf(b))
  const i = sorted.findIndex((s) => s.id === id)
  if (i < 0) return items as StickerBoardItem[]
  const [it] = sorted.splice(i, 1)
  const to = how === "front" ? sorted.length : how === "back" ? 0 : how === "forward" ? Math.min(i + 1, sorted.length) : Math.max(i - 1, 0)
  if (to === i && how !== "front" && how !== "back") return items as StickerBoardItem[]
  sorted.splice(to, 0, it)
  const rank = new Map(sorted.map((s, k) => [s.id, k]))
  const next = items.map((s) => ({ ...s, z: rank.get(s.id) ?? s.z }))
  return next.every((s, k) => s.z === items[k].z) ? (items as StickerBoardItem[]) : next
}

interface AddOptions {
  x?: number
  y?: number
  rot?: number
  scale?: number
  id?: string
  canvas?: { width: number; height: number }
}

function addSticker(items: readonly StickerBoardItem[], name: string, o: AddOptions = {}): StickerBoardItem[] {
  const used = new Set(items.map((s) => s.id))
  let k = 1
  while (used.has(`${name}-${k}`)) k++
  const id = o.id && !used.has(o.id) ? o.id : `${name}-${k}`
  const cx = o.x ?? (o.canvas ? o.canvas.width / 2 : 160) + ((items.length % 5) - 2) * 18
  const cy = o.y ?? (o.canvas ? o.canvas.height / 2 : 120) + ((items.length % 4) - 1.5) * 14
  const rot = o.rot ?? Math.round(((hashSeed(id) % 1600) / 100 - 8) * 10) / 10
  const z = items.reduce((m, s) => Math.max(m, Number.isFinite(s.z) ? s.z : 0), -1) + 1
  return [...items, { id, name, x: Math.round(cx), y: Math.round(cy), rot, scale: o.scale ?? 1, z }]
}

function boardPoint(root: Element | null | undefined, clientX: number, clientY: number): { x: number; y: number; inside: boolean } | null {
  const canvas = root?.matches?.('[data-slot="sticker-board-canvas"]') ? root : root?.querySelector?.('[data-slot="sticker-board-canvas"]')
  if (!canvas) return null
  const r = canvas.getBoundingClientRect()
  return { x: Math.round(clientX - r.left), y: Math.round(clientY - r.top), inside: clientX >= r.left && clientX <= r.left + r.width && clientY >= r.top && clientY <= r.top + r.height }
}

type BoundsMode = "center" | "inside" | "none"

function keepIn(x: number, y: number, art: { w: number; h: number; rot: number; scale: number }, canvas: { w: number; h: number }, mode: BoundsMode): [number, number] {
  if (mode === "none" || !canvas.w || !canvas.h) return [x, y]
  if (mode === "center") return [clamp(x, 0, canvas.w), clamp(y, 0, canvas.h)]
  const a = (art.rot * Math.PI) / 180
  const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a))
  const ex = Math.min(canvas.w / 2, (art.w * art.scale * c + art.h * art.scale * s) / 2)
  const ey = Math.min(canvas.h / 2, (art.w * art.scale * s + art.h * art.scale * c) / 2)
  return [clamp(x, ex, canvas.w - ex), clamp(y, ey, canvas.h - ey)]
}

const DROP =
  "drop-shadow(calc(var(--sb-dx) * (1px + 4px * var(--sb-lift))) calc(var(--sb-dy) * (1px + 4px * var(--sb-lift))) calc(0.6px + 2.4px * var(--sb-lift)) rgb(var(--ll-shade) / calc(0.26 * var(--ll-shadow-k)))) " +
  "drop-shadow(calc(var(--sb-dx) * (3px + 11px * var(--sb-lift))) calc(var(--sb-dy) * (3px + 11px * var(--sb-lift))) calc(3px + 7px * var(--sb-lift)) rgb(var(--ll-shade) / calc(0.14 * var(--ll-shadow-k))))"

const down = (rot: number) => {
  const a = (rot * Math.PI) / 180
  return { dx: Math.round(Math.sin(a) * 1000) / 1000, dy: Math.round(Math.cos(a) * 1000) / 1000 }
}

interface StickerBoardContextValue {
  items: readonly StickerBoardItem[]
  selectedId: string | null
  select(id: string | null): void
  commit(next: StickerBoardItem[], message?: string): void
  patch(id: string, change: Partial<StickerBoardItem>, message?: string): void
  remove(id: string): void
  duplicate(id: string): void
  reorder(id: string, how: Reorder): void
  turn(id: string, deg: number): void
  resize(id: string, factor: number): void
  exportBoard(): void
  size: number
  minScale: number
  maxScale: number
  bounds: BoundsMode
  editable: boolean
  canvas(): { w: number; h: number }
  registerCanvas(el: HTMLElement | null): void
  say(message: string): void
  help: string
  canvasId: string
  label: string
}

const StickerBoardContext = React.createContext<StickerBoardContextValue | null>(null)

function useStickerBoard(): StickerBoardContextValue {
  const ctx = React.useContext(StickerBoardContext)
  if (!ctx) throw new Error("Sticker board parts must be used inside <StickerBoard>")
  return ctx
}

interface StickerBoardExport {
  items: StickerBoardItem[]
  json: string
  svg: string
  width: number
  height: number
  png(scale?: number): Promise<Blob>
}

function resolveTokens(svg: string, el: Element): string {
  if (typeof getComputedStyle !== "function") return svg
  const cs = getComputedStyle(el)
  return svg.replace(/var\((--[a-z0-9-]+)\)/gi, (whole, name: string) => cs.getPropertyValue(name).trim() || whole)
}

function rasterise(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }))
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const g = canvas.getContext("2d")
      if (!g) return reject(new Error("No 2d canvas"))
      g.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The canvas gave no image"))), "image/png")
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("The svg could not be drawn"))
    }
    img.src = url
  })
}

type StickerBoardProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: StickerBoardItem[]
  defaultValue?: StickerBoardItem[]
  onValueChange?: (value: StickerBoardItem[]) => void
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelectedIdChange?: (id: string | null) => void
  size?: number
  minScale?: number
  maxScale?: number
  bounds?: BoundsMode
  readOnly?: boolean
  disabled?: boolean
  label?: string
  onExport?: (data: StickerBoardExport) => void
}

function StickerBoard({
  className,
  children,
  ref,
  value,
  defaultValue,
  onValueChange,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  size = 96,
  minScale = DEFAULT_MIN,
  maxScale = DEFAULT_MAX,
  bounds = "center",
  readOnly = false,
  disabled = false,
  label = "Sticker board",
  onExport,
  ...props
}: StickerBoardProps) {
  const [inner, setInner] = React.useState<StickerBoardItem[]>(defaultValue ?? [])
  const controlled = value !== undefined
  const raw = controlled ? value : inner
  const items = React.useMemo(() => wholeItems(raw), [raw])
  const latest = React.useRef(items)
  latest.current = items
  const [innerSel, setInnerSel] = React.useState<string | null>(defaultSelectedId)
  const selControlled = selectedProp !== undefined
  const sel = selControlled ? selectedProp : innerSel
  const selectedId = sel !== null && items.some((s) => s.id === sel) ? sel : null
  const canvasEl = React.useRef<HTMLElement | null>(null)
  const help = React.useId()
  const canvasId = React.useId()
  const [status, setStatus] = React.useState("")
  const said = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(said.current), [])

  const say = React.useCallback((message: string) => {
    clearTimeout(said.current)
    said.current = setTimeout(() => setStatus(message), 300)
  }, [])
  const select = React.useCallback(
    (id: string | null) => {
      if (!selControlled) setInnerSel(id)
      onSelectedIdChange?.(id)
    },
    [selControlled, onSelectedIdChange]
  )
  const commit = React.useCallback(
    (next: StickerBoardItem[], message?: string) => {
      latest.current = next
      if (!controlled) setInner(next)
      onValueChange?.(next)
      if (message) say(message)
    },
    [controlled, onValueChange, say]
  )
  const find = (id: string) => latest.current.find((s) => s.id === id)
  const nameOf = (id: string) => {
    const it = find(id)
    return it ? stickerLabel(it.name) : id
  }
  const patch = React.useCallback(
    (id: string, change: Partial<StickerBoardItem>, message?: string) => commit(latest.current.map((s) => (s.id === id ? { ...s, ...change } : s)), message),
    [commit]
  )

  const api = React.useMemo<StickerBoardContextValue>(() => {
    const canvas = () => ({ w: canvasEl.current?.offsetWidth ?? 0, h: canvasEl.current?.offsetHeight ?? 0 })
    const doExport = () => {
      const el = canvasEl.current
      const { w, h } = canvas()
      const width = w || 640, height = h || 400
      const build = () => composeBoardSvg(latest.current, { width, height, size, resolve: el ? (s) => resolveTokens(s, el) : undefined })
      const svg = build()
      const data: StickerBoardExport = {
        items: latest.current,
        json: JSON.stringify(latest.current, null, 2),
        svg,
        width,
        height,
        png: (scale = 2) => rasterise(svg, width, height, scale),
      }
      if (onExport) return onExport(data)
      if (typeof document === "undefined") return
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
      const a = document.createElement("a")
      a.href = url
      a.download = "stickers.svg"
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    return {
      items,
      selectedId,
      select,
      commit,
      patch,
      remove(id) {
        const at = latest.current.findIndex((s) => s.id === id)
        if (at < 0) return
        const name = nameOf(id)
        commit(latest.current.filter((s) => s.id !== id), `${name} removed.`)
        select(null)
      },
      duplicate(id) {
        const it = find(id)
        if (!it) return
        const next = addSticker(latest.current, it.name, { x: it.x + 20, y: it.y + 20, rot: it.rot, scale: it.scale })
        commit(next, `${nameOf(id)} duplicated.`)
        select(next[next.length - 1].id)
      },
      reorder(id, how) {
        const next = reorderSticker(latest.current, id, how)
        if (next === latest.current) return say(`${nameOf(id)} is already ${how === "forward" || how === "front" ? "on top" : "at the back"}.`)
        const word = { front: "brought to the front", back: "sent to the back", forward: "brought forward", backward: "sent backward" }[how]
        commit(next, `${nameOf(id)} ${word}.`)
      },
      turn(id, deg) {
        const it = find(id)
        if (!it) return
        const rot = turnTo(it.rot + deg)
        patch(id, { rot }, `${nameOf(id)} turned to ${rot} degrees.`)
      },
      resize(id, factor) {
        const it = find(id)
        if (!it) return
        const scale = clamp(round2(it.scale * factor), minScale, maxScale)
        if (scale === it.scale) return say(`${nameOf(id)} is as ${factor > 1 ? "big" : "small"} as it goes.`)
        patch(id, { scale }, `${nameOf(id)} at ${Math.round(scale * 100)} percent.`)
      },
      exportBoard: doExport,
      size,
      minScale,
      maxScale,
      bounds,
      editable: !readOnly && !disabled,
      canvas,
      registerCanvas: (el) => {
        canvasEl.current = el
      },
      say,
      help,
      canvasId,
      label,
    }
  }, [items, selectedId, select, commit, patch, say, size, minScale, maxScale, bounds, readOnly, disabled, help, canvasId, label, onExport])

  return (
    <StickerBoardContext.Provider value={api}>
      <div data-slot="sticker-board" data-disabled={disabled ? "" : undefined} ref={ref} className={cn("flex min-w-0 flex-col gap-3", disabled && "opacity-70", className)} {...props}>
        {children ?? (
          <>
            <StickerBoardCanvas className="flex-1" />
            <StickerBoardToolbar />
          </>
        )}
        {!readOnly && !disabled ? (
          <span id={help} className="sr-only">
            Stickers can be dragged. Focus one, then the arrow keys move it, Shift makes the steps bigger and Alt makes them one pixel. Left and right square brackets (or R and Shift R) turn it, plus and minus
            size it, Page Up and Page Down move it through the stack, Delete removes it and Escape lets go.
          </span>
        ) : null}
        <span role="status" className="sr-only">
          {status}
        </span>
      </div>
    </StickerBoardContext.Provider>
  )
}

type StickerBoardCanvasProps = Omit<PaperProps, "children" | "ref"> & {
  ref?: React.Ref<HTMLElement>
  empty?: React.ReactNode
}

function StickerBoardCanvas({ className, ref, stock = "dot-grid", tilt = false, empty, ...props }: StickerBoardCanvasProps) {
  const board = useStickerBoard()
  useEnsureInkDefs()
  const setRef = useMergedRef<HTMLElement>(board.registerCanvas, ref)
  return (
    <Paper
      data-slot="sticker-board-canvas"
      id={board.canvasId}
      role="group"
      aria-label={board.label}
      aria-describedby={board.editable ? board.help : undefined}
      ref={setRef}
      stock={stock}
      tilt={tilt}
      className={cn("relative min-h-72 w-full min-w-0", className)}
      {...props}
    >
      <div
        data-slot="sticker-board-surface"
        tabIndex={-1}
        className="absolute inset-0 overflow-clip outline-none"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget && board.editable) board.select(null)
        }}
      >
        {board.items.map((it) => (
          <BoardItem key={it.id} item={it} />
        ))}
        {board.items.length === 0 ? (
          <div data-slot="sticker-board-empty" className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center font-script text-2xl text-pencil-text">
            {empty ?? "Nothing stuck down yet."}
          </div>
        ) : null}
      </div>
    </Paper>
  )
}

interface DragState {
  pointer: number
  mode: "move" | "rotate" | "scale"
  sx: number
  sy: number
  cx: number
  cy: number
  a0: number
  d0: number
  x0: number
  y0: number
  rot0: number
  scale0: number
  x: number
  y: number
  rot: number
  scale: number
  moved: boolean
}

function BoardItem({ item }: { item: StickerBoardItem }) {
  const board = useStickerBoard()
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const seed = useInkSeed(item.id)
  const face = stickerFace(item.name, board.size, item.id, { idPrefix: `ll-sb${uid}` })
  const selected = board.selectedId === item.id
  const editable = board.editable
  const el = React.useRef<HTMLDivElement | null>(null)
  const art = React.useRef<HTMLSpanElement | null>(null)
  const drag = React.useRef<DragState | null>(null)
  const fw = face?.w ?? 0
  const fh = face?.h ?? 0
  const w = face?.box.w ?? 0
  const h = face?.box.h ?? 0
  const bx = face?.box.x ?? 0
  const by = face?.box.y ?? 0
  const host = useInk({ recipe: stickerBoardItemRecipe, params: { selected, handles: editable }, kind: "frame", seed })
  const name = stickerLabel(item.name)

  const place = (x: number, y: number) => {
    if (el.current) el.current.style.translate = `calc(${x}px - 50%) calc(${y}px - 50%)`
  }
  const turned = (rot: number) => {
    if (!el.current) return
    el.current.style.rotate = `${rot}deg`
    const d = down(rot)
    el.current.style.setProperty("--sb-dx", String(d.dx))
    el.current.style.setProperty("--sb-dy", String(d.dy))
  }
  const sized = (s: number) => {
    if (!el.current) return
    el.current.style.width = `${w * s}px`
    el.current.style.height = `${h * s}px`
    if (art.current) {
      art.current.style.scale = String(s)
      art.current.style.translate = `${-bx * s}px ${-by * s}px`
    }
  }
  const latest = React.useRef(item)
  latest.current = item
  const settle = () => {
    const it = latest.current
    place(it.x, it.y)
    turned(it.rot)
    sized(it.scale)
    if (el.current) el.current.style.zIndex = String(1 + it.z)
  }
  const merged = useMergedRef<HTMLDivElement>(el, host.hostRef)

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || !editable || (e.button ?? 0) !== 0) return
    const handle = (e.target as Element).closest?.("[data-handle]")?.getAttribute("data-handle")
    board.select(item.id)
    const node = e.currentTarget
    const r = node.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    drag.current = {
      pointer: e.pointerId,
      mode: handle === "rotate" ? "rotate" : handle === "scale" ? "scale" : "move",
      sx: e.clientX,
      sy: e.clientY,
      cx,
      cy,
      a0: Math.atan2(e.clientY - cy, e.clientX - cx),
      d0: Math.max(4, Math.hypot(e.clientX - cx, e.clientY - cy)),
      x0: item.x,
      y0: item.y,
      rot0: item.rot,
      scale0: item.scale,
      x: item.x,
      y: item.y,
      rot: item.rot,
      scale: item.scale,
      moved: false,
    }
    try {
      node.setPointerCapture(e.pointerId)
    } catch {
    }
    node.dataset.dragging = ""
    node.style.zIndex = "1000000"
    node.focus({ preventScroll: true })
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true
    if (d.mode === "move") {
      const [x, y] = keepIn(d.x0 + dx, d.y0 + dy, { w, h, rot: d.rot, scale: d.scale }, board.canvas(), board.bounds)
      d.x = x
      d.y = y
      place(x, y)
    } else if (d.mode === "rotate") {
      const a = Math.atan2(e.clientY - d.cy, e.clientX - d.cx)
      let rot = d.rot0 + ((a - d.a0) * 180) / Math.PI
      if (e.shiftKey) rot = Math.round(rot / BIG_TURN) * BIG_TURN
      d.rot = turnTo(rot)
      turned(d.rot)
    } else {
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy)
      d.scale = clamp(round2(d.scale0 * (dist / d.d0)), board.minScale, board.maxScale)
      sized(d.scale)
    }
  }

  const finish = (cancel: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    delete e.currentTarget.dataset.dragging
    e.currentTarget.style.zIndex = String(1 + latest.current.z)
    if (cancel || !d.moved) return settle()
    const change = d.mode === "move" ? { x: Math.round(d.x), y: Math.round(d.y) } : d.mode === "rotate" ? { rot: d.rot } : { scale: d.scale }
    const said = d.mode === "move" ? `${name} moved to ${change.x}, ${change.y}.` : d.mode === "rotate" ? `${name} turned to ${d.rot} degrees.` : `${name} at ${Math.round(d.scale * 100)} percent.`
    board.patch(item.id, change, said)
    setTimeout(settle, 0)
  }

  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || !editable || e.target !== e.currentTarget) return
    const k = e.key
    const cur = latest.current
    if (e.metaKey || (e.ctrlKey && !e.altKey)) {
      if (k.toLowerCase() === "d") {
        e.preventDefault()
        board.duplicate(item.id)
      }
      return
    }
    if (drag.current && k === "Escape") {
      drag.current = null
      delete e.currentTarget.dataset.dragging
      return settle()
    }
    const step = e.altKey ? 1 : e.shiftKey ? BIG_STEP : STEP
    const dx = k === "ArrowRight" ? step : k === "ArrowLeft" ? -step : 0
    const dy = k === "ArrowDown" ? step : k === "ArrowUp" ? -step : 0
    if (dx || dy) {
      e.preventDefault()
      const [x, y] = keepIn(cur.x + dx, cur.y + dy, { w, h, rot: cur.rot, scale: cur.scale }, board.canvas(), board.bounds)
      board.patch(item.id, { x, y }, `${name} at ${x}, ${y}.`)
    } else if (k === "[" || k === "{" || k === "]" || k === "}" || k === "r" || k === "R") {
      e.preventDefault()
      const by = e.shiftKey ? BIG_TURN : TURN
      const left = k === "[" || k === "{" || k === "R"
      board.turn(item.id, left ? -by : by)
    } else if (k === "+" || k === "=" || k === "-" || k === "_") {
      e.preventDefault()
      const f = e.shiftKey ? BIG_ZOOM : ZOOM
      board.resize(item.id, k === "+" || k === "=" ? f : 1 / f)
    } else if (k === "0") {
      e.preventDefault()
      board.patch(item.id, { rot: 0, scale: 1 }, `${name} set upright at full size.`)
    } else if (k === "PageUp" || k === "PageDown") {
      e.preventDefault()
      board.reorder(item.id, k === "PageUp" ? (e.shiftKey ? "front" : "forward") : e.shiftKey ? "back" : "backward")
    } else if (k === "Delete" || k === "Backspace") {
      e.preventDefault()
      const sibling = e.currentTarget.nextElementSibling ?? e.currentTarget.previousElementSibling
      board.remove(item.id)
      const surface = e.currentTarget.parentElement
      ;(sibling instanceof HTMLElement && sibling.dataset.slot === "sticker-board-item" ? sibling : surface)?.focus?.({ preventScroll: true })
    } else if (k === "Escape") {
      e.preventDefault()
      board.select(null)
      e.currentTarget.blur()
    }
  }

  if (!face) return null

  const out = 5
  return (
    <div
      data-slot="sticker-board-item"
      data-id={item.id}
      data-sticker={item.name}
      data-selected={selected ? "" : undefined}
      role="group"
      aria-roledescription="sticker"
      aria-label={name}
      aria-current={selected ? "true" : undefined}
      aria-describedby={editable ? board.help : undefined}
      tabIndex={editable ? 0 : undefined}
      ref={merged}
      {...host.hostProps}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish(false)}
      onPointerCancel={finish(true)}
      onKeyDown={keys}
      onFocus={(e) => {
        if (e.target === e.currentTarget && editable && !selected) board.select(item.id)
      }}
      className={cn(
        "absolute top-0 left-0 isolate touch-none select-none not-focus-visible:outline-none",
        "[transition:scale_var(--ll-dur-hover)_var(--ll-ease-settle)]",
        editable && "cursor-grab data-dragging:cursor-grabbing hover:scale-[1.03] data-dragging:scale-[1.06] calm:hover:scale-100",
        "[--sb-lift:0] data-dragging:[--sb-lift:1]",
        "forced-colors:data-selected:outline-2 forced-colors:data-selected:outline-[Highlight]"
      )}
      style={{
        width: w * item.scale,
        height: h * item.scale,
        translate: `calc(${item.x}px - 50%) calc(${item.y}px - 50%)`,
        rotate: `${item.rot}deg`,
        zIndex: 1 + item.z,
        "--sb-dx": down(item.rot).dx,
        "--sb-dy": down(item.rot).dy,
        "--ll-drop-sticker": DROP,
      } as React.CSSProperties}
    >
      {host.node}
      <span
        ref={art}
        data-slot="sticker-board-item-art"
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ width: fw, height: fh, translate: `${-bx * item.scale}px ${-by * item.scale}px`, scale: item.scale }}
      >
        <svg
          data-ink="sticker"
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${fw} ${fh}`}
          width={fw}
          height={fh}
          className="ll-drop-sticker pointer-events-none block overflow-visible"
          dangerouslySetInnerHTML={{ __html: face.svg }}
        />
      </span>
      {selected && editable ? (
        <>
          <span
            data-handle="rotate"
            aria-hidden="true"
            className="absolute cursor-grab"
            style={{ left: "50%", top: -(out + HANDLE.rotateUp), width: HANDLE.hit, height: HANDLE.hit, translate: "-50% -50%" }}
          />
          <span
            data-handle="scale"
            aria-hidden="true"
            className="absolute cursor-nwse-resize"
            style={{ left: `calc(100% + ${out + HANDLE.scaleOut - HANDLE.scaleSize / 2}px)`, top: `calc(100% + ${out + HANDLE.scaleOut - HANDLE.scaleSize / 2}px)`, width: HANDLE.hit, height: HANDLE.hit, translate: "-50% -50%" }}
          />
        </>
      ) : null}
    </div>
  )
}

type ToolbarAction = "turn" | "size" | "layer" | "duplicate" | "delete" | "export"

type StickerBoardToolbarProps = Omit<React.ComponentProps<"div">, "children"> & {
  actions?: readonly ToolbarAction[]
}

const ALL_ACTIONS: readonly ToolbarAction[] = ["turn", "size", "layer", "duplicate", "delete", "export"]

function StickerBoardToolbar({ className, actions = ALL_ACTIONS, onKeyDown, ...props }: StickerBoardToolbarProps) {
  const board = useStickerBoard()
  const id = board.selectedId
  const off = !id || !board.editable
  const row = React.useRef<HTMLElement | null>(null)
  const item = board.items.find((s) => s.id === id)

  const roving = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const k = e.key
    if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return
    const list = [...(row.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])]
    const at = list.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    e.preventDefault()
    const rtl = getComputedStyle(row.current as Element).direction === "rtl"
    const dir = (k === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1)
    const to = k === "Home" ? 0 : k === "End" ? list.length - 1 : (at + dir + list.length) % list.length
    list[to].focus()
  }

  const removeAndMoveOn = (gone: string) => {
    const surface = document.getElementById(board.canvasId)?.querySelector<HTMLElement>('[data-slot="sticker-board-surface"]')
    board.remove(gone)
    surface?.focus({ preventScroll: true })
  }

  const tool = (label: string, icon: string, run: () => void, o: { text?: string; disabled?: boolean; always?: boolean; mirror?: boolean } = {}) => (
    <Button
      key={label}
      type="button"
      variant="outline"
      size={o.text ? "sm" : "icon-sm"}
      aria-label={label}
      title={label}
      disabled={o.always ? false : (o.disabled ?? off)}
      onClick={run}
      data-tool={label}
    >
      {icon ? <Icon name={icon} size={16} className={o.mirror ? "-scale-x-100" : undefined} /> : null}
      {o.text}
    </Button>
  )
  const has = (a: ToolbarAction) => actions.includes(a)
  const groups: React.ReactNode[] = []
  const group = (key: string, children: React.ReactNode) =>
    groups.push(
      <div key={key} role="presentation" className="flex items-center gap-1.5">
        {children}
      </div>
    )
  if (has("turn")) group("turn", [tool("Turn left", "rotate-cw", () => id && board.turn(id, -TURN), { mirror: true }), tool("Turn right", "rotate-cw", () => id && board.turn(id, TURN))])
  if (has("size"))
    group("size", [
      tool("Smaller", "minus", () => id && board.resize(id, 1 / ZOOM), { disabled: off || (item ? item.scale <= board.minScale : false) }),
      tool("Larger", "plus", () => id && board.resize(id, ZOOM), { disabled: off || (item ? item.scale >= board.maxScale : false) }),
    ])
  if (has("layer"))
    group("layer", [
      tool("Send to back", "", () => id && board.reorder(id, "back"), { text: "Back" }),
      tool("Send backward", "arrow-down", () => id && board.reorder(id, "backward")),
      tool("Bring forward", "arrow-up", () => id && board.reorder(id, "forward")),
      tool("Bring to front", "", () => id && board.reorder(id, "front"), { text: "Front" }),
    ])
  if (has("duplicate") || has("delete"))
    group("edit", [
      has("duplicate") && tool("Duplicate", "copy", () => id && board.duplicate(id)),
      has("delete") && tool("Delete", "trash", () => id && removeAndMoveOn(id)),
    ])
  if (has("export")) group("export", [tool("Export", "download", board.exportBoard, { text: "Export", always: true })])

  return (
    <Paper
      data-slot="sticker-board-toolbar"
      role="toolbar"
      aria-label="Sticker tools"
      aria-controls={board.canvasId}
      ref={row}
      onKeyDown={roving}
      stock="slip"
      edge="cut"
      tilt={false}
      shadow="hair"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-2 py-1.5", className)}
      {...props}
    >
      {groups}
    </Paper>
  )
}

export { StickerBoard, StickerBoardCanvas, StickerBoardToolbar, useStickerBoard, addSticker, reorderSticker, boardPoint }
export type { StickerBoardItem, StickerBoardProps, StickerBoardCanvasProps, StickerBoardToolbarProps, StickerBoardExport, BoundsMode as StickerBoardBounds }
