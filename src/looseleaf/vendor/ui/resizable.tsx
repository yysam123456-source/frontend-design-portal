// @ts-nocheck
"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"

import { Icon } from ".//icon"
import { useInk, useMergedRef } from "../lib/ink/react"
import { resizableRecipe } from "../lib/ink/recipes/resizable-ink"
import { cn } from "../lib/utils"

const SEAM_STATE = [
  "data-[separator=hover]:[&>svg_[data-layer=hover]]:visible data-[separator=hover]:[&>svg_[data-layer=hover]]:opacity-100",
  "data-[separator=active]:[&>svg_[data-layer=hover]]:opacity-0 data-[separator=active]:[&>svg_[data-layer=pressed]]:visible data-[separator=active]:[&>svg_[data-layer=pressed]]:opacity-100",
].join(" ")

const GroupContext = React.createContext<{ orientation: "horizontal" | "vertical"; disabled: boolean }>({ orientation: "horizontal", disabled: false })

function ResizablePanelGroup({ className, orientation = "horizontal", disabled, style, ...props }: ResizablePrimitive.GroupProps) {
  const context = React.useMemo(() => ({ orientation, disabled: !!disabled }), [orientation, disabled])
  return (
    <GroupContext.Provider value={context}>
      <ResizablePrimitive.Group
        data-slot="resizable-panel-group"
        data-orientation={orientation}
        orientation={orientation}
        disabled={disabled}
        resizeTargetMinimumSize={{ coarse: 37, fine: 24 }}
        style={{ height: undefined, width: undefined, ...style }}
        className={cn("flex h-full w-full", className)}
        {...props}
      />
    </GroupContext.Provider>
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  disabled,
  elementRef,
  seed,
  children,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
  seed?: string | number
}) {
  const group = React.useContext(GroupContext)
  const line = group.orientation === "horizontal" ? "vertical" : "horizontal"
  const { hostRef, hostProps, node } = useInk({ recipe: resizableRecipe, params: { line, grip: !!withHandle, disabled: !!(disabled ?? group.disabled) }, kind: "seam", seed, still: true })
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      disabled={disabled}
      elementRef={useMergedRef<HTMLDivElement>(hostRef, elementRef)}
      {...(node ? hostProps : {})}
      className={cn("relative isolate flex shrink-0 items-center justify-center", line === "vertical" ? "w-2" : "h-2", SEAM_STATE, className)}
      {...props}
    >
      {node}
      {withHandle ? (
        <div data-slot="resizable-handle-grip" className="pointer-events-none z-10 flex items-center justify-center">
          <Icon name="grip-vertical" size={14} className={line === "horizontal" ? "rotate-90" : undefined} />
        </div>
      ) : null}
      {children}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
export { useDefaultLayout, useGroupRef, usePanelRef } from "react-resizable-panels"
export type { GroupImperativeHandle, Layout, LayoutStorage, PanelImperativeHandle } from "react-resizable-panels"
