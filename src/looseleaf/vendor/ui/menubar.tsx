// @ts-nocheck
"use client"

import * as React from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { Icon } from ".//icon"
import { Kbd } from ".//kbd"
import { Paper, type PaperProps } from ".//paper"
import { Separator } from ".//separator"
import { useInk, useInkScope, useMergedRef } from "../lib/ink/react"
import { menubarRecipe } from "../lib/ink/recipes/menubar-ink"
import {
  MENU_CHOICE_ITEM,
  MENU_INDICATOR,
  MENU_ITEM,
  MENU_KEYCAP,
  MENU_LABEL,
  MENU_MARK,
  MENU_SEPARATOR,
  MENU_SHORTCUT,
  MENU_SUB_TRIGGER,
  menuContentClass,
  menuViewportClass,
  parseShortcut,
  splitMenuClass,
} from "../lib/menu-styles"
import { cn } from "../lib/utils"

type PaperLook = Pick<PaperProps, "stock" | "edge" | "tilt" | "tape" | "seed">

function Menubar({
  className,
  seed,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root> & {
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({ recipe: menubarRecipe, params: {}, kind: "bar", seed, still: true })
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      ref={useMergedRef<HTMLDivElement>(hostRef, ref)}
      {...hostProps}
      className={cn("relative isolate flex h-10 items-center gap-1 px-2 compact:h-9 calm:h-8", className)}
      {...props}
    >
      {node}
      {children}
    </MenubarPrimitive.Root>
  )
}

function MenubarMenu({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "flex min-h-7 items-center px-3 py-0.5 font-hand text-base leading-6 font-bold select-none hover:ll-swipe focus:ll-swipe data-[state=open]:ll-swipe",
        "forced-colors:[&:is(:hover,:focus,[data-state=open])]:bg-[color:Highlight]! forced-colors:[&:is(:hover,:focus,[data-state=open])]:text-[color:HighlightText]!",
        "calm:px-2.5 calm:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  stock = "slip",
  edge,
  tilt = true,
  tape,
  seed,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content> & PaperLook) {
  const scope = useInkScope()
  const split = splitMenuClass(className)
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content asChild align={align} alignOffset={alignOffset} sideOffset={sideOffset} {...props}>
        <Paper data-slot="menubar-content" stock={stock} edge={edge} tilt={tilt} tape={tape} rules="none" seed={seed} {...scope} className={cn(menuContentClass("menubar"), "min-w-48", split.content)}>
          <div data-slot="menubar-viewport" className={menuViewportClass("menubar", split.viewport)}>
            {children}
          </div>
        </Paper>
      </MenubarPrimitive.Content>
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return <MenubarPrimitive.Item data-slot="menubar-item" data-inset={inset} data-variant={variant} className={cn(MENU_ITEM, className)} {...props} />
}

function MenubarCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem data-slot="menubar-checkbox-item" className={cn(MENU_CHOICE_ITEM, className)} checked={checked} {...props}>
      <span data-slot="menubar-item-indicator" className={MENU_INDICATOR}>
        <Icon name="square" size={16} className="absolute text-pencil-mark forced-colors:text-[CanvasText]" />
        <MenubarPrimitive.ItemIndicator className={MENU_MARK}>
          <Icon name="check" size={22} className="-translate-y-px" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem data-slot="menubar-radio-item" className={cn(MENU_CHOICE_ITEM, className)} {...props}>
      <span data-slot="menubar-item-indicator" className={MENU_INDICATOR}>
        <Icon name="circle" size={16} className="absolute text-pencil-mark forced-colors:text-[CanvasText]" />
        <MenubarPrimitive.ItemIndicator className={MENU_MARK}>
          <Icon name="dot" size={26} />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({ className, inset, ...props }: React.ComponentProps<typeof MenubarPrimitive.Label> & { inset?: boolean }) {
  return <MenubarPrimitive.Label data-slot="menubar-label" data-inset={inset} className={cn(MENU_LABEL, className)} {...props} />
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator asChild {...props}>
      <Separator data-slot="menubar-separator" className={cn(MENU_SEPARATOR, className)} />
    </MenubarPrimitive.Separator>
  )
}

function MenubarShortcut({ className, children, ...props }: React.ComponentProps<"span">) {
  const keys = typeof children === "string" ? parseShortcut(children) : null
  return (
    <span data-slot="menubar-shortcut" className={cn(MENU_SHORTCUT, className)} {...props}>
      {keys
        ? keys.map((k, i) => (
            <Kbd key={i} className={MENU_KEYCAP}>
              {"icon" in k ? <Icon name={k.icon} label={k.label} /> : k.text}
            </Kbd>
          ))
        : children}
    </span>
  )
}

function MenubarSub({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({ className, inset, children, ...props }: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <MenubarPrimitive.SubTrigger data-slot="menubar-sub-trigger" data-inset={inset} className={cn(MENU_SUB_TRIGGER, className)} {...props}>
      {children}
      <Icon name="chevron-right" size={16} className="ms-auto" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  alignOffset = -4,
  stock = "slip",
  edge,
  tilt = true,
  tape,
  seed,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent> & PaperLook) {
  const scope = useInkScope()
  const split = splitMenuClass(className)
  return (
    <MenubarPrimitive.SubContent asChild alignOffset={alignOffset} {...props}>
      <Paper data-slot="menubar-sub-content" stock={stock} edge={edge} tilt={tilt} tape={tape} rules="none" seed={seed} {...scope} className={cn(menuContentClass("menubar"), split.content)}>
        <div data-slot="menubar-viewport" className={menuViewportClass("menubar", split.viewport)}>
          {children}
        </div>
      </Paper>
    </MenubarPrimitive.SubContent>
  )
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
