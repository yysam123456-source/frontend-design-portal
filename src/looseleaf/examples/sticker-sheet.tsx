// @ts-nocheck
import { StickerSheet, StickerSheetItem } from "../vendor/ui/sticker-sheet"

export const meta = {
  title: "A sheet to peel",
  description: "Press a sticker (or Enter) and it lifts off, leaving its kiss-cut outline behind. Press the outline to stick it back. Hover one and its corner curls.",
  layout: "center" as const,
  stage: "desk" as const,
}

const NAMES = ["rocket", "cloud-smile", "sun-shades", "ringed-planet", "done", "rainbow", "first-place", "number-one", "a-plus", "hundred", "moon-sleepy", "sale"]

export default function Example() {
  return (
    <StickerSheet title="Sticker sheet no. 4" defaultPeeled={["done", "hundred"]}>
      {NAMES.map((name) => (
        <StickerSheetItem key={name} name={name} />
      ))}
    </StickerSheet>
  )
}
