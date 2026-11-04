// @ts-nocheck
import * as React from "react"

import { Icon } from "../vendor/ui/icon"
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHint,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../vendor/ui/prompt-input"

export const meta = {
  title: "The composer",
  description: "Type, press Enter and the paper plane flies. Shift+Enter breaks the line; the box grows with the text up to eight rows. The send button is pencilled in until there is something to send.",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  const [sent, setSent] = React.useState<string[]>([])
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-2 pb-3">
      <PromptInput seed="composer" onSubmit={(text) => setSent((s) => [...s, text])}>
        <PromptInputBody>
          <PromptInputTextarea aria-label="Message" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton size="icon-sm" aria-label="Attach a file">
              <Icon name="paperclip" />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputHint>Enter to send, Shift+Enter for a new line</PromptInputHint>
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
      <ul aria-label="Sent" className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-foreground">
        {sent.map((s, i) => (
          <li key={i} className="whitespace-pre-wrap">
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
