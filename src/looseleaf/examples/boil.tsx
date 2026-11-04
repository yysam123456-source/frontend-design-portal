// @ts-nocheck
import { Boil } from "../vendor/ui/boil"
import { Doodle } from "../vendor/ui/doodle"

export const meta = {
  title: "Default",
  description: "Four doodles, six redraws a second. The shapes hold still; the lines shiver. Stops when the tab is hidden, off screen, and with reduced motion.",
  layout: "center" as const,
  height: 200,
}

export default function Example() {
  return (
    <div className="flex items-end gap-6">
      {(["sun", "flower", "star", "mushroom"] as const).map((name) => (
        <Boil key={name}>
          <Doodle name={name} size={96} />
        </Boil>
      ))}
    </div>
  )
}
