// @ts-nocheck
import { Checkbox } from "../vendor/ui/checkbox"
import { Clipboard, ClipboardPaper } from "../vendor/ui/clipboard"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "A clipboard",
  description: "Hardboard with the grain of its fiber, a chrome spring clip over the paper, and a checklist on the ruled sheet (each row is one 28 px line).",
  layout: "center" as const,
  stage: "desk" as const,
}

const items = ["Passport, tickets", "Waterproof notebook", "Two rolls of washi", "Tea (a lot)", "The very small pencil"]

export default function Example() {
  return (
    <Clipboard seed="pack" tilt={-1.1} className="max-w-sm">
      <ClipboardPaper as="section" aria-labelledby="pack-title" seed="pack-p">
        <h3 id="pack-title" className="font-script text-[1.75rem] leading-7 font-bold">
          Packing list
        </h3>
        {items.map((item, i) => (
          <div key={item} className="flex min-h-7 items-center gap-3">
            <Checkbox id={`pk-${i}`} defaultChecked={i < 2} />
            <Label htmlFor={`pk-${i}`} className="text-[17px] leading-7 font-normal">
              {item}
            </Label>
          </div>
        ))}
      </ClipboardPaper>
    </Clipboard>
  )
}
