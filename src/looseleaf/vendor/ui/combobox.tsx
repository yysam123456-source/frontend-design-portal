// @ts-nocheck
"use client"

import * as React from "react"
import { Command as CommandPrimitive, defaultFilter, useCommandState } from "cmdk"

import { Button } from ".//button"
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading, CommandSeparator, useFreshActiveDescendant } from ".//command"
import { Icon } from ".//icon"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from ".//popover"
import { useFormReset } from "../hooks/use-form-reset"
import { useInk, useMergedRef } from "../lib/ink/react"
import { chipToneList, comboboxChipRecipe, comboboxChipsRecipe, comboboxTriggerRecipe, type ChipTone } from "../lib/ink/recipes/combobox-ink"
import { cn } from "../lib/utils"

type ComboboxItemData = string | { value: string; label?: string; disabled?: boolean; keywords?: string[] }
interface NormalItem {
  value: string
  label: string
  disabled?: boolean
  keywords?: string[]
}

const normalize = (items: readonly ComboboxItemData[] | undefined): NormalItem[] =>
  (items ?? []).map((i) => (typeof i === "string" ? { value: i, label: i } : { value: i.value, label: i.label ?? i.value, disabled: i.disabled, keywords: i.keywords }))

type FieldMode = null | "single" | "chips"

interface ComboboxContextValue {
  multiple: boolean
  value: string[]
  select: (value: string) => void
  remove: (value: string) => void
  clear: () => void
  open: boolean
  setOpen: (open: boolean) => void
  query: string
  setQuery: (q: string) => void
  dirty: boolean
  setDirty: (d: boolean) => void
  items: NormalItem[]
  labelFor: (value: string) => string
  register: (value: string, label: string) => void
  hasItem: (text: string) => boolean
  loading: boolean
  disabled: boolean
  readOnly: boolean
  invalid: boolean
  required: boolean
  label?: string
  fieldMode: FieldMode
  setFieldMode: (m: FieldMode) => void
  anchorRef: React.RefObject<HTMLElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
const InContentContext = React.createContext(false)

function useCombobox(): ComboboxContextValue {
  const ctx = React.useContext(ComboboxContext)
  if (!ctx) throw new Error("Combobox parts must be used inside <Combobox>")
  return ctx
}

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

interface ComboboxBaseProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  items?: readonly ComboboxItemData[]
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  filter?: React.ComponentProps<typeof CommandPrimitive>["filter"]
  shouldFilter?: boolean
  loop?: boolean
  loading?: boolean
  name?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  label?: string
  announce?: false | ((change: { added: string[]; removed: string[] }) => string)
  children?: React.ReactNode
}
type ComboboxSingleProps = { multiple?: false; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string | null) => void }
type ComboboxMultiProps = { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void }
type ComboboxProps = ComboboxBaseProps & (ComboboxSingleProps | ComboboxMultiProps)

function Combobox(props: ComboboxProps) {
  const { multiple = false, items: itemsProp, name, disabled = false, readOnly = false, required = false, invalid = false, loading = false, label, announce, filter, shouldFilter, loop, children, open: openProp, defaultOpen, onOpenChange } = props
  const [raw, setRaw, resetRaw] = useControllable<string | string[] | null | undefined>(
    props,
    "value",
    (props.defaultValue as string | string[] | null | undefined) ?? (multiple ? [] : null),
    props.onValueChange as ((v: string | string[] | null | undefined) => void) | undefined
  )
  const value = React.useMemo<string[]>(() => (multiple ? ((raw as string[] | undefined) ?? []) : raw ? [raw as string] : []), [multiple, raw])

  const controlledOpen = openProp !== undefined
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false)
  const open = controlledOpen ? openProp : innerOpen
  const [query, setQuery, resetQuery] = useControllable<string>(props, "inputValue", props.defaultInputValue ?? "", props.onInputValueChange)
  const [dirty, setDirty] = React.useState(false)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (next && readOnly) return
      if (!controlledOpen) setInnerOpen(next)
      onOpenChange?.(next)
      if (!next) {
        setQuery("")
        setDirty(false)
      }
    },
    [controlledOpen, onOpenChange, setQuery, readOnly]
  )

  const items = React.useMemo(() => normalize(itemsProp), [itemsProp])
  const itemMap = React.useMemo(() => new Map(items.map((i) => [i.value, i])), [items])
  const seen = React.useRef(new Map<string, string>())
  const [, bump] = React.useState(0)
  const register = React.useCallback((v: string, l: string) => {
    if (seen.current.get(v) === l) return
    seen.current.set(v, l)
    bump((n) => n + 1)
  }, [])
  const labelFor = React.useCallback((v: string) => itemMap.get(v)?.label ?? seen.current.get(v) ?? v, [itemMap])
  const hasItem = React.useCallback(
    (text: string) => {
      const t = text.trim().toLowerCase()
      if (!t) return false
      for (const i of items) if (i.value.toLowerCase() === t || i.label.toLowerCase() === t) return true
      for (const [v, l] of seen.current) if (v.toLowerCase() === t || l.toLowerCase() === t) return true
      return false
    },
    [items]
  )

  const select = React.useCallback(
    (v: string) => {
      if (readOnly) return
      if (multiple) {
        setRaw(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
        setQuery("")
        setDirty(false)
      } else {
        setRaw(v)
        setOpen(false)
      }
    },
    [multiple, setRaw, setOpen, setQuery, value, readOnly]
  )
  const remove = React.useCallback((v: string) => (readOnly ? undefined : setRaw(multiple ? value.filter((x) => x !== v) : null)), [multiple, setRaw, value, readOnly])
  const clear = React.useCallback(() => {
    if (readOnly) return
    setRaw(multiple ? [] : null)
    setQuery("")
    setDirty(false)
  }, [multiple, setRaw, setQuery, readOnly])

  const [fieldMode, setFieldMode] = React.useState<FieldMode>(null)
  const anchorRef = React.useRef<HTMLElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const dirtyRef = React.useRef(dirty)
  dirtyRef.current = dirty
  useFormReset(
    () => inputRef.current ?? triggerRef.current ?? anchorRef.current,
    () => {
      resetRaw()
      resetQuery()
      setDirty(false)
    }
  )

  const previous = React.useRef(value)
  const [said, setSaid] = React.useState("")
  React.useEffect(() => {
    const before = previous.current
    previous.current = value
    if (!multiple || announce === false) return
    const added = value.filter((v) => !before.includes(v)).map(labelFor)
    const removed = before.filter((v) => !value.includes(v)).map(labelFor)
    if (added.length === 0 && removed.length === 0) return
    setSaid(announce ? announce({ added, removed }) : [added.length ? `${added.join(", ")} selected` : "", removed.length ? `${removed.join(", ")} removed` : ""].filter(Boolean).join(". "))
  }, [value, multiple, announce, labelFor])

  const ctx = React.useMemo<ComboboxContextValue>(
    () => ({ multiple, value, select, remove, clear, open, setOpen, query, setQuery, dirty, setDirty, items, labelFor, register, hasItem, loading, disabled, readOnly, invalid, required, label, fieldMode, setFieldMode, anchorRef, inputRef, triggerRef }),
    [multiple, value, select, remove, clear, open, setOpen, query, setQuery, dirty, items, labelFor, register, hasItem, loading, disabled, readOnly, invalid, required, label, fieldMode]
  )

  const cmdkFilter = React.useCallback<NonNullable<ComboboxBaseProps["filter"]>>(
    (v, search, keywords) => (fieldMode === "single" && !dirtyRef.current ? 1 : (filter ?? defaultFilter)(v, search, keywords)),
    [fieldMode, filter]
  )

  return (
    <ComboboxContext.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        <CommandPrimitive data-slot="combobox" className="contents" label={label} filter={cmdkFilter} shouldFilter={shouldFilter} loop={loop}>
          {children}
        </CommandPrimitive>
      </Popover>
      {name && value.length === 0 ? <input type="hidden" name={name} value="" /> : null}
      {name ? value.map((v) => <input key={v} type="hidden" name={name} value={v} />) : null}
      {required && !disabled && value.length === 0 ? (
        <input
          data-slot="combobox-required"
          tabIndex={-1}
          aria-hidden="true"
          required
          value=""
          onChange={() => {}}
          onFocus={() => (inputRef.current ?? triggerRef.current)?.focus()}
          className="pointer-events-none absolute size-px overflow-hidden opacity-0"
        />
      ) : null}
      {multiple && announce !== false ? (
        <span data-slot="combobox-status" role="status" aria-live="polite" className="sr-only">
          {said}
        </span>
      ) : null}
    </ComboboxContext.Provider>
  )
}

const TRIGGER =
  "group/combobox-trigger relative isolate flex h-9 w-full items-center justify-between gap-2 ps-3 pe-2 text-start font-hand text-base whitespace-nowrap text-(--ll-input-ink) compact:h-8 calm:h-7 calm:text-[15px] disabled:cursor-not-allowed disabled:text-pencil-text forced-colors:aria-invalid:underline forced-colors:aria-invalid:decoration-wavy [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not(.absolute):not([class*='size-'])]:size-4"

function ComboboxTrigger({ className, children, seed, ref, onKeyDown, disabled: disabledProp, ...props }: React.ComponentProps<"button"> & { seed?: string | number }) {
  const ctx = useCombobox()
  const disabled = ctx.disabled || !!disabledProp
  const invalid = ctx.invalid || props["aria-invalid"] === true || props["aria-invalid"] === "true"
  const { hostRef, hostProps, node } = useInk({ recipe: comboboxTriggerRecipe, params: { disabled, invalid: invalid && !disabled }, kind: "field", seed, still: true })
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        role="combobox"
        aria-expanded={ctx.open}
        aria-required={ctx.required || undefined}
        aria-readonly={ctx.readOnly || undefined}
        aria-invalid={invalid || undefined}
        data-slot="combobox-trigger"
        disabled={disabled}
        ref={useMergedRef<HTMLButtonElement>(hostRef, ref, ctx.triggerRef as React.Ref<HTMLButtonElement>)}
        {...hostProps}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (!e.defaultPrevented && !disabled && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            ctx.setOpen(true)
          }
          e.stopPropagation()
        }}
        className={cn(TRIGGER, className)}
        {...props}
      >
        {node}
        {children ?? <ComboboxValue />}
        <Icon name="chevrons-up-down" size={16} data-slot="combobox-trigger-icon" className="text-ink-soft group-disabled/combobox-trigger:text-pencil-text" />
      </button>
    </PopoverTrigger>
  )
}

function ComboboxValue({
  placeholder,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  placeholder?: React.ReactNode
  children?: (value: string | string[] | null, labelFor: (value: string) => string) => React.ReactNode
}) {
  const ctx = useCombobox()
  if (children) return <>{children(ctx.multiple ? ctx.value : (ctx.value[0] ?? null), ctx.labelFor)}</>
  const text = ctx.value.map(ctx.labelFor).join(", ")
  return (
    <span data-slot="combobox-value" data-placeholder={text ? undefined : ""} className={cn("min-w-0 flex-1 truncate", !text && "text-(--ll-placeholder)", className)} {...props}>
      {text || placeholder}
    </span>
  )
}

function ComboboxContent({
  className,
  align = "start",
  sideOffset = 6,
  anchor,
  children,
  onOpenAutoFocus,
  onInteractOutside,
  onFocusOutside,
  onMouseDown,
  ...props
}: React.ComponentProps<typeof PopoverContent> & { anchor?: React.RefObject<Element | null> }) {
  const ctx = useCombobox()
  const inField = ctx.fieldMode !== null
  const inAnchor = (target: EventTarget | null): boolean => !!ctx.anchorRef.current && target instanceof Node && ctx.anchorRef.current.contains(target)
  return (
    <>
      {anchor ? <PopoverAnchor virtualRef={anchor as React.RefObject<{ getBoundingClientRect(): DOMRect }>} /> : null}
      <PopoverContent
        aria-label={ctx.label ?? "Options"}
        align={align}
        sideOffset={sideOffset}
        tilt={false}
        onOpenAutoFocus={(e) => {
          if (inField) e.preventDefault()
          onOpenAutoFocus?.(e)
        }}
        onInteractOutside={(e) => {
          onInteractOutside?.(e)
          if (inField && inAnchor(e.target)) e.preventDefault()
        }}
        onFocusOutside={(e) => {
          onFocusOutside?.(e)
          if (inField && inAnchor(e.target)) e.preventDefault()
        }}
        onMouseDown={(e) => {
          onMouseDown?.(e)
          if (!e.defaultPrevented && !(e.target instanceof HTMLInputElement)) e.preventDefault()
        }}
        className={cn("w-(--radix-popover-trigger-width) max-w-[calc(100vw-1rem)] min-w-52 p-0", className)}
        {...props}
      >
        <div data-slot="combobox-content" className="flex flex-col">
          <InContentContext.Provider value>{children}</InContentContext.Provider>
        </div>
      </PopoverContent>
    </>
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

function ComboboxList({ className, children, ...props }: Omit<React.ComponentProps<typeof CommandList>, "children"> & { children?: React.ReactNode | ((item: NormalItem) => React.ReactNode) }) {
  const ctx = useCombobox()
  return (
    <CommandList data-slot="combobox-list" label={ctx.label} className={cn("max-h-[min(20rem,var(--radix-popover-content-available-height))]", className)} {...props}>
      {typeof children === "function" ? ctx.items.map(children) : children}
    </CommandList>
  )
}

function ComboboxCollection({ items, children }: { items?: readonly ComboboxItemData[]; children?: React.ReactNode | ((item: NormalItem, index: number) => React.ReactNode) }) {
  const ctx = useCombobox()
  const list = React.useMemo(() => (items ? normalize(items) : ctx.items), [items, ctx.items])
  return <>{typeof children === "function" ? list.map(children) : children}</>
}

function ComboboxItem({
  className,
  value,
  label,
  children,
  keywords,
  onSelect,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "value" | "keywords"> & { value: string; label?: string; keywords?: string[] }) {
  const ctx = useCombobox()
  const text = label ?? (typeof children === "string" ? children : (ctx.items.find((i) => i.value === value)?.label ?? value))
  const { register } = ctx
  React.useEffect(() => register(value, text), [register, value, text])
  const chosen = ctx.value.includes(value)
  return (
    <CommandItem
      data-slot="combobox-item"
      data-checked={chosen ? "true" : undefined}
      value={value}
      keywords={[text, ...(keywords ?? [])]}
      onSelect={(v) => {
        onSelect?.(v)
        ctx.select(value)
      }}
      className={cn("pe-8", className)}
      {...props}
    >
      {children ?? text}
      {chosen && (
        <>
          <span className="sr-only">, selected</span>
          <span data-slot="combobox-item-indicator" aria-hidden="true" className="pointer-events-none absolute end-2 grid size-4 place-items-center">
            <Icon name="check" size={16} className="text-ink-you forced-colors:text-[CanvasText]" />
          </span>
        </>
      )}
    </CommandItem>
  )
}

function ComboboxGroup({ className, ...props }: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="combobox-group" className={className} {...props} />
}

function ComboboxLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="combobox-label" role="presentation" className={cn("px-2 py-1.5 font-type text-xs text-ink-muted", className)} {...props} />
}

function ComboboxSeparator({ className, ...props }: React.ComponentProps<typeof CommandSeparator>) {
  return <CommandSeparator data-slot="combobox-separator" className={className} {...props} />
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<typeof CommandEmpty>) {
  const ctx = useCombobox()
  if (ctx.loading) return null
  return <CommandEmpty data-slot="combobox-empty" className={className} {...props} />
}

function ComboboxLoading({ className, ...props }: React.ComponentProps<typeof CommandLoading>) {
  return <CommandLoading data-slot="combobox-loading" className={className} {...props} />
}

function ComboboxCreate({
  className,
  children,
  onCreate,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "children" | "value" | "onSelect"> & { onCreate?: (text: string) => void; children?: React.ReactNode | ((text: string) => React.ReactNode) }) {
  const ctx = useCombobox()
  const search = useCommandState((s) => s.search) as string
  const text = search.trim()
  if (!text || ctx.hasItem(text) || (ctx.fieldMode === "single" && !ctx.dirty)) return null
  return (
    <CommandItem
      forceMount
      data-slot="combobox-create"
      value={`__create__${text}`}
      onSelect={() => {
        onCreate?.(text)
        ctx.select(text)
      }}
      className={cn("text-ink-you", className)}
      {...props}
    >
      <Icon name="plus" />
      {typeof children === "function" ? children(text) : (children ?? `Create "${text}"`)}
    </CommandItem>
  )
}

const FIELD_INPUT =
  "h-full min-w-0 flex-1 bg-transparent px-3 py-1 font-hand text-base text-(--ll-input-ink) caret-(--ll-caret) outline-hidden placeholder:text-(--ll-placeholder) disabled:cursor-not-allowed disabled:text-pencil-text calm:text-[15px]"

function useExpandedAttr(input: React.RefObject<HTMLInputElement | null>, open: boolean) {
  React.useEffect(() => {
    input.current?.setAttribute("aria-expanded", String(open))
  }, [input, open])
}

function useCallerId(input: React.RefObject<HTMLInputElement | null>, id: string | undefined) {
  React.useEffect(() => {
    const el = input.current
    if (!id || !el || el.id === id) return
    const own = Array.from(el.ownerDocument.querySelectorAll("label[cmdk-label]")).find((l) => l.getAttribute("for") === el.id)
    own?.setAttribute("for", id)
    el.id = id
  }, [input, id])
}

function ComboboxInput({ className, showTrigger = true, showClear = false, ...props }: React.ComponentProps<typeof CommandInput> & { showTrigger?: boolean; showClear?: boolean }) {
  const inContent = React.useContext(InContentContext)
  return inContent ? <ComboboxSearch className={className} {...props} /> : <ComboboxField className={className} showTrigger={showTrigger} showClear={showClear} {...props} />
}

function ComboboxSearch({ className, ...props }: React.ComponentProps<typeof CommandInput>) {
  const ctx = useCombobox()
  return <CommandInput data-slot="combobox-input" value={ctx.query} onValueChange={ctx.setQuery} className={className} {...props} />
}

function ComboboxField({
  className,
  showTrigger,
  showClear,
  seed,
  wrapperClassName,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof CommandInput> & { showTrigger: boolean; showClear: boolean }) {
  const ctx = useCombobox()
  const { setFieldMode, anchorRef, inputRef } = ctx
  React.useEffect(() => {
    setFieldMode("single")
    return () => setFieldMode(null)
  }, [setFieldMode])
  useExpandedAttr(inputRef, ctx.open)
  useFreshActiveDescendant(inputRef)
  useCallerId(inputRef, props.id)
  const invalid = ctx.invalid
  const { hostRef, hostProps, node } = useInk({ recipe: comboboxTriggerRecipe, params: { disabled: ctx.disabled, invalid: invalid && !ctx.disabled }, kind: "field", seed: seed as string | number | undefined, still: true })
  const shown = ctx.dirty ? ctx.query : ctx.value[0] ? ctx.labelFor(ctx.value[0]) : ""
  return (
    <PopoverAnchor asChild>
      <div
        data-slot="combobox-input-frame"
        data-state={ctx.open ? "open" : "closed"}
        data-ink-focus="within"
        ref={useMergedRef<HTMLElement>(hostRef, anchorRef)}
        {...hostProps}
        onClick={() => {
          if (!ctx.disabled) inputRef.current?.focus()
        }}
        className={cn("relative isolate flex h-9 w-full items-center compact:h-8 calm:h-7", wrapperClassName)}
      >
        {node}
        <CommandPrimitive.Input
          data-slot="combobox-input"
          ref={inputRef}
          value={shown}
          onValueChange={(v) => {
            ctx.setQuery(v)
            ctx.setDirty(true)
            ctx.setOpen(true)
          }}
          disabled={ctx.disabled}
          readOnly={ctx.readOnly}
          aria-invalid={invalid || undefined}
          aria-required={ctx.required || undefined}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (!ctx.open && !ctx.disabled && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault()
              ctx.setOpen(true)
            }
          }}
          className={cn(FIELD_INPUT, showClear && "pe-1", className)}
          {...props}
        />
        {showClear && <ComboboxClear />}
        {showTrigger && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle options"
            data-slot="combobox-trigger"
            disabled={ctx.disabled || ctx.readOnly}
            onClick={(e) => {
              e.stopPropagation()
              ctx.setOpen(!ctx.open)
              inputRef.current?.focus()
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="me-0.5 grid size-7 shrink-0 place-items-center text-ink-soft disabled:text-pencil-text"
          >
            <Icon name="chevrons-up-down" size={16} />
          </button>
        )}
      </div>
    </PopoverAnchor>
  )
}

function ComboboxClear({ className, onClick, onKeyDown, ...props }: React.ComponentProps<typeof Button>) {
  const ctx = useCombobox()
  if (ctx.value.length === 0 || ctx.disabled || ctx.readOnly) return null
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Clear"
      data-slot="combobox-clear"
      tabIndex={-1}
      onClick={(e) => {
        onClick?.(e)
        e.stopPropagation()
        ctx.clear()
        ctx.inputRef.current?.focus()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        e.stopPropagation()
      }}
      className={cn("me-0.5 shrink-0", className)}
      {...props}
    >
      <Icon name="x" />
    </Button>
  )
}

const toneOf = (value: string): ChipTone => {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return chipToneList[h % chipToneList.length]
}

function ComboboxChips({
  className,
  children,
  renderChip,
  tone = "hi",
  seed,
  ref,
  ...props
}: React.ComponentProps<"div"> & { renderChip?: (value: string, label: string) => React.ReactNode; tone?: ChipTone | "auto"; seed?: string | number }) {
  const ctx = useCombobox()
  const { setFieldMode, anchorRef, inputRef } = ctx
  React.useEffect(() => {
    setFieldMode("chips")
    return () => setFieldMode(null)
  }, [setFieldMode])
  useExpandedAttr(inputRef, ctx.open)
  useFreshActiveDescendant(inputRef)
  const { hostRef, hostProps, node } = useInk({ recipe: comboboxChipsRecipe, params: { disabled: ctx.disabled, invalid: ctx.invalid && !ctx.disabled }, kind: "field", seed, still: true })
  return (
    <PopoverAnchor asChild>
      <div
        data-slot="combobox-chips"
        data-state={ctx.open ? "open" : "closed"}
        data-ink-focus="within"
        data-disabled={ctx.disabled ? "" : undefined}
        ref={useMergedRef<HTMLDivElement>(hostRef, anchorRef as React.Ref<HTMLDivElement>, ref)}
        {...hostProps}
        onClick={(e) => {
          props.onClick?.(e)
          if (!ctx.disabled && !(e.target as Element).closest("button")) inputRef.current?.focus()
        }}
        className={cn("relative isolate flex min-h-9 w-full flex-wrap items-center gap-1.5 px-2 py-1 font-hand text-base compact:min-h-8 calm:gap-1 calm:py-0.5", className)}
        {...props}
      >
        {node}
        {ctx.value.map((v) =>
          renderChip ? (
            <React.Fragment key={v}>{renderChip(v, ctx.labelFor(v))}</React.Fragment>
          ) : (
            <ComboboxChip key={v} value={v} tone={tone === "auto" ? toneOf(v) : tone}>
              {ctx.labelFor(v)}
            </ComboboxChip>
          )
        )}
        {children ?? <ComboboxChipsInput />}
      </div>
    </PopoverAnchor>
  )
}

function ComboboxChip({
  className,
  children,
  value,
  tone = "hi",
  showRemove = true,
  seed,
  removeLabel,
  ...props
}: React.ComponentProps<"span"> & { value?: string; tone?: ChipTone; showRemove?: boolean; seed?: string | number; removeLabel?: string }) {
  const ctx = useCombobox()
  const key = value ?? (typeof children === "string" ? children : "")
  const { hostRef, hostProps, node } = useInk({ recipe: comboboxChipRecipe, params: { tone, disabled: ctx.disabled }, kind: "chip", seed: seed ?? `chip|${key}`, still: true })
  const label = typeof children === "string" ? children : ctx.labelFor(key)
  return (
    <span
      data-slot="combobox-chip"
      data-value={key}
      ref={hostRef}
      {...hostProps}
      className={cn(
        "relative isolate inline-flex h-7 w-fit max-w-full items-center gap-0.5 ps-5 pe-0.5 text-sm font-bold whitespace-nowrap text-ink calm:h-6 calm:ps-4",
        ctx.disabled && "text-pencil-text",
        className
      )}
      {...props}
    >
      {node}
      <span className="min-w-0 truncate">{children}</span>
      {showRemove && (
        <button
          type="button"
          aria-label={removeLabel ?? `Remove ${label}`}
          data-slot="combobox-chip-remove"
          disabled={ctx.disabled || ctx.readOnly}
          onClick={(e) => {
            e.stopPropagation()
            ctx.remove(key)
            ctx.inputRef.current?.focus()
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="grid size-6 shrink-0 cursor-default place-items-center text-ink-soft outline-hidden hover:ll-swipe hover:text-ink focus-visible:ll-swipe focus-visible:text-ink focus-visible:[outline:2px_solid_var(--ll-focus)] focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:text-pencil-text"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  )
}

function ComboboxChipsInput({ className, onKeyDown, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const ctx = useCombobox()
  useCallerId(ctx.inputRef, props.id)
  return (
    <CommandPrimitive.Input
      data-slot="combobox-chip-input"
      ref={ctx.inputRef}
      value={ctx.query}
      onValueChange={(v) => {
        ctx.setQuery(v)
        ctx.setOpen(true)
      }}
      disabled={ctx.disabled}
      readOnly={ctx.readOnly}
      aria-required={ctx.required || undefined}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === "Backspace" && ctx.query === "" && ctx.value.length > 0) ctx.remove(ctx.value[ctx.value.length - 1])
        else if (!ctx.open && !ctx.disabled && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault()
          ctx.setOpen(true)
        }
      }}
      className={cn("h-7 min-w-16 flex-1 bg-transparent px-1 font-hand text-base text-(--ll-input-ink) caret-(--ll-caret) outline-hidden placeholder:text-(--ll-placeholder) disabled:cursor-not-allowed calm:h-6 calm:text-[15px]", className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxCollection,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxEmpty,
  ComboboxLoading,
  ComboboxCreate,
  ComboboxClear,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
  useCombobox,
}
export type { ComboboxItemData, ComboboxProps }
