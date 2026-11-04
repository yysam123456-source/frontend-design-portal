// @ts-nocheck
import { Strike } from "../vendor/ui/strike"

export const meta = {
  title: "Default",
  description: "Red pencil through the old plan. The line tilts a little and pokes out past both ends.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <p className="max-w-md text-[17px] leading-[1.55]">
      We meet on <Strike>Thursday at nine</Strike> Friday at ten, in the room with the good chairs.
    </p>
  )
}
