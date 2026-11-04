// @ts-nocheck
"use client"

import * as React from "react"

import { MARK_REVEAL, useMarkPhase } from "../hooks/use-mark-ink"
import { useInk, useMergedRef } from "../lib/ink/react"
import type { MarkPen, MarkWeight } from "../lib/ink/recipes/text-marks-ink"
import { signatureRecipe, type SignatureFlourish } from "../lib/ink/recipes/signature-ink"
import { cn } from "../lib/utils"

const NAME_WIPE =
  "data-animate:data-[mark=idle]:[&>[data-slot=signature-name]]:[clip-path:inset(-10%_var(--ll-wipe-r,100%)_-10%_var(--ll-wipe-l,-4%))] data-animate:data-[mark=in]:[&>[data-slot=signature-name]]:animate-[ll-wipe_calc(var(--ll-dur-draw)*1.6)_var(--ll-ease-out)_var(--ll-name-delay,0s)_both]"

const SIZE: Record<"sm" | "md" | "lg", number> = { sm: 28, md: 44, lg: 64 }
const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = { sm: "text-[28px]", md: "text-[44px]", lg: "text-[64px]" }

function Signature({
  flourish = "swoosh",
  size = "md",
  tone = "blue",
  weight = "regular",
  animate = false,
  show = true,
  delay,
  seed,
  className,
  style,
  children,
  ref,
  ...props
}: React.ComponentProps<"span"> & {
  flourish?: SignatureFlourish
  size?: keyof typeof SIZE
  tone?: MarkPen
  weight?: MarkWeight
  animate?: boolean
  show?: boolean
  delay?: number
  seed?: string | number
}) {
  const fs = SIZE[size]
  const { hostRef, hostProps, node } = useInk({ recipe: signatureRecipe, params: { flourish, tone, weight, fs, animate }, kind: "signature", seed })
  const { phaseRef, phaseProps } = useMarkPhase({ animate, show })
  const ready = !!node && show
  const t = delay ?? 0
  return (
    <span
      data-slot="signature"
      ref={useMergedRef<HTMLElement>(hostRef, phaseRef, ref as React.Ref<HTMLElement> | undefined)}
      {...(ready ? hostProps : {})}
      {...phaseProps}
      style={{ ...(animate ? ({ "--ll-name-delay": `${t}ms`, "--ll-draw-delay": `${t + 700}ms` } as React.CSSProperties) : undefined), ...style }}
      className={cn(
        "relative isolate inline-block self-start justify-self-start outline-none pb-3 font-script leading-none whitespace-nowrap text-ink-you",
        tone === "ink" && "text-ink",
        SIZE_CLASS[size],
        animate && NAME_WIPE,
        animate && MARK_REVEAL,
        className,
      )}
      {...props}
    >
      <span data-slot="signature-name">{children}</span>
      {ready ? node : null}
    </span>
  )
}

export { Signature }
