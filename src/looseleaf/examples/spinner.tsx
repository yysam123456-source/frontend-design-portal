// @ts-nocheck
import { Spinner } from "../vendor/ui/spinner"

export const meta = {
  title: "Sizes and colors",
  description:
    "Size it with size-*; the scribble is redrawn for the size (fewer, wider turns when it is small). It draws in whatever text color it sits in. With reduced motion on, every one of these stands still, whole.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <Spinner className="size-3" aria-label="Loading, extra small" />
        <Spinner />
        <Spinner className="size-6" aria-label="Loading, medium" />
        <Spinner className="size-8" aria-label="Loading, large" />
        <Spinner className="size-12" aria-label="Loading, extra large" />
        <Spinner className="size-16" aria-label="Loading, huge" />
      </div>
      <div className="flex items-center gap-6">
        <Spinner className="size-8 text-ink-you" aria-label="Loading, blue" />
        <Spinner className="size-8 text-red" aria-label="Loading, red" />
        <Spinner className="size-8 text-green" aria-label="Loading, green" />
        <Spinner className="size-8 text-pencil-text" aria-label="Loading, pencil" />
      </div>
    </div>
  )
}
