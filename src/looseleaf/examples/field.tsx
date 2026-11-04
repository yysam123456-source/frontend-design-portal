// @ts-nocheck
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "../vendor/ui/field"
import { Input } from "../vendor/ui/input"
import { Textarea } from "../vendor/ui/textarea"

export const meta = {
  title: "Default",
  description: "A set of labeled controls: a legend in the script font, fields that stack label, control and help, and the gaps between them. Nothing is drawn but the controls; Field is layout and words.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="w-full max-w-md">
      <FieldSet>
        <FieldLegend>Your notebook</FieldLegend>
        <FieldDescription>Everything is saved as you write, in pencil.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nb-name">Name</FieldLabel>
            <Input id="nb-name" placeholder="Field notes" />
            <FieldDescription>Shows on the spine. You can change it later.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="nb-about">About</FieldLabel>
            <Textarea id="nb-about" placeholder="What is it for?" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
