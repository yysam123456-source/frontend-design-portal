// @ts-nocheck
"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { NavigationMenu as NavigationMenuPrimitive, Slot as SlotPrimitive } from "radix-ui"

import { Icon } from ".//icon"
import { Paper } from ".//paper"
import { PropSvg } from "../lib/ink/paper/prop-svg"
import { stockOf, TOOTH_TILES } from "../lib/ink/paper/stocks"
import type { PaperTileName } from "../lib/ink/textures"
import { InkTiles, useDensity, useInk, useInkSeed, useInkTier, useMergedRef } from "../lib/ink/react"
import { navBaselineRecipe, navTabRecipe, underlineMark } from "../lib/ink/recipes/navigation-menu-ink"
import { cn } from "../lib/utils"

const InPanel = React.createContext(false)

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  const tiles = TOOTH_TILES[stockOf("slip").tooth].map(([t]) => t) as PaperTileName[]
  return (
    <NavigationMenuPrimitive.Root data-slot="navigation-menu" data-viewport={viewport} className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)} {...props}>
      {viewport ? null : <InkTiles tiles={tiles} />}
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({ className, children, ref, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  const { hostRef, hostProps, node } = useInk({ recipe: navBaselineRecipe, params: {}, kind: "rule", still: true })
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      ref={useMergedRef<HTMLUListElement>(hostRef, ref)}
      {...(node ? hostProps : {})}
      className={cn("group relative isolate flex flex-1 list-none items-end justify-center gap-1", className)}
      {...props}
    >
      {node}
      {children}
    </NavigationMenuPrimitive.List>
  )
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />
}

const navigationMenuTriggerStyle = cva(
  "group relative isolate inline-flex h-9 w-max items-center justify-center gap-1 px-4 py-2 font-hand text-[15px] font-bold whitespace-nowrap text-foreground transition-[translate,color] duration-(--ll-dur-hover) ease-settle disabled:pointer-events-none disabled:text-pencil-text data-[state=open]:-translate-y-0.5 data-[selected]:-translate-y-0.5 compact:h-8 calm:h-7 calm:text-sm"
)

function NavigationMenuTrigger({
  className,
  children,
  seed,
  disabled,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger> & {
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({ recipe: navTabRecipe, params: { role: "trigger", disabled: !!disabled }, kind: "tab", seed, still: true })
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      ref={useMergedRef<HTMLButtonElement>(hostRef, ref)}
      {...hostProps}
      disabled={disabled}
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {node}
      {children}
      <Icon name="chevron-down" size={16} aria-hidden="true" className="relative top-px transition-transform duration-(--ll-dur-sheet) ease-settle group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "start-0 top-0 w-full p-2 pe-2.5 data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 rtl:data-[motion=from-end]:slide-in-from-left-52 rtl:data-[motion=from-start]:slide-in-from-right-52 rtl:data-[motion=to-end]:slide-out-to-left-52 rtl:data-[motion=to-start]:slide-out-to-right-52 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:ll-paper group-data-[viewport=false]/navigation-menu:ll-stock-slip group-data-[viewport=false]/navigation-menu:ll-tooth-fine group-data-[viewport=false]/navigation-menu:ll-sheet-slip group-data-[viewport=false]/navigation-menu:[--ll-sheet-shadow:var(--ll-shadow-lift)] group-data-[viewport=false]/navigation-menu:calm:[--ll-sheet-shadow:var(--ll-shadow-hair)] group-data-[viewport=false]/navigation-menu:absolute! group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:z-(--ll-z-popover) group-data-[viewport=false]/navigation-menu:duration-(--ll-dur-pop) group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      <InPanel value>{children}</InPanel>
    </NavigationMenuPrimitive.Content>
  )
}

function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <Paper
      data-slot="navigation-menu-viewport-frame"
      stock="slip"
      tilt={0.3}
      rules="none"
      className={cn(
        "absolute start-0 top-full mt-2 isolate z-(--ll-z-popover) flex justify-center empty:hidden",
        "data-[side]:[--ll-sheet-shadow:var(--ll-shadow-lift)] [--ll-sheet-shadow:var(--ll-shadow-lift)] calm:[--ll-sheet-shadow:var(--ll-shadow-hair)]",
        "duration-(--ll-dur-pop) has-[[data-state=closed]]:animate-out has-[[data-state=closed]]:fade-out-0 has-[[data-state=open]]:animate-in has-[[data-state=open]]:fade-in-0 has-[[data-state=open]]:slide-in-from-top-2"
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top relative h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden transition-[width,height] duration-(--ll-dur-sheet) ease-out data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 md:w-(--radix-navigation-menu-viewport-width)",
          className
        )}
        {...props}
      />
    </Paper>
  )
}

function NavigationMenuLink({
  className,
  active,
  seed,
  ref,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link> & {
  seed?: string | number
}) {
  const inPanel = React.useContext(InPanel)
  if (inPanel) {
    return (
      <NavigationMenuPrimitive.Link
        data-slot="navigation-menu-link"
        ref={ref}
        active={active}
        className={cn(
          "flex flex-col gap-1 p-2 font-hand text-base transition-all hover:ll-swipe focus-visible:ll-swipe data-[active]:ll-swipe [&_svg:not(.absolute):not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-ink-soft",
          className
        )}
        {...props}
      >
        {children}
      </NavigationMenuPrimitive.Link>
    )
  }
  return (
    <TabLink active={active} seed={seed} className={className} refProp={ref} {...props}>
      {children}
    </TabLink>
  )
}

function TabLink({
  className,
  active,
  seed,
  refProp,
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link> & { seed?: string | number; refProp?: React.Ref<HTMLAnchorElement> }) {
  const { hostRef, hostProps, node } = useInk({ recipe: navTabRecipe, params: { role: "link" }, kind: "tab", seed, still: true })
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      data-selected={active ? "" : undefined}
      ref={useMergedRef<HTMLAnchorElement>(hostRef, refProp)}
      active={active}
      asChild={asChild}
      {...hostProps}
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {node}
      {asChild ? <SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable> : children}
    </NavigationMenuPrimitive.Link>
  )
}

function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  const seed = useInkSeed()
  const tier = useInkTier()
  const calm = useDensity() === "calm"
  const res = React.useMemo(() => underlineMark(`${seed}|underline`, { tier, calm }), [seed, tier, calm])
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-[1] block h-2 transition-[transform,width] duration-(--ll-dur-sheet) ease-settle data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
        className
      )}
      {...props}
    >
      <PropSvg res={res} kind="prop" preserveAspectRatio="none" width="100%" height={res.h} className="pointer-events-none block" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}
