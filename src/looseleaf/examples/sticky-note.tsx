// @ts-nocheck
import { StickyNote, StickyNoteContent, StickyNoteTitle } from "../vendor/ui/sticky-note"

export const meta = {
  title: "Five pads",
  description: "Yellow, green, orange, pink and blue, each turned by its own seeded angle. The first word says what the note is.",
  layout: "stack" as const,
  stage: "desk" as const,
}

const notes = [
  { color: "yellow", title: "todo", body: "buy more ink" },
  { color: "green", title: "done", body: "book the venue" },
  { color: "orange", title: "careful", body: "the glue is wet" },
  { color: "pink", title: "urgent", body: "call mum" },
  { color: "blue", title: "tip", body: "tape it down first" },
] as const

export default function Example() {
  return (
    <div className="flex flex-wrap justify-center gap-8 p-4">
      {notes.map((n) => (
        <StickyNote key={n.title} color={n.color} seed={n.title}>
          <StickyNoteTitle>{n.title}</StickyNoteTitle>
          <StickyNoteContent>{n.body}</StickyNoteContent>
        </StickyNote>
      ))}
    </div>
  )
}
