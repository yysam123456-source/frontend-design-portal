// @ts-nocheck
import { Notebook, NotebookPage, NotebookTitle } from "../vendor/ui/notebook"

export const meta = {
  title: "A spiral notebook",
  description: "Wire coils through punched holes, ruled lines with a red margin, and two more pages peeking out underneath. The words sit on the lines.",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Notebook seed="field-notes" className="mx-auto min-h-[24rem] w-full max-w-md">
      <NotebookPage>
        <NotebookTitle>Field notes</NotebookTitle>
        <p>Tuesday. Rain on the window,</p>
        <p>three cups of tea, and one</p>
        <p>very small plan for a very big week.</p>
        <p className="mt-7 text-muted-foreground">1. ink the outline</p>
        <p className="text-muted-foreground">2. wash the sky, then wait</p>
        <p className="text-muted-foreground">3. hatch the shade</p>
      </NotebookPage>
    </Notebook>
  )
}
