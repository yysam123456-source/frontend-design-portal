// @ts-nocheck
"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
  type ChevronProps,
  type DayButtonProps,
  type DayProps,
  type DropdownProps,
  type MonthGridProps,
  type MonthProps,
  type NextMonthButtonProps,
  type PreviousMonthButtonProps,
  type RootProps,
} from "react-day-picker"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { Paper, type PaperProps } from ".//paper"
import { useInk, useInkContext } from "../lib/ink/react"
import { calendarCss, calendarDropdownRecipe, calendarGridRecipe, RING_HANDS } from "../lib/ink/recipes/calendar-ink"
import { cn } from "../lib/utils"

type SheetProps = Pick<PaperProps, "stock" | "edge" | "tilt" | "tape" | "tapeKind" | "fastener" | "fastenerTone" | "fastenerClassName" | "shadow" | "seed">

interface CalendarSetup {
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  ruled: boolean
  sheet: SheetProps | false
  seed?: string | number
  weekNumbers: boolean
}

const CalendarContext = React.createContext<CalendarSetup>({ buttonVariant: "ghost", ruled: true, sheet: false, weekNumbers: false })
const MonthContext = React.createContext({ rows: 6, index: 0 })

function CalendarRoot({ className, rootRef, ...props }: RootProps) {
  const { sheet } = React.useContext(CalendarContext)
  const clipSlot = sheet && sheet.fastener === "clip" ? "right-[3.125rem] rtl:right-auto rtl:left-[3.125rem]" : undefined
  if (sheet) return <Paper data-slot="calendar" ref={rootRef as React.Ref<HTMLElement>} rules="none" {...sheet} fastenerClassName={cn(clipSlot, sheet.fastenerClassName)} className={className} {...props} />
  return <div data-slot="calendar" ref={rootRef} className={className} {...props} />
}

function CalendarMonth({ calendarMonth, displayIndex, ...props }: MonthProps) {
  const value = React.useMemo(() => ({ rows: calendarMonth.weeks.length, index: displayIndex }), [calendarMonth.weeks.length, displayIndex])
  return (
    <MonthContext.Provider value={value}>
      <div {...props} />
    </MonthContext.Provider>
  )
}

function CalendarMonthGrid({ className, children, ...props }: MonthGridProps) {
  const { ruled, seed, weekNumbers } = React.useContext(CalendarContext)
  const { rows, index } = React.useContext(MonthContext)
  const { hostRef, hostProps, node } = useInk({
    recipe: calendarGridRecipe,
    params: { rows, weekNumbers },
    kind: "calendar",
    seed: seed === undefined ? undefined : `${seed}|${index}`,
    still: true,
  })
  return (
    <div data-slot="calendar-grid" ref={ruled ? hostRef : undefined} {...(ruled ? hostProps : {})} className="relative isolate w-fit [grid-area:grid]">
      {ruled ? node : null}
      <table className={className} {...props}>
        {children}
      </table>
    </div>
  )
}

function CalendarDay({ day, modifiers, ...props }: DayProps) {
  const range =
    modifiers.range_start && modifiers.range_end ? "single" : modifiers.range_start ? "start" : modifiers.range_end ? "end" : modifiers.range_middle ? "mid" : undefined
  return <td data-range={range} {...props} />
}

function CalendarDayButton({ className, day, modifiers, children, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const ranged = modifiers.range_start || modifiers.range_end || modifiers.range_middle
  return (
    <button
      ref={ref}
      data-slot="calendar-day"
      data-day={day.isoDate}
      data-v={day.date.getDate() % RING_HANDS}
      data-selected-single={modifiers.selected && !ranged ? "true" : undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={modifiers.range_middle || undefined}
      aria-current={modifiers.today ? "date" : undefined}
      className={cn(
        "grid aspect-square w-[calc(100%-6px)] place-items-center m-[3px] cursor-default p-0 font-script text-[1.3rem] leading-none font-semibold text-inherit outline-hidden select-none compact:text-[1.2rem] calm:text-[1.05rem]",
        "data-[selected-single=true]:font-bold data-[range-start=true]:font-bold data-[range-end=true]:font-bold",
        "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
      {modifiers.today && <span data-part="today" aria-hidden="true" />}
    </button>
  )
}

function CalendarNavButton({ className, children, ...props }: PreviousMonthButtonProps | NextMonthButtonProps) {
  const { buttonVariant } = React.useContext(CalendarContext)
  const disabled = props["aria-disabled"] === true || props["aria-disabled"] === "true"
  return (
    <Button asChild variant={buttonVariant} size="icon-sm" disabled={disabled} className="select-none">
      <button className={className} {...props}>
        {children}
      </button>
    </Button>
  )
}

function CalendarChevron({ orientation = "left", className }: ChevronProps) {
  const name = orientation === "up" ? "chevron-up" : orientation === "down" ? "chevron-down" : orientation === "right" ? "chevron-right" : "chevron-left"
  return <Icon name={name} size={orientation === "down" ? 14 : 16} className={className} />
}

function CalendarDropdown({ options, className, ...selectProps }: DropdownProps) {
  const { classNames } = useDayPicker()
  const { seed } = React.useContext(CalendarContext)
  const { hostRef, hostProps, node } = useInk({
    recipe: calendarDropdownRecipe,
    params: { disabled: !!selectProps.disabled },
    kind: "field",
    seed: seed === undefined ? undefined : `${seed}|${selectProps["aria-label"] ?? "dropdown"}`,
    still: true,
  })
  return (
    <span
      data-slot="calendar-dropdown"
      data-disabled={selectProps.disabled || undefined}
      ref={hostRef}
      {...hostProps}
      className={cn("group/dropdown relative isolate inline-flex h-8 items-center text-ink calm:h-7", classNames.dropdown_root)}
    >
      {node}
      <select
        className={cn(
          "h-full cursor-pointer appearance-none bg-transparent ps-2.5 pe-7 font-script text-[1.15rem] font-semibold text-inherit outline-none disabled:cursor-not-allowed disabled:text-pencil-text",
          classNames.dropdown,
          className
        )}
        {...selectProps}
      >
        {options?.map(({ value, label, disabled }) => (
          <option key={value} value={value} disabled={disabled}>
            {label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={14} className="pointer-events-none absolute end-1.5 text-ink-soft group-has-disabled/dropdown:text-pencil-text" />
    </span>
  )
}

const components = {
  Root: CalendarRoot,
  Month: CalendarMonth,
  MonthGrid: CalendarMonthGrid,
  Day: CalendarDay,
  DayButton: CalendarDayButton,
  PreviousMonthButton: CalendarNavButton,
  NextMonthButton: CalendarNavButton,
  Chevron: CalendarChevron,
  Dropdown: CalendarDropdown,
}

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  ruled?: boolean
  sheet?: boolean | SheetProps
  seed?: string | number
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components: userComponents,
  ruled = true,
  sheet = false,
  seed,
  dir: dirProp,
  ...props
}: CalendarProps) {
  const d = getDefaultClassNames()
  const ink = useInkContext()
  const setup = React.useMemo<CalendarSetup>(
    () => ({ buttonVariant, ruled, seed, weekNumbers: !!props.showWeekNumber, sheet: sheet === false ? false : sheet === true ? { stock: "card" } : sheet }),
    [buttonVariant, ruled, seed, props.showWeekNumber, sheet]
  )
  const merged = React.useMemo(() => (userComponents ? { ...components, ...userComponents } : components), [userComponents])
  return (
    <>
      <style href="ll-calendar" precedence="low">
        {calendarCss()}
      </style>
      <CalendarContext.Provider value={setup}>
        <DayPicker
          showOutsideDays={showOutsideDays}
          captionLayout={captionLayout}
          navLayout="around"
          dir={dirProp ?? (ink.hasProvider ? ink.dir : undefined)}
          className={cn(
            "group/calendar p-3 [--cell:2.5rem] [--wn:2rem] compact:[--cell:2.125rem] calm:[--cell:1.875rem] calm:p-2 [[data-slot=card-content]_&]:p-0 [[data-slot=popover-content]_&]:bg-transparent",
            className
          )}
          formatters={{
            formatMonthDropdown: (date, dateLib) => (dateLib ? dateLib.format(date, "LLL") : date.toLocaleString("en", { month: "short" })),
            ...formatters,
          }}
          classNames={{
            root: cn("w-fit", d.root),
            months: cn("relative flex flex-wrap justify-center gap-5", d.months),
            month: cn("grid w-fit grid-cols-[var(--cell)_minmax(0,1fr)_var(--cell)] [grid-template-areas:'prev_cap_next'_'grid_grid_grid']", d.month),
            nav: cn("absolute inset-x-0 top-0 z-(--ll-z-raised) flex h-(--cell) w-full items-center justify-between", d.nav),
            button_previous: cn("place-self-center select-none [grid-area:prev] aria-disabled:opacity-40", d.button_previous),
            button_next: cn("place-self-center select-none [grid-area:next] aria-disabled:opacity-40", d.button_next),
            month_caption: cn("flex min-h-(--cell) w-full items-center justify-center [container-type:inline-size] [grid-area:cap]", d.month_caption),
            dropdowns: cn("flex h-(--cell) w-full items-center justify-center gap-2.5", d.dropdowns),
            caption_label: cn("font-script text-[min(1.65rem,13cqi)] leading-none font-semibold whitespace-nowrap text-ink select-none calm:text-[min(1.4rem,13cqi)]", d.caption_label),
            month_grid: cn("table-fixed border-collapse [border-spacing:0]", d.month_grid),
            weekdays: cn(d.weekdays),
            weekday: cn(
              "h-7 w-(--cell) p-0 text-center align-middle font-type text-[0.78rem] leading-none font-normal text-pencil-text select-none",
              d.weekday
            ),
            week: cn(d.week),
            week_number_header: cn("w-(--wn) p-0", d.week_number_header),
            week_number: cn("w-(--wn) p-0 pe-2 text-end align-middle font-type text-xs font-normal text-pencil-text select-none", d.week_number),
            day: cn(
              "group/day w-(--cell) p-0 text-center align-middle text-ink data-outside:text-pencil-text data-outside:[&>button]:font-normal data-disabled:text-pencil-text",
              d.day
            ),
            hidden: cn("invisible", d.hidden),
            footer: cn("mt-2 text-center font-hand text-sm text-ink-muted", d.footer),
            ...classNames,
          }}
          components={merged}
          {...props}
        />
      </CalendarContext.Provider>
    </>
  )
}

export { Calendar, CalendarDayButton }
export type { CalendarProps }
