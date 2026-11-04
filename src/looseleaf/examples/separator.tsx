// @ts-nocheck
import { Separator } from "../vendor/ui/separator"

export const meta = {
  title: "Seven ways to draw a line",
  description:
    "Pencil is the default. The others are for when a divider should say something: ledger dashes, a squiggle, dots, kraft tape, a running stitch, a torn edge.",
  layout: "stack" as const,
}

const variants = ["pencil", "dashed", "wavy", "dotted", "tape", "stitched", "torn"] as const

export default function Example() {
  return (
    <div className="flex w-full max-w-md flex-col gap-7">
      {variants.map((v) => (
        <div key={v} className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{v}</span>
          <Separator variant={v} seed={v} />
        </div>
      ))}
    </div>
  )
}
