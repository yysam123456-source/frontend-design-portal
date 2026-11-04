// @ts-nocheck
import * as React from "react"

import { Button } from "../vendor/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../vendor/ui/collapsible"
import { Icon } from "../vendor/ui/icon"
import { Paper } from "../vendor/ui/paper"

export const meta = {
  title: "Starred repositories",
  description: "The classic: a heading with a trigger button, one item always shown and the rest folded away. The panel slides open and shut.",
  layout: "center" as const,
  height: 240,
}

function Repo({ seed, stock, children }: { seed: string; stock: "sticky-yellow" | "sticky-blue" | "sticky-green"; children: React.ReactNode }) {
  return (
    <Paper stock={stock} seed={seed} className="mx-1 px-3 py-2 font-mono text-sm">
      {children}
    </Paper>
  )
}

export default function Example() {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex w-[350px] flex-col gap-2">
      <div className="flex items-center justify-between gap-4 px-1">
        <h4 className="font-script text-xl font-semibold">Starred this week: 3</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Icon name="chevrons-up-down" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <Repo seed="r1" stock="sticky-yellow">radix-ui/primitives</Repo>
      <CollapsibleContent className="flex flex-col gap-2">
        <Repo seed="r2" stock="sticky-blue">tailwindlabs/tailwindcss</Repo>
        <Repo seed="r3" stock="sticky-green">shadcn-ui/ui</Repo>
      </CollapsibleContent>
    </Collapsible>
  )
}
