// @ts-nocheck
import { Circled } from "../vendor/ui/circled"

export const meta = {
  title: "Default",
  description: "A loop around a word. It overshoots where it started, like a hand that did not quite stop.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <p className="max-w-md text-[17px] leading-[1.55]">
      We agreed to ship the first draft before <Circled tone="red" className="mx-2">Friday</Circled>, so please reply today with the numbers.
    </p>
  )
}
