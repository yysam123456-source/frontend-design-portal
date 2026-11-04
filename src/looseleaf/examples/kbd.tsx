// @ts-nocheck
import { Kbd, KbdGroup } from "../vendor/ui/kbd"

export const meta = {
  title: "Keys and shortcuts",
  description: "Single keys inline, and KbdGroup for a combination. Each key is its own drawing, so no two caps are the same.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base">
        Press <Kbd>Esc</Kbd> to close, <Kbd>Tab</Kbd> to move on, or <Kbd>Enter</Kbd> to go.
      </p>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span className="text-sm text-muted-foreground">+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span className="text-sm text-muted-foreground">+</span>
          <Kbd>Shift</Kbd>
          <span className="text-sm text-muted-foreground">+</span>
          <Kbd>P</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Alt</Kbd>
          <span className="text-sm text-muted-foreground">+</span>
          <Kbd>F4</Kbd>
        </KbdGroup>
        <Kbd>Space</Kbd>
      </div>
    </div>
  )
}
