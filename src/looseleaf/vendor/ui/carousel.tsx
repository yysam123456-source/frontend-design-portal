// @ts-nocheck
"use client"

import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { useInk, useInkSeed } from "../lib/ink/react"
import { CAROUSEL_TICK_PAD, CAROUSEL_TICK_PAD_PLAIN, carouselTickRecipe } from "../lib/ink/recipes/carousel-ink"
import { cn } from "../lib/utils"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  snapCount: number
  seed: string
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== "string") return false
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  seed: seedProp,
  onKeyDown,
  ...props
}: React.ComponentProps<"div"> &
  CarouselProps & {
    seed?: string | number
  }) {
  const seed = useInkSeed(seedProp)
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(0)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSelectedIndex(api.selectedScrollSnap())
    setSnapCount(api.scrollSnapList().length)
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api]
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (!event.currentTarget.contains(event.target as Node)) return
      if (isEditable(event.target)) return
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
      const back = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft"
      const forward = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight"
      if (event.key === back) {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === forward) {
        event.preventDefault()
        scrollNext()
      }
    },
    [orientation, scrollPrev, scrollNext, onKeyDown]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("reInit", onSelect)
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        snapCount,
        seed,
      }}
    >
      <div onKeyDown={handleKeyDown} className={cn("relative min-w-0", className)} role="region" aria-roledescription="carousel" data-slot="carousel" {...props}>
        {children}
        <span data-slot="carousel-status" className="sr-only" aria-live="polite" aria-atomic="true">
          {snapCount > 1 ? `Slide ${selectedIndex + 1} of ${snapCount}` : ""}
        </span>
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className={cn("overflow-hidden", orientation === "horizontal" ? "-my-3 py-3" : "-mx-3 px-3")} data-slot="carousel-content">
      <div className={cn("flex", orientation === "horizontal" ? "-ms-4" : "-mt-4 flex-col", className)} {...props} />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "ps-4" : "pt-4", className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn("absolute size-8", orientation === "horizontal" ? "-start-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <Icon name={orientation === "horizontal" ? "arrow-left" : "arrow-up"} />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn("absolute size-8", orientation === "horizontal" ? "-end-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <Icon name={orientation === "horizontal" ? "arrow-right" : "arrow-down"} />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

const PITCH = 24

function Tick({ index, selected, slash, onSelect, seed }: { index: number; selected: boolean; slash: boolean; onSelect: () => void; seed: string }) {
  const { hostRef, hostProps, node } = useInk({
    recipe: carouselTickRecipe,
    params: { slash, pitch: PITCH },
    kind: "tick",
    seed: `${seed}|tick${index}`,
    pad: slash ? CAROUSEL_TICK_PAD : CAROUSEL_TICK_PAD_PLAIN,
    still: true,
  })
  return (
    <button
      type="button"
      role="tab"
      data-slot="carousel-dot"
      data-index={index}
      aria-selected={selected}
      aria-label={`Go to slide ${index + 1}`}
      tabIndex={selected ? 0 : -1}
      ref={hostRef}
      {...hostProps}
      onClick={onSelect}
      className="relative isolate block h-8 w-6 shrink-0 cursor-pointer text-ink"
    >
      {node}
    </button>
  )
}

function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
  const { snapCount, selectedIndex, scrollTo, seed } = useCarousel()
  const list = React.useRef<HTMLDivElement | null>(null)
  const focusIn = React.useRef(false)
  React.useEffect(() => {
    if (!focusIn.current) return
    list.current?.querySelector<HTMLElement>(`[data-slot="carousel-dot"][data-index="${selectedIndex}"]`)?.focus()
  }, [selectedIndex])
  if (snapCount < 2) return null
  const groups = Math.ceil(snapCount / 5)
  return (
    <div
      data-slot="carousel-dots"
      role="tablist"
      aria-label="Choose a slide"
      ref={list}
      onFocus={() => {
        focusIn.current = true
      }}
      onBlur={(e) => {
        focusIn.current = e.currentTarget.contains(e.relatedTarget as Node | null)
      }}
      className={cn("-mx-4 -mb-4 flex flex-wrap items-center justify-center gap-x-2 overflow-clip p-4", className)}
      {...props}
    >
      {Array.from({ length: groups }, (_, g) => (
        <span key={g} className="flex shrink-0">
          {Array.from({ length: Math.min(5, snapCount - g * 5) }, (_, k) => {
            const i = g * 5 + k
            return <Tick key={i} index={i} selected={i === selectedIndex} slash={i % 5 === 4} onSelect={() => scrollTo(i)} seed={seed} />
          })}
        </span>
      ))}
    </div>
  )
}

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots }
