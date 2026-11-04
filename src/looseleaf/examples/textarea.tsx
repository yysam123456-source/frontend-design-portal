// @ts-nocheck
import { Label } from "../vendor/ui/label"
import { Textarea } from "../vendor/ui/textarea"

export const meta = {
  title: "Default",
  description: "Grows with what you write. The resize handle in the corner is drawn by hand over the browser's own.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="story">Your message</Label>
      <Textarea id="story" placeholder="Tell us what happened..." />
    </div>
  )
}
