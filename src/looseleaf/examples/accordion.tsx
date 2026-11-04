// @ts-nocheck
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../vendor/ui/accordion"

export const meta = {
  title: "Questions",
  description:
    "Ruled rows on a page. Opening one turns the chevron over, draws a margin brace beside the text (written top to bottom in blue pencil) and lets the words soak in. `type=\"single\" collapsible` opens one at a time and lets you close it again.",
  layout: "center" as const,
  height: 320,
}

export default function Example() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It follows the WAI-ARIA accordion pattern: one tab stop per row, arrows between rows, and every panel is labeled by its trigger.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it drawn by hand?</AccordionTrigger>
        <AccordionContent>Every rule, brace and highlighter swipe is a pen stroke, seeded so the same page always looks the same.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Does it respect reduced motion?</AccordionTrigger>
        <AccordionContent>Yes. With reduced motion the rows open at once and the brace simply appears.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
