// @ts-nocheck
import * as React from "react"

import { Icon } from "../vendor/ui/icon"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../vendor/ui/context-menu"
import { Paper } from "../vendor/ui/paper"

export const meta = {
  title: "Right-click anywhere",
  description: "The shadcn demo: back, forward and reload with keycaps, a sub-menu, ticked rows and a radio group. The slip opens where you clicked (or press the menu key on the focused note).",
  layout: "center" as const,
  height: 480,
  stage: "desk" as const,
}

export default function Example() {
  const [bookmarks, setBookmarks] = React.useState(true)
  const [urls, setUrls] = React.useState(false)
  const [person, setPerson] = React.useState("pedro")

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Paper stock="graph" seed="region" tabIndex={0} aria-label="Right click, or press the menu key" className="grid h-44 w-80 place-items-center text-center">
          <span className="font-script text-2xl">
            Right-click anywhere
            <span className="block font-hand text-sm text-muted-foreground">long-press on touch</span>
          </span>
        </Paper>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-72" seed="ctx">
        <ContextMenuItem inset>
          Back <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>More tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52">
            <ContextMenuItem>
              Save page as… <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Create shortcut…</ContextMenuItem>
            <ContextMenuItem>Name window…</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer tools</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Icon name="trash" /> Delete
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}>
          Show bookmarks <ContextMenuShortcut>⇧⌘B</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={urls} onCheckedChange={setUrls}>
          Show full URLs
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
          <ContextMenuLabel inset>People</ContextMenuLabel>
          <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
