// @ts-nocheck
import { Card, CardContent } from "../vendor/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../vendor/ui/carousel"

export const meta = {
  title: "Default",
  description: "The shadcn demo: five cards and two arrows. Previous is dashed on the first slide; swipe or drag, click the arrows, or press Left and Right while focus is inside.",
  layout: "center" as const,
  height: 340,
  stage: "desk" as const,
}

const STOCKS = ["paper", "sticky-yellow", "kraft", "sticky-blue", "index-card"] as const

export default function Example() {
  return (
    <div className="mx-12 w-full max-w-xs">
      <Carousel aria-label="Numbered cards" seed="default">
        <CarouselContent>
          {Array.from({ length: 5 }, (_, i) => (
            <CarouselItem key={i} aria-label={`${i + 1} of 5`}>
              <Card seed={`c${i}`} stock={STOCKS[i]}>
                <CardContent className="grid aspect-square place-items-center p-6">
                  <span className="font-script text-6xl font-semibold">{i + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
