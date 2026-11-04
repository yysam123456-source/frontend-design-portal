// @ts-nocheck
import { Bubble, BubbleContent } from "../vendor/ui/bubble"
import { Marker, MarkerContent } from "../vendor/ui/marker"

export const meta = {
  title: "Day separators",
  description: "A ruled pencil line on each side of the day, written in the script font. The lines run level and stop just short of the words.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 pb-4">
      <Marker variant="separator" seed="wed">
        <MarkerContent>Wednesday</MarkerContent>
      </Marker>
      <Bubble variant="muted">
        <BubbleContent seed="sep-1">Did the tags make it into the build?</BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent seed="sep-2">They did. Filter row is next.</BubbleContent>
      </Bubble>
      <Marker variant="separator" seed="today" className="mt-3">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Bubble variant="muted">
        <BubbleContent seed="sep-3">Morning! The filter row is in.</BubbleContent>
      </Bubble>
    </div>
  )
}
