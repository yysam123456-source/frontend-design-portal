// @ts-nocheck
"use client"

import * as React from "react"

import { clip, coffeeRing, pin, ruler } from "../lib/ink/paper/props"
import { PropSvg } from "../lib/ink/paper/prop-svg"
import { dropShadow } from "../lib/ink/paper/shadows"
import { InkTiles, useDensity, useInkSeed, useInkTier } from "../lib/ink/react"
import { DESK_OBJECTS, pencil, type DeskObject } from "../lib/ink/recipes/desk-ink"
import { cn } from "../lib/utils"

type DeskElement = "div" | "main" | "section" | "article"

type DeskProps = React.ComponentProps<"div"> & {
  as?: DeskElement
  objects?: readonly DeskObject[] | boolean
  lamp?: number | boolean
  seed?: string | number
}

function lampVignette(lamp: number): string | undefined {
  if (lamp === 1) return undefined
  if (lamp <= 0) return "linear-gradient(transparent, transparent)"
  return `radial-gradient(ellipse 120% 100% at 50% 40%, transparent 60%, rgb(var(--ll-shade) / calc(${Math.round(lamp * lamp * 0.05 * 1000) / 1000} * var(--ll-shadow-k))))`
}

function Desk({ className, style, children, as = "div", objects = false, lamp = 1, seed, ...props }: DeskProps) {
  const Comp = as as React.ElementType
  const list = objects === true ? DESK_OBJECTS : objects || []
  const vignette = lampVignette(lamp === true ? 1 : lamp === false ? 0 : lamp)
  return (
    <>
      <InkTiles tiles={["linen"]} />
      <Comp
        data-slot="desk"
        className={cn("ll-desk relative isolate", className)}
        style={vignette ? ({ "--ll-desk-vignette": vignette, ...style } as React.CSSProperties) : style}
        {...props}
      >
        {list.length ? <DeskObjects objects={list} seed={seed} /> : null}
        {children}
      </Comp>
    </>
  )
}

const PLACES: Record<DeskObject, string> = {
  coffee: "-bottom-12 -end-10 rotate-6",
  pencil: "bottom-16 start-10 -rotate-[24deg] origin-left",
  clips: "top-5 end-28",
  ruler: "-bottom-1 start-[38%] -rotate-[1.4deg]",
  pins: "top-4 start-24",
}

type DeskObjectsProps = Omit<React.ComponentProps<"div">, "children"> & {
  objects: readonly DeskObject[]
  seed?: string | number
}

function DeskObjects({ objects, seed: seedProp, className, ...props }: DeskObjectsProps) {
  const seed = useInkSeed(seedProp)
  const tier = useInkTier()
  const calm = useDensity() === "calm"
  const art = React.useMemo(() => {
    const o = { tier, calm }
    return {
      coffee: [coffeeRing(`${seed}:coffee`, { radius: 64, ...o })],
      pencil: [pencil(`${seed}:pencil`, { length: 200, ...o })],
      clips: [clip(`${seed}:clip-a`, { height: 62, tone: "steel", ...o }), clip(`${seed}:clip-b`, { height: 58, tone: "sky", ...o })],
      ruler: [ruler(`${seed}:ruler`, 300, { height: 30, ...o })],
      pins: [pin(`${seed}:pin-a`, { size: 22, color: "tomato", ...o }), pin(`${seed}:pin-b`, { size: 24, color: "sky", ...o })],
    } satisfies Record<DeskObject, ReturnType<typeof pin>[]>
  }, [seed, tier, calm])
  return (
    <div
      data-slot="desk-objects"
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-(--ll-z-sheet) overflow-hidden max-sm:hidden calm:hidden", className)}
      {...props}
    >
      {objects.map((name) => (
        <div key={name} data-object={name} className={cn("absolute flex gap-2", PLACES[name])}>
          {art[name].map((res, i) => (
            <PropSvg
              key={i}
              res={res}
              kind="prop"
              data-slot="desk-object"
              className={cn("block shrink-0", name === "clips" && (i ? "-mt-1 rotate-[-9deg]" : "rotate-12"), name === "pins" && (i ? "mt-4" : ""))}
              style={name === "coffee" ? undefined : { filter: dropShadow("prop") }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Desk, DeskObjects }
export type { DeskProps, DeskObjectsProps, DeskObject }
