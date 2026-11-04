// @ts-nocheck
import { Callout } from "../vendor/ui/callout"

export const meta = {
  title: "Default",
  description: "Handwritten words and an arrow that points left, at whatever is to their left.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <div className="flex items-center gap-1">
      <span className="rounded-none border border-dashed border-pencil-mark px-3 py-2 text-[17px]">the total</span>
      <Callout>check the date!</Callout>
    </div>
  )
}
