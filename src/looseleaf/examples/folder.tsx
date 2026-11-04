// @ts-nocheck
import { Folder, FolderContent, FolderTab, FolderTabs } from "../vendor/ui/folder"

export const meta = {
  title: "A folder with tabs",
  description: "The front tab is the folder's color and runs into the body; the others stand behind it. Arrow keys move between tabs; Home and End jump.",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Folder defaultValue="inbox" className="mx-auto">
      <FolderTabs aria-label="Mail">
        <FolderTab value="inbox">Inbox</FolderTab>
        <FolderTab value="drafts">Drafts</FolderTab>
        <FolderTab value="sent">Sent</FolderTab>
        <FolderTab value="archive" disabled>
          Archive
        </FolderTab>
      </FolderTabs>
      <FolderContent value="inbox" seed="in">
        <h3 className="font-script text-3xl leading-none font-bold">Inbox</h3>
        <p className="mt-2">Three letters are waiting: one from Ada, and a parcel notice that has been waiting longer.</p>
      </FolderContent>
      <FolderContent value="drafts" seed="dr">
        <h3 className="font-script text-3xl leading-none font-bold">Drafts</h3>
        <p className="mt-2">Two drafts, both begun, neither finished.</p>
      </FolderContent>
      <FolderContent value="sent" seed="se">
        <h3 className="font-script text-3xl leading-none font-bold">Sent</h3>
        <p className="mt-2">Nothing yet this week.</p>
      </FolderContent>
    </Folder>
  )
}
