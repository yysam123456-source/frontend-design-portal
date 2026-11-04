// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import { motionIsOff } from "../hooks/use-live-motion"
import { useInk, useInkContext, useMergedRef } from "../lib/ink/react"
import { tearHintRecipe, tearSeamRecipe, tearStubRecipe } from "../lib/ink/recipes/tear-off-ink"
import { clamp } from "../lib/ink/rng"
import { cn } from "../lib/utils"

type Orientation = "horizontal" | "vertical"

interface TearOffContextValue {
  torn: boolean
  gone: boolean
  restored: boolean
  orientation: Orientation
  rtl: boolean
  disabled: boolean
  help: string
  tear(): void
}

const TearOffContext = React.createContext<TearOffContextValue | null>(null)

function useTearOff(): TearOffContextValue {
  const ctx = React.useContext(TearOffContext)
  if (!ctx) throw new Error("TearOff parts must be used inside <TearOff>")
  return ctx
}

type TearOffProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  torn?: boolean
  defaultTorn?: boolean
  onTornChange?: (torn: boolean) => void
  onTear?: () => void
  orientation?: Orientation
  disabled?: boolean
  tornMessage?: string
}

function TearOff({ className, children, ref, torn: tornProp, defaultTorn = false, onTornChange, onTear, orientation = "horizontal", disabled = false, tornMessage = "Torn off.", ...props }: TearOffProps) {
  const [inner, setInner] = React.useState(defaultTorn)
  const [gone, setGone] = React.useState(defaultTorn)
  const [restored, setRestored] = React.useState(false)
  const [domRtl, setDomRtl] = React.useState(false)
  const ctxDir = useInkContext().dir
  const rtl = domRtl || ctxDir === "rtl"
  const root = React.useRef<HTMLDivElement | null>(null)
  const torn = tornProp ?? inner
  const help = React.useId()
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wasTorn = React.useRef(torn)
  const heldFocus = React.useRef(false)

  React.useLayoutEffect(() => {
    if (root.current) setDomRtl(getComputedStyle(root.current).direction === "rtl")
  }, [])
  React.useEffect(() => {
    clearTimeout(timer.current)
    if (torn) {
      if (heldFocus.current) root.current?.focus({ preventScroll: true })
      heldFocus.current = false
      timer.current = setTimeout(() => setGone(true), motionIsOff(root.current) ? 0 : 420)
    } else {
      setGone(false)
      if (wasTorn.current) {
        setRestored(true)
        timer.current = setTimeout(() => setRestored(false), 500)
      }
    }
    wasTorn.current = torn
    return () => clearTimeout(timer.current)
  }, [torn])

  const tear = React.useCallback(() => {
    if (torn || disabled) return
    heldFocus.current = !!root.current?.contains(document.activeElement)
    if (tornProp === undefined) setInner(true)
    onTornChange?.(true)
    onTear?.()
  }, [torn, disabled, tornProp, onTornChange, onTear])

  const ctx: TearOffContextValue = { torn, gone, restored, orientation, rtl, disabled, help, tear }
  return (
    <TearOffContext.Provider value={ctx}>
      <div
        data-slot="tear-off"
        data-state={torn ? "torn" : "attached"}
        data-orientation={orientation}
        ref={useMergedRef<HTMLDivElement>(root, ref)}
        tabIndex={torn ? -1 : undefined}
        className={cn("group/tear relative isolate inline-flex outline-none", orientation === "vertical" ? "flex-col" : "flex-row", className)}
        {...props}
      >
        {children}
        <span id={help} className="sr-only">
          Press Enter or Space to tear it off along the dotted line, or pull it away with a pointer.
        </span>
        <span role="status" className="sr-only">
          {torn ? tornMessage : ""}
        </span>
      </div>
    </TearOffContext.Provider>
  )
}

function sides(o: Orientation, rtl: boolean): { body: "right" | "left" | "bottom"; stub: "left" | "right" | "top" } {
  if (o === "vertical") return { body: "bottom", stub: "top" }
  return rtl ? { body: "left", stub: "right" } : { body: "right", stub: "left" }
}

type PieceProps = Omit<PaperProps, "ref" | "stock" | "edge"> & { ref?: React.Ref<HTMLElement>; stock?: PaperProps["stock"] }

function TearOffBody({ className, children, stock = "paper", ...props }: PieceProps) {
  const { torn, orientation, rtl } = useTearOff()
  const s = sides(orientation, rtl)
  return (
    <Paper data-slot="tear-off-body" stock={stock} edge={{ [s.body]: torn ? "torn" : "perf" }} tilt={false} className={cn("min-w-0 flex-1 p-4", className)} {...props}>
      {children}
    </Paper>
  )
}

type StubProps = PieceProps & {
  label?: string
  seed?: string | number
}

function TearOffStub({ className, children, stock = "index-card", label, seed, style, ref, onKeyDown, ...props }: StubProps) {
  const ctx = useTearOff()
  const { orientation, rtl } = ctx
  const s = sides(orientation, rtl)
  const vertical = orientation === "vertical"
  const sign = rtl ? -1 : 1
  const el = React.useRef<HTMLDivElement | null>(null)
  const drag = React.useRef<{ pointer: number; x: number; y: number; size: number; p: number; moved: boolean } | null>(null)
  const host = useInk({ recipe: tearStubRecipe, params: {}, kind: "tear-off-stub", seed })
  const seam = useInk({ recipe: tearSeamRecipe, params: { scissors: true, inset: rtl ? -5 : 5 }, kind: "tear-off-seam", seed: seed === undefined ? undefined : `${seed}|seam` })
  const hint = useInk({ recipe: tearHintRecipe, params: { toward: vertical ? "down" : rtl ? "left" : "right" }, kind: "tear-off-hint", size: [36, 28], seed: seed === undefined ? undefined : `${seed}|hint` })

  const progress = (p: number) => el.current?.style.setProperty("--tear", String(p))
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || ctx.disabled || ctx.torn || (e.button ?? 0) !== 0) return
    const box = e.currentTarget
    drag.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY, size: (vertical ? box.offsetHeight : box.offsetWidth) || 100, p: 0, moved: false }
    try {
      box.setPointerCapture(e.pointerId)
    } catch {
    }
    box.dataset.dragging = ""
  }
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const along = vertical ? e.clientY - d.y : (e.clientX - d.x) * sign
    if (Math.abs(along) > 4) d.moved = true
    d.p = clamp(along / Math.max(56, d.size * 0.7), 0, 1)
    progress(d.p)
    if (d.p >= 1) release(e.currentTarget, true)
  }
  const release = (node: HTMLDivElement, doTear: boolean) => {
    const d = drag.current
    drag.current = null
    delete node.dataset.dragging
    node.style.removeProperty("--tear")
    if (d && doTear) ctx.tear()
  }
  const up = (cancel: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const tap = !d.moved
    release(e.currentTarget, !cancel && (tap || d.p >= 0.5))
  }
  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.target !== e.currentTarget) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      ctx.tear()
    }
  }

  return (
    <div
      data-slot="tear-off-stub"
      role="button"
      aria-label={label}
      aria-describedby={ctx.help}
      aria-disabled={ctx.disabled || undefined}
      tabIndex={ctx.disabled || ctx.torn ? -1 : 0}
      hidden={ctx.gone}
      aria-hidden={ctx.torn || undefined}
      ref={useMergedRef<HTMLDivElement>(el, host.hostRef)}
      {...host.hostProps}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up(false)}
      onPointerCancel={up(true)}
      onKeyDown={keys}
      onClick={(e) => {
        if (e.detail === 0) ctx.tear()
      }}
      className={cn(
        "relative isolate flex touch-none select-none",
        vertical ? "origin-top-left" : rtl ? "origin-bottom-right" : "origin-bottom-left",
        ctx.disabled ? "cursor-default" : "cursor-grab data-dragging:cursor-grabbing",
        "[transform:translate(calc(var(--tear,0)*var(--tx)),calc(var(--tear,0)*var(--ty)))_rotate(calc(var(--tear,0)*var(--rot)))]",
        "transition-[transform,opacity] duration-(--ll-dur-drop) ease-(--ll-ease-settle) data-dragging:transition-none",
        "[--tx:var(--tx0)] [--ty:var(--ty0)] [--rot:var(--rot0)]",
        "group-data-[state=torn]/tear:pointer-events-none group-data-[state=torn]/tear:opacity-0 group-data-[state=torn]/tear:[--tear:1] group-data-[state=torn]/tear:[--tx:calc(var(--tx0)*3)] group-data-[state=torn]/tear:[--ty:calc(var(--ty0)*3+28px)] group-data-[state=torn]/tear:[--rot:calc(var(--rot0)*1.8)]",
        ctx.restored && "animate-drop",
      )}
      style={
        {
          "--tx0": vertical ? "0px" : `${8 * sign}px`,
          "--ty0": vertical ? "10px" : "4px",
          "--rot0": vertical ? `${-14}deg` : `${14 * sign}deg`,
          ...style,
        } as React.CSSProperties
      }
    >
      {host.node}
      <Paper
        data-slot="tear-off-sheet"
        stock={stock}
        edge={{ [s.stub]: ctx.torn ? "torn" : "perf" }}
        tilt={false}
        ref={ref}
        className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 p-4 text-center", className)}
        {...props}
      >
        {children}
      </Paper>
      <span
        aria-hidden="true"
        ref={seam.hostRef}
        {...seam.hostProps}
        style={{ outline: "none" }}
        className={cn(
          "pointer-events-none absolute z-(--ll-z-raised) isolate",
          vertical ? "inset-x-3 -top-2 h-4" : rtl ? "inset-y-3 -end-2 w-4" : "inset-y-3 -start-2 w-4",
        )}
      >
        {seam.node}
      </span>
      <span
        aria-hidden="true"
        ref={hint.hostRef}
        {...hint.hostProps}
        className={cn("pointer-events-none absolute z-(--ll-z-raised) isolate h-7 w-9", vertical ? "left-1/2 bottom-1 -translate-x-1/2" : rtl ? "start-1 bottom-1" : "end-1 bottom-1")}
      >
        {hint.node}
      </span>
    </div>
  )
}

export { TearOff, TearOffBody, TearOffStub, useTearOff }
export type { TearOffProps }
