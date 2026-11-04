// @ts-nocheck
import { toast } from "sonner"

import { Button } from "../vendor/ui/button"
import { Toaster } from "../vendor/ui/sonner"

export const meta = {
  title: "Types",
  description: "Six kinds of paper: a plain slip, a green guest check for success, a pink sticky for errors, yellow for warnings, blue for news, and a slip with a spinning loader. Each has its own drawn icon and a slightly different tilt.",
  layout: "center" as const,
}

const ID = "sonner-types"

export default function Example() {
  const t = { toasterId: ID }
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" onClick={() => toast("Event created", { ...t, description: "Saturday, 10:00 am" })}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Notebook saved", { ...t, description: "All 48 pages are safe." })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Could not sync", { ...t, description: "You are offline. We will try again." })}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Storage almost full", { ...t, description: "92% of your 1 GB is used." })}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info("A new version is ready", { ...t })}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.loading("Uploading photo…", { ...t, description: "IMG_2043.jpg" })}>
        Loading
      </Button>
      <Toaster id={ID} closeButton />
    </div>
  )
}
