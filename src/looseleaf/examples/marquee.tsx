// @ts-nocheck
import { Marquee, MarqueeItem } from "../vendor/ui/marquee"

export const meta = {
  title: "Default",
  description: "Point at it and it stops; so does Tab. The round button pauses it for good.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Marquee label="Shop news" className="max-w-2xl">
      <MarqueeItem>Fresh bread at seven</MarqueeItem>
      <MarqueeItem>Open late on Fridays</MarqueeItem>
      <MarqueeItem>Ask about the rye</MarqueeItem>
    </Marquee>
  )
}
