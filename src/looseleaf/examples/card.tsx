// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../vendor/ui/card"
import { Label } from "../vendor/ui/label"
import { Switch } from "../vendor/ui/switch"

export const meta = {
  title: "Settings card",
  description: "The whole family: a title and description, an action tucked into the header, content, and a footer with a pencil rule above it.",
  layout: "stack" as const,
}

const ROWS = [
  { id: "comments", label: "Comments on your notes", on: true },
  { id: "replies", label: "Replies to your questions", on: true },
  { id: "weekly", label: "The weekly summary, Fridays", on: false },
]

export default function Example() {
  return (
    <Card seed="settings" className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what lands in your inbox.</CardDescription>
        <CardAction>
          <Button variant="link" size="sm">
            Reset
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {ROWS.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4">
            <Label htmlFor={`card-${row.id}`}>{row.label}</Label>
            <Switch id={`card-${row.id}`} defaultChecked={row.on} />
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  )
}
