// @ts-nocheck
import { FlipCard, FlipCardBack, FlipCardFront } from "../vendor/ui/flip-card"

export const meta = {
  title: "Default",
  description: "Click it, or Tab to it and press Space. The card lifts off the desk as it turns.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 260,
}

export default function Example() {
  return (
    <FlipCard label="Show the answer">
      <FlipCardFront>
        <span className="text-4xl">le chat</span>
        <span className="font-hand text-sm text-pencil-text">(masculine noun)</span>
      </FlipCardFront>
      <FlipCardBack>
        <span className="text-4xl">the cat</span>
        <span className="font-hand text-sm text-pencil-text">purrs, ignores you</span>
      </FlipCardBack>
    </FlipCard>
  )
}
