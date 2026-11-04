// @ts-nocheck
import * as React from "react"

import { Rating } from "../vendor/ui/rating"

export const meta = {
  title: "Default",
  description: "Hover to preview, click to choose. It is a radio group: Tab lands on the chosen glyph, then arrow keys, Home and End change the value.",
  layout: "stack" as const,
}

export default function Example() {
  const [value, setValue] = React.useState(3)
  return (
    <div className="grid justify-items-start gap-2">
      <Rating value={value} onValueChange={setValue} aria-label="Rate this notebook" />
      <p className="text-sm text-ink-muted" aria-live="polite">
        {value ? `You gave it ${value} out of 5.` : "Not rated yet."}
      </p>
    </div>
  )
}
