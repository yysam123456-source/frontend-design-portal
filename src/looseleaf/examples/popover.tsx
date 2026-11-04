// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Input } from "../vendor/ui/input"
import { Label } from "../vendor/ui/label"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../vendor/ui/popover"

export const meta = {
  title: "Dimensions",
  description: "The shadcn demo on a slip with a push-pin through its top edge. A CSS sheet: it costs no SVG.",
  layout: "center" as const,
  height: 340,
}

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="self-start">
          Open popover
        </Button>
      </PopoverTrigger>
      <PopoverContent pin seed="dimensions" className="w-80">
        <div className="grid gap-4">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
          </PopoverHeader>
          <div className="grid gap-2">
            {[
              ["width", "Width", "100%"],
              ["maxWidth", "Max. width", "300px"],
              ["height", "Height", "25px"],
              ["maxHeight", "Max. height", "none"],
            ].map(([id, label, value]) => (
              <div key={id} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} defaultValue={value} className="col-span-2 h-8" />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
