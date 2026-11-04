// @ts-nocheck
import { Signature } from "../vendor/ui/signature"

export const meta = {
  title: "Default",
  description: "A name and its pen tail.",
  layout: "center" as const,
}

export default function Example() {
  return <Signature>Ada Lovelace</Signature>
}
