// @ts-nocheck
import { Sticker } from "../vendor/ui/sticker"

export const meta = {
  title: "Default",
  description: "Die-cut vinyl: a white border, a cut line, a soft shadow and a small seeded tilt. Badges like Done and Sale are generated; the rest are drawn.",
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {["done", "sale", "cursor-click", "hand-point-right"].map((name) => (
        <Sticker key={name} name={name} />
      ))}
    </div>
  )
}
