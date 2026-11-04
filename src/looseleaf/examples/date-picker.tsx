// @ts-nocheck
import * as React from "react"

import { DatePicker } from "../vendor/ui/date-picker"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Type it or pick it",
  description: "Type a date any way you would write it (9/17/26, 2026-09-17, Sep 17, tomorrow) and press Enter, or open the calendar and circle a day. Days before the 3rd are hatched out, so typing one turns the box red.",
  layout: "center" as const,
  height: 470,
}

export default function Example() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 17))
  return (
    <div className="grid w-72 gap-2">
      <Label htmlFor="due-date">Due date</Label>
      <DatePicker
        id="due-date"
        value={date}
        onValueChange={setDate}
        min={new Date(2026, 8, 3)}
        calendarProps={{ today: new Date(2026, 8, 15), defaultMonth: new Date(2026, 8) }}
      />
      <p className="font-hand text-sm text-ink-muted">{date ? date.toDateString() : "No date yet."}</p>
    </div>
  )
}
