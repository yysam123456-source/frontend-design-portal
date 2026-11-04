// @ts-nocheck
import { Arrow } from "../vendor/ui/arrow"

export const meta = {
  title: "Default",
  description: "A straight arrow in its 80 x 40 box. The tail sits a hair lower than the head, like a real one.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <div className="flex items-center gap-3 text-[17px]">
      <span>Next</span>
      <Arrow />
    </div>
  )
}
