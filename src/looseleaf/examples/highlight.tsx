// @ts-nocheck
import { Highlight } from "../vendor/ui/highlight"

export const meta = {
  title: "Default",
  description: "A swipe behind a phrase. Select the text, copy it: it is still just words.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <p className="max-w-md text-[17px] leading-[1.55]">
      Most of what I remember from a book is in the margins. The good bits get <Highlight>a swipe of yellow</Highlight> so I can find them on the next read.
    </p>
  )
}
