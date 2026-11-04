// @ts-nocheck
import * as React from "react"

import { Button } from "../vendor/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../vendor/ui/drawer"
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "Move goal",
  description: "The shadcn demo: a slip pulled up from the bottom, torn along its top edge and taped down by its grab tab. Drag the tape, flick it away, or press Escape.",
  layout: "center" as const,
}

const DATA = [400, 300, 200, 300, 200, 278, 189, 239, 300, 200, 278, 189, 349]

export default function Example() {
  const [goal, setGoal] = React.useState(350)
  const clamp = (v: number) => Math.max(200, Math.min(400, v))
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent seed="goal">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={() => setGoal((g) => clamp(g - 10))} disabled={goal <= 200} aria-label="Decrease">
                <Icon name="minus" />
              </Button>
              <div className="text-center">
                <div className="ll-num font-script text-7xl leading-none font-bold tracking-tight">{goal}</div>
                <div className="font-type text-[0.7rem] text-muted-foreground">Calories/day</div>
              </div>
              <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={() => setGoal((g) => clamp(g + 10))} disabled={goal >= 400} aria-label="Increase">
                <Icon name="plus" />
              </Button>
            </div>
            <div className="mt-4 flex h-16 items-end justify-center gap-1" aria-hidden="true">
              {DATA.map((v, i) => (
                <div
                  key={i}
                  className="w-2.5 border-x border-t border-pencil-mark bg-[repeating-linear-gradient(-58deg,var(--ll-pencil-mark)_0_1.2px,transparent_1.2px_3.6px)]"
                  style={{ height: `${(v / 400) * 100}%` }}
                />
              ))}
            </div>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
