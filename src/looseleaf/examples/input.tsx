// @ts-nocheck
import { Input } from "../vendor/ui/input"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Default",
  description: "A label and a field. What you type is blue felt; the placeholder is graphite.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  )
}
