// @ts-nocheck
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Paper, type PaperProps } from ".//paper"
import { useChatAlign } from "../lib/chat-align"
import { useInk, useMergedRef } from "../lib/ink/react"
import { bubbleReactionsRecipe, bubbleRecipe, type BubbleVariant } from "../lib/ink/recipes/bubble-ink"
import { cn } from "../lib/utils"

type BubbleShape = "cloud" | "note" | "sticky"
type BubblePen = "ink" | "you"

type BubbleState = { variant: BubbleVariant; align: "start" | "end"; shape: BubbleShape; pen: BubblePen }
const BubbleContext = React.createContext<BubbleState>({ variant: "default", align: "start", shape: "cloud", pen: "ink" })

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2 [&>[data-slot=bubble]:not(:last-child)_[data-part=tail]]:hidden", className)}
      {...props}
    />
  )
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        muted: "",
        tinted: "",
        outline: "",
        ghost: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Bubble({
  variant = "default",
  align,
  shape = "cloud",
  pen = "ink",
  tail = true,
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end"
    shape?: BubbleShape
    pen?: BubblePen
    tail?: boolean
  }) {
  const inherited = useChatAlign()
  const a = align ?? inherited ?? "start"
  const v = variant ?? "default"
  const state = React.useMemo<BubbleState>(() => ({ variant: v, align: a, shape, pen }), [v, a, shape, pen])
  return (
    <BubbleContext.Provider value={state}>
      <div
        data-slot="bubble"
        data-variant={v}
        data-align={a}
        data-shape={shape}
        data-tail={tail ? undefined : "false"}
        className={cn(bubbleVariants({ variant: v }), className)}
        {...props}
      />
    </BubbleContext.Provider>
  )
}

const contentVariants = cva(
  "relative isolate w-fit max-w-full min-w-0 px-4 py-2.5 font-hand text-base leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end compact:px-3.5 compact:py-2 calm:px-3 calm:py-1.5 [&:is(a,button)]:cursor-pointer [&:is(button)]:text-start group-data-[tail=false]/bubble:[&>svg_[data-part=tail]]:hidden",
  {
    variants: {
      variant: {
        default: "text-paper",
        secondary: "text-secondary-foreground",
        muted: "text-foreground",
        tinted: "text-foreground",
        outline: "text-foreground",
        ghost: "rounded-none bg-transparent p-0 text-foreground compact:p-0 calm:p-0",
        destructive: "text-paper",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const NOTE_STOCK: Record<BubbleVariant, NonNullable<PaperProps["stock"]>> = {
  default: "slip",
  secondary: "index-card",
  muted: "paper",
  tinted: "card",
  outline: "graph",
  ghost: "slip",
  destructive: "slip",
}
const STICKY_STOCK: Record<BubbleVariant, NonNullable<PaperProps["stock"]>> = {
  default: "sticky-orange",
  secondary: "sticky-yellow",
  muted: "sticky-blue",
  tinted: "sticky-pink",
  outline: "sticky-green",
  ghost: "sticky-yellow",
  destructive: "sticky-pink",
}

const CREASES =
  "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:content-[''] after:mix-blend-multiply after:[background:linear-gradient(90deg,transparent_31.6%,rgb(var(--ll-shade)/0.16)_32.2%,color-mix(in_srgb,var(--ll-photo)_50%,transparent)_32.9%,transparent_35.5%,transparent_64%,rgb(var(--ll-shade)/0.12)_64.6%,color-mix(in_srgb,var(--ll-photo)_45%,transparent)_65.3%,transparent_68%)]"

function BubbleContent({
  asChild = false,
  className,
  seed,
  paper,
  ref,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
  seed?: string | number
  paper?: Partial<PaperProps>
}) {
  const { variant, align, shape, pen } = React.useContext(BubbleContext)
  const drawn = shape === "cloud" && variant !== "ghost"
  const interactive = asChild
  const { hostRef, hostProps, node } = useInk({
    recipe: bubbleRecipe,
    params: { variant, tail: align, pen, interactive },
    kind: "bubble",
    seed,
    still: true,
  })
  const merged = useMergedRef<HTMLElement>(drawn ? hostRef : undefined, ref as React.Ref<HTMLElement> | undefined)
  const voice = pen === "you" ? "font-script text-[1.35rem] leading-snug text-ink-you" : undefined
  const base = contentVariants({ variant })

  if (shape !== "cloud") {
    const sticky = shape === "sticky"
    return (
      <Paper
        data-slot="bubble-content"
        ref={merged as React.Ref<HTMLElement>}
        stock={sticky ? STICKY_STOCK[variant] : NOTE_STOCK[variant]}
        curl
        seed={seed}
        className={cn(base, "rounded-none font-script text-[1.35rem] leading-snug text-ink", !sticky && CREASES, voice, className)}
        {...paper}
        {...props}
      >
        {children}
      </Paper>
    )
  }

  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="bubble-content"
      ref={merged}
      {...(drawn ? hostProps : {})}
      className={cn(base, voice, className)}
      {...props}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {drawn ? node : null}
    </Comp>
  )
}

const bubbleReactionsPlace = cva(
  "absolute z-10 flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 px-2 py-0.5 font-hand text-sm has-[button]:p-0 [&>svg[data-ink]]:[filter:var(--ll-drop-sticker)]",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "start-3",
        end: "end-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
)

function BubbleReactions({
  side = "bottom",
  align = "end",
  seed,
  className,
  ref,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end"
  side?: "top" | "bottom"
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({ recipe: bubbleReactionsRecipe, params: {}, kind: "reactions", seed, still: true })
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
      {...hostProps}
      className={cn(bubbleReactionsPlace({ side, align }), className)}
      {...props}
    >
      {node}
      {children}
    </div>
  )
}

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions }
export type { BubbleShape, BubblePen }
