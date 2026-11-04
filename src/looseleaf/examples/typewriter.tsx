// @ts-nocheck
import { Typewriter } from "../vendor/ui/typewriter"

export const meta = {
  title: "Default",
  description: "It waits until it is on screen, then types at an uneven pace, holding at the comma and the period.",
  layout: "stack" as const,
  height: 160,
}

export default function Example() {
  return (
    <p className="min-h-[5.25rem] max-w-xl text-3xl leading-snug">
      <Typewriter text="Every screen, drawn by hand. Nothing here was made by a ruler." startOnView={false} />
    </p>
  )
}
