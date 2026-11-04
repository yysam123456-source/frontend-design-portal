// @ts-nocheck
import { Quote, QuoteAttribution, QuoteText } from "../vendor/ui/quote"

export const meta = {
  title: "Default",
  description: "A pull quote: marker marks in the gutters, the words in the script font, the source below.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <Quote className="max-w-md">
      <QuoteText cite="https://example.com/margins">The best time to write it down was when it happened; the second best is now, before the coffee gets cold.</QuoteText>
      <QuoteAttribution>Ada, in the margin of a book</QuoteAttribution>
    </Quote>
  )
}
