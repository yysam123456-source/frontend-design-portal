// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Icon } from "../vendor/ui/icon"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../vendor/ui/item"

export const meta = {
  title: "Variants and sizes",
  description:
    "Bare, outlined in ruled pencil, and washed in paper-shade. The small size trims the padding. None of these rows draws an svg: the pencil is CSS.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item>
        <ItemMedia variant="icon">
          <Icon name="bell" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Notifications</ItemTitle>
          <ItemDescription>Choose what lands in your inbox.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Icon name="user" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Profile</ItemTitle>
          <ItemDescription>Your name, your face, your pencil case.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>
      <Item variant="muted">
        <ItemMedia variant="icon">
          <Icon name="settings" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Preferences</ItemTitle>
          <ItemDescription>Density, motion and the color of the desk.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Change
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm">
        <ItemContent>
          <ItemTitle>Small</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="sm">
            Undo
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
