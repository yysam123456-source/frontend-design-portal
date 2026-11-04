// @ts-nocheck
"use client"

import * as React from "react"

import { Paper, type PaperProps } from ".//paper"
import { useEnsureInkDefs, useInk, useInkSeed } from "../lib/ink/react"
import { hasSticker, kissCut, stickerFace, stickerLabel } from "../lib/ink/recipes/sticker-ink"
import { stickerSheetRecipe, stickerSlotRecipe } from "../lib/ink/recipes/sticker-sheet-ink"
import { cn } from "../lib/utils"

interface StickerSheetPeel {
  id: string
  name: string
  label: string
  dragged: boolean
  x?: number
  y?: number
}

interface StickerSheetContextValue {
  peeled: readonly string[]
  peel(item: StickerSheetPeel): void
  stick(item: StickerSheetPeel): void
  size: number
  restorable: boolean
  disabled: boolean
  uid: string
}

const StickerSheetContext = React.createContext<StickerSheetContextValue | null>(null)

function useStickerSheet(): StickerSheetContextValue {
  const ctx = React.useContext(StickerSheetContext)
  if (!ctx) throw new Error("StickerSheetItem must be used inside <StickerSheet>")
  return ctx
}

const cellOf = (size: number) => Math.round(size + 22)

const BACKINGS = {
  glassine: { stock: "slip", tint: "color-mix(in srgb, var(--ll-sky) 13%, var(--ll-paper))" },
  kraft: { stock: "kraft", tint: undefined },
  paper: { stock: "paper", tint: undefined },
} as const satisfies Record<string, { stock: PaperProps["stock"]; tint: string | undefined }>

type StickerSheetProps = Omit<PaperProps, "ref" | "children" | "stock" | "onChange" | "size"> & {
  ref?: React.Ref<HTMLElement>
  stickers?: readonly string[]
  children?: React.ReactNode
  columns?: number
  size?: number
  title?: string
  backing?: keyof typeof BACKINGS
  peeled?: readonly string[]
  defaultPeeled?: readonly string[]
  onPeeledChange?: (peeled: string[]) => void
  onPeel?: (item: StickerSheetPeel) => void
  onStick?: (item: StickerSheetPeel) => void
  restorable?: boolean
  disabled?: boolean
  label?: string
}

function StickerSheet({
  className,
  children,
  ref,
  stickers,
  columns = 4,
  size = 72,
  title,
  backing = "glassine",
  peeled: peeledProp,
  defaultPeeled = [],
  onPeeledChange,
  onPeel,
  onStick,
  restorable = true,
  disabled = false,
  label = "Sticker sheet",
  tilt = true,
  seed: seedProp,
  style,
  ...props
}: StickerSheetProps) {
  const seed = useInkSeed(seedProp)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const titleId = React.useId()
  const [inner, setInner] = React.useState<readonly string[]>(defaultPeeled)
  const controlled = peeledProp !== undefined
  const peeled = controlled ? peeledProp : inner
  const [status, setStatus] = React.useState("")
  const latest = React.useRef(peeled)
  latest.current = peeled

  const change = React.useCallback(
    (next: string[]) => {
      latest.current = next
      if (!controlled) setInner(next)
      onPeeledChange?.(next)
    },
    [controlled, onPeeledChange]
  )
  const ctx = React.useMemo<StickerSheetContextValue>(
    () => ({
      peeled,
      size,
      restorable,
      disabled,
      uid,
      peel(item) {
        if (latest.current.includes(item.id)) return
        change([...latest.current, item.id])
        onPeel?.(item)
        setStatus(`${item.label} peeled off.`)
      },
      stick(item) {
        if (!latest.current.includes(item.id)) return
        change(latest.current.filter((id) => id !== item.id))
        onStick?.(item)
        setStatus(`${item.label} stuck back on.`)
      },
    }),
    [peeled, size, restorable, disabled, uid, change, onPeel, onStick]
  )

  const cell = cellOf(size)
  const B = BACKINGS[backing]
  const header = title ? 34 : 0
  const print = useInk({ recipe: stickerSheetRecipe, params: { top: header }, kind: "print", seed: `${seed}|print` })
  const items = React.Children.count(children) ? children : (stickers ?? []).map((n) => <StickerSheetItem key={n} name={n} />)
  const here = new Set<string>()
  let unknown = 0
  React.Children.toArray(items).forEach((child) => {
    const p = React.isValidElement(child) ? (child.props as { name?: unknown; id?: unknown }) : null
    if (p && typeof p.name === "string") {
      if (hasSticker(p.name)) here.add(typeof p.id === "string" ? p.id : p.name)
    } else unknown++
  })
  const left = here.size + unknown - [...here].filter((id) => peeled.includes(id)).length

  return (
    <StickerSheetContext.Provider value={ctx}>
      <Paper
        data-slot="sticker-sheet"
        data-backing={backing}
        data-disabled={disabled ? "" : undefined}
        role="group"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        ref={ref}
        stock={B.stock}
        tilt={tilt}
        seed={seed}
        className={cn("w-fit max-w-full p-4 pt-4 has-[[data-dragging]]:z-(--ll-z-raised)", disabled && "opacity-70", className)}
        style={{ ...(B.tint ? { "--ll-stock": B.tint } : null), ...style } as React.CSSProperties}
        {...props}
      >
        <div ref={print.hostRef} {...print.hostProps} data-slot="sticker-sheet-print" aria-hidden="true" className="pointer-events-none absolute inset-1.5 isolate">
          {print.node}
        </div>
        {backing === "glassine" ? (
          <span
            aria-hidden="true"
            data-slot="sticker-sheet-sheen"
            className="pointer-events-none absolute inset-0 [background:linear-gradient(112deg,transparent_30%,color-mix(in_srgb,var(--ll-photo)_42%,transparent)_43%,transparent_56%)] calm:hidden"
          />
        ) : null}
        {title ? (
          <div className="relative mb-2 flex h-6 items-baseline justify-between gap-3 px-1.5">
            <p id={titleId} className="truncate font-type text-sm text-pencil-text">
              {title}
            </p>
            <p className="shrink-0 font-type text-xs text-pencil-text ll-num">{Math.max(0, left)} left</p>
          </div>
        ) : null}
        <div data-slot="sticker-sheet-grid" className="relative grid justify-center gap-1 p-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, ${cell}px)` }}>
          {items}
        </div>
        <span role="status" className="sr-only">
          {status}
        </span>
      </Paper>
    </StickerSheetContext.Provider>
  )
}

type StickerSheetItemProps = Omit<React.ComponentProps<"button">, "name" | "id" | "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"> & {
  name: string
  id?: string
  label?: string
  size?: number
}

const DRAG_AT = 6
const DRAG_OFF = 18

function StickerSheetItem({ name, id: idProp, label: labelProp, size: sizeProp, className, onClick, disabled: disabledProp, ...props }: StickerSheetItemProps) {
  const sheet = useStickerSheet()
  useEnsureInkDefs()
  const id = idProp ?? name
  const px = sizeProp ?? sheet.size
  const cell = cellOf(px)
  const label = labelProp ?? stickerLabel(name)
  const peeled = sheet.peeled.includes(id)
  const prefix = `ll-ss${sheet.uid}${id}`.replace(/[^a-zA-Z0-9-]/g, "")
  const face = stickerFace(name, px, id, { idPrefix: prefix })
  const [warm, setWarm] = React.useState(false)
  const flap = warm ? stickerFace(name, px, id, { peel: true, idPrefix: `${prefix}p` }) : null
  const slot = useInk({ recipe: stickerSlotRecipe, params: {}, kind: "frame", seed: `${prefix}` })
  const drag = React.useRef<{ pointer: number; sx: number; sy: number; started: boolean } | null>(null)
  const held = React.useRef<HTMLSpanElement | null>(null)
  const slotEl = React.useRef<HTMLDivElement | null>(null)
  const suppress = React.useRef(false)
  const peeledNow = React.useRef(peeled)
  peeledNow.current = peeled
  const disabled = disabledProp || sheet.disabled
  const spent = peeled && !sheet.restorable
  const item = (dragged: boolean, e?: { clientX: number; clientY: number }): StickerSheetPeel => ({ id, name, label, dragged, x: e?.clientX, y: e?.clientY })

  const carry = (dx: number, dy: number) => {
    if (!held.current) return
    held.current.style.translate = `${dx}px ${dy}px`
    held.current.style.rotate = `${Math.max(-14, Math.min(14, dx * 0.06))}deg`
  }
  const putDown = () => {
    if (!held.current) return
    held.current.style.translate = ""
    held.current.style.rotate = ""
  }
  React.useEffect(() => {
    if (peeled) return
    slotEl.current?.removeAttribute("data-drop")
    putDown()
  }, [peeled])

  if (!face) return null
  const cx = face.box.x + face.box.w / 2
  const cy = face.box.y + face.box.h / 2
  const at = { left: cell / 2 - cx, top: cell / 2 - cy }
  const kiss = kissCut(face, `${prefix}k`)

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    setWarm(true)
    if (disabled || peeled || e.pointerType === "touch" || (e.button ?? 0) !== 0) return
    suppress.current = false
    drag.current = { pointer: e.pointerId, sx: e.clientX, sy: e.clientY, started: false }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
    }
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.started && Math.hypot(dx, dy) < DRAG_AT) return
    if (!d.started) {
      d.started = true
      slotEl.current?.setAttribute("data-dragging", "")
    }
    carry(dx, dy)
  }
  const up = (cancel: boolean) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    drag.current = null
    if (!d.started) return
    slotEl.current?.removeAttribute("data-dragging")
    suppress.current = !cancel
    setTimeout(() => (suppress.current = false), 0)
    const far = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_OFF
    if (cancel || !far) return putDown()
    slotEl.current?.setAttribute("data-drop", "")
    sheet.peel(item(true, e))
    setTimeout(() => {
      if (peeledNow.current) return
      slotEl.current?.removeAttribute("data-drop")
      putDown()
    }, 0)
  }

  return (
    <div ref={slotEl} data-slot="sticker-sheet-slot" data-state={peeled ? "peeled" : "stuck"} className="group/slot relative shrink-0" style={{ width: cell, height: cell }}>
      <svg
        data-ink="prop"
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${face.w} ${face.h}`}
        width={face.w}
        height={face.h}
        className="pointer-events-none absolute block overflow-visible"
        style={at}
        dangerouslySetInnerHTML={{ __html: kiss }}
      />
      <button
        type="button"
        data-slot="sticker-sheet-item"
        data-sticker={name}
        aria-label={peeled ? (sheet.restorable ? `Put ${label} sticker back` : `${label} sticker, peeled`) : `Peel ${label} sticker`}
        aria-disabled={spent ? true : undefined}
        disabled={disabled}
        ref={slot.hostRef}
        {...slot.hostProps}
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up(false)}
        onPointerCancel={up(true)}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented || spent) return
          if (suppress.current) {
            suppress.current = false
            return
          }
          if (peeled) sheet.stick(item(false))
          else sheet.peel(item(false))
        }}
        className={cn(
          "absolute inset-0 touch-manipulation select-none not-focus-visible:outline-none",
          "enabled:cursor-grab enabled:active:cursor-grabbing disabled:cursor-default aria-disabled:cursor-default!",
          "group-data-[dragging]/slot:z-(--ll-z-raised)",
          className
        )}
        {...props}
      >
        {slot.node}
        <span
          data-slot="sticker-sheet-art"
          className={cn(
            "pointer-events-none absolute block transition-[translate,rotate,scale,opacity] duration-(--ll-dur-sheet) ease-(--ll-ease-settle)",
            "group-data-[state=peeled]/slot:translate-x-4 group-data-[state=peeled]/slot:-translate-y-6 group-data-[state=peeled]/slot:-rotate-12 group-data-[state=peeled]/slot:scale-110 group-data-[state=peeled]/slot:opacity-0",
            "group-data-[drop]/slot:translate-x-0! group-data-[drop]/slot:translate-y-0! group-data-[drop]/slot:rotate-0! group-data-[drop]/slot:scale-100! group-data-[drop]/slot:duration-(--ll-dur-fade)!"
          )}
          style={{ ...at, width: face.w, height: face.h }}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget || e.propertyName !== "opacity" || !peeled || !slotEl.current?.hasAttribute("data-drop")) return
            slotEl.current.removeAttribute("data-drop")
            putDown()
          }}
        >
          <span
            ref={held}
            className="relative block size-full transition-[scale,rotate] duration-(--ll-dur-hover) ease-(--ll-ease-settle) group-hover/slot:-rotate-2 group-hover/slot:scale-[1.04] group-data-[dragging]/slot:scale-110 group-data-[dragging]/slot:transition-none"
          >
            <svg
              data-ink="sticker"
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${face.w} ${face.h}`}
              width={face.w}
              height={face.h}
              className="ll-drop-sticker pointer-events-none absolute inset-0 block overflow-visible transition-opacity duration-(--ll-dur-fade) group-hover/slot:opacity-0 group-has-[:focus-visible]/slot:opacity-0 group-data-[dragging]/slot:opacity-0 group-data-[state=peeled]/slot:opacity-0"
              dangerouslySetInnerHTML={{ __html: face.svg }}
            />
            {flap ? (
              <svg
                data-ink="sticker"
                aria-hidden="true"
                focusable="false"
                viewBox={`0 0 ${flap.w} ${flap.h}`}
                width={flap.w}
                height={flap.h}
                className="ll-drop-sticker pointer-events-none absolute inset-0 block overflow-visible opacity-0 transition-opacity duration-(--ll-dur-fade) group-hover/slot:opacity-100 group-has-[:focus-visible]/slot:opacity-100 group-data-[dragging]/slot:opacity-100 group-data-[state=peeled]/slot:opacity-100"
                dangerouslySetInnerHTML={{ __html: flap.svg }}
              />
            ) : null}
          </span>
        </span>
      </button>
    </div>
  )
}

export { StickerSheet, StickerSheetItem, useStickerSheet }
export type { StickerSheetProps, StickerSheetItemProps, StickerSheetPeel }
