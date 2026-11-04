// @ts-nocheck
import { Dropzone } from "../vendor/ui/dropzone"

export const meta = {
  title: "Drop or browse",
  description: "Drag files over it (Stubby comes out with a sheet of paper), drop them, or click / Tab and press Enter to browse. Pick something that is not an image, or bigger than 2 MB, or a fifth file, and the reason appears in red.",
  layout: "center" as const,
  height: 480,
}

export default function Example() {
  return (
    <div className="w-full max-w-lg">
      <Dropzone accept="image/*" maxSize={2 * 1024 * 1024} maxFiles={4} />
    </div>
  )
}
