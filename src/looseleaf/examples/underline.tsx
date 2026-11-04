// @ts-nocheck
import { Underline } from "../vendor/ui/underline"

export const meta = {
  title: "Default",
  description: "A felt-tip line under a phrase. It rises a little to the right, starts a hair early and runs past the last letter.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <p className="max-w-md text-[17px] leading-[1.55]">
      Underline the parts you will need again, like <Underline>the date of the meeting</Underline>, and leave the rest for the next pass.
    </p>
  )
}
