// @ts-nocheck
import * as React from "react"

import { Button } from "../vendor/ui/button"
import { Icon } from "../vendor/ui/icon"
import { Sticker } from "../vendor/ui/sticker"
import { StickerPicker, StickerPickerContent, StickerPickerTrigger } from "../vendor/ui/sticker-picker"

export const meta = {
  title: "A sticker for the job",
  description: "Type to search, click a category, or walk the grid with the arrow keys. The highlighted sticker peels its corner; Enter sticks it.",
  layout: "center" as const,
  height: 520,
}

export default function Example() {
  const [name, setName] = React.useState<string | null>(null)
  return (
    <div className="flex items-center gap-4">
      <StickerPicker value={name} onSelect={(s) => setName(s.name)}>
        <StickerPickerTrigger asChild>
          <Button variant="outline">
            <Icon name="star" />
            Add sticker
          </Button>
        </StickerPickerTrigger>
        <StickerPickerContent />
      </StickerPicker>
      <div className="grid size-28 place-items-center text-muted-foreground" aria-live="polite">
        {name ? <Sticker name={name} size={88} label={`Chosen: ${name}`} /> : <span className="font-script text-xl">none yet</span>}
      </div>
    </div>
  )
}
