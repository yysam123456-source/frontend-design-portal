// @ts-nocheck
import { Mascot } from "../vendor/ui/mascot"

export const meta = {
  title: "Poses",
  description: "Stubby, an original pencil stub drawn as a die-cut sticker: one bold body with a face and nothing else. A pose is a different face, a lean and a doodle.",
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-end gap-8">
      {["idle", "wave", "think", "sleep"].map((pose) => (
        <figure key={pose} className="flex flex-col items-center gap-1">
          <Mascot pose={pose} />
          <figcaption className="text-sm text-pencil-text">{pose}</figcaption>
        </figure>
      ))}
    </div>
  )
}
