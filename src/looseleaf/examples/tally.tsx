// @ts-nocheck
import { Tally } from "../vendor/ui/tally"

export const meta = {
  title: "Default",
  description: "Seven: one bundle struck through and two more. `size` takes sm, md, lg or a number of pixels. The number is what a screen reader hears.",
  layout: "center" as const,
}

export default function Example() {
  return <Tally count={7} size={52} />
}
