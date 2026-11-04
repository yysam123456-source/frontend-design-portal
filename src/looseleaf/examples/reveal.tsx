// @ts-nocheck
import * as React from "react"

import { Button } from "../vendor/ui/button"
import { Reveal } from "../vendor/ui/reveal"

export const meta = {
  title: "Default",
  description: "The heading is drawn on left to right as it comes into view, once, with a marker tip writing it (nib). Replay mounts it again; on a long page it waits until you scroll to it.",
  layout: "stack" as const,
}

export default function Example() {
  const [run, setRun] = React.useState(0)
  return (
    <div className="flex max-w-xl flex-col items-start gap-4">
      <Reveal key={run} nib className="font-script text-5xl leading-none">
        Drawn by hand, on the way in.
      </Reveal>
      <p className="text-sm text-muted-foreground">Nothing is hidden from screen readers while it waits.</p>
      <Button size="sm" variant="outline" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  )
}
