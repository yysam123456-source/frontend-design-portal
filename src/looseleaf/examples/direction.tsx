// @ts-nocheck
import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../vendor/ui/card"
import { DirectionProvider, useDirection } from "../vendor/ui/direction"
import { Slider } from "../vendor/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../vendor/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "../vendor/ui/toggle-group"

export const meta = {
  title: "Reading direction",
  description:
    "One provider, one prop. Flip it and the Radix keys, the slider's start edge, the tab shoulders and the words all turn round together. Click a tab and press the arrow keys before and after.",
  layout: "center" as const,
  height: 360,
}

function Readout() {
  const dir = useDirection()
  return (
    <p className="text-sm text-muted-foreground">
      <bdi dir="ltr">
        <code className="font-mono">useDirection()</code> says <strong className="text-foreground">{dir}</strong>. ArrowRight moves to the {dir === "rtl" ? "previous" : "next"} tab.
      </bdi>
    </p>
  )
}

export default function Example() {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("rtl")
  return (
    <div className="grid w-full max-w-md gap-4">
      <ToggleGroup type="single" variant="outline" value={direction} onValueChange={(v) => (v === "ltr" || v === "rtl") && setDirection(v)} aria-label="Reading direction">
        <ToggleGroupItem value="ltr">Left to right</ToggleGroupItem>
        <ToggleGroupItem value="rtl">Right to left</ToggleGroupItem>
      </ToggleGroup>

      <DirectionProvider direction={direction}>
        <Card seed="direction-default">
          <CardHeader>
            <CardTitle>{direction === "rtl" ? "دفتر الملاحظات" : "Notebook"}</CardTitle>
            <CardDescription>{direction === "rtl" ? "كل صفحة تُقرأ من اليمين إلى اليسار." : "Every page reads from left to right."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Tabs defaultValue="one">
              <TabsList>
                <TabsTrigger value="one">{direction === "rtl" ? "الأول" : "First"}</TabsTrigger>
                <TabsTrigger value="two">{direction === "rtl" ? "الثاني" : "Second"}</TabsTrigger>
                <TabsTrigger value="three">{direction === "rtl" ? "الثالث" : "Third"}</TabsTrigger>
              </TabsList>
              <TabsContent value="one">
                <Readout />
              </TabsContent>
              <TabsContent value="two">
                <Readout />
              </TabsContent>
              <TabsContent value="three">
                <Readout />
              </TabsContent>
            </Tabs>
            <Slider defaultValue={[35]} ticks={4} aria-label={direction === "rtl" ? "حجم الخط" : "Type size"} />
          </CardContent>
        </Card>
      </DirectionProvider>
    </div>
  )
}
