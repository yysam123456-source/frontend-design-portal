// @ts-nocheck
import { CodeBlock } from "../vendor/ui/code-block"

export const meta = {
  title: "A typed slip",
  description: "Pass `code`, a `filename` and a language: the header, the copy button and the lines come with it. Keywords are typed in red, functions struck twice, strings underscored.",
  layout: "stack" as const,
  stage: "desk" as const,
}

const CODE = `import { useState } from "react"

type Props = { tags: string[] } // one per note

export function TagChips({ tags }: Props) {
  const [on, setOn] = useState(new Set<string>())
  return (
    <ul className="flex gap-2">
      {tags.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}`

export default function Example() {
  return <CodeBlock code={CODE} filename="src/notes/tag-chips.tsx" lineNumbers className="mx-auto w-full max-w-xl" seed="default" />
}
