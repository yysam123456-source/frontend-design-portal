// @ts-nocheck
"use client"

import * as React from "react"

import { Doodle } from ".//doodle"
import { useInk, useMergedRef } from "../lib/ink/react"
import { marqueeBandRecipe, marqueeControlRecipe } from "../lib/ink/recipes/marquee-ink"
import type { Accent, TapeKind } from "../lib/ink/paper/props"
import { clamp } from "../lib/ink/rng"
import { cn } from "../lib/utils"

const CSS = `@keyframes ll-marquee{to{transform:translateX(var(--ll-marquee-shift,-50%))}}
@keyframes ll-marquee-rtl{to{transform:translateX(calc(var(--ll-marquee-shift,-50%)*-1))}}
[data-slot=marquee-track]{animation:ll-marquee var(--ll-marquee-dur,30s) linear infinite}
[dir=rtl] [data-slot=marquee-track]{animation-name:ll-marquee-rtl}
[data-slot=marquee-track]:dir(rtl){animation-name:ll-marquee-rtl}
[data-slot=marquee][data-direction=reverse] [data-slot=marquee-track]{animation-direction:reverse}
[data-slot=marquee]:hover [data-slot=marquee-track],[data-slot=marquee]:focus-within [data-slot=marquee-track],[data-slot=marquee][data-paused] [data-slot=marquee-track]{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){[data-slot=marquee-track]{animation:none}[data-slot=marquee-group][data-copy]{display:none}[data-slot=marquee-viewport]{justify-content:center;justify-content:safe center}}
[data-motion=reduced] [data-slot=marquee-track]{animation:none}
[data-motion=reduced] [data-slot=marquee-group][data-copy]{display:none}
[data-motion=reduced] [data-slot=marquee-viewport]{justify-content:center;justify-content:safe center}`

const MAX_COPIES = 48

interface MarqueeContextValue {
  paused: boolean
  toggle(): void
}

const MarqueeContext = React.createContext<MarqueeContextValue | null>(null)

type MarqueeProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  label?: string
  speed?: number
  direction?: "start" | "end"
  tape?: TapeKind
  color?: Accent
  paused?: boolean
  defaultPaused?: boolean
  onPausedChange?: (paused: boolean) => void
  controls?: boolean
  seed?: string | number
}

function Marquee({
  className,
  children,
  ref,
  label = "Ticker",
  speed = 60,
  direction = "start",
  tape = "washi-stripes",
  color,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  controls = true,
  seed,
  style,
  ...props
}: MarqueeProps) {
  const [inner, setInner] = React.useState(defaultPaused)
  const paused = pausedProp ?? inner
  const [copies, setCopies] = React.useState(2)
  const [dur, setDur] = React.useState(30)
  const viewport = React.useRef<HTMLDivElement | null>(null)
  const group = React.useRef<HTMLDivElement | null>(null)
  const { hostRef, hostProps, node } = useInk({ recipe: marqueeBandRecipe, params: { kind: tape, color }, kind: "marquee-band", seed })
  const ctx = React.useMemo<MarqueeContextValue>(
    () => ({
      paused,
      toggle: () => {
        if (pausedProp === undefined) setInner(!paused)
        onPausedChange?.(!paused)
      },
    }),
    [paused, pausedProp, onPausedChange],
  )

  React.useLayoutEffect(() => {
    const v = viewport.current, g = group.current
    if (!v || !g) return
    const measure = () => {
      const gw = g.offsetWidth, vw = v.offsetWidth
      if (!(gw > 0)) return
      setCopies(clamp(Math.ceil(vw / gw) + 1, 2, MAX_COPIES))
      setDur(Math.max(4, gw / Math.max(1, speed)))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(v)
    ro.observe(g)
    return () => ro.disconnect()
  }, [speed])

  return (
    <MarqueeContext.Provider value={ctx}>
      <style href="ll-marquee" precedence="low">
        {CSS}
      </style>
      <div
        data-slot="marquee"
        data-direction={direction === "end" ? "reverse" : undefined}
        data-paused={paused ? "" : undefined}
        role="marquee"
        aria-label={label}
        ref={useMergedRef<HTMLDivElement>(hostRef, ref)}
        {...hostProps}
        className={cn("relative isolate block h-11 w-full overflow-x-clip", className)}
        style={{ "--ll-marquee-shift": `${-100 / copies}%`, "--ll-marquee-dur": `${dur.toFixed(2)}s`, ...style } as React.CSSProperties}
        {...props}
      >
        {node}
        <div
          ref={viewport}
          data-slot="marquee-viewport"
          className={cn("absolute inset-y-0 start-3 flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]", controls ? "end-11" : "end-3")}
        >
          <div data-slot="marquee-track" className="flex w-max shrink-0 items-center">
            {Array.from({ length: copies }, (_, i) => (
              <div
                key={i}
                ref={i === 0 ? group : undefined}
                data-slot="marquee-group"
                data-copy={i ? "" : undefined}
                aria-hidden={i ? true : undefined}
                inert={i ? true : undefined}
                className="flex shrink-0 items-center font-script text-2xl leading-none font-semibold whitespace-nowrap text-ink [text-shadow:0_0_2px_var(--ll-slip),0_0_5px_var(--ll-slip)]"
              >
                {children}
              </div>
            ))}
          </div>
        </div>
        {controls ? <MarqueeControl /> : null}
      </div>
    </MarqueeContext.Provider>
  )
}

function MarqueeItem({ className, children, separator, ...props }: React.ComponentProps<"span"> & { separator?: React.ReactNode | false }) {
  return (
    <span data-slot="marquee-item" className={cn("inline-flex items-center gap-4 pe-4", className)} {...props}>
      {children}
      {separator === false ? null : (separator ?? <Doodle name="star" size={24} className="-mt-0.5 opacity-90" />)}
    </span>
  )
}

function MarqueeControl({ className, seed, ref, onClick, ...props }: React.ComponentProps<"button"> & { seed?: string | number }) {
  const ctx = React.useContext(MarqueeContext)
  if (!ctx) throw new Error("MarqueeControl must be used inside <Marquee>")
  const { hostRef, hostProps, node } = useInk({ recipe: marqueeControlRecipe, params: { paused: ctx.paused }, kind: "marquee-control", size: [28, 28], seed })
  return (
    <button
      type="button"
      data-slot="marquee-control"
      aria-label="Pause ticker"
      aria-pressed={ctx.paused}
      ref={useMergedRef<HTMLButtonElement>(hostRef, ref)}
      {...hostProps}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.toggle()
      }}
      className={cn("absolute end-2 top-1/2 z-(--ll-z-raised) size-7 -translate-y-1/2 cursor-pointer", className)}
      {...props}
    >
      {node}
    </button>
  )
}

export { Marquee, MarqueeItem, MarqueeControl }
export type { MarqueeProps }
