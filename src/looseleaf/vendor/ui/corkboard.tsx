// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import { useDensity, useInk, useMergedRef } from "../lib/ink/react"
import { CORK_FRAME, corkBoardRecipe, corkNoteRecipe, corkPinRecipe } from "../lib/ink/recipes/corkboard-ink"
import { clamp, hashSeed } from "../lib/ink/rng"
import type { PaintKey } from "../lib/ink/paint"
import { cn } from "../lib/utils"

interface NotePosition {
  x: number
  y: number
  r: number
  z: number
}

type CorkboardValue = Record<string, Partial<NotePosition>>

interface CorkboardContextValue {
  positions: CorkboardValue
  update(id: string, patch: Partial<NotePosition>, message?: string): void
  topZ(): number
  bounds(): { w: number; h: number }
  onResize(fn: () => void): () => void
  say(message: string): void
  help: string
  disabled: boolean
}

const CorkboardContext = React.createContext<CorkboardContextValue | null>(null)

function useCorkboard(): CorkboardContextValue {
  const ctx = React.useContext(CorkboardContext)
  if (!ctx) throw new Error("CorkboardNote must be used inside <Corkboard>")
  return ctx
}

const STEP = 8
const BIG_STEP = 32
const TURN = 4
const MAX_TURN = 24
const PIN_COLORS: readonly PaintKey[] = ["tomato", "sky", "lemon", "grass", "grape", "tangerine"]

type CorkboardProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: CorkboardValue
  defaultValue?: CorkboardValue
  onValueChange?: (value: CorkboardValue) => void
  label?: string
  disabled?: boolean
  seed?: string | number
}

function Corkboard({ className, children, ref, value, defaultValue, onValueChange, label = "Corkboard", disabled = false, seed, ...props }: CorkboardProps) {
  const [inner, setInner] = React.useState<CorkboardValue>(defaultValue ?? {})
  const controlled = value !== undefined
  const positions = controlled ? value : inner
  const latest = React.useRef(positions)
  latest.current = positions
  const surface = React.useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = React.useState("")
  const said = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const watchers = React.useRef(new Set<() => void>())
  const help = React.useId()

  const say = React.useCallback((message: string) => {
    clearTimeout(said.current)
    said.current = setTimeout(() => setStatus(message), 350)
  }, [])
  const onResize = React.useCallback((fn: () => void) => {
    watchers.current.add(fn)
    return () => void watchers.current.delete(fn)
  }, [])
  const update = React.useCallback(
    (id: string, patch: Partial<NotePosition>, message?: string) => {
      const next: CorkboardValue = { ...latest.current, [id]: { ...latest.current[id], ...patch } }
      latest.current = next
      if (!controlled) setInner(next)
      onValueChange?.(next)
      if (message) say(message)
    },
    [controlled, onValueChange, say],
  )
  React.useEffect(() => () => clearTimeout(said.current), [])
  React.useLayoutEffect(() => {
    const el = surface.current
    const watching = watchers.current
    watching.forEach((fn) => fn())
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => watching.forEach((fn) => fn()))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { hostRef, hostProps, node } = useInk({ recipe: corkBoardRecipe, params: { frame: CORK_FRAME }, kind: "corkboard", seed })
  const ctx = React.useMemo<CorkboardContextValue>(
    () => ({
      positions,
      update,
      topZ: () => Math.max(0, ...Object.values(latest.current).map((p) => p.z ?? 0)),
      bounds: () => ({ w: surface.current?.offsetWidth ?? 0, h: surface.current?.offsetHeight ?? 0 }),
      onResize,
      say,
      help,
      disabled,
    }),
    [positions, update, onResize, say, help, disabled],
  )

  return (
    <CorkboardContext.Provider value={ctx}>
      <div
        data-slot="corkboard"
        role="group"
        aria-label={label}
        aria-describedby={help}
        ref={useMergedRef<HTMLDivElement>(hostRef, ref)}
        {...hostProps}
        className={cn(
          "relative isolate min-h-64 w-full touch-manipulation bg-[color-mix(in_oklab,var(--ll-kraft),var(--ll-marker)_22%)] select-none",
          className,
        )}
        {...props}
      >
        {node}
        <div ref={surface} data-slot="corkboard-surface" className="absolute" style={{ inset: CORK_FRAME }}>
          {children}
        </div>
        <span id={help} className="sr-only">
          Notes can be moved with a pointer, or focus one and use the arrow keys (Shift for bigger steps). R turns it clockwise, Shift R back. Enter brings it to the front.
        </span>
        <span role="status" className="sr-only">
          {status}
        </span>
      </div>
    </CorkboardContext.Provider>
  )
}

type CorkboardNoteProps = Omit<React.ComponentProps<"div">, "id"> & {
  id: string
  x?: number
  y?: number
  rotate?: number
  stock?: PaperProps["stock"]
  pinned?: boolean
  pinColor?: PaintKey
  label?: string
  paperProps?: Omit<PaperProps, "children" | "ref" | "stock">
  bare?: boolean
  seed?: string | number
}

function CorkboardNote({ id, x = 16, y = 16, rotate, stock = "sticky-yellow", pinned = true, pinColor, label, className, style, children, paperProps, bare = false, seed, ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown, ...props }: CorkboardNoteProps) {
  const board = useCorkboard()
  const calm = useDensity() === "calm"
  const at = board.positions[id]
  const auto = calm ? 0 : Math.round(((hashSeed(id) % 700) / 100 - 3.5) * 10) / 10
  const pos: NotePosition = { x: at?.x ?? x, y: at?.y ?? y, r: at?.r ?? rotate ?? auto, z: at?.z ?? 0 }
  const el = React.useRef<HTMLDivElement | null>(null)
  const drag = React.useRef<{ pointer: number; sx: number; sy: number; x0: number; y0: number; x: number; y: number; moved: boolean; z: number } | null>(null)
  const host = useInk({ recipe: corkNoteRecipe, params: {}, kind: "corkboard-note", seed })
  const pin = pinColor ?? PIN_COLORS[hashSeed(id) % PIN_COLORS.length]

  const limits = () => {
    const b = board.bounds()
    const node = el.current
    return { maxX: b.w && node ? Math.max(0, b.w - node.offsetWidth) : Infinity, maxY: b.h && node ? Math.max(0, b.h - node.offsetHeight) : Infinity }
  }
  const put = (nx: number, ny: number) => {
    if (el.current) el.current.style.translate = `${nx}px ${ny}px`
  }
  const rendered = React.useRef(pos)
  rendered.current = pos
  const fit = () => {
    if (drag.current) return
    const { maxX, maxY } = limits()
    put(clamp(rendered.current.x, 0, maxX), clamp(rendered.current.y, 0, maxY))
  }
  const fitLatest = React.useRef(fit)
  fitLatest.current = fit
  React.useLayoutEffect(() => board.onResize(() => fitLatest.current()), [board.onResize])
  const settle = () => setTimeout(() => fitLatest.current(), 0)
  React.useLayoutEffect(() => fitLatest.current(), [pos.x, pos.y])

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || board.disabled || (e.button ?? 0) !== 0) return
    if ((e.target as Element).closest("a, button, input, textarea, select, [contenteditable='true'], [data-corkboard-nodrag]")) return
    const z = board.topZ() + 1
    const { maxX, maxY } = limits()
    const x0 = clamp(pos.x, 0, maxX), y0 = clamp(pos.y, 0, maxY)
    drag.current = { pointer: e.pointerId, sx: e.clientX, sy: e.clientY, x0, y0, x: x0, y: y0, moved: false, z }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
    }
    e.currentTarget.dataset.dragging = ""
    e.currentTarget.style.zIndex = String(1 + z)
    e.currentTarget.focus({ preventScroll: true })
  }
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true
    const { maxX, maxY } = limits()
    d.x = clamp(d.x0 + dx, 0, maxX)
    d.y = clamp(d.y0 + dy, 0, maxY)
    put(d.x, d.y)
  }
  const finish = (cancel: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (cancel) onPointerCancel?.(e)
    else onPointerUp?.(e)
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    const node = e.currentTarget
    delete node.dataset.dragging
    if (cancel || !d.moved) {
      fit()
      node.style.zIndex = String(1 + pos.z)
      return
    }
    node.dataset.dropped = ""
    board.update(id, { x: Math.round(d.x), y: Math.round(d.y), z: d.z }, `${label ?? id} moved to ${Math.round(d.x)}, ${Math.round(d.y)}.`)
    settle()
  }

  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || board.disabled || e.target !== e.currentTarget || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (drag.current && k === "Escape") {
      const d = drag.current
      drag.current = null
      delete e.currentTarget.dataset.dragging
      put(d.x0, d.y0)
      return
    }
    const step = e.shiftKey ? BIG_STEP : STEP
    const dx = k === "ArrowRight" ? step : k === "ArrowLeft" ? -step : 0
    const dy = k === "ArrowDown" ? step : k === "ArrowUp" ? -step : 0
    if (dx || dy) {
      e.preventDefault()
      const { maxX, maxY } = limits()
      const nx = clamp(pos.x + dx, 0, maxX), ny = clamp(pos.y + dy, 0, maxY)
      board.update(id, { x: nx, y: ny }, `${label ?? id} at ${nx}, ${ny}.`)
    } else if (k.toLowerCase() === "r") {
      e.preventDefault()
      const nr = clamp(pos.r + (e.shiftKey ? -TURN : TURN), -MAX_TURN, MAX_TURN)
      board.update(id, { r: nr }, `${label ?? id} turned to ${nr} degrees.`)
    } else if (k === "Enter" || k === " ") {
      e.preventDefault()
      board.update(id, { z: board.topZ() + 1 }, `${label ?? id} brought to the front.`)
    }
  }

  return (
    <div
      data-slot="corkboard-note"
      data-id={id}
      data-pinned={pinned ? "" : undefined}
      role="group"
      aria-roledescription="note"
      aria-label={label ?? id}
      aria-describedby={board.help}
      aria-disabled={board.disabled || undefined}
      tabIndex={board.disabled ? undefined : 0}
      ref={useMergedRef<HTMLDivElement>(el, host.hostRef, ref)}
      {...host.hostProps}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish(false)}
      onPointerCancel={finish(true)}
      onKeyDown={keys}
      onAnimationEnd={(e) => delete e.currentTarget.dataset.dropped}
      className={cn(
        "group absolute top-0 left-0 isolate w-44 touch-none [transition:scale_var(--ll-dur-hover)_var(--ll-ease-settle)] outline-none",
        board.disabled ? "cursor-default" : "cursor-grab data-dragging:cursor-grabbing hover:scale-[1.015] data-dragging:scale-[1.05]",
        "data-dragging:[&_[data-slot=corkboard-sheet]]:[--ll-sheet-shadow:var(--ll-shadow-lift)]",
        className,
      )}
      style={{ translate: `${pos.x}px ${pos.y}px`, rotate: `${pos.r}deg`, zIndex: 1 + pos.z, ...style }}
      {...props}
    >
      {host.node}
      {bare ? (
        <div data-slot="corkboard-sheet">{children}</div>
      ) : (
        <Paper data-slot="corkboard-sheet" stock={stock} edge="cut" tilt={false} tape={pinned ? false : "top"} className="w-full font-script text-xl leading-tight" {...paperProps}>
          <div className="px-3.5 pt-6 pb-4">{children}</div>
        </Paper>
      )}
      {pinned ? <Pin color={pin} seed={`${id}|pin`} /> : null}
    </div>
  )
}

function Pin({ color, seed }: { color: PaintKey; seed: string }) {
  const { hostRef, hostProps, node } = useInk({ recipe: corkPinRecipe, params: { color }, kind: "corkboard-pin", seed, size: [24, 24] })
  return (
    <span
      data-slot="corkboard-pin"
      aria-hidden="true"
      ref={hostRef}
      {...hostProps}
      className="pointer-events-none absolute -top-2.5 left-1/2 z-(--ll-z-prop) size-6 -translate-x-1/2 transition-[translate,scale] duration-(--ll-dur-hover) ease-(--ll-ease-settle) group-data-dragging:-translate-y-1.5 group-data-dragging:scale-110 group-data-dropped:animate-pop calm:hidden"
    >
      {node}
    </span>
  )
}

export { Corkboard, CorkboardNote }
export type { CorkboardProps, CorkboardNoteProps, CorkboardValue, NotePosition }
