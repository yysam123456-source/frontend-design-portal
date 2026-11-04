// @ts-nocheck
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../vendor/ui/select"

export const meta = {
  title: "Default",
  description: "Press it, slide down the list, and the row under the pointer gets the highlighter. Type a letter to jump; the chosen row is bold with a blue tick.",
  layout: "center" as const,
  height: 330,
}

export default function Example() {
  return (
    <Select>
      <SelectTrigger className="w-[190px]" aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
