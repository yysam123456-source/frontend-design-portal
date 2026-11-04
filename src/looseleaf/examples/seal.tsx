// @ts-nocheck
import { Seal } from "../vendor/ui/seal"

export const meta = {
  title: "Seals",
  description: "A scalloped seal, a starburst, a rosette with a ribbon hanging from it, a medal, a shield, a plate and a tag: one generator, eight shapes, any stationery color.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      <Seal variant="scallop" text="Best" sub="seller" tone="grass" />
      <Seal variant="starburst" text="New" tone="lemon" />
      <Seal variant="rosette" text="Pick" tone="tangerine" ribbon="sky" />
      <Seal variant="medal" text="Top" tone="lemon" />
      <Seal variant="shield" text="Pro" sub="plan" tone="teal" />
      <Seal variant="plate" text="Gold" tone="lemon" />
      <Seal variant="tag" text="Sale" tone="tangerine" />
    </div>
  )
}
