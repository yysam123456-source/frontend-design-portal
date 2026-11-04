// @ts-nocheck
import { Ribbon } from "../vendor/ui/ribbon"

export const meta = {
  title: "A banner",
  description: "A band of colored paper with folded, swallow-tailed ends. The words are real text; the paper is drawn behind them and grows with them.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <div className="flex flex-col items-center gap-5">
      <Ribbon size="lg">New arrivals</Ribbon>
      <Ribbon tone="sky">Staff pick</Ribbon>
      <Ribbon size="sm" tone="grass">
        In stock
      </Ribbon>
    </div>
  )
}
