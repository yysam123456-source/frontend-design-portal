// @ts-nocheck
import { Skeleton } from "../vendor/ui/skeleton"

export const meta = {
  title: "Shapes",
  description:
    "Whatever shape the class says: text lines, a circle for an avatar, a picture, a row of buttons. Watch one for a few seconds: the outline and the hatch are redrawn three times over, slowly.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-36 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[64%]" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  )
}
