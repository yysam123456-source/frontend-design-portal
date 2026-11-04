// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../vendor/ui/empty"
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "Icon tile",
  description: "The upstream layout: media, title, description and an action. `variant=\"icon\"` puts the icon on a little slip of paper with a hatched shadow; the title is in the script font.",
  layout: "center" as const,
  height: 360,
}

export default function Example() {
  return (
    <Empty seed="no-projects">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name="folder-plus" />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>You have not created any projects yet. Get started by creating your first project.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create project</Button>
          <Button variant="outline">Import project</Button>
        </div>
        <Button variant="link" size="sm" className="text-muted-foreground">
          Learn more
          <Icon name="arrow-up-right" />
        </Button>
      </EmptyContent>
    </Empty>
  )
}
