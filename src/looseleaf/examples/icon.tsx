// @ts-nocheck
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "Default",
  description: "Sixteen pixels, ink in the current text color. Names are lucide's, so a shadcn snippet keeps working.",
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-center gap-5 text-ink">
      {["check", "x", "plus", "minus", "search", "chevron-down", "arrow-right", "copy", "trash", "pencil", "user", "settings", "calendar", "ellipsis"].map((name) => (
        <Icon key={name} name={name} />
      ))}
    </div>
  )
}
