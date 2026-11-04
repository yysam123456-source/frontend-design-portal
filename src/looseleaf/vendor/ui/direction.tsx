// @ts-nocheck
"use client"

import * as React from "react"
import { Direction, Slot } from "radix-ui"

import { InkContext, useInkContext, useMergedRef, type InkContextValue, type InkScopeProps } from "../lib/ink/react"
import { cn } from "../lib/utils"

type Dir = "ltr" | "rtl"

type DirectionScope = InkScopeProps & { dir: Dir }

function readDirection(from: Element | null): Dir | undefined {
  for (let el = from; el; el = el.parentElement) {
    const d = el.getAttribute("dir")
    if (d === "rtl" || d === "ltr") return d
  }
  return undefined
}

function DirectionProvider({
  dir,
  direction,
  asChild = false,
  className,
  children,
  ref,
  ...props
}: Omit<React.ComponentProps<"div">, "dir"> & {
  dir?: Dir
  direction?: Dir
  asChild?: boolean
}) {
  const explicit = direction ?? dir
  const hostRef = React.useRef<HTMLElement | null>(null)
  const [inherited, setInherited] = React.useState<Dir>("ltr")

  React.useLayoutEffect(() => {
    const host = hostRef.current
    if (explicit || !host) return
    const read = () => setInherited(readDirection(host.parentElement) ?? "ltr")
    read()
    if (typeof MutationObserver === "undefined") return
    const mo = new MutationObserver(read)
    mo.observe(host.ownerDocument.documentElement, { attributes: true, attributeFilter: ["dir"], subtree: true })
    return () => mo.disconnect()
  }, [explicit])

  const value: Dir = explicit ?? inherited
  const ink = useInkContext()
  const inkValue = React.useMemo<InkContextValue>(() => {
    const scope: DirectionScope = { ...ink.scope, dir: value }
    return { ...ink, dir: value, scope }
  }, [ink, value])

  const Comp = asChild ? Slot.Root : "div"
  return (
    <Direction.DirectionProvider dir={value}>
      <InkContext.Provider value={inkValue}>
        <Comp data-slot="direction" ref={useMergedRef(hostRef, ref)} dir={explicit} className={asChild ? className : cn("contents", className)} {...props}>
          {children}
        </Comp>
      </InkContext.Provider>
    </Direction.DirectionProvider>
  )
}

const useDirection: (localDir?: Dir) => Dir = Direction.useDirection

export { DirectionProvider, useDirection }
