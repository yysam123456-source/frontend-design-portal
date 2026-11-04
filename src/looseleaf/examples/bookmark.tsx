// @ts-nocheck
import { Bookmark } from "../vendor/ui/bookmark"

export const meta = {
  title: "A bookmark",
  description: "Press it: the ghost becomes a ribbon that settles in with a little turn. It is a toggle button, so Space and Enter work, and its state is `aria-pressed`.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <div className="flex items-center gap-8 p-6">
      <Bookmark seed="off">Save for later</Bookmark>
      <Bookmark defaultPressed seed="on">
        Saved
      </Bookmark>
      <Bookmark disabled seed="dis">
        Cannot save
      </Bookmark>
    </div>
  )
}
