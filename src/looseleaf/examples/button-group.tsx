// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { ButtonGroup } from "../vendor/ui/button-group"
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "A row of buttons",
  description: "Outline buttons side by side share their seams: the edge between two of them is drawn once. Icon buttons, and a column, work the same way.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <ButtonGroup aria-label="Range">
        <Button variant="outline">Years</Button>
        <Button variant="outline">Months</Button>
        <Button variant="outline">Days</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Page">
        <Button variant="outline" size="icon" aria-label="Previous">
          <Icon name="chevron-left" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Search">
          <Icon name="search" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next">
          <Icon name="chevron-right" />
        </Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <Button variant="outline" size="icon" aria-label="Zoom in">
          <Icon name="plus" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Zoom out">
          <Icon name="minus" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
