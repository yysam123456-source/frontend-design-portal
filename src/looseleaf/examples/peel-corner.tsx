// @ts-nocheck
import { PeelCorner, PeelCornerPage, PeelCornerUnder } from "../vendor/ui/peel-corner"

export const meta = {
  title: "Default",
  description: "Hover the bottom-right corner, drag it, or click. The sheet underneath is out of reach until the corner is open.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 300,
}

export default function Example() {
  return (
    <PeelCorner className="w-80">
      <PeelCornerPage className="h-52">
        <p className="font-script text-4xl leading-none">Spring sale</p>
        <p className="mt-2 text-sm">Everything in the shop, one week only.</p>
        <p className="mt-1 text-sm text-pencil-text">Peek under the corner for a code.</p>
      </PeelCornerPage>
      <PeelCornerUnder>
        <div className="text-end">
          <p className="font-script text-4xl leading-none">SAVE10</p>
          <p className="text-sm text-ink-soft">ten off your next order</p>
        </div>
      </PeelCornerUnder>
    </PeelCorner>
  )
}
