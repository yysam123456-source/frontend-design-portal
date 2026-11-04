// @ts-nocheck
"use client"

import * as React from "react"
import { format as formatDate, isSameDay, isValid, parse as parseWith, startOfDay } from "date-fns"
import type { Locale } from "date-fns"
import { dateMatchModifiers, type DateRange, type Matcher } from "react-day-picker"

import { Button } from ".//button"
import { Calendar, type CalendarProps } from ".//calendar"
import { Icon } from ".//icon"
import { InputControl } from ".//input"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from ".//popover"
import { useFormReset } from "../hooks/use-form-reset"
import { useInk, useMergedRef } from "../lib/ink/react"
import { datePickerRecipe } from "../lib/ink/recipes/date-picker-ink"
import { cn } from "../lib/utils"

const FALLBACK_FORMATS = [
  "P",
  "PP",
  "PPP",
  "yyyy-MM-dd",
  "yyyy/M/d",
  "M/d/yyyy",
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "MMM d yyyy",
  "MMMM d yyyy",
  "d MMM yyyy",
  "d MMMM yyyy",
  "d.M.yyyy",
  "M/d/yy",
  "d.M.yy",
]

const TWO_DIGIT_YEAR_PIVOT = new Date(2000, 0, 1)

const isDate = (d: Date | undefined): d is Date => !!d && isValid(d)

function parseDateInput(text: string, o: { format?: string; locale?: Locale; reference?: Date } = {}): Date | undefined {
  const s = text.trim()
  if (!s) return undefined
  const reference = o.reference ?? TWO_DIGIT_YEAR_PIVOT
  const word = s.toLowerCase()
  if (o.reference) {
    if (word === "today") return startOfDay(reference)
    if (word === "tomorrow") return startOfDay(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1))
    if (word === "yesterday") return startOfDay(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 1))
  }
  for (const f of [o.format, ...FALLBACK_FORMATS]) {
    if (!f) continue
    const d = parseWith(s, f, reference, { locale: o.locale })
    if (isValid(d) && d.getFullYear() >= 1000 && d.getFullYear() <= 9999) return startOfDay(d)
  }
  return undefined
}

const toIsoDate = (d: Date): string => (isValid(d) ? formatDate(d, "yyyy-MM-dd") : "")

const RANGE_SEPARATOR = /\s+(?:–|—|-|to)\s+|\s*[–—]\s*/

function useControllable<T>(props: object, key: string, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void, () => void] {
  const controlled = key in props
  const [inner, setInner] = React.useState<T>(defaultValue)
  const value = controlled ? (props as Record<string, T>)[key] : inner
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange]
  )
  const reset = () => {
    if (!controlled) setInner(defaultValue)
  }
  return [value, set, reset]
}

type CalendarPass = Partial<
  Pick<
    CalendarProps,
    | "captionLayout"
    | "showWeekNumber"
    | "weekStartsOn"
    | "numberOfMonths"
    | "startMonth"
    | "endMonth"
    | "fixedWeeks"
    | "showOutsideDays"
    | "dir"
    | "footer"
    | "today"
    | "defaultMonth"
    | "month"
    | "onMonthChange"
    | "modifiers"
    | "components"
    | "classNames"
    | "timeZone"
    | "numerals"
    | "sheet"
    | "ruled"
    | "buttonVariant"
  >
>

interface PickerBaseProps {
  id?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  required?: boolean
  typeable?: boolean
  format?: string
  locale?: Locale
  min?: Date
  max?: Date
  disabledDates?: Matcher | Matcher[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  calendarLabel?: string
  invalidMessage?: string
  calendarProps?: CalendarPass
  contentProps?: Partial<React.ComponentProps<typeof PopoverContent>>
  seed?: string | number
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

interface DatePreset {
  label: string
  value: Date | (() => Date)
}

interface DateRangePreset {
  label: string
  value: DateRange | (() => DateRange)
}

function DatePickerPresets<P extends { label: string }>({
  presets,
  onPick,
  label = "Presets",
  className,
}: {
  presets: readonly P[]
  onPick: (preset: P) => void
  label?: string
  className?: string
}) {
  return (
    <div
      data-slot="date-picker-presets"
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-1 border-b border-pencil-mark/40 p-3 pb-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-e sm:border-b-0 sm:pb-3", className)}
    >
      {presets.map((p) => (
        <Button key={p.label} type="button" variant="ghost" size="sm" className="justify-start" onClick={() => onPick(p)}>
          {p.label}
        </Button>
      ))}
    </div>
  )
}

const FIELD =
  "relative isolate flex h-9 w-full min-w-0 items-center font-hand text-base text-(--ll-input-ink) caret-(--ll-caret) compact:h-8 calm:h-7 calm:text-[15px]"

interface ShellProps extends Omit<PickerBaseProps, "format" | "locale" | "min" | "max" | "disabledDates" | "calendarProps"> {
  text: string
  onCommitText: (typed: string) => boolean
  hidden?: React.ReactNode
  presets?: (close: () => void) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  fallbackPlaceholder: string
  wide?: boolean
  onFormReset: () => void
}

function PickerShell({
  id,
  placeholder,
  disabled,
  readOnly,
  invalid: invalidProp,
  required,
  typeable = true,
  open: openProp,
  defaultOpen,
  onOpenChange,
  calendarLabel = "Choose date",
  invalidMessage = "Enter a date we can read.",
  contentProps,
  seed,
  className,
  text,
  onCommitText,
  hidden,
  presets,
  children,
  fallbackPlaceholder,
  wide,
  onFormReset,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}: ShellProps) {
  const aria = { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, "aria-describedby": ariaDescribedby }
  const controlledOpen = openProp !== undefined
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false)
  const open = controlledOpen ? openProp : innerOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlledOpen) setInnerOpen(next)
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange]
  )
  const [draft, setDraft] = React.useState<{ text: string; base: string } | null>(null)
  const [bad, setBad] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const setReadable = (ok: boolean): void => inputRef.current?.setCustomValidity(ok ? "" : invalidMessage)
  const shown = draft && draft.base === text ? draft.text : text
  React.useEffect(() => {
    setBad(false)
    inputRef.current?.setCustomValidity("")
  }, [text])
  const invalid = !!invalidProp || bad
  const inert = !!disabled || !!readOnly

  const { hostRef, hostProps, node } = useInk({
    recipe: datePickerRecipe,
    params: { disabled: !!disabled, invalid: invalid && !disabled },
    kind: "field",
    seed,
    still: true,
  })
  const boxRef = React.useRef<HTMLElement | null>(null)
  const boxMerged = useMergedRef<HTMLElement>(hostRef, boxRef)
  useFormReset(
    () => boxRef.current,
    () => {
      setDraft(null)
      setBad(false)
      setReadable(true)
      onFormReset()
    }
  )

  const commitDraft = (): boolean => {
    if (!draft || draft.base !== text) return true
    if (draft.text === text) {
      setDraft(null)
      return true
    }
    const ok = onCommitText(draft.text)
    setBad(!ok)
    setReadable(ok)
    if (ok) setDraft(null)
    return ok
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!commitDraft()) e.preventDefault()
    } else if (e.key === "ArrowDown" && !inert) {
      e.preventDefault()
      setOpen(true)
    } else if (e.key === "Escape" && draft && !open) {
      e.preventDefault()
      setDraft(null)
      setBad(false)
      setReadable(true)
    }
  }
  const close = React.useCallback(() => setOpen(false), [setOpen])

  const field = cn(FIELD, wide && "max-w-none", className)
  const ph = placeholder ?? fallbackPlaceholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {typeable ? (
        <PopoverAnchor asChild>
          <div
            data-slot="date-picker"
            data-state={open ? "open" : "closed"}
            data-ink-focus="within"
            ref={boxMerged}
            {...hostProps}
            className={field}
          >
            {node}
            <InputControl
              ref={inputRef}
              id={id}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder={ph}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              aria-invalid={invalid || undefined}
              value={shown}
              onChange={(e) => {
                setBad(false)
                setReadable(true)
                setDraft({ text: e.target.value, base: text })
              }}
              onBlur={commitDraft}
              onKeyDown={handleKeyDown}
              className="pe-1 aria-invalid:pe-9"
              {...aria}
            />
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" disabled={inert} aria-label={calendarLabel} className="me-0.5 size-7 shrink-0 calm:size-6">
                <Icon name="calendar" size={16} />
              </Button>
            </PopoverTrigger>
            {hidden}
          </div>
        </PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            data-slot="date-picker"
            disabled={disabled || readOnly}
            aria-invalid={invalid || undefined}
            ref={boxMerged}
            {...hostProps}
            {...aria}
            className={cn(field, "cursor-default justify-between gap-2 ps-3 text-start whitespace-nowrap disabled:cursor-not-allowed disabled:text-pencil-text", !text && "text-(--ll-placeholder)")}
          >
            {node}
            <span className="min-w-0 flex-1 truncate">{text || ph}</span>
            <span aria-hidden="true" className="grid h-full w-8 shrink-0 place-items-center text-ink-soft">
              <Icon name="calendar" size={16} />
            </span>
            {hidden}
          </button>
        </PopoverTrigger>
      )}
      <PopoverContent aria-label={calendarLabel} align="start" tilt={false} collisionPadding={8} {...contentProps} className={cn("w-auto max-w-[calc(100vw-1rem)] p-0", contentProps?.className)}>
        <div className="flex flex-col sm:flex-row">
          {presets?.(close)}
          {children(close)}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const toMatchers = (min?: Date, max?: Date, more?: Matcher | Matcher[]): Matcher[] => {
  const out: Matcher[] = []
  if (min) out.push({ before: min })
  if (max) out.push({ after: max })
  if (more !== undefined) out.push(...(Array.isArray(more) ? (more as Matcher[]) : [more]))
  return out
}

interface DatePickerProps extends PickerBaseProps {
  value?: Date | undefined
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
  name?: string
  presets?: readonly DatePreset[]
  closeOnSelect?: boolean
}

function DatePicker(props: DatePickerProps) {
  const { value: _v, defaultValue, onValueChange, name, presets, closeOnSelect = true, format = "PP", locale, min, max, disabledDates, calendarProps, ...rest } = props
  void _v
  const [given, setDate, resetDate] = useControllable<Date | undefined>(props, "value", defaultValue, onValueChange)
  const date = isDate(given) ? given : undefined
  const matchers = React.useMemo(() => toMatchers(min, max, disabledDates), [min, max, disabledDates])
  const text = date ? formatDate(date, format, { locale }) : ""

  const handleCommit = (typed: string): boolean => {
    if (!typed.trim()) {
      setDate(undefined)
      return true
    }
    const d = parseDateInput(typed, { format, locale, reference: new Date() })
    if (!d || (matchers.length > 0 && dateMatchModifiers(d, matchers))) return false
    if (!date || !isSameDay(d, date)) setDate(d)
    return true
  }

  return (
    <PickerShell
      {...rest}
      text={text}
      onCommitText={handleCommit}
      onFormReset={resetDate}
      fallbackPlaceholder="Pick a date"
      hidden={name ? <input type="hidden" name={name} value={date ? toIsoDate(date) : ""} /> : null}
      presets={
        presets?.length
          ? (close) => (
              <DatePickerPresets
                presets={presets}
                onPick={(p) => {
                  setDate(typeof p.value === "function" ? p.value() : p.value)
                  if (closeOnSelect) close()
                }}
              />
            )
          : undefined
      }
    >
      {(close) => (
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d, triggerDate) => {
            if (!d && date && props.typeable !== false && isSameDay(triggerDate, date)) {
              if (closeOnSelect) close()
              return
            }
            setDate(d)
            if (closeOnSelect && d) close()
          }}
          defaultMonth={date}
          disabled={matchers.length ? matchers : undefined}
          locale={locale}
          autoFocus
          {...calendarProps}
        />
      )}
    </PickerShell>
  )
}

interface DateRangePickerProps extends PickerBaseProps {
  value?: DateRange | undefined
  defaultValue?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  name?: string
  nameTo?: string
  presets?: readonly DateRangePreset[]
  closeOnSelect?: boolean
}

function DateRangePicker(props: DateRangePickerProps) {
  const { value: _v, defaultValue, onValueChange, name, nameTo, presets, closeOnSelect = true, format = "PP", locale, min, max, disabledDates, calendarProps, ...rest } = props
  void _v
  const [given, setRange, resetRange] = useControllable<DateRange | undefined>(props, "value", defaultValue, onValueChange)
  const range = isDate(given?.from) ? { from: given.from, to: isDate(given.to) ? given.to : undefined } : undefined
  const matchers = React.useMemo(() => toMatchers(min, max, disabledDates), [min, max, disabledDates])
  const fmt = (d: Date) => formatDate(d, format, { locale })
  const text = range?.from ? (range.to ? `${fmt(range.from)} – ${fmt(range.to)}` : `${fmt(range.from)} –`) : ""

  const handleCommit = (typed: string): boolean => {
    if (!typed.trim()) {
      setRange(undefined)
      return true
    }
    const reference = new Date()
    const parts = typed
      .trim()
      .split(RANGE_SEPARATOR)
      .filter((p) => p.trim() !== "")
    if (parts.length < 1 || parts.length > 2) return false
    const dates = parts.map((p) => parseDateInput(p, { format, locale, reference }))
    if (dates.some((d) => !d)) return false
    const [a, b] = dates as [Date, Date | undefined]
    const from = b && b < a ? b : a
    const to = b ? (b < a ? a : b) : undefined
    if (matchers.length > 0 && [from, to].some((d) => d && dateMatchModifiers(d, matchers))) return false
    setRange({ from, to })
    return true
  }

  return (
    <PickerShell
      {...rest}
      text={text}
      onCommitText={handleCommit}
      onFormReset={resetRange}
      fallbackPlaceholder="Pick a date range"
      wide
      calendarLabel={rest.calendarLabel ?? "Choose dates"}
      hidden={
        name || nameTo ? (
          <>
            {name ? <input type="hidden" name={name} value={range?.from ? toIsoDate(range.from) : ""} /> : null}
            {nameTo ? <input type="hidden" name={nameTo} value={range?.to ? toIsoDate(range.to) : ""} /> : null}
          </>
        ) : null
      }
      presets={
        presets?.length
          ? (close) => (
              <DatePickerPresets
                presets={presets}
                onPick={(p) => {
                  const next = typeof p.value === "function" ? p.value() : p.value
                  setRange(next)
                  if (closeOnSelect && next?.from && next?.to) close()
                }}
              />
            )
          : undefined
      }
    >
      {(close) => (
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={(r) => {
            setRange(r)
            if (closeOnSelect && r?.from && r.to && !isSameDay(r.from, r.to)) close()
          }}
          defaultMonth={range?.from}
          disabled={matchers.length ? matchers : undefined}
          locale={locale}
          autoFocus
          {...calendarProps}
        />
      )}
    </PickerShell>
  )
}

export { DatePicker, DateRangePicker, DatePickerPresets, parseDateInput, toIsoDate }
export type { DatePickerProps, DateRangePickerProps, DatePreset, DateRangePreset }
