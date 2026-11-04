// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Page, PageContent, PageDescription, PageFooter, PageHeader, PageTitle } from "../vendor/ui/page"

export const meta = {
  title: "A page",
  description: "Header, content and footer on a sheet of paper. The title is underlined by hand; the column is centered and as wide as you say.",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Page seed="field-notes" width="md">
      <PageHeader>
        <PageTitle>Field notes</PageTitle>
        <PageDescription>A week of small observations, written where the light was good.</PageDescription>
      </PageHeader>
      <PageContent>
        <p>
          Most of what I remember from a book is in the margins: an arrow, a question mark, a small argument with a dead author. The rest is weather.
        </p>
        <p>Tuesday. Rain on the window, three cups of tea, and one very small plan for a very big week.</p>
        <div>
          <Button>Save the page</Button>
        </div>
      </PageContent>
      <PageFooter>
        <span>Draft</span>
        <span className="ll-num">- 3 -</span>
      </PageFooter>
    </Page>
  )
}
