// @ts-nocheck
"use client"

import * as React from "react"

import { useInk, useInkSeed, useMergedRef } from "../lib/ink/react"
import { ratingRecipe, type RatingIcon } from "../lib/ink/recipes/rating-ink"
import { cn } from "../lib/utils"

type RatingSize = "sm" | "default" | "lg"

interface RatingContextValue {
  max: number
  allowHalf: boolean
  icon: RatingIcon
  size: RatingSize
  shown: number
  current: number
  interactive: boolean
  disabled: boolean
  readOnly: boolean
  invalid: boolean
  tabStop: number
  seed: string
  getLabel: (value: number, max: number) => string
  select: (value: number) => void
  preview: (value: number | null) => void
}

const RatingContext = React.createContext<RatingContextValue | null>(null)

function useRatingContext(): RatingContextValue {
  const c = React.useContext(RatingContext)
  if (!c) throw new Error("RatingItem must be used within <Rating>")
  return c
}

const glyph: Record<RatingSize, string> = {
  sm: "size-5",
  default: "size-6",
  lg: "size-8",
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const noop = (): void => {}

function RatingItem({ index, className, ref, ...props }: Omit<React.ComponentProps<"span">, "children"> & { index: number }) {
  const c = useRatingContext()
  const state = c.shown >= index ? "checked" : c.allowHalf && c.shown >= index - 0.5 ? "indeterminate" : "unchecked"
  const { hostRef, hostProps, node } = useInk({ recipe: ratingRecipe, params: { icon: c.icon, disabled: c.disabled, invalid: c.invalid }, kind: "rating", seed: `${c.seed}:${index}`, still: true })
  const values = c.allowHalf ? [index - 0.5, index] : [index]
  return (
    <span
      data-slot="rating-item"
      data-state={state}
      data-value={index}
      data-ink-focus="within"
      ref={useMergedRef<HTMLSpanElement>(hostRef, ref)}
      {...hostProps}
      className={cn(
        "relative isolate inline-block shrink-0 transition-transform duration-(--ll-dur-pop) ease-pop",
        glyph[c.size],
        c.interactive && "hover:scale-110",
        "forced-colors:before:absolute forced-colors:before:inset-0 forced-colors:before:grid forced-colors:before:place-content-center forced-colors:before:leading-none forced-colors:before:content-['☆'] forced-colors:data-[state=checked]:before:content-['★'] forced-colors:data-[state=indeterminate]:before:content-['◐']",
        className
      )}
      {...props}
    >
      {node}
      {!c.readOnly
        ? values.map((v, i) => (
            <button
              key={v}
              type="button"
              role="radio"
              data-slot="rating-radio"
              data-value={v}
              aria-checked={c.current === v}
              aria-label={c.getLabel(v, c.max)}
              tabIndex={v === c.tabStop ? 0 : -1}
              disabled={c.disabled}
              onClick={() => c.select(v)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") c.preview(v)
              }}
              className={cn(
                "absolute -inset-y-0.5 cursor-pointer appearance-none bg-transparent outline-hidden disabled:cursor-not-allowed",
                values.length === 1 ? "-inset-x-0.5" : i === 0 ? "-start-0.5 w-[calc(50%+2px)]" : "-end-0.5 w-[calc(50%+2px)]"
              )}
            />
          ))
        : null}
    </span>
  )
}

function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  required,
  name,
  icon = "star",
  size = "default",
  clearable = false,
  getLabel = (v, m) => `${v} of ${m}`,
  seed: seedProp,
  className,
  children,
  onKeyDown,
  onPointerLeave,
  ref,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue" | "children"> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  max?: number
  allowHalf?: boolean
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  icon?: RatingIcon
  size?: RatingSize
  clearable?: boolean
  getLabel?: (value: number, max: number) => string
  seed?: string | number
  children?: React.ReactNode
}) {
  const step = allowHalf ? 0.5 : 1
  const snap = (v: number): number => clamp(Math.round(v / step) * step, 0, max)
  const [inner, setInner] = React.useState(() => snap(defaultValue))
  const [hover, setHover] = React.useState<number | null>(null)
  const controlled = value !== undefined
  const current = snap(controlled ? value : inner)
  const interactive = !readOnly && !disabled
  const shown = interactive && hover !== null ? hover : current
  const seed = useInkSeed(seedProp)
  const tabStop = current > 0 ? current : step
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const set = (v: number): void => {
    const next = snap(v)
    if (!controlled) setInner(next)
    if (next !== current) onValueChange?.(next)
  }

  const latest = React.useRef({ reset: () => {} })
  latest.current.reset = () => {
    const next = snap(defaultValue)
    if (!controlled) setInner(next)
    if (next !== current) onValueChange?.(next)
  }
  React.useEffect(() => {
    const form = inputRef.current?.form ?? rootRef.current?.closest("form")
    if (!form) return
    const reset = () => latest.current.reset()
    form.addEventListener("reset", reset)
    return () => form.removeEventListener("reset", reset)
  }, [name, required])

  const ctx: RatingContextValue = {
    max,
    allowHalf,
    icon,
    size,
    shown,
    current,
    interactive,
    disabled,
    readOnly,
    invalid,
    tabStop,
    seed,
    getLabel,
    select: (v) => {
      setHover(null)
      set(clearable && v === current ? 0 : v)
    },
    preview: setHover,
  }

  const items = children ?? Array.from({ length: max }, (_, i) => <RatingItem key={i} index={i + 1} />)

  return (
    <RatingContext.Provider value={ctx}>
      <div
        data-slot="rating"
        data-readonly={readOnly ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        role={readOnly ? "img" : "radiogroup"}
        aria-label={readOnly && !props["aria-label"] && !props["aria-labelledby"] ? `Rated ${current} out of ${max}` : props["aria-label"]}
        aria-required={!readOnly && required ? true : undefined}
        aria-disabled={disabled && !readOnly ? true : undefined}
        ref={useMergedRef<HTMLDivElement>(rootRef, ref)}
        className={cn("relative inline-flex items-center gap-1 align-middle", className)}
        onPointerLeave={(e) => {
          setHover(null)
          onPointerLeave?.(e)
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented || !interactive || !(e.target as HTMLElement).matches("[role=radio]")) return
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
          let next: number
          if (e.key === "ArrowRight") next = current + (rtl ? -step : step)
          else if (e.key === "ArrowLeft") next = current + (rtl ? step : -step)
          else if (e.key === "ArrowUp") next = current + step
          else if (e.key === "ArrowDown") next = current - step
          else if (e.key === "Home") next = step
          else if (e.key === "End") next = max
          else return
          e.preventDefault()
          next = clamp(next, step, max)
          set(next)
          e.currentTarget.querySelector<HTMLElement>(`[role=radio][data-value="${next}"]`)?.focus()
        }}
        {...props}
      >
        {items}
        {required && !readOnly ? (
          <input
            ref={inputRef}
            type="text"
            name={name}
            value={current > 0 ? current : ""}
            required
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            onChange={noop}
            className="pointer-events-none absolute inset-0 size-full opacity-0"
          />
        ) : name ? (
          <input ref={inputRef} type="hidden" name={name} value={current} disabled={disabled} />
        ) : null}
      </div>
    </RatingContext.Provider>
  )
}

export { Rating, RatingItem }
