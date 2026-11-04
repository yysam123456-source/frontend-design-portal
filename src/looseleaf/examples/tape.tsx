// @ts-nocheck
import { Tape, type TapeProps } from "../vendor/ui/tape"

export const meta = {
  title: "Kinds",
  description: "Crepe masking tape, four printed washi patterns, gummed kraft and nearly invisible cellophane. Every strip has slit lines along its edges and crinkles where it was pressed down.",
  layout: "stack" as const,
  stage: "desk" as const,
}

const kinds: TapeProps["kind"][] = ["masking", "washi-dots", "washi-stripes", "washi-zigzag", "washi-gingham", "kraft", "clear"]

export default function Example() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-4 sm:grid-cols-4">
      {kinds.map((kind) => (
        <div key={kind} className="flex flex-col items-start gap-2">
          <Tape kind={kind} length={110} height={26} seed={kind} />
          <span className="text-sm text-muted-foreground">{kind}</span>
        </div>
      ))}
    </div>
  )
}
