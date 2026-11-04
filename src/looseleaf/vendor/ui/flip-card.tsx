// @ts-nocheck
"use client"

import * as React from "react"
import { Slot } from "radix-ui"

import { Paper, type PaperProps } from ".//paper"
import { useInk, useMergedRef } from "../lib/ink/react"
import { flipTriggerRecipe } from "../lib/ink/recipes/flip-card-ink"
import { cn } from "../lib/utils"

const CSS = `@keyframes ll-flip-lift-a{0%,100%{translate:0 0;scale:1}42%{translate:0 -10px;scale:1.045}}
@keyframes ll-flip-lift-b{0%,100%{translate:0 0;scale:1}42%{translate:0 -10px;scale:1.045}}
[data-slot=flip-card][data-touched][data-state=back]>[data-slot=flip-card-inner]{animation:ll-flip-lift-a calc(var(--ll-dur-sheet)*2) var(--ll-ease-out)}
[data-slot=flip-card][data-touched][data-state=front]>[data-slot=flip-card-inner]{animation:ll-flip-lift-b calc(var(--ll-dur-sheet)*2) var(--ll-ease-out)}`

type Side = "front" | "back"

interface FlipCardContextValue {
  flipped: boolean
  toggle(): void
  axis: "x" | "y"
  label: string
}

const FlipCardContext = React.createContext<FlipCardContextValue | null>(null)

function useFlipCard(): FlipCardContextValue {
  const ctx = React.useContext(FlipCardContext)
  if (!ctx) throw new Error("FlipCard parts must be used inside <FlipCard>")
  return ctx
}

type FlipCardProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  flipped?: boolean
  defaultFlipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
  axis?: "x" | "y"
  trigger?: boolean
  label?: string
}

function FlipCard({ className, children, ref, flipped: flippedProp, defaultFlipped = false, onFlippedChange, axis = "y", trigger = true, label = "Flip card", ...props }: FlipCardProps) {
  const [inner, setInner] = React.useState(defaultFlipped)
  const [touched, setTouched] = React.useState(false)
  const flipped = flippedProp ?? inner
  const toggle = () => {
    setTouched(true)
    if (flippedProp === undefined) setInner(!flipped)
    onFlippedChange?.(!flipped)
  }
  const state: Side = flipped ? "back" : "front"
  const ctx: FlipCardContextValue = { flipped, toggle, axis, label }
  return (
    <FlipCardContext.Provider value={ctx}>
      <style href="ll-flip-card" precedence="low">
        {CSS}
      </style>
      <div
        data-slot="flip-card"
        data-state={state}
        data-touched={touched ? "" : undefined}
        ref={ref}
        className={cn("relative isolate block h-48 w-72 [perspective:1200px]", className)}
        {...props}
      >
        <div
          data-slot="flip-card-inner"
          className={cn(
            "grid size-full [transform-style:preserve-3d] transition-transform duration-[calc(var(--ll-dur-sheet)*2)] ease-(--ll-ease-settle)",
            flipped && (axis === "x" ? "[transform:rotateX(180deg)]" : "[transform:rotateY(180deg)]"),
          )}
        >
          {children}
        </div>
        {trigger ? <FlipCardTrigger /> : null}
      </div>
    </FlipCardContext.Provider>
  )
}

type FaceProps = Omit<PaperProps, "ref" | "stock"> & { ref?: React.Ref<HTMLElement>; stock?: PaperProps["stock"] }

function Face({ side, stock, className, children, ref, ...props }: FaceProps & { side: Side }) {
  const { flipped, axis } = useFlipCard()
  const hidden = side === "front" ? flipped : !flipped
  return (
    <Paper
      data-slot={`flip-card-${side}`}
      data-side={side}
      stock={stock ?? (side === "front" ? "index-card" : "slip")}
      edge="cut"
      tilt={false}
      inert={hidden}
      aria-hidden={hidden || undefined}
      ref={ref}
      className={cn(
        "col-start-1 row-start-1 size-full [backface-visibility:hidden] flex flex-col items-center justify-center gap-1 px-6 py-5 text-center font-script text-2xl leading-tight",
        "[transition:visibility_0s_linear_calc(var(--ll-dur-sheet)*.24)]",
        hidden ? "invisible" : "visible",
        side === "back" && (axis === "x" ? "[transform:rotateX(180deg)]" : "[transform:rotateY(180deg)]"),
        className,
      )}
      {...props}
    >
      {children}
    </Paper>
  )
}

function FlipCardFront(props: FaceProps) {
  return <Face side="front" {...props} />
}

function FlipCardBack(props: FaceProps) {
  return <Face side="back" {...props} />
}

type FlipCardTriggerProps = React.ComponentProps<"button"> & {
  asChild?: boolean
  overlay?: boolean
  hint?: boolean
  seed?: string | number
}

function FlipCardTrigger({ className, children, asChild = false, overlay = true, hint, seed, ref, onClick, ...props }: FlipCardTriggerProps) {
  const ctx = useFlipCard()
  const drawn = overlay && (hint ?? true)
  const { hostRef, hostProps, node } = useInk({ recipe: flipTriggerRecipe, params: { hint: drawn }, kind: "flip-card-trigger", seed })
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="flip-card-trigger"
      type={asChild ? undefined : "button"}
      aria-pressed={ctx.flipped}
      ref={useMergedRef<HTMLButtonElement>(overlay ? hostRef : undefined, ref)}
      {...(overlay ? hostProps : {})}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.toggle()
      }}
      className={cn(overlay && "absolute inset-0 z-(--ll-z-raised) block size-full cursor-pointer", className)}
      {...props}
    >
      <Slot.Slottable>{children ?? <span className="sr-only">{ctx.label}</span>}</Slot.Slottable>
      {overlay ? node : null}
    </Comp>
  )
}

export { FlipCard, FlipCardFront, FlipCardBack, FlipCardTrigger, useFlipCard }
export type { FlipCardProps, FlipCardTriggerProps }
