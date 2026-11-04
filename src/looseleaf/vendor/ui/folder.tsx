// @ts-nocheck
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { Paper, type PaperProps } from ".//paper"
import { usePaperDecor } from "../hooks/use-paper-object"
import { useInkFaces } from "../lib/ink/paper/sheet-layers"
import type { StockName } from "../lib/ink/paper/stocks"
import { useMergedRef } from "../lib/ink/react"
import { folderBodyRecipe, folderTabRecipe } from "../lib/ink/recipes/folder-ink"
import { cn } from "../lib/utils"

const FolderContext = React.createContext<{ stock: StockName }>({ stock: "kraft" })

type FolderProps = Omit<React.ComponentProps<typeof TabsPrimitive.Root>, "orientation"> & {
  stock?: StockName
}

function Folder({ className, stock = "kraft", ...props }: FolderProps) {
  const ctx = React.useMemo(() => ({ stock }), [stock])
  return (
    <FolderContext.Provider value={ctx}>
      <TabsPrimitive.Root data-slot="folder" className={cn("flex w-full max-w-2xl flex-col", className)} {...props} orientation="horizontal" />
    </FolderContext.Provider>
  )
}

function FolderTabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="folder-tabs" className={cn("relative z-10 flex items-end gap-1 ps-4 pe-4", className)} {...props} />
}

function FolderTab({ className, children, ref, disabled, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { stock } = React.useContext(FolderContext)
  const { hostRef, hostProps, node } = useInkFaces({ recipe: folderTabRecipe, params: { stock, disabled: !!disabled }, kind: "folder-tab", still: true })
  const merged = useMergedRef<HTMLButtonElement>(hostRef, ref)
  return (
    <TabsPrimitive.Trigger
      data-slot="folder-tab"
      ref={merged}
      disabled={disabled}
      {...(node ? hostProps : {})}
      className={cn(
        "relative isolate inline-flex h-9 items-center justify-center whitespace-nowrap px-6 pt-1 font-hand text-[15px] font-bold text-ink compact:h-8 compact:px-5 calm:h-7 calm:px-4",
        "cursor-pointer data-[state=active]:z-10 data-[state=active]:pt-0.5 data-[state=active]:text-ink disabled:cursor-not-allowed disabled:text-pencil-text",
        "data-[state=active]:[&>svg_[data-layer=hover]]:hidden",
        "forced-colors:data-[state=active]:bg-[Highlight] forced-colors:data-[state=active]:text-[HighlightText]",
        "not-data-[ink-ready]:border not-data-[ink-ready]:border-b-0 not-data-[ink-ready]:border-pencil-mark not-data-[ink-ready]:bg-index-card",
        className,
      )}
      {...props}
    >
      {node}
      {children}
    </TabsPrimitive.Trigger>
  )
}

type FolderContentProps = Omit<React.ComponentProps<typeof TabsPrimitive.Content>, "ref"> &
  Pick<PaperProps, "tilt" | "seed" | "edge" | "tape" | "tapeKind" | "fastener" | "fastenerTone" | "shadow" | "size"> & {
    crease?: boolean
    ref?: React.Ref<HTMLElement>
  }

function FolderContent({ className, children, ref, crease = true, tilt = false, seed, size, edge, tape, tapeKind, fastener, fastenerTone, shadow, ...props }: FolderContentProps) {
  const { stock } = React.useContext(FolderContext)
  const o = usePaperDecor({ recipe: folderBodyRecipe, params: { crease }, kind: "folder", ref, seed, tilt, size, enabled: crease })
  return (
    <TabsPrimitive.Content asChild {...props}>
      <Paper
        data-slot="folder-content"
        stock={stock}
        rules="none"
        edge={edge}
        tape={tape}
        tapeKind={tapeKind}
        fastener={fastener}
        fastenerTone={fastenerTone}
        shadow={shadow}
        size={size}
        {...o.paper}
        className={cn(o.paper.className, "min-h-40 px-6 pt-8 pb-6 text-ink", className)}
        style={o.paper.style}
      >
        {o.decor}
        {children}
      </Paper>
    </TabsPrimitive.Content>
  )
}

export { Folder, FolderTabs, FolderTab, FolderContent }
export type { FolderProps, FolderContentProps }
