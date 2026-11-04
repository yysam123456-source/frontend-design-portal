// @ts-nocheck
import { Lettering } from "../vendor/ui/lettering"

export const meta = {
  title: "Default",
  description: "Ink with a marker-colored second pass, printed a hair out of register.",
  layout: "center" as const,
}

export default function Example() {
  return <Lettering>Hello, paper</Lettering>
}
