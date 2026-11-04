// @ts-nocheck
import { Stamp } from "../vendor/ui/stamp"

export const meta = {
  title: "Presets",
  description: "Ink pressed through a worn pad: about 86 percent of it survives, patches are missed, the border wobbles and the whole stamp tilts a few degrees.",
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Stamp name="stamp-approved" />
      <Stamp name="stamp-draft" />
      <Stamp name="stamp-paid" />
      <Stamp name="stamp-urgent" />
    </div>
  )
}
