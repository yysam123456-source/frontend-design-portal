// @ts-nocheck
import { Corkboard, CorkboardNote } from "../vendor/ui/corkboard"

export const meta = {
  title: "Default",
  description: "Pick a note up and move it. Or focus one, then use the arrow keys, R to turn it, Enter to bring it to the front.",
  layout: "stack" as const,
  height: 380,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Corkboard className="h-[360px] max-w-2xl">
      <CorkboardNote id="mum" x={20} y={26}>
        Call mum about Sunday
      </CorkboardNote>
      <CorkboardNote id="ink" x={250} y={40} stock="sticky-pink" rotate={2.5}>
        Buy more ink!! (the blue felt)
      </CorkboardNote>
      <CorkboardNote id="tape" x={130} y={190} stock="sticky-green" pinned={false} rotate={-2}>
        Tape it up before Friday
      </CorkboardNote>
    </Corkboard>
  )
}
