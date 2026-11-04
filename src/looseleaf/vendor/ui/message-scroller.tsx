// @ts-nocheck
"use client"

import * as React from "react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "../lib/message-scroller-primitive"
import { cn } from "../lib/utils"

function MessageScrollerProvider(props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>) {
  return <MessageScrollerPrimitive.Provider {...props} />
}

function MessageScroller({ className, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return <MessageScrollerPrimitive.Root data-slot="message-scroller" className={cn("group/message-scroller relative flex size-full min-h-0 flex-col", className)} {...props} />
}

function MessageScrollerViewport({ className, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain [--fade-b:0px] [--fade-t:0px] [mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-t),black_calc(100%-var(--fade-b)),transparent)] [scrollbar-gutter:stable] [scrollbar-width:thin] group-data-[scrollable~=end]/message-scroller:[--fade-b:28px] group-data-[scrollable~=start]/message-scroller:[--fade-t:20px] data-autoscrolling:[scrollbar-width:none] focus-visible:-outline-offset-3",
        className
      )}
      {...props}
    />
  )
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return <MessageScrollerPrimitive.Content data-slot="message-scroller-content" className={cn("flex h-max min-h-full flex-col gap-5 px-4 py-4", className)} {...props} />
}

function MessageScrollerItem({ className, scrollAnchor = false, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return <MessageScrollerPrimitive.Item data-slot="message-scroller-item" scrollAnchor={scrollAnchor} className={cn("min-w-0 shrink-0", className)} {...props} />
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  render,
  variant = "secondary",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      data-variant={variant}
      data-size={size}
      direction={direction}
      className={cn(
        "absolute inset-s-1/2 z-(--ll-z-raised) -translate-x-1/2 transition-[translate,scale,opacity] duration-(--ll-dur-sheet) ease-settle data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
        className
      )}
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    >
      {children ?? (
        <>
          <Icon name="arrow-down" />
          <span className="sr-only">{direction === "end" ? "Scroll to end" : "Scroll to start"}</span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
