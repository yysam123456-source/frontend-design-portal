// @ts-nocheck
"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { Paper, type PaperProps } from ".//paper"
import { useShapedSheet } from "../hooks/use-paper-object"
import type { Accent } from "../lib/ink/paper/props"
import { useInkFaces } from "../lib/ink/paper/sheet-layers"
import type { StockName } from "../lib/ink/paper/stocks"
import { useMergedRef } from "../lib/ink/react"
import { envelopeBackRecipe, envelopeFrontRecipe } from "../lib/ink/recipes/envelope-ink"
import { cn } from "../lib/utils"

type EnvelopeContextValue = { stock: StockName; stamp: Accent | "none"; postmark: boolean; airmail: boolean; seed: string }
const EnvelopeContext = React.createContext<EnvelopeContextValue | null>(null)

const FRONT_TILT = "[&>svg]:[rotate:clamp(calc(var(--ll-tilt-max)*-1),var(--ll-tilt,0deg),var(--ll-tilt-max))]"

type EnvelopeProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  stock?: StockName
  stamp?: Accent | false
  postmark?: boolean
  airmail?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  openOnHover?: boolean
  disabled?: boolean
  tilt?: boolean | number
  seed?: string | number
  size?: readonly [number, number]
}

function Envelope({
  className,
  style,
  children,
  ref,
  stock = "kraft",
  stamp = "tomato",
  postmark = true,
  airmail = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openOnHover = false,
  disabled,
  tilt,
  seed,
  size,
  onPointerEnter,
  onPointerLeave,
  ...props
}: EnvelopeProps) {
  const [inner, setInner] = React.useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : inner
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!controlled) setInner(v)
      onOpenChange?.(v)
    },
    [controlled, onOpenChange],
  )
  const hoverOpened = React.useRef(false)
  const o = useShapedSheet({ recipe: envelopeBackRecipe, params: { stock }, seed, tilt, tiltMax: 1.1, size })
  const ctx = React.useMemo<EnvelopeContextValue>(() => ({ stock, stamp: stamp || "none", postmark: postmark && !!stamp, airmail, seed: o.seed }), [stock, stamp, postmark, airmail, o.seed])
  const state = open ? "open" : "closed"
  return (
    <EnvelopeContext.Provider value={ctx}>
      <div data-slot="envelope" data-state={state} ref={ref} className={cn("group/env @container w-full max-w-sm", className)} style={style} {...props}>
        <div aria-hidden="true" className="h-0 transition-[height] duration-(--ll-dur-sheet) ease-(--ll-ease-settle) group-data-[state=open]/env:h-[31cqw]" />
        <CollapsiblePrimitive.Root
          open={open}
          disabled={disabled}
          onOpenChange={(v) => {
            if (!v && hoverOpened.current) {
              hoverOpened.current = false
              return
            }
            hoverOpened.current = false
            setOpen(v)
          }}
          asChild
        >
          <div
            data-slot="envelope-body"
            {...o.root}
            onPointerEnter={(e) => {
              onPointerEnter?.(e as never)
              if (openOnHover && !disabled && e.pointerType === "mouse" && !open) {
                hoverOpened.current = true
                setOpen(true)
              }
            }}
            onPointerLeave={(e) => {
              onPointerLeave?.(e as never)
              if (openOnHover && e.pointerType === "mouse" && hoverOpened.current) {
                hoverOpened.current = false
                if (e.currentTarget.querySelector('[data-slot="envelope-letter"]')?.contains(document.activeElement)) return
                setOpen(false)
              }
            }}
            className={cn("relative isolate aspect-[8/5] w-full", !o.ready && "bg-card shadow-card")}
            style={o.root.style}
          >
            {o.node}
            {children}
          </div>
        </CollapsiblePrimitive.Root>
      </div>
    </EnvelopeContext.Provider>
  )
}

type EnvelopeLetterProps = Omit<PaperProps, "stock" | "as"> & { stock?: StockName }

function EnvelopeLetter({ className, stock = "paper", children, ...props }: EnvelopeLetterProps) {
  return (
    <CollapsiblePrimitive.Content asChild>
      <Paper
        data-slot="envelope-letter"
        stock={stock}
        className={cn(
          "absolute inset-x-[5%] bottom-[9%] z-10 h-[86%] -translate-y-[38%] overflow-hidden p-5 text-ink data-[state=closed]:hidden",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-[30%] data-[state=open]:duration-(--ll-dur-sheet)",
          className,
        )}
        {...props}
      >
        {children}
      </Paper>
    </CollapsiblePrimitive.Content>
  )
}

function EnvelopeFront({ className, children, ref, ...props }: React.ComponentProps<"div">) {
  const ctx = React.useContext(EnvelopeContext)
  const { hostRef, hostProps, node } = useInkFaces({
    recipe: envelopeFrontRecipe,
    params: { stock: ctx?.stock ?? "paper", stamp: ctx?.stamp ?? "none", postmark: ctx?.postmark ?? false, airmail: ctx?.airmail ?? false },
    kind: "envelope",
    seed: `${ctx?.seed ?? "envelope"}|front`,
    still: true,
  })
  const merged = useMergedRef<HTMLDivElement>(hostRef, ref)
  return (
    <div
      data-slot="envelope-front"
      ref={merged}
      {...(node ? hostProps : {})}
      className={cn("absolute inset-0 z-20 isolate flex flex-col justify-end ps-[13%] pe-[8%] pb-[8%] text-ink", FRONT_TILT, className)}
      {...props}
    >
      {node}
      {children}
    </div>
  )
}

function EnvelopeTrigger({ className, children, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="envelope-trigger" className={cn("absolute inset-0 z-10 cursor-pointer disabled:cursor-not-allowed", className)} {...props}>
      <span className="sr-only">{children ?? "Open the letter"}</span>
    </CollapsiblePrimitive.Trigger>
  )
}

function EnvelopeAddress({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="envelope-address"
      className={cn(
        "max-w-[62%] font-script text-[1.35rem] leading-7 break-words [background-image:linear-gradient(to_bottom,transparent_calc(100%-1px),color-mix(in_srgb,var(--ll-pencil-mark)_55%,transparent)_calc(100%-1px))] [background-size:100%_28px]",
        className,
      )}
      {...props}
    />
  )
}

function EnvelopeSender({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="envelope-sender" className={cn("absolute start-[5%] top-[7%] max-w-[40%] text-xs leading-tight break-words text-ink-soft", className)} {...props} />
}

export { Envelope, EnvelopeLetter, EnvelopeFront, EnvelopeTrigger, EnvelopeAddress, EnvelopeSender }
export type { EnvelopeProps, EnvelopeLetterProps }
