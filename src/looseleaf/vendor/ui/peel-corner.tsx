// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import { motionIsOff } from "../hooks/use-live-motion"
import { useInk, useMergedRef } from "../lib/ink/react"
import type { PaintKey } from "../lib/ink/paint"
import { PEEL_UNIT, peelFlapRecipe, peelTriggerRecipe } from "../lib/ink/recipes/peel-corner-ink"
import { clamp } from "../lib/ink/rng"
import { cn } from "../lib/utils"

const REST = 0.2
const PEEK = 0.42
const OPEN = 1
const MAX = 1.3
const HIT = 56

type Corner = "bottom-right" | "bottom-left"

interface PeelContextValue {
  open: boolean
  under: string
}

const PeelContext = React.createContext<PeelContextValue | null>(null)

function usePeelCorner(): PeelContextValue {
  const ctx = React.useContext(PeelContext)
  if (!ctx) throw new Error("PeelCorner parts must be used inside <PeelCorner>")
  return ctx
}

type PeelCornerProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  peeled?: boolean
  defaultPeeled?: boolean
  onPeeledChange?: (peeled: boolean) => void
  size?: number
  corner?: Corner
  back?: PaintKey
  label?: string
  seed?: string | number
}

function PeelCorner({
  className,
  children,
  ref,
  peeled: peeledProp,
  defaultPeeled = false,
  onPeeledChange,
  size = PEEL_UNIT,
  corner = "bottom-right",
  back = "paper",
  label = "Peel back the corner",
  seed,
  style,
  ...props
}: PeelCornerProps) {
  const [inner, setInner] = React.useState(defaultPeeled)
  const open = peeledProp ?? inner
  const left = corner === "bottom-left"
  const root = React.useRef<HTMLDivElement | null>(null)
  const k = React.useRef(open ? OPEN : REST)
  const frame = React.useRef(0)
  const drag = React.useRef<{ pointer: number; moved: boolean; startX: number; startY: number } | null>(null)
  const under = React.useId()
  const flap = useInk({ recipe: peelFlapRecipe, params: { back, mirror: left }, kind: "peel-corner-flap", size: [size, size], seed })
  const hit = useInk({ recipe: peelTriggerRecipe, params: {}, kind: "peel-corner-trigger", size: [HIT, HIT], seed: seed === undefined ? undefined : `${seed}|hit` })

  const paint = (v: number) => {
    k.current = v
    root.current?.style.setProperty("--peel-k", v.toFixed(3))
  }
  const tween = (to: number) => {
    cancelAnimationFrame(frame.current)
    const from = k.current
    if (motionIsOff(root.current) || Math.abs(to - from) < 0.005) return paint(to)
    let t0 = -1
    const step = (now: number) => {
      if (t0 < 0) t0 = now
      const t = clamp((now - t0) / 260, 0, 1)
      paint(from + (to - from) * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }
  const openNow = React.useRef(open)
  openNow.current = open
  const decline = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      clearTimeout(decline.current)
    },
    [],
  )
  const settled = React.useRef(open)
  React.useEffect(() => {
    if (settled.current === open) return
    settled.current = open
    tween(open ? OPEN : REST)
  }, [open])

  const set = (v: boolean) => {
    settled.current = v
    if (peeledProp === undefined) setInner(v)
    onPeeledChange?.(v)
    tween(v ? OPEN : REST)
    if (peeledProp !== undefined) {
      clearTimeout(decline.current)
      decline.current = setTimeout(() => {
        if (openNow.current === v) return
        settled.current = openNow.current
        tween(openNow.current ? OPEN : REST)
      }, 0)
    }
  }

  const pull = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect()
    if (!r) return REST
    const p = left ? (e.clientX - r.left + (r.bottom - e.clientY)) / 2 : (r.right - e.clientX + (r.bottom - e.clientY)) / 2
    return clamp(p / size, 0.05, MAX)
  }
  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if ((e.button ?? 0) !== 0) return
    drag.current = { pointer: e.pointerId, moved: false, startX: e.clientX, startY: e.clientY }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
    }
    cancelAnimationFrame(frame.current)
    root.current?.setAttribute("data-dragging", "")
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) d.moved = true
    if (d.moved) paint(pull(e))
  }
  const up = (cancel: boolean) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    root.current?.removeAttribute("data-dragging")
    if (cancel) return tween(open ? OPEN : REST)
    if (!d.moved) return set(!open)
    const v = k.current >= 0.62
    if (v !== open) set(v)
    else tween(v ? OPEN : REST)
  }

  const first = React.useRef(String(open ? OPEN : REST)).current
  const vars = { "--peel-size": `${size}px`, "--peel-k": first, "--peel": "calc(var(--peel-k) * var(--peel-size))" } as React.CSSProperties
  const origin = left ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"

  return (
    <PeelContext.Provider value={{ open, under }}>
      <div
        data-slot="peel-corner"
        data-state={open ? "open" : "closed"}
        data-corner={corner}
        ref={useMergedRef<HTMLDivElement>(root, ref)}
        className={cn("group/peel relative isolate inline-block", className)}
        style={{ ...vars, ...style }}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          data-slot="peel-corner-flap"
          ref={flap.hostRef}
          {...flap.hostProps}
          className={cn("pointer-events-none absolute bottom-0 z-2 [scale:var(--peel-k)]", origin)}
          style={{ width: size, height: size }}
        >
          {flap.node}
        </span>
        <button
          type="button"
          data-slot="peel-corner-trigger"
          aria-label={label}
          aria-expanded={open}
          aria-controls={under}
          ref={hit.hostRef}
          {...hit.hostProps}
          onPointerEnter={() => !open && !drag.current && tween(PEEK)}
          onPointerLeave={() => !drag.current && tween(open ? OPEN : REST)}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up(false)}
          onPointerCancel={up(true)}
          onClick={(e) => {
            if (e.detail === 0) set(!open)
          }}
          className={cn("absolute bottom-0 z-3 cursor-grab touch-none active:cursor-grabbing", left ? "left-0" : "right-0")}
          style={{ width: HIT, height: HIT }}
        >
          {hit.node}
        </button>
      </div>
    </PeelContext.Provider>
  )
}

type PageProps = Omit<PaperProps, "ref"> & { ref?: React.Ref<HTMLElement> }

function PeelCornerPage({ className, children, stock = "paper", tilt = false, ...props }: PageProps) {
  usePeelCorner()
  return (
    <Paper
      data-slot="peel-corner-page"
      stock={stock}
      tilt={tilt}
      className={cn(
        "relative z-1 [clip-path:polygon(-40px_-40px,calc(100%+40px)_-40px,calc(100%+40px)_calc(100%-var(--peel)-40px),calc(100%-var(--peel)-40px)_calc(100%+40px),-40px_calc(100%+40px))]",
        "group-data-[corner=bottom-left]/peel:[clip-path:polygon(-40px_-40px,calc(100%+40px)_-40px,calc(100%+40px)_calc(100%+40px),calc(var(--peel)+40px)_calc(100%+40px),-40px_calc(100%-var(--peel)-40px))]",
        "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </Paper>
  )
}

function PeelCornerUnder({ className, children, stock = "kraft", ...props }: PageProps) {
  const { open, under } = usePeelCorner()
  return (
    <Paper
      id={under}
      data-slot="peel-corner-under"
      data-state={open ? "open" : "closed"}
      stock={stock}
      tilt={false}
      inert={!open}
      aria-hidden={!open || undefined}
      className={cn("absolute inset-0 z-0 flex items-end justify-end p-3 group-data-[corner=bottom-left]/peel:justify-start", className)}
      {...props}
    >
      {children}
    </Paper>
  )
}

export { PeelCorner, PeelCornerPage, PeelCornerUnder, usePeelCorner }
export type { PeelCornerProps }
