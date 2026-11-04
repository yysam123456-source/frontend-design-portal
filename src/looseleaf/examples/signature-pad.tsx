// @ts-nocheck
import { SignaturePad } from "../vendor/ui/signature-pad"

export const meta = {
  title: "Default",
  description: "Sign with the mouse, a finger or a pen. The brush swells where you lean on it.",
  layout: "stack" as const,
}

export default function Example() {
  return <SignaturePad className="max-w-lg" />
}
