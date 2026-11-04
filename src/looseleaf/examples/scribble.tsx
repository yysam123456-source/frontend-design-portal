// @ts-nocheck
import { Scribble } from "../vendor/ui/scribble"

export const meta = {
  title: "Default",
  description: "A word scribbled out in ink. The strokes lean, vary in pitch and spill past the letters.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <p className="max-w-md text-[17px] leading-[1.55]">
      Dear <Scribble>Mr. Whitcombe</Scribble> Sam, thank you for the tomatoes; they were <Scribble weight="fine">acceptable</Scribble> wonderful.
    </p>
  )
}
