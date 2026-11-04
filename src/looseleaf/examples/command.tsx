// @ts-nocheck
import { Icon } from "../vendor/ui/icon"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "../vendor/ui/command"

export const meta = {
  title: "Default",
  description: "The shadcn demo on a slip. Type to cut the list down (\"cal\"), use the arrow keys, Enter to choose. The row you are on wears the highlighter; Calculator is disabled; the last three end in a keycap.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 440,
}

export default function Example() {
  return (
    <Command className="h-auto w-[22rem]" label="Commands">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Icon name="calendar" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Icon name="face-slightly-smiling" />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem disabled>
            <Icon name="calculator" />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <Icon name="user" />
            <span>Profile</span>
            <CommandShortcut>Ctrl P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Icon name="credit-card" />
            <span>Billing</span>
            <CommandShortcut>Ctrl B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Icon name="settings" />
            <span>Settings</span>
            <CommandShortcut>Ctrl S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
