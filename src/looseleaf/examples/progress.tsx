// @ts-nocheck
import * as React from "react"

import { Progress } from "../vendor/ui/progress"

export const meta = {
  title: "Default",
  description: "A pencil-hatched box colored in with a marker as far as the value says. Change the value and the marker glides to it (a CSS clip on a full-length pass; nothing is redrawn).",
  layout: "stack" as const,
}

export default function Example() {
  const [value, setValue] = React.useState(13)
  React.useEffect(() => {
    const t = setTimeout(() => setValue(66), 600)
    return () => clearTimeout(t)
  }, [])
  return <Progress value={value} className="w-[60%] min-w-48" aria-label="Chapter progress" />
}
