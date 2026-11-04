// @ts-nocheck
import * as React from "react"

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger, ComboboxValue } from "../vendor/ui/combobox"

export const meta = {
  title: "Framework picker",
  description: "The shadcn recipe: press the field, type to narrow (\"svelte\" finds SvelteKit), arrow keys and Enter to choose. The chosen row ends in a blue tick. Try a word that matches nothing to meet Stubby.",
  layout: "center" as const,
  height: 380,
}

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

export default function Example() {
  const [value, setValue] = React.useState<string | null>("next")
  return (
    <div className="self-start">
      <Combobox items={FRAMEWORKS} value={value} onValueChange={setValue} label="Framework">
        <ComboboxTrigger aria-label="Framework" className="w-64">
          <ComboboxValue placeholder="Select framework..." />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search framework..." />
          <ComboboxList>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxGroup>
              {FRAMEWORKS.map((f) => (
                <ComboboxItem key={f.value} value={f.value}>
                  {f.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
