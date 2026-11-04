// @ts-nocheck
"use client"

import * as React from "react"

import { useShapedSheet } from "../hooks/use-paper-object"
import type { StockName } from "../lib/ink/paper/stocks"
import { ticketRecipe, type TicketStub } from "../lib/ink/recipes/ticket-ink"
import { cn } from "../lib/utils"

const TicketContext = React.createContext<{ stubWidth: number }>({ stubWidth: 88 })

type TicketProps = React.ComponentProps<"div"> & {
  stock?: StockName
  stub?: TicketStub
  stubWidth?: number
  punched?: boolean
  tilt?: boolean | number
  seed?: string | number
  size?: readonly [number, number]
}

function Ticket({ className, style, children, ref, stock = "kraft", stub = "end", stubWidth = 88, punched = false, tilt, seed, size, ...props }: TicketProps) {
  const o = useShapedSheet({ recipe: ticketRecipe, params: { stock, stub, stubWidth, punched }, ref, seed, tilt, tiltMax: 1.2, size })
  const ctx = React.useMemo(() => ({ stubWidth }), [stubWidth])
  return (
    <TicketContext.Provider value={ctx}>
      <div
        data-slot="ticket"
        data-stub={stub}
        data-punched={punched ? "" : undefined}
        {...o.root}
        {...props}
        className={cn("relative isolate flex min-h-28 w-full max-w-lg items-stretch text-ink", stub === "start" && "flex-row-reverse", !o.ready && "bg-index-card shadow-card", className)}
        style={{ ...o.root.style, ...style }}
      >
        {o.node}
        {children}
      </div>
    </TicketContext.Provider>
  )
}

function TicketBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ticket-body" className={cn("flex min-w-0 flex-1 flex-col justify-center gap-1 px-6 py-4 font-type break-words", className)} {...props} />
}

function TicketStub({ className, style, ...props }: React.ComponentProps<"aside">) {
  const { stubWidth } = React.useContext(TicketContext)
  return <aside data-slot="ticket-stub" role="note" className={cn("flex shrink-0 flex-col items-center justify-center gap-1 px-2 py-3 text-center font-type break-words", className)} style={{ width: stubWidth, ...style }} {...props} />
}

function TicketTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ticket-title" className={cn("text-2xl leading-none", className)} {...props} />
}

function TicketDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ticket-description" className={cn("text-sm", className)} {...props} />
}

function TicketNumber({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="ticket-number" className={cn("ll-num text-sm tracking-widest text-[color-mix(in_srgb,var(--ll-red)_60%,var(--ll-ink))]", className)} {...props} />
}

export { Ticket, TicketBody, TicketStub, TicketTitle, TicketDescription, TicketNumber }
export type { TicketProps }
