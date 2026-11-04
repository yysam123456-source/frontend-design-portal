// @ts-nocheck
import { Polaroid, PolaroidCaption, PolaroidImage } from "../vendor/ui/polaroid"

export const meta = {
  title: "A polaroid",
  description: "The frame, the recessed window, the caption in the foot. Here the window holds a drawn scene; a real photograph goes in the same place.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Polaroid tape="top" seed="august">
      <PolaroidImage scene="hills" label="Hills, a tree and a sun" seed="hills" />
      <PolaroidCaption>august, finally</PolaroidCaption>
    </Polaroid>
  )
}
