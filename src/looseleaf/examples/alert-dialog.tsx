// @ts-nocheck
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "../vendor/ui/alert-dialog"
import { Button } from "../vendor/ui/button"
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "Delete (danger)",
  description: "The risky question: hazard tape across the top corners, a red patch behind the icon, and a hatched destructive answer. Focus starts on Cancel.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete notebook</Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="danger" seed="delete">
        <AlertDialogHeader>
          <AlertDialogMedia tone="danger">
            <Icon name="trash" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this notebook?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete &ldquo;Field notes&rdquo; and its 48 pages. You cannot undo this.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete notebook</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
