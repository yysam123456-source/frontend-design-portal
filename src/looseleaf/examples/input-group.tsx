// @ts-nocheck
import { Icon } from "../vendor/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../vendor/ui/input-group"

export const meta = {
  title: "Default",
  description: "One hand-drawn box around an icon, the field and some text. Click anywhere on an addon and the field takes focus; the focus ring goes around the whole group.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupAddon>
          <Icon name="search" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search the notebook" aria-label="Search" />
        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="field-notes" aria-label="Site name" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.looseleaf.dev</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <Icon name="dollar-sign" />
        </InputGroupAddon>
        <InputGroupInput placeholder="0.00" inputMode="decimal" aria-label="Amount" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
