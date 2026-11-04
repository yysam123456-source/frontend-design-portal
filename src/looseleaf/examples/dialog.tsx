// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../vendor/ui/dialog"
import { Input } from "../vendor/ui/input"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Edit profile",
  description: "The classic: a form in a dialog. Washi tape across the top corners, the doodled x, and a sheet that drops onto the dimmed page.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent tape="both" tapeKind="washi-dots" seed="edit-profile" className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes to your profile here. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="justify-end">
              Name
            </Label>
            <Input id="edit-name" defaultValue="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-username" className="justify-end">
              Username
            </Label>
            <Input id="edit-username" defaultValue="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
