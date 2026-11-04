// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import type { EdgeKind } from "../lib/ink/paper/edges"
import { useInk, useMergedRef } from "../lib/ink/react"
import { barcode, receiptCircleRecipe } from "../lib/ink/recipes/receipt-ink"
import { cn } from "../lib/utils"

type ReceiptProps = Omit<PaperProps, "stock" | "rules" | "edge"> & {
  ends?: EdgeKind
}

function Receipt({ className, ends = "zig", ...props }: ReceiptProps) {
  return (
    <Paper
      data-slot="receipt"
      stock="receipt"
      rules="none"
      edge={{ top: ends, bottom: ends }}
      className={cn("mx-auto flex w-72 flex-col gap-3 px-5 py-8 font-type text-[13px] leading-5 text-ink", className)}
      {...props}
    />
  )
}

function ReceiptHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="receipt-header" className={cn("flex flex-col items-center gap-0.5 text-center [&>:first-child]:text-base [&>:first-child]:font-bold", className)} {...props} />
}

function ReceiptLines({ className, ...props }: React.ComponentProps<"dl">) {
  return <dl data-slot="receipt-lines" className={cn("flex flex-col gap-1 border-y border-dashed border-pencil-mark py-2.5", className)} {...props} />
}

type ReceiptLineProps = Omit<React.ComponentProps<"div">, "children"> & {
  children: React.ReactNode
  qty?: number
  price: React.ReactNode
}

function ReceiptLine({ className, children, qty, price, ...props }: ReceiptLineProps) {
  return (
    <div data-slot="receipt-line" className={cn("flex items-baseline gap-2", className)} {...props}>
      <dt className="min-w-0 flex-1 wrap-anywhere">
        {qty !== undefined ? <span className="ll-num">{qty} x </span> : null}
        {children}
      </dt>
      <dd className="ll-num shrink-0 text-end">{price}</dd>
    </div>
  )
}

type ReceiptTotalProps = Omit<React.ComponentProps<"dl">, "children"> & {
  label?: React.ReactNode
  children: React.ReactNode
  circled?: boolean | "red" | "blue" | "ink"
  seed?: string | number
}

function ReceiptTotal({ className, label = "TOTAL", children, circled = false, seed, ...props }: ReceiptTotalProps) {
  const pen = circled === "blue" ? "blue" : circled === "ink" ? "ink" : "redfelt"
  const { hostRef, hostProps, node } = useInk({ recipe: receiptCircleRecipe, params: { pen }, kind: "circle", seed, still: true })
  const merged = useMergedRef<HTMLElement>(circled ? hostRef : undefined)
  return (
    <dl data-slot="receipt-total" className={cn("flex flex-wrap items-baseline justify-between gap-x-3 text-base font-bold", className)} {...props}>
      <dt>{label}</dt>
      <dd ref={merged as React.Ref<HTMLElement>} {...(circled && node ? hostProps : {})} className="ll-num relative isolate ms-auto px-1">
        {circled ? node : null}
        {children}
      </dd>
    </dl>
  )
}

function ReceiptDivider({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="receipt-divider" role="separator" className={cn("h-0 w-full border-t border-dashed border-pencil-mark", className)} {...props} />
}

type ReceiptBarcodeProps = Omit<React.ComponentProps<"figure">, "children"> & {
  value: string
  height?: number
}

function ReceiptBarcode({ className, value, height = 44, ...props }: ReceiptBarcodeProps) {
  const code = React.useMemo(() => barcode(value, 220, height), [value, height])
  return (
    <figure data-slot="receipt-barcode" className={cn("flex flex-col items-center gap-1.5", className)} {...props}>
      <svg role="img" aria-label={`Barcode ${value}`} viewBox={`0 0 220 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} focusable="false">
        <path d={code.d} fill="currentColor" />
      </svg>
      <figcaption className="ll-num text-xs tracking-[0.3em]">{value}</figcaption>
    </figure>
  )
}

function ReceiptFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="receipt-footer" className={cn("text-center text-xs text-muted-foreground", className)} {...props} />
}

export { Receipt, ReceiptHeader, ReceiptLines, ReceiptLine, ReceiptTotal, ReceiptDivider, ReceiptBarcode, ReceiptFooter }
export type { ReceiptProps, ReceiptLineProps, ReceiptTotalProps, ReceiptBarcodeProps }
