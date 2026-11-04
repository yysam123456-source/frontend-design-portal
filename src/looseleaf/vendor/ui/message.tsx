// @ts-nocheck
"use client"

import * as React from "react"

import { ChatAlignContext } from "../lib/chat-align"
import { makeRng } from "../lib/ink/rng"
import { cn } from "../lib/utils"

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="message-group" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
}

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <ChatAlignContext.Provider value={align}>
      <div
        data-slot="message"
        data-align={align}
        className={cn("group/message relative flex w-full min-w-0 gap-2 text-[15px] data-[align=end]:flex-row-reverse", className)}
        {...props}
      />
    </ChatAlignContext.Provider>
  )
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex w-fit min-w-8 shrink-0 items-center justify-center self-end group-has-data-[slot=message-footer]/message:-translate-y-8",
        className
      )}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn("flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end", className)}
      {...props}
    />
  )
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "flex max-w-full min-w-0 items-center gap-2 px-3 font-hand text-sm font-bold text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
        className
      )}
      {...props}
    />
  )
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "flex max-w-full min-w-0 items-center gap-2 px-3 font-hand text-sm text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
        className
      )}
      {...props}
    />
  )
}

function jitterOf(seed: string, index: number): React.CSSProperties {
  const r = makeRng(`${seed}:${index}`)
  return {
    "--jy": `${((r() * 2 - 1) * 0.6).toFixed(2)}px`,
    "--jo": (0.88 + r() * 0.12).toFixed(2),
  } as React.CSSProperties
}

const CSS = `[data-slot=message-text] [style*="--jy"]{position:relative;top:calc(var(--jy,0px)*var(--ll-jitter-k,1));color:color-mix(in srgb,currentColor calc((1 - (1 - var(--jo,1))*var(--ll-jitter-k,1))*100%),transparent)}`

const WORDS = /(\s+)/
const RTL_SCRIPT = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
const CARET = "after:ms-0.5 after:inline-block after:h-[1.05em] after:w-0.5 after:animate-pulse after:rounded-full after:bg-ink-you after:align-[-0.18em] after:content-['']"

function MessageText({
  children,
  streaming = false,
  jitter = true,
  seed,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  children?: string
  streaming?: boolean
  jitter?: boolean
  seed?: string | number
}) {
  const id = React.useId()
  const text = children ?? ""
  const s = seed === undefined ? id : String(seed)
  const bidi = RTL_SCRIPT.test(text)
  const parts = React.useMemo(() => (bidi ? [] : text.split(WORDS)), [text, bidi])
  let last = parts.length - 1
  while (last > 0 && (parts[last] === "" || last % 2 === 1)) last--
  const settled = React.useRef<number | null>(null)
  if (settled.current === null) {
    let end = parts.length
    while (end > 0 && parts[end - 1] === "") end--
    settled.current = end
  }
  let word = 0
  const out = parts.map((p, i) => {
    if (p === "") return null
    if (i % 2 === 1) return p
    const n = word++
    const fresh = streaming && i >= (settled.current ?? 0)
    return (
      <span
        key={i}
        data-word={fresh ? "fresh" : undefined}
        className={cn(fresh && "animate-soak", streaming && i === last && CARET) || undefined}
        style={jitter ? jitterOf(s, n) : undefined}
      >
        {p}
      </span>
    )
  })
  return (
    <span
      data-slot="message-text"
      data-streaming={streaming ? "" : undefined}
      dir={bidi ? "auto" : undefined}
      className={cn("whitespace-pre-wrap", bidi && streaming && CARET, className)}
      {...props}
    >
      {jitter && !bidi ? (
        <style href="ll-message-text" precedence="low">
          {CSS}
        </style>
      ) : null}
      {bidi ? text : out}
    </span>
  )
}

export { MessageGroup, Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader, MessageText }
