// @ts-nocheck
import * as React from "react"

import { Annotate } from "../vendor/ui/annotate"
import { Asterisk } from "../vendor/ui/asterisk"
import { Button } from "../vendor/ui/button"
import { Callout } from "../vendor/ui/callout"
import { Paper } from "../vendor/ui/paper"
import { Tally } from "../vendor/ui/tally"

export const meta = {
  title: "Playground: a reader's page",
  description:
    "One paragraph annotated the way a reader does it: a circle, two highlighters, a red underline, a struck phrase, a wavy line and margin notes with arrows. Switch each on and off, or replay the whole page being marked up.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 470,
}

const MARKS = { circle: "Circle", highlight: "Highlight", underline: "Underline", strike: "Strike", wavy: "Wavy line", notes: "Margin notes" } as const
type Key = keyof typeof MARKS

export default function Example() {
  const [on, setOn] = React.useState<Record<Key, boolean>>({ circle: true, highlight: true, underline: true, strike: true, wavy: true, notes: true })
  const [take, setTake] = React.useState(0)
  return (
    <div className="grid w-full max-w-4xl gap-4">
      <div role="group" aria-label="Annotations" className="flex flex-wrap items-center gap-4">
        {(Object.keys(MARKS) as Key[]).map((k) => (
          <Button key={k} size="sm" variant={on[k] ? "default" : "outline"} aria-pressed={on[k]} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))}>
            {MARKS[k]}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setTake((t) => t + 1)}>
          Replay
        </Button>
      </div>
      <Paper key={take} stock="paper" rules="ruled" seed="reader" className="w-full pt-4 pr-6 pb-6 pl-14 md:pr-60">
        <p className="font-type text-[11px] leading-[28px] text-pencil-text">Reading notes / Tuesday</p>
        <h3 className="font-script text-[2.1rem] leading-[56px] font-bold">On owning books</h3>
        <p className="text-[17px] leading-[28px]">
          Most of what I remember from a book is in the{" "}
          <Annotate type="circle" color="red" show={on.circle} animate>
            margins
          </Annotate>
          <Callout show={on.notes} animate delay={500} curve="straight" className="float-end clear-end -me-52 mt-1.5 w-48 max-md:hidden">
            ha, true
          </Callout>
          : an arrow, a question mark, a small argument with a dead author. The good bits get{" "}
          <Annotate type="highlight" show={on.highlight} animate delay={200}>
            a swipe of yellow
          </Annotate>
          <Callout show={on.notes} animate delay={600} className="float-end clear-end -me-52 mt-1.5 w-48 max-md:hidden">
            the best line
          </Callout>{" "}
          so I can find them on the next read, and the parts I do not believe get a{" "}
          <Annotate type="underline" color="red" show={on.underline} animate delay={300}>
            red pencil
          </Annotate>
          . By the{" "}
          <Annotate type="highlight" color="green" show={on.highlight} animate delay={250}>
            third reading
          </Annotate>{" "}
          the book is more mine than the{" "}
          <Annotate type="strike-through" show={on.strike} animate>
            writer&rsquo;s
          </Annotate>
          <Callout show={on.notes} animate delay={900} direction="left" bend="down" className="float-end clear-end -me-52 mt-1.5 w-48 max-md:hidden">
            not sure about this...
          </Callout>
          , which is the{" "}
          <Annotate type="underline" kind="wavy" color="blue" show={on.wavy} animate delay={400}>
            whole point of owning one
          </Annotate>
          <Asterisk label="footnote" />.
        </p>
        <div className="mt-7 flex items-center gap-3 text-sm leading-[28px] text-pencil-text">
          times I have read it <Tally count={7} size="md" animate />
        </div>
        <p className="text-sm leading-[28px] text-pencil-text">* the whole shelf, eventually</p>
      </Paper>
    </div>
  )
}
