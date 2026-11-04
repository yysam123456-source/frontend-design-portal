// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Doodle } from "../vendor/ui/doodle"
import { HoverCard, HoverCardCaption, HoverCardContent, HoverCardMedia, HoverCardTrigger } from "../vendor/ui/hover-card"

export const meta = {
  title: "Profile",
  description: "The shadcn demo as a polaroid: hover the link (or tab to it) and a small photo with handwriting on its margin lands next to it.",
  layout: "center" as const,
  height: 340,
}

export default function Example() {
  return (
    <div className="flex items-center gap-1 self-start text-base">
      Made by
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link" className="px-1" asChild>
            <a href="https://kevintngo.github.io/looseleaf">@looseleaf</a>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent seed="profile">
          <HoverCardMedia>
            <Doodle name="flower" size={88} />
          </HoverCardMedia>
          <HoverCardCaption>@looseleaf</HoverCardCaption>
          <p className="px-1 text-sm text-muted-foreground">shadcn/ui, drawn by hand. Joined September 2026.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
