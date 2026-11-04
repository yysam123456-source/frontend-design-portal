// @ts-nocheck
import { Blockquote, H1, H2, H3, H4, InlineCode, Large, Lead, List, Muted, P, Small } from "../vendor/ui/typography"

export const meta = {
  title: "The scale",
  description: "Every part in one page: headings with hand rules, a lead line, body text, a list, a quotation, inline code and the small sizes.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="max-w-[64ch]">
      <H1>Notes on keeping a notebook</H1>
      <Lead className="mt-4">A notebook is a small argument you have with yourself, one page at a time.</Lead>
      <P>
        Most of what I remember from a book is in the margins. Run <InlineCode>npm run notes</InlineCode> if you want it on the screen.
      </P>
      <H2 className="mt-8">What goes in the margin</H2>
      <List className="mt-4">
        <li>A question you cannot answer yet</li>
        <li>A disagreement, politely worded</li>
      </List>
      <H3 className="mt-6">A word from someone who knew</H3>
      <Blockquote>The best time to write it down was when it happened.</Blockquote>
      <H4 className="mt-6">Small print</H4>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-6">
        <Large>Large</Large>
        <Small>Small</Small>
        <Muted>Muted, for captions</Muted>
      </div>
    </div>
  )
}
