// @ts-nocheck
"use client"

import * as React from "react"

import { Icon } from ".//icon"
import { Input } from ".//input"
import { Mascot } from ".//mascot"
import { Popover, PopoverContent, PopoverTrigger } from ".//popover"
import { useEnsureInkDefs } from "../lib/ink/react"
import { categoryLabel, hasSticker, stickerCatalog, stickerFace, stickerLabel, type StickerCatalogEntry } from "../lib/ink/recipes/sticker-ink"
import { cn } from "../lib/utils"

type StickerPickerItem = StickerCatalogEntry

type StickerPickerInput = string | { name: string; label?: string; category?: string; tags?: readonly string[] }

function catalogFrom(list?: readonly StickerPickerInput[]): StickerPickerItem[] {
  const all = stickerCatalog()
  if (!list) return all
  const known = new Map(all.map((e) => [e.name, e]))
  return list.flatMap((entry) => {
    const name = typeof entry === "string" ? entry : entry.name
    const base = known.get(name) ?? (hasSticker(name) ? { name, label: stickerLabel(name), category: "stickers", categoryLabel: "Stickers", tags: [] } : null)
    if (!base) return []
    if (typeof entry === "string") return [base]
    const category = entry.category ?? base.category
    return [{ ...base, label: entry.label ?? base.label, category, categoryLabel: entry.category ? categoryLabel(entry.category) : base.categoryLabel, tags: [...base.tags, ...(entry.tags ?? [])] }]
  })
}

interface StickerPickerContextValue {
  catalog: readonly StickerPickerItem[]
  recent: readonly string[]
  value: string | null | undefined
  choose(item: StickerPickerItem): void
  uid: string
}

const StickerPickerContext = React.createContext<StickerPickerContextValue | null>(null)

function useStickerPicker(): StickerPickerContextValue {
  const ctx = React.useContext(StickerPickerContext)
  if (!ctx) throw new Error("Sticker picker parts must be used inside <StickerPicker>")
  return ctx
}

type StickerPickerProps = React.ComponentProps<typeof Popover> & {
  onSelect?: (sticker: StickerPickerItem) => void
  value?: string | null
  stickers?: readonly StickerPickerInput[]
  recent?: readonly string[]
  closeOnSelect?: boolean
}

const NO_RECENT: readonly string[] = []

function StickerPicker({ open: openProp, defaultOpen = false, onOpenChange, onSelect, value, stickers, recent = NO_RECENT, closeOnSelect = true, children, ...props }: StickerPickerProps) {
  const [inner, setInner] = React.useState(defaultOpen)
  const open = openProp ?? inner
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )
  const catalog = React.useMemo(() => catalogFrom(stickers), [stickers])
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const ctx = React.useMemo<StickerPickerContextValue>(
    () => ({
      catalog,
      recent,
      value,
      uid,
      choose(item) {
        onSelect?.(item)
        if (closeOnSelect) setOpen(false)
      },
    }),
    [catalog, recent, value, uid, onSelect, closeOnSelect, setOpen]
  )
  return (
    <StickerPickerContext.Provider value={ctx}>
      <Popover data-slot="sticker-picker" open={open} onOpenChange={setOpen} {...props}>
        {children}
      </Popover>
    </StickerPickerContext.Provider>
  )
}

function StickerPickerTrigger({ ...props }: React.ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger data-slot="sticker-picker-trigger" {...props} />
}

interface Section {
  key: string
  label: string
  items: readonly StickerPickerItem[]
}

const matches = (e: StickerPickerItem, words: readonly string[]): boolean => {
  const hay = `${e.label} ${e.name} ${e.categoryLabel} ${e.tags.join(" ")}`.toLowerCase()
  return words.every((w) => hay.includes(w))
}

function neighbour(sections: readonly Section[], at: { s: number; i: number }, key: string, cols: number): { s: number; i: number } | null {
  const last = sections.length - 1
  if (key === "ArrowRight") return at.i < sections[at.s].items.length - 1 ? { s: at.s, i: at.i + 1 } : at.s < last ? { s: at.s + 1, i: 0 } : null
  if (key === "ArrowLeft") return at.i > 0 ? { s: at.s, i: at.i - 1 } : at.s > 0 ? { s: at.s - 1, i: sections[at.s - 1].items.length - 1 } : null
  const col = at.i % cols
  if (key === "ArrowDown") {
    if (at.i + cols < sections[at.s].items.length) return { s: at.s, i: at.i + cols }
    return at.s < last ? { s: at.s + 1, i: Math.min(col, sections[at.s + 1].items.length - 1) } : null
  }
  if (key === "ArrowUp") {
    if (at.i - cols >= 0) return { s: at.s, i: at.i - cols }
    if (at.s === 0) return null
    const prev = sections[at.s - 1].items.length
    const lastRow = Math.floor((prev - 1) / cols) * cols
    return { s: at.s - 1, i: Math.min(lastRow + col, prev - 1) }
  }
  return null
}

type StickerPickerContentProps = Omit<React.ComponentProps<typeof PopoverContent>, "children"> & {
  columns?: number
  size?: number
  placeholder?: string
}

function StickerPickerContent({ className, columns = 5, size = 44, placeholder = "Search stickers", ...props }: StickerPickerContentProps) {
  useStickerPicker()
  const perRow = Math.max(1, Math.floor(columns) || 1)
  return (
    <PopoverContent
      data-slot="sticker-picker-content"
      aria-label="Stickers"
      align="start"
      className={cn("w-[min(23rem,calc(100vw-2rem))] p-3", className)}
      {...props}
    >
      <PickerBody columns={perRow} size={size} placeholder={placeholder} />
    </PopoverContent>
  )
}

function PickerBody({ columns, size, placeholder }: { columns: number; size: number; placeholder: string }) {
  const picker = useStickerPicker()
  useEnsureInkDefs()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [activeKey, setActiveKey] = React.useState<string | null>(null)
  const input = React.useRef<HTMLInputElement | null>(null)
  const list = React.useRef<HTMLDivElement | null>(null)
  const listId = `sp-list-${picker.uid}`

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const categories = React.useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of picker.catalog) if (!seen.has(e.category)) seen.set(e.category, e.categoryLabel)
    return [...seen]
  }, [picker.catalog])

  const everything = React.useMemo<Section[]>(() => {
    const byName = new Map(picker.catalog.map((e) => [e.name, e]))
    const found = picker.catalog.filter((e) => (category === "all" || e.category === category) && matches(e, words))
    if (words.length || category !== "all") return found.length ? [{ key: "found", label: words.length ? `${found.length} found` : (categories.find(([k]) => k === category)?.[1] ?? ""), items: found }] : []
    const out: Section[] = []
    const recent = picker.recent.map((n) => byName.get(n)).filter((e): e is StickerPickerItem => !!e)
    if (recent.length) out.push({ key: "recent", label: "Recent", items: recent })
    for (const [key, label] of categories) out.push({ key, label, items: picker.catalog.filter((e) => e.category === key) })
    return out
  }, [picker.catalog, picker.recent, category, categories, query])

  const progressive = words.length === 0 && category === "all"
  const [shown, setShown] = React.useState(2)
  React.useEffect(() => {
    if (!progressive || shown >= everything.length) return
    const t = setTimeout(() => setShown((n) => n + 1), 24)
    return () => clearTimeout(t)
  }, [progressive, shown, everything.length])
  const sections = progressive ? everything.slice(0, shown) : everything
  const total = everything.reduce((n, s) => n + s.items.length, 0)

  const keyOf = (s: Section, e: StickerPickerItem) => `${s.key}:${e.name}`
  const flat = sections.flatMap((s, si) => s.items.map((e, i) => ({ s: si, i, e, key: keyOf(s, e) })))
  const current = flat.find((f) => f.key === activeKey) ?? flat[0] ?? null
  const optionId = (key: string) => `${listId}-${key.replace(/[^a-zA-Z0-9-]/g, "_")}`

  React.useEffect(() => {
    if (!current) return
    document.getElementById(optionId(current.key))?.scrollIntoView?.({ block: "nearest" })
  }, [current?.key])

  const goTo = (target: { s: number; i: number } | null) => {
    if (!target) return
    const f = flat.find((x) => x.s === target.s && x.i === target.i)
    if (f) setActiveKey(f.key)
  }

  const keys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const k = e.key
    if (k === "Enter") {
      if (current && !e.nativeEvent.isComposing) {
        e.preventDefault()
        picker.choose(current.e)
      }
      return
    }
    if (!current) return
    const at = { s: current.s, i: current.i }
    if (k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault()
      goTo(neighbour(sections, at, k, columns))
    } else if (k === "ArrowLeft" || k === "ArrowRight") {
      const rtl = getComputedStyle(el).direction === "rtl"
      const forward = (k === "ArrowRight") !== rtl
      const caretFree = el.value === "" || (forward ? el.selectionStart === el.value.length : el.selectionEnd === 0)
      if (!caretFree) return
      e.preventDefault()
      goTo(neighbour(sections, at, forward ? "ArrowRight" : "ArrowLeft", columns))
    } else if ((k === "Home" || k === "End") && el.value === "") {
      e.preventDefault()
      const f = k === "Home" ? flat[0] : flat[flat.length - 1]
      if (f) setActiveKey(f.key)
    }
  }

  const count = flat.length
  return (
    <>
      <Input
        ref={input}
        type="text"
        role="combobox"
        aria-label="Search stickers"
        aria-expanded={count > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={current ? optionId(current.key) : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActiveKey(null)
        }}
        onKeyDown={keys}
        className="w-full"
      />
      {categories.length > 1 ? (
        <div data-slot="sticker-picker-categories" role="group" aria-label="Categories" className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-28px),transparent)]">
          {[["all", "All"] as const, ...categories].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              onClick={() => {
                setCategory(key)
                setActiveKey(null)
                input.current?.focus()
              }}
              className={cn(
                "inline-flex min-h-6 shrink-0 items-center px-2 font-hand text-sm font-bold whitespace-nowrap text-muted-foreground transition-colors duration-(--ll-dur-hover)",
                "hover:text-foreground aria-pressed:ll-swipe aria-pressed:text-foreground focus-visible:ll-swipe forced-colors:aria-pressed:underline"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <div
        ref={list}
        id={listId}
        role="listbox"
        aria-label="Stickers"
        data-slot="sticker-picker-list"
        hidden={count === 0}
        className="mt-2 max-h-64 min-h-24 overflow-y-auto overscroll-contain pe-1"
      >
        {sections.map((s) => (
          <div key={s.key} role="group" aria-labelledby={`${listId}-h-${s.key}`} className="mb-1.5 last:mb-0">
            <div id={`${listId}-h-${s.key}`} aria-hidden="true" className="px-1 pt-1 pb-0.5 font-script text-lg leading-none text-muted-foreground">
              {s.label}
            </div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {s.items.map((e) => {
                const key = keyOf(s, e)
                return <Option key={key} entry={e} id={optionId(key)} active={current?.key === key} selected={picker.value === e.name} size={size} scope={`${picker.uid}${s.key}`} onActivate={() => setActiveKey(key)} onChoose={() => picker.choose(e)} />
              })}
            </div>
          </div>
        ))}
      </div>
      {count === 0 ? (
        <div data-slot="sticker-picker-empty" className="mt-2 grid min-h-24 place-items-center gap-1 px-2 py-5 text-center">
          <Mascot pose="search" size={64} />
          <p className="font-script text-xl leading-tight text-muted-foreground">{query.trim() ? <>Nothing looks like &ldquo;{query.trim()}&rdquo;.</> : "No stickers to choose from."}</p>
        </div>
      ) : null}
      <div className="mt-2 flex min-h-6 items-baseline justify-between gap-2 border-t border-dashed border-pencil-mark/60 pt-1.5" aria-hidden="true">
        <span className="truncate font-script text-xl leading-none text-foreground">{current?.e.label ?? ""}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{current ? current.e.categoryLabel : ""}</span>
      </div>
      <span role="status" className="sr-only">
        {total === 0 ? "No stickers found." : `${total} ${total === 1 ? "sticker" : "stickers"}.`}
      </span>
    </>
  )
}

interface OptionProps {
  entry: StickerPickerItem
  id: string
  active: boolean
  selected: boolean
  size: number
  scope: string
  onActivate(): void
  onChoose(): void
}

function Option({ entry, id, active, selected, size, scope, onActivate, onChoose }: OptionProps) {
  const face = stickerFace(entry.name, size, entry.name, { peel: active ? true : undefined, idPrefix: `ll-sp${scope}${entry.name}`.replace(/[^a-zA-Z0-9-]/g, "") })
  if (!face) return null
  const cell = size + 12
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-label={entry.label}
      data-slot="sticker-picker-option"
      data-active={active ? "" : undefined}
      data-selected={selected ? "" : undefined}
      onPointerMove={() => !active && onActivate()}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onChoose}
      className="group/option relative flex cursor-pointer items-center justify-center data-active:ll-swipe"
      style={{ height: cell }}
    >
      <svg
        data-ink="sticker"
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${face.w} ${face.h}`}
        width={face.w}
        height={face.h}
        className="pointer-events-none block overflow-visible transition-[scale,rotate] duration-(--ll-dur-hover) ease-(--ll-ease-settle) group-data-active/option:-rotate-3 group-data-active/option:scale-110 group-data-active/option:ll-drop-sticker"
        dangerouslySetInnerHTML={{ __html: face.svg }}
      />
      {selected ? <Icon name="check" size={14} className="pointer-events-none absolute end-0.5 top-0.5 text-foreground" /> : null}
    </div>
  )
}

export { StickerPicker, StickerPickerTrigger, StickerPickerContent, useStickerPicker }
export type { StickerPickerProps, StickerPickerContentProps, StickerPickerItem, StickerPickerInput }
