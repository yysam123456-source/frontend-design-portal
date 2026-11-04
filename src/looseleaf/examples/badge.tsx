// @ts-nocheck
import { Badge } from "../vendor/ui/badge"

export const meta = {
  title: "Variants",
  description: "A marker stamp, a highlighter swipe, a red-hatched pill, a circled word, and two that only show up when they are links.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge>Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  )
}
