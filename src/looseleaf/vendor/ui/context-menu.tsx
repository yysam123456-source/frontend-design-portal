// @ts-nocheck
"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { Icon } from ".//icon"
import { Kbd } from ".//kbd"
import { Paper, type PaperProps } from ".//paper"
import { Separator } from ".//separator"
import { useInkScope } from "../lib/ink/react"
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

function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
}

function ContextMenuPortal({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
}

function ContextMenuSub({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function ContextMenuSubTrigger({ className, inset, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.SubTrigger data-slot="context-menu-sub-trigger" data-inset={inset} className={cn(MENU_SUB_TRIGGER, className)} {...props}>
      {children}
      <Icon name="chevron-right" size={16} className="ms-auto" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  alignOffset = -4,
  stock = "slip",
  edge,
  tilt = true,
  tape,
  seed,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent> & PaperLook) {
  const scope = useInkScope()
  const split = splitMenuClass(className)
  return (
    <ContextMenuPrimitive.SubContent asChild alignOffset={alignOffset} {...props}>
      <Paper data-slot="context-menu-sub-content" stock={stock} edge={edge} tilt={tilt} tape={tape} rules="none" seed={seed} {...scope} className={cn(menuContentClass("context-menu"), split.content)}>
        <div data-slot="context-menu-viewport" className={menuViewportClass("context-menu", split.viewport)}>
          {children}
        </div>
      </Paper>
    </ContextMenuPrimitive.SubContent>
  )
}

function ContextMenuContent({
  className,
  stock = "slip",
  edge,
  tilt = true,
  tape,
  seed,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & PaperLook) {
  const scope = useInkScope()
  const split = splitMenuClass(className)
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content asChild {...props}>
        <Paper data-slot="context-menu-content" stock={stock} edge={edge} tilt={tilt} tape={tape} rules="none" seed={seed} {...scope} className={cn(menuContentClass("context-menu"), "data-[state=open]:animate-pop", split.content)}>
          <div data-slot="context-menu-viewport" className={menuViewportClass("context-menu", split.viewport)}>
            {children}
          </div>
        </Paper>
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return <ContextMenuPrimitive.Item data-slot="context-menu-item" data-inset={inset} data-variant={variant} className={cn(MENU_ITEM, className)} {...props} />
}

function ContextMenuCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem data-slot="context-menu-checkbox-item" className={cn(MENU_CHOICE_ITEM, className)} checked={checked} {...props}>
      <span data-slot="context-menu-item-indicator" className={MENU_INDICATOR}>
        <Icon name="square" size={16} className="absolute text-pencil-mark forced-colors:text-[CanvasText]" />
        <ContextMenuPrimitive.ItemIndicator className={MENU_MARK}>
          <Icon name="check" size={22} className="-translate-y-px" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem data-slot="context-menu-radio-item" className={cn(MENU_CHOICE_ITEM, className)} {...props}>
      <span data-slot="context-menu-item-indicator" className={MENU_INDICATOR}>
        <Icon name="circle" size={16} className="absolute text-pencil-mark forced-colors:text-[CanvasText]" />
        <ContextMenuPrimitive.ItemIndicator className={MENU_MARK}>
          <Icon name="dot" size={26} />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({ className, inset, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Label> & { inset?: boolean }) {
  return <ContextMenuPrimitive.Label data-slot="context-menu-label" data-inset={inset} className={cn(MENU_LABEL, className)} {...props} />
}

function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator asChild {...props}>
      <Separator data-slot="context-menu-separator" className={cn(MENU_SEPARATOR, className)} />
    </ContextMenuPrimitive.Separator>
  )
}

function ContextMenuShortcut({ className, children, ...props }: React.ComponentProps<"span">) {
  const keys = typeof children === "string" ? parseShortcut(children) : null
  return (
    <span data-slot="context-menu-shortcut" className={cn(MENU_SHORTCUT, className)} {...props}>
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

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
