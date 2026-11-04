// @ts-nocheck
import * as React from "react"

import { Label } from "../vendor/ui/label"
import { Stepper } from "../vendor/ui/stepper"

export const meta = {
  title: "Quantity",
  description: "Press the plus, hold it to run, or type. Arrow keys step, Shift or PageUp / PageDown jump ten, Home and End go to the ends. At 10 the plus has nothing left and rattles the box.",
  layout: "center" as const,
  height: 200,
}

export default function Example() {
  const [qty, setQty] = React.useState<number | undefined>(2)
  return (
    <div className="grid justify-items-start gap-2">
      <Label htmlFor="qty">Quantity</Label>
      <Stepper id="qty" value={qty} onValueChange={setQty} min={0} max={10} />
      <p className="font-hand text-sm text-ink-muted" aria-live="polite">
        {qty === undefined ? "Nothing chosen." : `${qty} in the basket.`}
      </p>
    </div>
  )
}
