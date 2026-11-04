// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Icon } from "../vendor/ui/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../vendor/ui/tooltip"

export const meta = {
  title: "Icon toolbar",
  description: "The everyday use: names for icon buttons. One provider holds the delay (a calm 300 ms), and once one note is open the next opens at once as you sweep along the row. Each button still has its own aria-label.",
  layout: "center" as const,
  height: 220,
}

const TOOLS = [
  { icon: "plus", label: "Add to library" },
  { icon: "pencil", label: "Edit notebook" },
  { icon: "copy", label: "Duplicate" },
  { icon: "trash", label: "Move to bin" },
  { icon: "settings", label: "Settings" },
]

export default function Example() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-2 pt-10" role="toolbar" aria-label="Notebook actions">
        {TOOLS.map((t, i) => (
          <Tooltip key={t.label}>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t.label}>
                <Icon name={t.icon} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" seed={`tool-${i}`}>
              {t.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
