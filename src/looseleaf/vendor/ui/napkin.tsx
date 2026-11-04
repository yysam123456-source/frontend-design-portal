// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import { usePaperDecor } from "../hooks/use-paper-object"
import { napkinRecipe, type NapkinFold } from "../lib/ink/recipes/napkin-ink"
import { cn } from "../lib/utils"

type NapkinProps = Omit<PaperProps, "stock" | "rules"> & {
  fold?: NapkinFold
  stain?: boolean
}

function Napkin({ className, children, ref, fold = "quarter", stain = false, seed, tilt, size, style, ...props }: NapkinProps) {
  const o = usePaperDecor({ recipe: napkinRecipe, params: { fold, stain }, kind: "napkin", ref, seed, tilt, tiltMax: 1.2, size, enabled: fold !== "none" || stain })
  return (
    <Paper
      data-slot="napkin"
      data-fold={fold}
      stock="napkin"
      rules="none"
      size={size}
      {...o.paper}
      {...props}
      className={cn(o.paper.className, "flex min-h-56 w-72 flex-col gap-2 p-9 text-ink", className)}
      style={{ ...o.paper.style, ...style }}
    >
      {o.decor}
      {children}
    </Paper>
  )
}

function NapkinContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="napkin-content" className={cn("flex-1 font-script text-[1.5rem] leading-[1.15]", className)} {...props} />
}

function NapkinTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="napkin-title" className={cn("font-script text-[2rem] leading-none font-bold", className)} {...props} />
}

function NapkinFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="napkin-footer" className={cn("mt-auto text-sm text-ink-soft", className)} {...props} />
}

export { Napkin, NapkinTitle, NapkinContent, NapkinFooter }
export type { NapkinProps }
