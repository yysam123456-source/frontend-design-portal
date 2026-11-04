// @ts-nocheck
import { Checkbox } from "../vendor/ui/checkbox"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Default",
  description: "Tick it and watch the felt tick get written. Clicking the label works too.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept the terms and conditions</Label>
    </div>
  )
}
