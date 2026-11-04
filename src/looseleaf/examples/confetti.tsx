// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { ConfettiTrigger } from "../vendor/ui/confetti"

export const meta = {
  title: "Default",
  description: "Click the button. Pieces leave it in a cone, slow down like paper, sway and fade.",
  layout: "center" as const,
  height: 240,
}

export default function Example() {
  return (
    <ConfettiTrigger asChild>
      <Button size="lg">Celebrate</Button>
    </ConfettiTrigger>
  )
}
