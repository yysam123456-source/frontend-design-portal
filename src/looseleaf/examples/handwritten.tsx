// @ts-nocheck
import { Handwritten } from "../vendor/ui/handwritten"

export const meta = {
  title: "Default",
  description: "Typeset on the left, written on the right: the same words, the same size.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid max-w-xl gap-6 sm:grid-cols-2">
      <p className="text-[17px] leading-[1.7]">Most of what I remember from a book is in the margins: an arrow, a question mark, a small argument with a dead author.</p>
      <Handwritten as="p" className="text-[17px] leading-[1.7]">
        Most of what I remember from a book is in the margins: an arrow, a question mark, a small argument with a dead author.
      </Handwritten>
    </div>
  )
}
