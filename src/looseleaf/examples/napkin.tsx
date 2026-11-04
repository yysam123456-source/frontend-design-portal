// @ts-nocheck
import { Napkin, NapkinContent, NapkinFooter, NapkinTitle } from "../vendor/ui/napkin"

export const meta = {
  title: "A napkin",
  description: "Folded in four, so it has a crease each way. The edge is pinked and the border pressed into the tissue.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Napkin seed="specials" tape="top">
      <NapkinTitle>Specials</NapkinTitle>
      <NapkinContent>soup of the day, a very small pie, and something with pears</NapkinContent>
      <NapkinFooter>until six</NapkinFooter>
    </Napkin>
  )
}
