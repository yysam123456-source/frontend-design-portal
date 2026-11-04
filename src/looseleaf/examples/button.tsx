// @ts-nocheck
import { Button } from "../vendor/ui/button"

export const meta = {
  title: "Variants",
  description: "Six ways to hold a pen: marker, red pencil, ink, highlighter, pencil whisper and blue felt.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button>Save changes</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Read more</Button>
    </div>
  )
}
