// @ts-nocheck
import { Bubble, BubbleContent, BubbleGroup } from "../vendor/ui/bubble"

export const meta = {
  title: "Variants",
  description: "Marker, highlighter, paper shade, a marker wash, paper and a line, red pencil hatching, and nothing at all. The tail sits on the sender's side.",
  layout: "stack" as const,
}

const SAYS = {
  default: "Can you add tags to my notes?",
  secondary: "Tags, then a filter row above the list.",
  muted: "Sure. Give me a minute, I will look at the list first.",
  tinted: "Two tags per note is plenty, I think.",
  outline: "And a way to remove them again?",
  destructive: "That would delete every tag. Are you sure?",
} as const

export default function Example() {
  return (
    <BubbleGroup className="mx-auto w-full max-w-lg gap-4 px-3 pb-4">
      {(Object.keys(SAYS) as Array<keyof typeof SAYS>).map((variant, i) => (
        <Bubble key={variant} variant={variant} align={i % 2 ? "end" : "start"} tail>
          <BubbleContent seed={`variant-${variant}`}>{SAYS[variant]}</BubbleContent>
        </Bubble>
      ))}
      <Bubble variant="ghost">
        <BubbleContent>Ghost bubbles are just the words, set in the same hand.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  )
}
