// @ts-nocheck
"use client"

import * as React from "react"

import { MARK_REVEAL, useMarkPhase } from "../hooks/use-mark-ink"
import { useInk, useMergedRef } from "../lib/ink/react"
import { bracketRecipe, type BracketKind } from "../lib/ink/recipes/bracket-ink"
import type { MarkPen, MarkWeight } from "../lib/ink/recipes/text-marks-ink"
import { cn } from "../lib/utils"

function Bracket({
  kind = "square",
  side = "start",
  tone = "ink",
  weight = "regular",
  inset = 8,
  animate = false,
  show = true,
  delay,
  seed,
  className,
  style,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: BracketKind
  side?: "start" | "end"
  tone?: MarkPen
  weight?: MarkWeight
  inset?: number
  animate?: boolean
  show?: boolean
  delay?: number
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({ recipe: bracketRecipe, params: { kind, side, tone, weight, inset, animate }, kind: "bracket", seed })
  const { phaseRef, phaseProps } = useMarkPhase({ animate, show })
  const ready = !!node && show
  return (
    <div
      data-slot="bracket"
      data-kind={kind}
      data-side={side}
      ref={useMergedRef<HTMLElement>(hostRef, phaseRef, ref as React.Ref<HTMLElement> | undefined)}
      {...(ready ? hostProps : {})}
      {...phaseProps}
      style={{ ...(animate ? ({ "--ll-draw-delay": `${delay ?? 0}ms` } as React.CSSProperties) : undefined), ...style }}
      className={cn("relative isolate outline-none", side === "start" ? "ps-7" : "pe-7", animate && MARK_REVEAL, className)}
      {...props}
    >
      {ready ? node : null}
      {children}
    </div>
  )
}

export { Bracket }
