// @ts-nocheck
import { AspectRatio } from "../vendor/ui/aspect-ratio"
import { Doodle } from "../vendor/ui/doodle"

export const meta = {
  title: "Ratios",
  description: "The same width, four ratios: 16:9, 4:3, 1:1 and 3:4, each a small print with a white border. Change the width of the container and each box keeps its shape.",
  layout: "stack" as const,
}

const ratios = [
  { label: "16 / 9", ratio: 16 / 9, doodle: "sun", tint: "bg-sky/40", turn: "-rotate-1" },
  { label: "4 / 3", ratio: 4 / 3, doodle: "flower", tint: "bg-lemon/45", turn: "rotate-1" },
  { label: "1 / 1", ratio: 1, doodle: "mushroom", tint: "bg-bubblegum/40", turn: "-rotate-[0.6deg]" },
  { label: "3 / 4", ratio: 3 / 4, doodle: "star", tint: "bg-grass/40", turn: "rotate-[0.8deg]" },
] as const

const WINDOW = "shadow-[inset_0_2px_4px_rgb(var(--ll-shade)/0.26),inset_0_0_0_1px_rgb(var(--ll-shade)/0.12)]"

export default function Example() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 items-end gap-x-6 gap-y-6 sm:grid-cols-4">
      {ratios.map((r) => (
        <figure key={r.label} className="flex flex-col gap-3">
          <div className={`bg-slip p-2 shadow-slip ${r.turn}`}>
            <AspectRatio ratio={r.ratio} className={`grid place-items-center overflow-hidden ${r.tint} ${WINDOW}`}>
              <Doodle name={r.doodle} size={48} />
            </AspectRatio>
          </div>
          <figcaption className="text-center text-sm text-muted-foreground">{r.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}
