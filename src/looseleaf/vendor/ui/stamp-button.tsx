// @ts-nocheck
"use client"

import * as React from "react"
import { Slot } from "radix-ui"

import { Stamp } from ".//stamp"
import { motionIsOff } from "../hooks/use-live-motion"
import { useInk, useMergedRef } from "../lib/ink/react"
import { STAMP_KNOB, stampButtonRecipe, stampInkList, type StampInk } from "../lib/ink/recipes/stamp-button-ink"
import { hashSeed } from "../lib/ink/rng"
import { stickers } from "../lib/ink/art/stickers"
import type { StampGen, StickerDef } from "../lib/ink/art/types"
import { cn } from "../lib/utils"

interface StampImpression {
  id: string
  press: number
  x: number
  y: number
  name?: string
  text?: string
  shape?: StampGen["shape"]
  ink?: StampInk
  sub?: string
  ring?: string
  w?: number
  h?: number
  size?: number
  ghost?: boolean
  dashed?: boolean
  turn: number
  seed: string
}

interface StampSurfaceContextValue {
  strike(aim: Omit<StampImpression, "press" | "turn" | "seed"> & { say: string }): StampImpression
}

const StampSurfaceContext = React.createContext<StampSurfaceContextValue | null>(null)

const keyOf = (i: StampImpression) => `${i.id}#${i.press}`

const RECOIL_MS = 190

type StampSurfaceProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: StampImpression[]
  defaultValue?: StampImpression[]
  onValueChange?: (value: StampImpression[]) => void
  max?: number
}

function StampSurface({ className, children, ref, value, defaultValue, onValueChange, max, ...props }: StampSurfaceProps) {
  const [inner, setInner] = React.useState<StampImpression[]>(defaultValue ?? [])
  const controlled = value !== undefined
  const impressions = controlled ? value : inner
  const latest = React.useRef(impressions)
  latest.current = impressions
  const el = React.useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = React.useState("")
  const struck = React.useRef(new Set<string>())

  const api = React.useMemo<StampSurfaceContextValue>(
    () => ({
      strike({ say, ...rest }) {
        const before = latest.current.find((i) => i.id === rest.id)
        const press = (before?.press ?? 0) + 1
        const h = hashSeed(`${rest.id}|${press}`)
        const wander = (bits: number) => (((h >>> bits) % 1000) / 1000 - 0.5) * 0.06
        const clamp01 = (v: number) => Math.min(0.96, Math.max(0.04, v))
        const impression: StampImpression = {
          ...rest,
          x: clamp01(rest.x + wander(0)),
          y: clamp01(rest.y + wander(10)),
          ghost: rest.ghost ?? (h % 5 === 0 ? true : undefined),
          press,
          turn: ((h % 700) - 350) / 100,
          seed: `${rest.id}#${press}`,
        }
        let next = [...latest.current.filter((i) => i.id !== rest.id), impression]
        if (max && next.length > max) next = next.slice(next.length - max)
        latest.current = next
        struck.current.add(keyOf(impression))
        for (const k of struck.current) if (!next.some((i) => keyOf(i) === k)) struck.current.delete(k)
        if (!controlled) setInner(next)
        onValueChange?.(next)
        setStatus(`${say} stamped.`)
        const node = el.current
        if (node && typeof node.animate === "function" && !motionIsOff(node)) {
          node.animate([{ translate: "0 0" }, { translate: "0 2px", offset: 0.35 }, { translate: "0 0" }], { duration: RECOIL_MS, easing: "ease-out" })
        }
        return impression
      },
    }),
    [controlled, onValueChange, max]
  )

  return (
    <StampSurfaceContext.Provider value={api}>
      <div data-slot="stamp-surface" ref={useMergedRef<HTMLDivElement>(el, ref)} className={cn("relative isolate", className)} {...props}>
        {children}
        <div data-slot="stamp-layer" className="pointer-events-none absolute inset-0 z-(--ll-z-prop)">
          {impressions.map((i) => (
            <Stamp
              key={keyOf(i)}
              data-slot="stamp-impression"
              data-id={i.id}
              name={i.name}
              text={i.text}
              shape={i.shape}
              ink={i.ink}
              sub={i.sub}
              ring={i.ring}
              w={i.w}
              h={i.h}
              size={i.size}
              ghost={i.ghost}
              dashed={i.dashed}
              seed={i.seed}
              className={cn("absolute", struck.current.has(keyOf(i)) && "animate-in duration-(--ll-dur-pop) ease-(--ll-ease-pop) fade-in-0 zoom-in-[1.7]")}
              style={{ left: `${i.x * 100}%`, top: `${i.y * 100}%`, translate: "-50% -50%", rotate: `${i.turn}deg` }}
            />
          ))}
        </div>
        <span role="status" className="sr-only">
          {status}
        </span>
      </div>
    </StampSurfaceContext.Provider>
  )
}

function useStampSurface(): StampSurfaceContextValue {
  const ctx = React.useContext(StampSurfaceContext)
  if (!ctx) throw new Error("useStampSurface must be used inside <StampSurface>")
  return ctx
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

type StampButtonProps = Omit<React.ComponentProps<"button">, "color"> & {
  stamp?: string
  text?: string
  shape?: StampGen["shape"]
  ink?: StampInk
  sub?: string
  ring?: string
  w?: number
  h?: number
  size?: number
  ghost?: boolean
  dashed?: boolean
  impressionId?: string
  place?: { x: number; y: number }
  onStamp?: (impression: StampImpression) => void
  asChild?: boolean
  seed?: string | number
}

function StampButton(props: StampButtonProps) {
  const surface = React.useContext(StampSurfaceContext)
  if (!surface) {
    return (
      <StampSurface className="inline-flex">
        <StampButtonInner {...props} />
      </StampSurface>
    )
  }
  return <StampButtonInner {...props} />
}

function StampButtonInner({
  className,
  children,
  ref,
  stamp,
  text,
  shape,
  ink: inkProp,
  sub,
  ring,
  w,
  h,
  size,
  ghost,
  dashed,
  impressionId,
  place = { x: 0.72, y: 0.6 },
  onStamp,
  onClick,
  asChild = false,
  disabled,
  seed,
  style,
  ...props
}: StampButtonProps) {
  const surface = useStampSurface()
  const preset = stamp ? ((stickers as Record<string, StickerDef>)[stamp] as StampGen | undefined) : undefined
  const gen = preset && "gen" in preset && preset.gen === "stamp" ? preset : undefined
  const words = text ?? gen?.text ?? stamp ?? ""
  const tone: StampInk = inkProp ?? (gen?.ink as StampInk | undefined) ?? "red"
  const id = impressionId ?? stamp ?? text ?? "stamp"
  const { hostRef, hostProps, node } = useInk({ recipe: stampButtonRecipe, params: { ink: tone, disabled: !!disabled }, kind: "stamp-tool", seed })
  const Comp = asChild ? Slot.Root : "button"

  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled) return
    const impression = surface.strike({
      id,
      x: place.x,
      y: place.y,
      name: stamp,
      text,
      shape,
      ink: inkProp,
      sub,
      ring,
      w,
      h,
      size,
      ghost,
      dashed,
      say: titleCase(words.replace(/^stamp-/, "").replace(/-/g, " ")),
    })
    onStamp?.(impression)
  }

  return (
    <Comp
      data-slot="stamp-button"
      data-ink-tone={tone}
      data-ink-sink="self"
      ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined)}
      {...hostProps}
      {...(asChild ? { "aria-disabled": disabled || undefined } : { type: "button" as const, disabled })}
      onClick={press as React.MouseEventHandler<HTMLElement>}
      className={cn(
        "relative isolate inline-flex min-w-28 shrink-0 cursor-pointer items-center justify-center px-6 pb-2 font-type text-base font-bold tracking-wide whitespace-nowrap text-ink",
        "transition-[translate] duration-(--ll-dur-press) ease-out hover:-translate-y-px active:translate-y-(--ll-press-sink)",
        "disabled:cursor-not-allowed disabled:text-pencil-text disabled:hover:translate-y-0",
        "[&_svg:not(.absolute):not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      style={{ height: STAMP_KNOB + 38, paddingTop: STAMP_KNOB, ...style }}
      {...props}
    >
      {node}
      <Slot.Slottable>{children ?? titleCase(words.replace(/^stamp-/, "").replace(/-/g, " "))}</Slot.Slottable>
    </Comp>
  )
}

export { StampSurface, StampButton, useStampSurface, stampInkList }
export type { StampSurfaceProps, StampButtonProps, StampImpression, StampInk }
