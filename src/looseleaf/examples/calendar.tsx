// @ts-nocheck
import * as React from "react"

import { Calendar } from "../vendor/ui/calendar"

export const meta = {
  title: "Planner page",
  description: "One chosen day, circled in marker; today underlined; the days before the 3rd hatched out. On its own sheet of card, taped at the corner. (Fixed dates, so the page looks the same tomorrow.)",
  layout: "center" as const,
  stage: "desk" as const,
  height: 380,
}

export default function Example() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 17))
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={new Date(2026, 8)}
      today={new Date(2026, 8, 15)}
      disabled={{ before: new Date(2026, 8, 3) }}
      sheet={{ stock: "card", tape: "corner", seed: "planner" }}
      seed="planner"
    />
  )
}
