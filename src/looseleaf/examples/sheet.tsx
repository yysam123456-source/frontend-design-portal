// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../vendor/ui/sheet"

export const meta = {
  title: "Four sides",
  description: "The page is bound along whichever edge faces the middle of the screen: the coils hang on the left of a right-hand page, along the bottom of a page that comes from the top.",
  layout: "center" as const,
  height: 220,
}

const SIDES = ["top", "right", "bottom", "left"] as const

export default function Example() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </SheetTrigger>
          <SheetContent side={side} seed={`side-${side}`}>
            <SheetHeader>
              <SheetTitle>From the {side}</SheetTitle>
              <SheetDescription>A page slides in from the {side} edge of the screen. Click outside, press Escape or tap the x to put it away.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}
