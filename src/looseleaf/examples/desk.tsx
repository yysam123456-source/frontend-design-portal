// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../vendor/ui/card"
import { Desk } from "../vendor/ui/desk"
import { Paper } from "../vendor/ui/paper"

export const meta = {
  title: "The bare desk",
  description: "Sage bookcloth under a lamp. Paper lies on it with a short umber shadow and the light from the upper left.",
  layout: "full" as const,
}

export default function Example() {
  return (
    <Desk className="grid min-h-72 place-items-center gap-6 p-10 sm:grid-cols-2" seed="bare">
      <Card seed="a" className="w-full max-w-xs">
        <CardHeader>
          <CardTitle>On the desk</CardTitle>
          <CardDescription>A card, casting a card-sized shadow.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">The blotter is a shade darker than the paper so cream glows against it.</CardContent>
      </Card>
      <Paper stock="sticky-yellow" seed="b" className="size-40 p-4">
        <p className="font-script text-2xl leading-none font-bold">call mum</p>
        <p className="mt-2 text-sm">before six</p>
      </Paper>
    </Desk>
  )
}
