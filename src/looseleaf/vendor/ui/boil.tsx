// @ts-nocheck
"use client"

import * as React from "react"

import { motionIsOff } from "../hooks/use-live-motion"
import { InkContext, useInkContext, useMergedRef } from "../lib/ink/react"
import { BOIL_MAX_FRAMES, boilKnobs, boilSeed } from "../lib/ink/recipes/boil-ink"
import { cn } from "../lib/utils"

interface BoilContextValue {
  frame: number
  frames: number
}

const BoilContext = React.createContext<BoilContextValue | null>(null)

function useBoilFrame(): number {
  return React.useContext(BoilContext)?.frame ?? 0
}

function useBoilSeed(seed: string | number): string {
  return boilSeed(seed, useBoilFrame())
}

type BoilProps = Omit<React.ComponentProps<"span">, "children"> & {
  fps?: number
  frames?: number
  strength?: number
  active?: boolean
  reseed?: boolean
  children?: React.ReactNode | ((frame: { frame: number; seed: (base: string | number) => string }) => React.ReactNode)
}

function Boil({ className, children, ref, fps = 6, frames = 3, strength = 1, active = true, reseed = true, ...props }: BoilProps) {
  const outer = useInkContext()
  const providerReduced = outer.motion === "reduced" || outer.density === "calm"
  const n = Math.min(BOIL_MAX_FRAMES, Math.max(2, Math.round(frames)))
  const [frame, setFrame] = React.useState(0)
  const [onScreen, setOnScreen] = React.useState(true)
  const root = React.useRef<HTMLSpanElement | null>(null)
  const [hidden, setHidden] = React.useState(false)
  const [still, setStill] = React.useState(false)

  React.useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    const on = () => setHidden(document.hidden)
    on()
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])
  React.useEffect(() => {
    const check = () => setStill(motionIsOff(root.current, providerReduced))
    check()
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    mq?.addEventListener?.("change", check)
    return () => mq?.removeEventListener?.("change", check)
  }, [providerReduced])

  const boiling = active && onScreen && !hidden && !still
  React.useEffect(() => {
    if (!boiling) {
      setFrame(0)
      return
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % n), 1000 / Math.min(12, Math.max(1, fps)))
    return () => clearInterval(id)
  }, [boiling, fps, n])

  const f = boiling ? frame % n : 0
  const value = React.useMemo(
    () => (f === 0 ? outer : { ...outer, knobs: mulKnobs(outer.knobs, boilKnobs(f, strength)) }),
    [outer, f, strength],
  )
  const seedOf = (base: string | number) => boilSeed(base, f)
  const body =
    typeof children === "function"
      ? children({ frame: f, seed: seedOf })
      : reseed
        ? React.Children.map(children, (child, i) => {
            if (f === 0 || !React.isValidElement<{ seed?: string | number; name?: string; id?: string }>(child) || typeof child.type === "string") return child
            const base = child.props.seed ?? child.props.name ?? child.props.id ?? i
            return React.cloneElement(child, { seed: seedOf(base) })
          })
        : children

  return (
    <BoilContext.Provider value={{ frame: f, frames: n }}>
      <InkContext.Provider value={value}>
        <span data-slot="boil" data-state={boiling ? "boiling" : "still"} data-frame={f} ref={useMergedRef<HTMLSpanElement>(root, ref)} className={cn("inline-block", className)} {...props}>
          {body}
        </span>
      </InkContext.Provider>
    </BoilContext.Provider>
  )
}

const mulKnobs = (a: { wobble: number; misreg: number; bleed: number; width: number }, b: { wobble: number; misreg: number; bleed: number; width: number }) => ({
  wobble: a.wobble * b.wobble,
  misreg: a.misreg * b.misreg,
  bleed: a.bleed * b.bleed,
  width: a.width * b.width,
})

export { Boil, useBoilFrame, useBoilSeed }
export type { BoilProps }
