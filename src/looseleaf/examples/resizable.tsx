// @ts-nocheck
import { Paper } from "../vendor/ui/paper"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../vendor/ui/resizable"

export const meta = {
  title: "Panels",
  description:
    "Three panels and two seams, nested: a row with a column inside, on a slip of paper. The seam is stitched by hand; `withHandle` adds a paper tab with a grip. Drag it, or focus it and use the arrow keys (Home and End jump to the limits).",
  layout: "center" as const,
}

export default function Example() {
  return (
    <Paper stock="slip" tilt={false} seed="panels" className="w-full max-w-md">
      <ResizablePanelGroup orientation="horizontal" className="h-64">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-script text-2xl font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize the first panel" />
        <ResizablePanel defaultSize="50%" minSize="20%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="25%" minSize="10%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-script text-2xl font-semibold">Two</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize the second panel" />
            <ResizablePanel defaultSize="75%" minSize="10%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-script text-2xl font-semibold">Three</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Paper>
  )
}
