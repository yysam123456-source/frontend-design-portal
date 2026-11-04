// @ts-nocheck
import { Icon } from "../vendor/ui/icon"
import { Toggle } from "../vendor/ui/toggle"

export const meta = {
  title: "Variants",
  description:
    "Default is a whisper of pencil that becomes a highlighted, boxed button when it is on. Outline keeps its ink box the whole time. Icon-only toggles need an aria-label.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <Toggle aria-label="Show hidden pages">
          <Icon name="eye" />
        </Toggle>
        <Toggle aria-label="Show hidden pages, on" defaultPressed>
          <Icon name="eye" />
        </Toggle>
        <Toggle>
          <Icon name="bell" />
          Watch
        </Toggle>
        <Toggle defaultPressed>
          <Icon name="bell" />
          Watching
        </Toggle>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Toggle variant="outline" aria-label="Show hidden pages">
          <Icon name="eye" />
        </Toggle>
        <Toggle variant="outline" aria-label="Show hidden pages, on" defaultPressed>
          <Icon name="eye" />
        </Toggle>
        <Toggle variant="outline">
          <Icon name="bell" />
          Watch
        </Toggle>
        <Toggle variant="outline" defaultPressed>
          <Icon name="bell" />
          Watching
        </Toggle>
      </div>
    </div>
  )
}
