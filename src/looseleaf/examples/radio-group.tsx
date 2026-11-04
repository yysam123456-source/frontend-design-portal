// @ts-nocheck
import { Label } from "../vendor/ui/label"
import { RadioGroup, RadioGroupItem } from "../vendor/ui/radio-group"

export const meta = {
  title: "Default",
  description: "Pick one. The choice is circled, then colored in: a terracotta blot with a felt spiral written into it. Arrow keys move the choice.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <RadioGroup defaultValue="comfortable" aria-label="Density">
      {[
        ["default", "Default"],
        ["comfortable", "Comfortable"],
        ["compact", "Compact"],
      ].map(([value, label]) => (
        <div key={value} className="flex items-center gap-3">
          <RadioGroupItem value={value} id={`density-${value}`} />
          <Label htmlFor={`density-${value}`}>{label}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}
