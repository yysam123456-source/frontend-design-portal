// @ts-nocheck
import { Paper } from "../vendor/ui/paper"

export const meta = {
  title: "Stocks",
  description: "Paper is a recipe: a color, a tooth, a shadow and the rules printed on it. Each stock lies at its own small angle.",
  layout: "stack" as const,
  stage: "desk" as const,
}

const stocks = ["paper", "slip", "index-card", "graph", "dot-grid", "kraft", "sticky-yellow", "sticky-pink"] as const

export default function Example() {
  return (
    <div className="@container w-full">
      <div className="grid grid-cols-2 gap-x-8 gap-y-8 p-2 @2xl:grid-cols-4">
        {stocks.map((stock) => (
          <figure key={stock} className="m-0 grid gap-2">
            <Paper stock={stock} seed={stock} className="h-24" />
            <figcaption className="font-script text-xl leading-none font-bold">{stock}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
