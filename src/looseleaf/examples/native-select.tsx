// @ts-nocheck
import { NativeSelect, NativeSelectOption } from "../vendor/ui/native-select"

export const meta = {
  title: "Default",
  description: "The browser's own select in a hand-drawn frame: its popup, its mobile picker, its typeahead. The chevron is drawn; a first option with an empty value reads as a placeholder.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <NativeSelect defaultValue="" className="w-[220px]" aria-label="Country">
      <NativeSelectOption value="" disabled>
        Choose a country
      </NativeSelectOption>
      <NativeSelectOption value="is">Iceland</NativeSelectOption>
      <NativeSelectOption value="pt">Portugal</NativeSelectOption>
      <NativeSelectOption value="jp">Japan</NativeSelectOption>
      <NativeSelectOption value="ca">Canada</NativeSelectOption>
    </NativeSelect>
  )
}
