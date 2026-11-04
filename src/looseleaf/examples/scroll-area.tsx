// @ts-nocheck
import { Paper } from "../vendor/ui/paper"
import { ScrollArea } from "../vendor/ui/scroll-area"

export const meta = {
  title: "Tags",
  description: "Shadcn's list, with a pencil scroll mark instead of a bar. The mark fades in when the pointer is over the area or it scrolls, and the thumb is a graphite pull that slides down a faint gutter.",
  layout: "center" as const,
  height: 320,
}

const tags = Array.from({ length: 50 }, (_, i) => `v1.${2 - Math.floor(i / 10)}.${9 - (i % 10)}-beta.${50 - i}`)

export default function Example() {
  return (
    <Paper stock="slip" tilt={false} seed="tags" className="w-56">
      <ScrollArea className="h-72 w-full">
        <div className="p-4">
          <h4 className="mb-3 font-script text-xl leading-none font-semibold">Tags</h4>
          {tags.map((tag) => (
            <div key={tag} className="border-b border-dashed border-pencil-mark/40 py-2 text-sm">
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Paper>
  )
}
