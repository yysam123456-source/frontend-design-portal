// @ts-nocheck
import { StickerBoard, type StickerBoardItem } from "../vendor/ui/sticker-board"

export const meta = {
  title: "Stick things down",
  description: "Drag a sticker anywhere. Pick one and a dashed frame appears with a ring to turn it by and a square to size it; the toolbar and the keyboard do the same.",
  layout: "stack" as const,
  stage: "desk" as const,
  height: 560,
}

const START: StickerBoardItem[] = [
  { id: "planet", name: "ringed-planet", x: 130, y: 130, rot: -8, scale: 1.2, z: 0 },
  { id: "rocket", name: "rocket", x: 290, y: 100, rot: 24, scale: 1, z: 1 },
  { id: "cloud", name: "cloud-smile", x: 432, y: 150, rot: -3, scale: 1.1, z: 2 },
  { id: "sun", name: "sun-shades", x: 310, y: 262, rot: 10, scale: 1.25, z: 3 },
  { id: "done", name: "done", x: 130, y: 290, rot: 6, scale: 0.9, z: 4 },
]

export default function Example() {
  return <StickerBoard className="h-[30rem] w-full" defaultValue={START} />
}
