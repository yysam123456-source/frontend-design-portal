// @ts-nocheck
import { TearOff, TearOffBody, TearOffStub } from "../vendor/ui/tear-off"

export const meta = {
  title: "Default",
  description: "Pull the stub away, tap it, or focus it and press Enter. The scissors have already started.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 250,
}

export default function Example() {
  return (
    <TearOff>
      <TearOffBody className="w-64">
        <p className="font-script text-3xl leading-none">Studio night</p>
        <p className="mt-2 text-sm">Friday, doors at 7</p>
        <p className="mt-3 text-sm text-pencil-text">admit one, keep this half</p>
      </TearOffBody>
      <TearOffStub className="w-32 justify-start gap-0 pt-3.5 pb-2" label="Tear off the 10% off coupon">
        <span className="font-script text-3xl leading-[30px]">10% off</span>
        <span className="text-sm leading-[30px] text-pencil-text">your next visit</span>
      </TearOffStub>
    </TearOff>
  )
}
