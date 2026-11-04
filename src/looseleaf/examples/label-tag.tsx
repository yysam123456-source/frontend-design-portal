// @ts-nocheck
import { LabelTag, LabelTagDescription, LabelTagPrice, LabelTagTitle } from "../vendor/ui/label-tag"

export const meta = {
  title: "A hang tag",
  description: "A card with clipped corners, a hole with its patch and brass eyelet, and a loop of natural twine. Everything drawn is one sheet: it turns and casts one shadow.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <LabelTag seed="sale" tilt={-3}>
      <LabelTagTitle>Sale</LabelTagTitle>
      <LabelTagDescription>while stocks last</LabelTagDescription>
      <LabelTagPrice>12.00</LabelTagPrice>
    </LabelTag>
  )
}
