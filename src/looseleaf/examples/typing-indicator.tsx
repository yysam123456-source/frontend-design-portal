// @ts-nocheck
import { TypingIndicator } from "../vendor/ui/typing-indicator"

export const meta = {
  title: "Three dots and a scrawl",
  description: "The pencil writes the dots one after another, walks back and starts again. The second variant scrawls a line of cursive instead.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-12 gap-y-6">
      <figure className="grid justify-items-center gap-3">
        <TypingIndicator seed="dots" />
        <figcaption className="text-sm text-muted-foreground">dots</figcaption>
      </figure>
      <figure className="grid justify-items-center gap-3">
        <TypingIndicator variant="squiggle" seed="scrawl" />
        <figcaption className="text-sm text-muted-foreground">scrawl</figcaption>
      </figure>
      <figure className="grid justify-items-center gap-3">
        <TypingIndicator pen="you" pencil={false} seed="you" />
        <figcaption className="text-sm text-muted-foreground">blue felt, no pencil</figcaption>
      </figure>
    </div>
  )
}
