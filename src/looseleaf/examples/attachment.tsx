// @ts-nocheck
import { Icon } from "../vendor/ui/icon"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
} from "../vendor/ui/attachment"

export const meta = {
  title: "The five states",
  description: "Done (a clipped slip), uploading (a pencil bar), processing (the same bar, pulsing), error (red pencil and a retry) and idle (a dashed slot waiting for a file).",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-start gap-6 px-4 pt-3 pb-4">
      <Attachment className="w-full" state="done" seed="done">
        <AttachmentMedia>
          <Icon name="file-text" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>field-notes.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB · pdf</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove field-notes.pdf">
            <Icon name="x" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment className="w-full" state="uploading" seed="uploading">
        <AttachmentMedia>
          <Icon name="file-code" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>tags-list.tsx</AttachmentTitle>
          <AttachmentDescription>Uploading 42 %</AttachmentDescription>
          <AttachmentProgress value={42} aria-label="Upload progress" />
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Cancel upload">
            <Icon name="x" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment className="w-full" state="processing" seed="processing">
        <AttachmentMedia>
          <Icon name="file" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>recipes.csv</AttachmentTitle>
          <AttachmentDescription>Reading the rows</AttachmentDescription>
          <AttachmentProgress aria-label="Processing" />
        </AttachmentContent>
      </Attachment>
      <Attachment className="w-full" state="error" seed="error">
        <AttachmentMedia>
          <Icon name="archive" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>holiday-photos.zip</AttachmentTitle>
          <AttachmentDescription>Too large. Max 25 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Try again">
            <Icon name="rotate-cw" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment className="w-full" state="idle" seed="idle">
        <AttachmentMedia>
          <Icon name="upload" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>Add a file</AttachmentTitle>
          <AttachmentDescription>or drop it here</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  )
}
