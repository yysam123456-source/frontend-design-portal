// @ts-nocheck
import { Label } from "../vendor/ui/label"
import { Switch } from "../vendor/ui/switch"

export const meta = {
  title: "Default",
  description: "Flip it: the marker fills the track and the paper coin slides across. The label toggles it too.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex items-center gap-3">
      <Switch id="airplane" />
      <Label htmlFor="airplane">Airplane mode</Label>
    </div>
  )
}
