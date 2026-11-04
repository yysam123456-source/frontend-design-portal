// @ts-nocheck
import * as React from "react"

import { Label } from "../vendor/ui/label"
import { Slider } from "../vendor/ui/slider"

export const meta = {
  title: "Default",
  description: "Drag the knob, or focus it and use the arrow keys, Home, End and Page Up / Down. The marker range follows the value; nothing is redrawn while you drag.",
  layout: "stack" as const,
}

export default function Example() {
  const [volume, setVolume] = React.useState([60])
  return (
    <div className="grid w-full max-w-sm gap-3">
      <div className="flex items-baseline justify-between">
        <Label id="volume-label">Pencil pressure</Label>
        <output className="ll-num font-script text-2xl leading-none text-ink-you">
          {volume[0]}
        </output>
      </div>
      <Slider value={volume} onValueChange={setVolume} max={100} step={1} aria-labelledby="volume-label" />
    </div>
  )
}
