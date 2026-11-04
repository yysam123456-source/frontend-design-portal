// @ts-nocheck
import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "../vendor/ui/toggle-group"

export const meta = {
  title: "Pick one",
  description:
    "type=single: one item is on, clicking it again clears it. Joined outline items share one box; the seam between two items is a short pencil stroke at the edge they share.",
  layout: "stack" as const,
}

export default function Example() {
  const [align, setAlign] = React.useState("center")
  return (
    <div className="flex flex-col items-start gap-4">
      <ToggleGroup type="single" variant="outline" value={align} onValueChange={(v) => v && setAlign(v)} aria-label="Text alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <p className="w-72 border-y border-dashed border-pencil-mark py-2 text-base" style={{ textAlign: align as "left" | "center" | "right" }}>
        Aligned {align}, the way the page would be.
      </p>
    </div>
  )
}
