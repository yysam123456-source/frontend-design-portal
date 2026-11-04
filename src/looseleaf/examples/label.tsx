// @ts-nocheck
import { Input } from "../vendor/ui/input"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Default",
  description: "Click the words and the field takes focus.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="nick">Nickname</Label>
      <Input id="nick" placeholder="What do they call you?" />
    </div>
  )
}
