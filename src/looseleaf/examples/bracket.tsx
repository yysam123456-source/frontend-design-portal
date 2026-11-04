// @ts-nocheck
import { Bracket } from "../vendor/ui/bracket"

export const meta = {
  title: "Default",
  description: "A square bracket down the start side of two paragraphs.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <Bracket className="max-w-md">
      <p className="text-[17px] leading-[1.6]">These two paragraphs are one idea, and the bracket says so.</p>
      <p className="mt-2 text-[17px] leading-[1.6]">You could nod and keep reading, or you could underline them and come back next week.</p>
    </Bracket>
  )
}
