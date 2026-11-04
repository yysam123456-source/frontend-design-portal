// @ts-nocheck
import { Asterisk } from "../vendor/ui/asterisk"

export const meta = {
  title: "Default",
  description: "A red-pencil asterisk after a word, raised like a superscript.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <p className="text-[17px]">
      Free shipping
      <Asterisk />
    </p>
  )
}
