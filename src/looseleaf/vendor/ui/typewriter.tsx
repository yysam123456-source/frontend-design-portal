// @ts-nocheck
"use client"

import * as React from "react"

import { motionIsOff } from "../hooks/use-live-motion"
import { useInk, useInkContext, useInkSeed, useMergedRef } from "../lib/ink/react"
import { typewriterCaretRecipe, typingPlan, type CaretShape } from "../lib/ink/recipes/typewriter-ink"
import { makeRng } from "../lib/ink/rng"
import { cn } from "../lib/utils"

const CSS = `@keyframes ll-caret{0%,49%{opacity:1}50%,100%{opacity:0}}
[data-slot=typewriter][data-state=idle] [data-slot=typewriter-caret]{animation:ll-caret 1.1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){[data-slot=typewriter-caret]{animation:none!important}}
[data-motion=reduced] [data-slot=typewriter-caret]{animation:none!important}
[data-slot=typewriter] .ll-w{position:relative;top:calc(var(--jy,0px)*var(--ll-jitter-k,1));color:color-mix(in srgb,currentColor calc((1 - (1 - var(--jo,1))*var(--ll-jitter-k,1))*100%),transparent)}`

const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)

type TypewriterProps = Omit<React.ComponentProps<"span">, "children"> & {
  text: string | readonly string[]
  mode?: "lines" | "cycle"
  speed?: number
  delay?: number
  pause?: number
  loop?: boolean
  cursor?: CaretShape | false
  startOnView?: boolean
  onDone?: () => void
  reserve?: boolean
  seed?: string | number
}

function Typewriter({ className, text, mode = "lines", speed = 22, delay = 300, pause = 1400, loop = false, cursor = "bar", startOnView = true, reserve = false, onDone, seed: seedProp, ref, ...props }: TypewriterProps) {
  const phrases = React.useMemo(() => (typeof text === "string" ? [text] : [...text]), [text])
  const key = phrases.join("\u0000")
  const seed = useInkSeed(seedProp)
  const providerReduced = useInkContext().motion === "reduced"
  const root = React.useRef<HTMLSpanElement | null>(null)
  const final = mode === "cycle" ? (phrases[phrases.length - 1] ?? "") : phrases.join("\n")
  const [shown, setShown] = React.useState(final)
  const [typing, setTyping] = React.useState(false)
  const [visible, setVisible] = React.useState(!startOnView)
  const done = React.useRef(onDone)
  done.current = onDone

  React.useEffect(() => {
    if (!startOnView || visible) return
    const el = root.current
    if (!el || typeof IntersectionObserver === "undefined") return setVisible(true)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && ((e.intersectionRatio ?? 1) >= 0.4 || (e.intersectionRect?.height ?? 0) >= window.innerHeight * 0.4))) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: STEPS },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [startOnView, visible])

  React.useLayoutEffect(() => {
    if (motionIsOff(root.current, providerReduced)) {
      setShown(final)
      setTyping(false)
      return
    }
    setShown("")
    if (!visible) return
    const { steps } = typingPlan(phrases, { speed, pause, mode, loop, seed })
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let rest: ReturnType<typeof setTimeout> | undefined
    const at = (i: number) => {
      if (stopped) return
      setShown(steps[i].text)
      setTyping(true)
      clearTimeout(rest)
      rest = setTimeout(() => setTyping(false), 260)
      if (i + 1 < steps.length) timer = setTimeout(() => at(i + 1), steps[i + 1].at - steps[i].at)
      else if (loop) timer = setTimeout(() => at(0), 120)
      else done.current?.()
    }
    timer = setTimeout(() => at(0), delay)
    return () => {
      stopped = true
      clearTimeout(timer)
      clearTimeout(rest)
    }
  }, [providerReduced, visible, key, mode, speed, pause, delay, loop, seed, final])

  const room = mode === "cycle" ? phrases.reduce((a, b) => (b.length > a.length ? b : a), "") : final
  const words = React.useMemo(() => shown.split(/(\s+)/), [shown])
  const jitter = React.useMemo(() => makeRng(`type-words|${seed}`), [seed])

  return (
    <span
      data-slot="typewriter"
      data-state={typing ? "typing" : "idle"}
      ref={useMergedRef<HTMLSpanElement>(root, ref)}
      data-reserve={reserve ? "" : undefined}
      className={cn("relative font-type whitespace-pre-wrap", reserve ? "inline-block" : "inline", className)}
      {...props}
    >
      <style href="ll-typewriter" precedence="low">
        {CSS}
      </style>
      <span className="sr-only" aria-live={loop || mode === "cycle" ? "off" : "polite"} aria-atomic="true">
        {mode === "cycle" ? phrases.join(". ") : final}
      </span>
      {reserve ? (
        <span data-slot="typewriter-reserve" aria-hidden="true" className="invisible">
          {room}
          {cursor ? <span className={cn("inline-block", RESERVE_CARET[cursor])} /> : null}
        </span>
      ) : null}
      <span aria-hidden="true" className={reserve ? "absolute inset-0" : undefined}>
        {words.map((w, i) => {
          if (!w) return null
          if (/^\s+$/.test(w)) return w
          const r = jitter.fork(i)
          return (
            <span key={i} className="ll-w" style={{ "--jy": `${(r() * 1.6 - 0.8).toFixed(2)}px`, "--jo": (0.9 + r() * 0.1).toFixed(2) } as React.CSSProperties}>
              {w}
            </span>
          )
        })}
        {cursor ? <Caret shape={cursor} seed={seed} /> : null}
      </span>
    </span>
  )
}

const CARET_CLASS: Record<CaretShape, string> = {
  block: "h-[1.1em] w-[0.6em] forced-colors:bg-[CanvasText]",
  bar: "h-[1.15em] w-[0.16em] ms-[0.06em] forced-colors:bg-[CanvasText]",
  underscore: "h-[1.15em] w-[0.6em] forced-colors:[background:linear-gradient(CanvasText,CanvasText)_bottom/100%_2px_no-repeat]",
}

const RESERVE_CARET: Record<CaretShape, string> = { block: "w-[0.6em]", bar: "w-[0.22em]", underscore: "w-[0.6em]" }

function Caret({ shape, seed }: { shape: CaretShape; seed: string }) {
  const { hostRef, hostProps, node } = useInk({ recipe: typewriterCaretRecipe, params: { shape }, kind: "typewriter-caret", seed: `${seed}|caret` })
  return (
    <span data-slot="typewriter-caret" ref={hostRef} {...hostProps} style={{ outline: "none" }} className={cn("relative isolate inline-block align-text-bottom", CARET_CLASS[shape])}>
      {node}
    </span>
  )
}

export { Typewriter }
export type { TypewriterProps }
