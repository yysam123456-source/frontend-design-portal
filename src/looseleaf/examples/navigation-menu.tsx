// @ts-nocheck
import * as React from "react"

import { Mascot } from "../vendor/ui/mascot"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../vendor/ui/navigation-menu"

export const meta = {
  title: "Getting started",
  description:
    "The shadcn demo on an index strip: a featured card with the mascot beside three rows, a two-column panel of components, and a plain tab. Move from Getting started to Components: the slip resizes, the panels slide inside it and the felt-tip underline glides along.",
  layout: "center" as const,
  height: 420,
}

const COMPONENTS = [
  ["Alert Dialog", "A modal dialog that interrupts the user with important content."],
  ["Hover Card", "For sighted users to preview content available behind a link."],
  ["Progress", "Displays an indicator showing the completion progress of a task."],
  ["Scroll Area", "Visually or semantically separates content."],
  ["Tabs", "A set of layered sections of content, one displayed at a time."],
  ["Tooltip", "A popup that displays information related to an element."],
] as const

function Row({ title, children, href = "#" }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a href={href}>
          <span className="font-bold">{title}</span>
          <span className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</span>
        </a>
      </NavigationMenuLink>
    </li>
  )
}

export default function Example() {
  return (
    <NavigationMenu aria-label="Main" className="self-start">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger seed="gs">Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a href="#looseleaf" className="flex h-full flex-col justify-end gap-1 bg-card p-4 shadow-loose">
                    <Mascot pose="wave" size={64} className="mb-2" style={{ width: "auto", height: 64 }} />
                    <span className="font-script text-2xl leading-none font-semibold">Looseleaf</span>
                    <span className="text-sm leading-snug text-muted-foreground">Beautifully designed components, drawn by hand.</span>
                  </a>
                </NavigationMenuLink>
              </li>
              <Row href="#docs" title="Introduction">
                Re-usable components built with Radix UI and Tailwind CSS.
              </Row>
              <Row href="#install" title="Installation">
                How to install dependencies and structure your app.
              </Row>
              <Row href="#type" title="Typography">
                Styles for headings, paragraphs, lists and more.
              </Row>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger seed="cm">Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {COMPONENTS.map(([title, desc]) => (
                <Row key={title} title={title}>
                  {desc}
                </Row>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs" seed="docs">
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuIndicator />
      </NavigationMenuList>
    </NavigationMenu>
  )
}
