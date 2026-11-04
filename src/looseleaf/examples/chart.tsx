// @ts-nocheck
import { BarChart, ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../vendor/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../vendor/ui/card"

export const meta = {
  title: "Bar chart",
  description: "Bars colored in with a marker that misses the outline a little, numbers on top, and the best day circled by hand. Hover or press the arrow keys: a highlighter lights the column and a slip of paper names it.",
  layout: "stack" as const,
  stage: "desk" as const,
}

const sales = [
  { day: "Mon", sales: 12 },
  { day: "Tue", sales: 19 },
  { day: "Wed", sales: 8 },
  { day: "Thu", sales: 24 },
  { day: "Fri", sales: 16 },
  { day: "Sat", sales: 21 },
  { day: "Sun", sales: 14 },
]

const config = { sales: { label: "Sales", color: "var(--chart-1)" } } satisfies ChartConfig

export default function Example() {
  return (
    <Card className="mx-auto w-full max-w-lg" seed="bar">
      <CardHeader>
        <CardTitle>Sales this week</CardTitle>
        <CardDescription>Units sold, Monday to Sunday</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={sales} xKey="day" label="Units sold per day" annotations={[{ at: "max", text: "best day!", pen: "blue" }]} />
          <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
