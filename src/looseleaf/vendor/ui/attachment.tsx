// @ts-nocheck
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Button } from ".//button"
import { Fastener, Paper } from ".//paper"
import { Tape } from ".//tape"
import { useInk, useMergedRef } from "../lib/ink/react"
import {
  attachmentMediaRecipe,
  attachmentProgressRecipe,
  attachmentRecipe,
  type AttachmentOrientation,
  type AttachmentState,
} from "../lib/ink/recipes/attachment-ink"
import { cn } from "../lib/utils"

type AttachmentSize = "default" | "sm" | "xs"

const AttachmentContext = React.createContext<{ state: AttachmentState; orientation: AttachmentOrientation; size: AttachmentSize; titleId?: string }>({
  state: "done",
  orientation: "horizontal",
  size: "default",
})

const attachmentVariants = cva(
  "group/attachment relative isolate flex w-fit max-w-full min-w-0 shrink-0 flex-wrap font-hand text-card-foreground not-has-[[data-slot=attachment-trigger]]:[&>svg_[data-layer=hover]]:hidden data-[clip]:not-has-[[data-slot=attachment-actions]]:[&>[data-slot=attachment-content]]:pe-3",
  {
    variants: {
      size: {
        default: "gap-2 text-[15px] has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2.5",
        sm: "gap-2.5 text-sm has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-2",
        xs: "gap-1.5 text-sm has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1.5",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-28 flex-col pb-4 has-data-[slot=attachment-content]:w-32",
      },
    },
  }
)

function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  seed,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState
    seed?: string | number
  }) {
  const st = state ?? "done"
  const sz = (size ?? "default") as AttachmentSize
  const or = (orientation ?? "horizontal") as AttachmentOrientation
  const { hostRef, hostProps, node, seed: s } = useInk({
    recipe: attachmentRecipe,
    params: { state: st, orientation: or, interactive: true },
    kind: "attachment",
    seed,
    still: true,
  })
  const titleId = React.useId()
  const ctx = React.useMemo(() => ({ state: st, orientation: or, size: sz, titleId }), [st, or, sz, titleId])
  const clipped = st === "done" && or === "horizontal" && sz === "default"
  return (
    <AttachmentContext.Provider value={ctx}>
      <div
        data-slot="attachment"
        data-state={st}
        data-size={sz}
        data-orientation={or}
        data-clip={clipped ? "" : undefined}
        data-ink-focus="within"
        ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
        {...hostProps}
        className={cn(attachmentVariants({ size: sz, orientation: or }), className)}
        {...props}
      >
        {st === "idle" ? null : (
          <span aria-hidden="true" data-slot="attachment-sheet" className="pointer-events-none absolute inset-0 -z-20">
            <Paper
              stock={or === "vertical" ? "photo" : "slip"}
              rules="none"
              tilt={or === "vertical" ? undefined : false}
              seed={`${s}|sheet`}
              className="size-full"
            />
          </span>
        )}
        {node}
        {st === "done" && or === "vertical" ? <Tape kind="masking" length={52} height={18} seed={`${s}|tape`} className="absolute -top-2.5 left-1/2 -ml-[26px] calm:hidden" /> : null}
        {clipped ? <Fastener kind="clip" size={30} seed={`${s}|clip`} className="absolute -top-3 end-1.5 z-(--ll-z-prop) calm:hidden" /> : null}
        {children}
      </div>
    </AttachmentContext.Provider>
  )
}

const attachmentMediaVariants = cva(
  "relative isolate flex aspect-square w-10 shrink-0 items-center justify-center text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[state=error]/attachment:text-red group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not(.absolute):not([data-ink=doodle]):not([data-ink=sticker]):not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not(.absolute):not([data-ink=doodle]):not([data-ink=sticker]):not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not(.absolute):not([data-ink=doodle]):not([data-ink=sticker]):not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 [&>img]:m-[3px] [&>img]:aspect-square [&>img]:size-[calc(100%-6px)] [&>img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

function AttachmentMedia({
  className,
  variant = "icon",
  seed,
  ref,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants> & { seed?: string | number }) {
  const { state } = React.useContext(AttachmentContext)
  const v = variant ?? "icon"
  const { hostRef, hostProps, node } = useInk({ recipe: attachmentMediaRecipe, params: { state, variant: v }, kind: "media", seed, still: true })
  return (
    <div
      data-slot="attachment-media"
      data-variant={v}
      ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
      {...hostProps}
      className={cn(attachmentMediaVariants({ variant: v }), className)}
      {...props}
    >
      {node}
      {children}
    </div>
  )
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("max-w-full min-w-0 flex-1 pe-0.5 leading-tight group-data-[orientation=vertical]/attachment:px-1", className)}
      {...props}
    />
  )
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
  const { titleId } = React.useContext(AttachmentContext)
  return (
    <span
      data-slot="attachment-title"
      id={titleId}
      className={cn(
        "ll-ink-room block min-w-0 truncate font-bold group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        "ll-ink-room mt-0.5 block min-w-0 truncate text-sm text-muted-foreground group-data-[state=error]/attachment:text-red",
        className
      )}
      {...props}
    />
  )
}

function AttachmentProgress({
  value,
  max = 100,
  className,
  style,
  seed,
  ref,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value?: number
  max?: number
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({ recipe: attachmentProgressRecipe, params: { indeterminate: value === undefined }, kind: "progress", seed, size: [120, 10], still: true })
  const own = React.useRef<HTMLDivElement | null>(null)
  const [titledBy, setTitledBy] = React.useState<string | undefined>()
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined
  React.useLayoutEffect(() => {
    if (named) return
    const title = own.current?.closest('[data-slot="attachment"]')?.querySelector<HTMLElement>('[data-slot="attachment-title"]')
    setTitledBy(title?.id || undefined)
  })
  const pct = value === undefined ? 100 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      data-slot="attachment-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value === undefined ? undefined : Math.round(value)}
      data-state={value === undefined ? "indeterminate" : pct >= 100 ? "complete" : "loading"}
      aria-labelledby={named ? undefined : titledBy}
      ref={useMergedRef<HTMLElement>(hostRef, own, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
      {...hostProps}
      style={{ "--ll-progress": `${pct}%`, ...style } as React.CSSProperties}
      className={cn(
        "relative isolate mt-1.5 block h-2.5 w-full min-w-16 [&>svg_[data-part=bar]]:transition-[clip-path] [&>svg_[data-part=bar]]:duration-(--ll-dur-sheet) [&>svg_[data-part=bar]]:[clip-path:inset(-15%_calc(100%-var(--ll-progress))_-15%_-3%)] rtl:[&>svg_[data-part=bar]]:[clip-path:inset(-15%_-3%_-15%_calc(100%-var(--ll-progress)))] data-[state=indeterminate]:[&>svg_[data-part=bar]]:animate-pulse",
        className
      )}
      {...props}
    >
      {node}
    </div>
  )
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:end-2 group-data-[orientation=vertical]/attachment:top-2 group-data-[orientation=vertical]/attachment:gap-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentAction({ className, variant, size = "icon-xs", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="attachment-action" variant={variant ?? "ghost"} size={size} className={cn(className)} {...props} />
}

function AttachmentTrigger({
  className,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? "button")}
      className={cn("absolute inset-0 z-10 cursor-pointer outline-hidden", className)}
      {...props}
    />
  )
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto overscroll-x-contain px-3 pt-4 pb-3 [scrollbar-width:none] *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className
      )}
      {...props}
    />
  )
}

export { Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentProgress, AttachmentActions, AttachmentAction, AttachmentTrigger }
export type { AttachmentState, AttachmentSize }
