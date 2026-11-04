// @ts-nocheck
import { Doodle } from "../vendor/ui/doodle"

export const meta = {
  title: "Default",
  description: "96 px: line-led, one marker fill that misses the outline, a light pencil shading in the lower right.",
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {["star", "sun", "flower", "mushroom"].map((name) => (
        <Doodle key={name} name={name} />
      ))}
    </div>
  )
}
