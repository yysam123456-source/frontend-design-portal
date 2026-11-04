// @ts-nocheck
"use client"

import * as React from "react"

import { Paper } from ".//paper"
import { buildXYRows, seriesLook, toNum, type BandInput, type NoteInput, type RefInput, type Row, type SeriesInput } from "../lib/ink/charts/chart-build"
import { summarizeXY, tableXY, TABLE_ROW_CAP, type DomainEnd, type TableModel } from "../lib/ink/charts/chart-data"
import { hitIndex, layoutChart, stepIndex, type ChartSpec } from "../lib/ink/charts/chart-layout"
import { buildCalendar, buildGrid, formatDay } from "../lib/ink/charts/chart-heat"
import { layoutGauge, layoutRadial, type PieLayout } from "../lib/ink/charts/chart-polar"
import type { XYLayout } from "../lib/ink/charts/chart-xy"
import { formatCompact, formatNumber, isNum, lttb, radarRim, round, shares } from "../lib/ink/charts/chart-scale"
import {
  PATTERNS,
  SLOT_KEYS,
  type ChartLabel,
  type ChartLayoutBase,
  type CursorSpec,
  type Dash,
  type GaugeSpec,
  type HeatSpec,
  type MarkerShape,
  type MiniParams,
  type Pattern,
  type PieSpec,
  type RadarSpec,
  type RadialSpec,
  type SparkSpec,
  type TallySpec,
  type XYKind,
  type XYSpec,
} from "../lib/ink/charts/chart-types"
import { useDensity, useInk, useMergedRef } from "../lib/ink/react"
import type { Recipe } from "../lib/ink/recipes"
import { markRecipe } from "../lib/ink/recipes/chart-ink/mark"
import { heatRecipe, sparkRecipe, tallyRecipe } from "../lib/ink/recipes/chart-ink/mini"
import { gaugeRecipe, pieRecipe, radarRecipe, radialRecipe } from "../lib/ink/recipes/chart-ink/polar"
import { xyRecipe } from "../lib/ink/recipes/chart-ink/xy"
import { cn } from "../lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    pattern?: Pattern | "auto"
    marker?: MarkerShape | "auto"
    dash?: Dash | "auto"
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>

export type ChartAnnotation = NoteInput
export type ChartHighlight = BandInput
export type ChartReference = RefInput
export type { Row as ChartRow }

export type ChartTooltipItem = {
  dataKey?: string
  name?: string
  value?: number | string | null
  color?: string
  fill?: string
  type?: string
  payload?: Row
  slot?: number
  pattern?: Pattern
  marker?: MarkerShape
  kind?: XYKind
  unit?: string
}

type TooltipModel = { label: React.ReactNode; payload: ChartTooltipItem[]; anchor: { x: number; y: number }; box: { w: number; h: number } }

type ActiveState = { index: number; series: number | null; source: "pointer" | "keyboard" | "default" }
type LegendEntry = { key: string; slot: number; pattern: Pattern; marker: MarkerShape; dash: Dash; kind: XYKind | "slice" }
type StoreState = { active: ActiveState | null; model: TooltipModel | null; announce: string; tooltip: boolean; legend: readonly LegendEntry[] }

interface TooltipCfg {
  content?: React.ReactElement
  defaultIndex?: number
  cursor?: boolean
}

function createStore() {
  let state: StoreState = { active: null, model: null, announce: "", tooltip: false, legend: [] }
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: Partial<StoreState>) {
      state = { ...state, ...next }
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    cfg: {} as TooltipCfg,
  }
}
type ChartStore = ReturnType<typeof createStore>

interface ChartContextProps {
  id: string
  config: ChartConfig
  keys: string[]
  hidden: ReadonlySet<string>
  toggle: (key: string) => void
  patterns: boolean | "auto"
  store: ChartStore
  size?: readonly [number, number]
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

function useStoreState(store: ChartStore): StoreState {
  return React.useSyncExternalStore(store.subscribe, store.get, store.get)
}

const labelText = (config: ChartConfig, key: string): string => {
  const l = config[key]?.label
  return typeof l === "string" || typeof l === "number" ? String(l) : key
}

const drawnKeys = (config: ChartConfig): string[] => Object.keys(config)

function inferSeries(rows: readonly Row[], xKey: string, config: ChartConfig | undefined): string[] {
  const first = rows.slice(0, 12)
  const numeric = (k: string) => first.some((r) => isNum(toNum(r[k])))
  if (config) {
    const fromConfig = Object.keys(config).filter((k) => k !== xKey && numeric(k))
    if (fromConfig.length) return fromConfig
  }
  const keys: string[] = []
  for (const r of first) for (const k of Object.keys(r)) if (k !== xKey && !keys.includes(k) && numeric(k)) keys.push(k)
  return keys
}

const FORCED = "(forced-colors: active)"

function useForcedColors(): boolean {
  return React.useSyncExternalStore(
    (notify) => {
      const q = typeof window === "undefined" ? undefined : window.matchMedia?.(FORCED)
      q?.addEventListener?.("change", notify)
      return () => q?.removeEventListener?.("change", notify)
    },
    () => typeof window !== "undefined" && !!window.matchMedia?.(FORCED)?.matches,
    () => false,
  )
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig
  patterns?: boolean | "auto"
  hiddenSeries?: readonly string[]
  defaultHiddenSeries?: readonly string[]
  onHiddenSeriesChange?: (hidden: string[]) => void
  initialDimension?: { width: number; height: number }
}

function ChartContainer({
  id,
  className,
  children,
  config,
  patterns,
  hiddenSeries,
  defaultHiddenSeries,
  onHiddenSeriesChange,
  initialDimension,
  ref,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`
  const [store] = React.useState(createStore)
  const [inner, setInner] = React.useState<readonly string[]>(defaultHiddenSeries ?? [])
  const controlled = hiddenSeries !== undefined
  const hiddenList = controlled ? hiddenSeries : inner
  const hiddenKey = hiddenList.join("\u0000")
  const hidden = React.useMemo(() => new Set(hiddenList), [hiddenKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = React.useCallback(
    (key: string) => {
      const next = hidden.has(key) ? hiddenList.filter((k) => k !== key) : [...hiddenList, key]
      if (!controlled) setInner(next)
      onHiddenSeriesChange?.(next)
    },
    [hidden, hiddenList, controlled, onHiddenSeriesChange],
  )
  const keys = React.useMemo(() => drawnKeys(config), [config])
  const forced = useForcedColors()
  const look = patterns ?? (forced ? "auto" : false)
  const size = initialDimension ? ([initialDimension.width, initialDimension.height] as const) : undefined
  const value = React.useMemo<ChartContextProps>(() => ({ id: chartId, config, keys, hidden, toggle, patterns: look, store, size }), [chartId, config, keys, hidden, toggle, look, store, size?.[0], size?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  const slotVars = React.useMemo(() => {
    const v: Record<string, string> = {}
    keys.forEach((k, i) => {
      if (config[k]?.color || config[k]?.theme) v[`--ll-${SLOT_KEYS[i % SLOT_KEYS.length]}`] = `var(--color-${k})`
    })
    return v
  }, [config, keys])

  return (
    <ChartContext.Provider value={value}>
      <div
        data-slot="chart"
        data-chart={chartId}
        ref={ref}
        className={cn("group/chart relative flex aspect-video w-full flex-col justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <div data-slot="chart-body" className="contents" style={slotVars as React.CSSProperties}>
          {children}
        </div>
      </div>
    </ChartContext.Provider>
  )
}

const defaultColor = (i: number) => `var(--ll-${SLOT_KEYS[i % SLOT_KEYS.length]})`

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const keys = Object.keys(config)
  if (!keys.length) return null
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${keys
  .map((key, i) => {
    const itemConfig = config[key]
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color ?? (theme === "light" ? defaultColor(i) : null)
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  )
}

const TONE_CLASS = { ink: "text-foreground", muted: "text-muted-foreground", red: "text-red", blue: "text-ink-you", green: "text-green" } as const
const ANCHOR_X = { start: "0%", middle: "-50%", end: "-100%" } as const
const ANCHOR_Y = { top: "0%", middle: "-50%", bottom: "-100%" } as const

const ChartLabels = React.memo(function ChartLabels({ labels, box }: { labels: readonly ChartLabel[]; box: { w: number; h: number } }) {
  return (
    <div
      aria-hidden="true"
      data-slot="chart-labels"
      className="pointer-events-none absolute inset-0 select-none forced-colors:hidden group-data-[reveal=on]/canvas:animate-in group-data-[reveal=on]/canvas:fade-in-0 group-data-[reveal=on]/canvas:duration-(--ll-dur-draw)"
    >
      {labels.map((l) => (
        <span
          key={l.id}
          data-role={l.role}
          className={cn("absolute block font-script leading-none whitespace-nowrap calm:font-hand", TONE_CLASS[l.tone ?? "ink"], l.role === "note" && "font-semibold [text-shadow:0_0_2px_var(--ll-slip),0_0_6px_var(--ll-slip)]", l.role === "value" && "[text-shadow:0_0_2px_var(--ll-slip),0_0_4px_var(--ll-slip)]", l.role === "center" && "font-semibold", l.maxW ? "ll-ink-room overflow-x-clip text-ellipsis" : "")}
          style={{
            left: `${round((l.x / box.w) * 100, 3)}%`,
            top: `${round((l.y / box.h) * 100, 3)}%`,
            fontSize: l.size,
            maxWidth: l.maxW,
            transform: `translate(${ANCHOR_X[l.anchor]}, ${ANCHOR_Y[l.valign]})`,
          }}
        >
          {l.text}
        </span>
      ))}
    </div>
  )
})

function cursorParams(c: CursorSpec): MiniParams {
  if (c.kind === "ring") return { kind: "ring", slot: c.slot }
  if (c.kind === "slice") return { kind: "slice", cx: round(c.cx, 1), cy: round(c.cy, 1), r0: round(c.r0, 1), r1: round(c.r1, 1), a0: round(c.a0, 3), a1: round(c.a1, 3) }
  if (c.kind === "spoke") return { kind: "spoke", x1: round(c.x1, 1), y1: round(c.y1, 1), x2: round(c.x2, 1), y2: round(c.y2, 1) }
  return { kind: c.kind }
}

function CursorMark({ c, box, seed }: { c: CursorSpec; box: { w: number; h: number }; seed: string }) {
  const params = cursorParams(c)
  const w = Math.max(4, Math.round(c.w))
  const h = Math.max(4, Math.round(c.h))
  const { hostProps, node } = useInk({ recipe: markRecipe, params, kind: "chart", size: [w, h], seed: `${seed}:${c.kind}` })
  return (
    <span
      data-slot="chart-cursor"
      data-kind={c.kind}
      {...hostProps}
      className="absolute block animate-in fade-in-0 transition-[left,top] duration-(--ll-dur-hover) ease-out motion-reduce:transition-none"
      style={{ left: `${round((c.x / box.w) * 100, 3)}%`, top: `${round((c.y / box.h) * 100, 3)}%`, width: `${round((c.w / box.w) * 100, 3)}%`, height: `${round((c.h / box.h) * 100, 3)}%` }}
    >
      {node}
    </span>
  )
}

function ChartCursors({ store, L, seed }: { store: ChartStore; L: ChartLayoutBase; seed: string }) {
  const st = useStoreState(store)
  const specs = st.active && store.cfg.cursor !== false ? L.cursorAt(st.active.index, st.active.series) : []
  const box = { w: L.w, h: L.h }
  const behind = specs.filter((c) => c.kind === "column" || c.kind === "guide")
  const above = specs.filter((c) => c.kind !== "column" && c.kind !== "guide")
  return (
    <>
      <div aria-hidden="true" data-slot="chart-cursors" data-place="behind" className="pointer-events-none absolute inset-0 -z-10 forced-colors:hidden">
        {behind.map((c, k) => (
          <CursorMark key={`${c.kind}-${k}`} c={c} box={box} seed={seed} />
        ))}
      </div>
      <div aria-hidden="true" data-slot="chart-cursors" data-place="above" className="pointer-events-none absolute inset-0 z-10 forced-colors:hidden">
        {above.map((c, k) => (
          <CursorMark key={`${c.kind}-${k}`} c={c} box={box} seed={seed} />
        ))}
      </div>
    </>
  )
}

type SwatchProps = Omit<React.ComponentProps<"span">, "slot"> & {
  palette: number
  pattern?: Pattern
  marker?: MarkerShape
  line?: boolean
}

function ChartSwatch({ palette: slot, pattern = "solid", marker, line, className, ...props }: SwatchProps) {
  const size = line ? ([22, 14] as const) : ([14, 14] as const)
  const { hostProps, node } = useInk({ recipe: markRecipe, params: { kind: "swatch", slot, pattern, marker, line: !!line }, kind: "chart", size, seed: `swatch-${slot}-${pattern}-${marker ?? "x"}-${line ? "l" : "b"}` })
  return (
    <span data-slot="chart-swatch" aria-hidden="true" {...hostProps} className={cn("relative isolate inline-block shrink-0 align-middle", line ? "h-3.5 w-[22px]" : "size-3.5", className)} {...props}>
      {node}
    </span>
  )
}

function TooltipPositioner({ anchor, box, children }: { anchor: { x: number; y: number }; box: { w: number; h: number }; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const pw = parent.offsetWidth || box.w
    const ph = parent.offsetHeight || box.h
    const ax = (anchor.x / box.w) * pw
    const ay = (anchor.y / box.h) * ph
    const tw = el.offsetWidth
    const th = el.offsetHeight
    const left = Math.max(4, Math.min(pw - tw - 4, ax - tw / 2))
    const above = ay - th - 14
    el.style.left = `${left}px`
    el.style.top = `${above < 2 ? ay + 18 : above}px`
    el.style.visibility = "visible"
  })
  return (
    <div
      ref={ref}
      data-slot="chart-tooltip-slot"
      className="pointer-events-none absolute z-(--ll-z-raised) w-max max-w-[min(22rem,calc(100%-8px))] transition-[left,top] duration-(--ll-dur-hover) ease-out motion-reduce:transition-none"
      style={{ left: 0, top: 0, visibility: "hidden" }}
    >
      {children}
    </div>
  )
}

function TooltipLayer({ store }: { store: ChartStore }) {
  const st = useStoreState(store)
  const layer = React.useCallback((el: HTMLDivElement | null) => {
    const frame = el?.closest<HTMLElement>('[data-slot="chart"]')
    if (el && frame) el.dir = getComputedStyle(frame).direction
  }, [])
  if (!st.tooltip || !st.model) return null
  const { model } = st
  const content = store.cfg.content ?? <ChartTooltipContent />
  return (
    <div ref={layer} aria-hidden="true" data-slot="chart-tooltip-layer" className="pointer-events-none absolute inset-0 z-20">
      <TooltipPositioner anchor={model.anchor} box={model.box}>
        {React.cloneElement(content as React.ReactElement<Record<string, unknown>>, { active: true, payload: model.payload, label: model.label })}
      </TooltipPositioner>
    </div>
  )
}

function ChartLive({ store }: { store: ChartStore }) {
  const st = useStoreState(store)
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-slot="chart-live" className="sr-only">
      {st.announce}
    </div>
  )
}

function ChartData({ id, summary, table, label }: { id: string; summary: string; table: TableModel | null; label: string }) {
  return (
    <div data-slot="chart-data" className="sr-only forced-colors:not-sr-only forced-colors:mt-2 forced-colors:overflow-auto forced-colors:text-sm">
      <p id={id}>{summary}</p>
      {table ? <ChartTable table={table} label={label} /> : null}
    </div>
  )
}

function ChartTable({ table, label }: { table: TableModel; label: string }) {
  return (
    <>
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            {table.head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) =>
                ci === 0 ? (
                  <th key={ci} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={ci}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {table.clipped ? <p>{`Showing the first ${table.clipped.shown} of ${table.clipped.total} rows.`}</p> : null}
    </>
  )
}

type Described = { label: React.ReactNode; payload: ChartTooltipItem[]; announce: string }

interface CanvasProps<S extends ChartSpec> extends Omit<React.ComponentProps<"div">, "children" | "onChange" | "onSelect"> {
  slot?: string
  recipe: Recipe<S>
  spec: S
  kindLabel: string
  label: string
  summary: string
  table: TableModel | null
  describe: (index: number, series: number | null, L: ChartLayoutBase) => Described | null
  seriesCount?: number
  interactive?: boolean
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
  onSelect?: (info: { index: number; series: number | null }) => void
  overlay?: (L: ChartLayoutBase) => React.ReactNode
  meter?: { min: number; max: number; now: number; text: string }
}

const REVEAL =
  "data-[reveal=on]:[&>svg_[data-part=wipe]]:animate-[ll-wipe_var(--ll-dur-draw)_var(--ll-ease-out)_both] data-[reveal=on]:[&>svg_[data-part=note]]:animate-[ll-pop_var(--ll-dur-pop)_var(--ll-ease-pop)_calc(var(--ll-dur-draw)*.9)_both] data-[reveal=on]:[&>svg_[data-part=note]]:[transform-box:fill-box] data-[reveal=on]:[&>svg_[data-part=note]]:origin-center [&>svg_[data-part=pulse]]:motion-safe:animate-pulse"

function useStableSpec<S>(spec: S): S {
  const key = React.useMemo(() => JSON.stringify(spec), [spec])
  const ref = React.useRef<{ key: string; spec: S }>({ key, spec })
  if (ref.current.key !== key) ref.current = { key, spec }
  return ref.current.spec
}

function ChartCanvas<S extends ChartSpec>({
  slot,
  recipe,
  spec: specIn,
  kindLabel,
  label,
  summary,
  table,
  describe,
  seriesCount = 0,
  interactive = true,
  animate = true,
  seed,
  onActiveChange,
  onSelect,
  overlay,
  meter,
  className,
  ref,
  ...props
}: CanvasProps<S>) {
  const ctx = useChart()
  const { store } = ctx
  const spec = useStableSpec(specIn)
  const calm = useDensity() === "calm"
  const descId = React.useId()
  const { hostRef, hostProps, node, box, seed: inkSeed } = useInk({ recipe, params: spec, kind: "chart", seed, size: ctx.size })
  const L = React.useMemo(() => (box ? layoutChart(spec, box, calm) : null), [spec, box, calm])
  const [reveal, setReveal] = React.useState<"on" | "done">(animate ? "on" : "done")
  const drawn = node !== null
  React.useEffect(() => {
    if (reveal !== "on" || !drawn) return
    const t = setTimeout(() => setReveal("done"), 1500)
    return () => clearTimeout(t)
  }, [reveal, drawn])

  const live = React.useRef({ L, describe, onActiveChange, onSelect, seriesCount })
  React.useLayoutEffect(() => {
    live.current = { L, describe, onActiveChange, onSelect, seriesCount }
  })
  const pointerFocus = React.useRef(false)
  const hostEl = React.useRef<HTMLElement | null>(null)

  const activate = React.useCallback(
    (index: number, series: number | null, source: ActiveState["source"], quiet = false) => {
      const { L: cur, describe: desc, onActiveChange: notify } = live.current
      if (!cur || index < 0 || index >= cur.targets.n) return
      const d = desc(index, series, cur)
      if (!d) return
      store.set({
        active: { index, series, source },
        model: { label: d.label, payload: d.payload, anchor: { x: cur.targets.cx[index], y: cur.targets.cy[index] }, box: { w: cur.w, h: cur.h } },
        announce: source === "keyboard" ? d.announce : store.get().announce,
      })
      if (!quiet) notify?.({ index, series })
    },
    [store],
  )
  const clear = React.useCallback(
    (only?: ActiveState["source"]) => {
      const cur = store.get().active
      if (!cur || (only && cur.source !== only)) return
      const di = store.cfg.defaultIndex
      if (di != null && cur.source !== "default") {
        activate(di, null, "default")
        return
      }
      store.set({ active: null, model: null })
      live.current.onActiveChange?.(null)
    },
    [store, activate],
  )
  React.useLayoutEffect(() => {
    ;(store as unknown as { activate?: typeof activate }).activate = activate
  }, [store, activate])
  React.useEffect(() => {
    const di = store.cfg.defaultIndex
    if (L && di != null && !store.get().active) activate(di, null, "default")
  }, [L, store, activate])
  React.useEffect(() => {
    const cur = store.get().active
    if (L && cur) activate(Math.min(cur.index, L.targets.n - 1), cur.series, cur.source, true)
    else if (cur && !L) store.set({ active: null, model: null })
  }, [spec]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const el = hostEl.current
    if (!el) return
    const away = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || el.contains(e.target)) return
      const a = store.get().active
      if (a && a.source === "pointer") clear("pointer")
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [store, clear])

  const point = (e: React.PointerEvent<HTMLDivElement>): [number, number] | null => {
    const cur = live.current.L
    const r = e.currentTarget.getBoundingClientRect()
    if (!cur || !r.width || !r.height) return null
    return [(e.clientX - r.left) * (cur.w / r.width), (e.clientY - r.top) * (cur.h / r.height)]
  }
  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const cur = live.current.L
    const p = point(e)
    if (!cur || !p) return
    const idx = hitIndex(cur.targets, p[0], p[1])
    if (idx == null) return clear("pointer")
    const a = store.get().active
    if (a && a.index === idx && a.source === "pointer") return
    activate(idx, null, "pointer")
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { L: cur, seriesCount: sc } = live.current
    if (!cur || e.altKey || e.ctrlKey || e.metaKey) return
    const a = store.get().active
    if (e.key === "Escape") {
      if (a) {
        store.set({ announce: "" })
        clear()
      }
      return
    }
    if (sc > 0 && cur.targets.mode !== "y" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault()
      const base = a?.index ?? 0
      const order: Array<number | null> = [null, ...Array.from({ length: sc }, (_, i) => i)]
      const at = order.indexOf(a?.series ?? null)
      const next = order[(at + (e.key === "ArrowUp" ? 1 : -1) + order.length) % order.length]
      activate(base, next, "keyboard")
      return
    }
    if ((e.key === "Enter" || e.key === " ") && a) {
      e.preventDefault()
      live.current.onSelect?.({ index: a.index, series: a.series })
      return
    }
    const next = stepIndex(cur.targets, a?.index ?? null, e.key)
    if (next == null) return
    e.preventDefault()
    activate(next, a?.series ?? null, "keyboard")
  }
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const cur = live.current.L
    const r = e.currentTarget.getBoundingClientRect()
    if (!cur || !live.current.onSelect || !r.width || !r.height) return
    const idx = hitIndex(cur.targets, (e.clientX - r.left) * (cur.w / r.width), (e.clientY - r.top) * (cur.h / r.height))
    if (idx != null) live.current.onSelect({ index: idx, series: store.get().active?.series ?? null })
  }

  const canMove = interactive && spec.state === "ready"
  const merged = useMergedRef<HTMLElement>(hostRef, hostEl, ref as React.Ref<HTMLElement> | undefined)

  return (
    <>
      <div
        data-slot={slot ?? "chart-canvas"}
        data-chart-type={spec.type}
        data-bucket={L?.bucket}
        data-state={spec.state}
        data-reveal={reveal}
        ref={merged as React.Ref<HTMLDivElement>}
        {...hostProps}
        role={meter ? "meter" : canMove ? "application" : "img"}
        aria-roledescription={meter ? undefined : kindLabel.toLowerCase()}
        aria-valuemin={meter?.min}
        aria-valuemax={meter?.max}
        aria-valuenow={meter?.now}
        aria-valuetext={meter?.text}
        aria-label={label}
        aria-describedby={descId}
        aria-busy={spec.state === "loading" || undefined}
        tabIndex={canMove ? 0 : undefined}
        dir="ltr"
        onPointerDown={
          canMove
            ? (e) => {
                pointerFocus.current = true
                track(e)
              }
            : undefined
        }
        onPointerMove={canMove ? track : undefined}
        onPointerLeave={canMove ? (e) => (e.pointerType === "touch" ? undefined : clear("pointer")) : undefined}
        onFocus={
          canMove
            ? () => {
                if (pointerFocus.current || store.get().active) return
                activate(0, null, "keyboard")
              }
            : undefined
        }
        onBlur={
          canMove
            ? (e) => {
                pointerFocus.current = false
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) clear("keyboard")
              }
            : undefined
        }
        onKeyDown={canMove ? onKeyDown : undefined}
        onClick={canMove && onSelect ? onClick : undefined}
        className={cn("group/canvas relative isolate min-h-0 w-full flex-1 touch-pan-y select-none forced-colors:hidden", REVEAL, className)}
        {...props}
      >
        {node}
        {L ? (
          <>
            <ChartLabels labels={L.labels} box={{ w: L.w, h: L.h }} />
            {overlay ? <div className="pointer-events-none absolute inset-0 forced-colors:hidden">{overlay(L)}</div> : null}
            {canMove ? <ChartCursors store={store} L={L} seed={String(inkSeed)} /> : null}
            <TooltipLayer store={store} />
          </>
        ) : null}
      </div>
      <ChartData id={descId} summary={summary} table={table} label={label} />
      {canMove ? <ChartLive store={store} /> : null}
    </>
  )
}

type ChartTooltipProps = {
  content?: React.ReactElement
  cursor?: boolean
  defaultIndex?: number
}

function ChartTooltip({ content, cursor = true, defaultIndex }: ChartTooltipProps) {
  const { store } = useChart()
  React.useLayoutEffect(() => {
    store.cfg = { content, cursor, defaultIndex }
    if (!store.get().tooltip) store.set({ tooltip: true })
    const activate = (store as unknown as { activate?: (index: number, series: number | null, source: "default") => void }).activate
    if (defaultIndex != null) activate?.(defaultIndex, null, "default")
    else if (store.get().active?.source === "default") store.set({ active: null, model: null })
  }, [store, content, cursor, defaultIndex])
  React.useLayoutEffect(() => () => store.set({ tooltip: false, active: null, model: null }), [store])
  return null
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : undefined
  let configLabelKey: string = key
  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key as keyof typeof payloadPayload] === "string") {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }
  return configLabelKey in config ? config[configLabelKey] : config[key]
}

type ChartTooltipContentProps = Omit<React.ComponentProps<"div">, "color" | "label"> & {
  active?: boolean
  payload?: ChartTooltipItem[]
  label?: React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  color?: string
  labelClassName?: string
  labelFormatter?: (label: React.ReactNode, payload: ChartTooltipItem[]) => React.ReactNode
  formatter?: (value: number | string | null, name: string, item: ChartTooltipItem, index: number, payload: Row | undefined) => React.ReactNode
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  ...props
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value: React.ReactNode = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : (itemConfig?.label ?? label)
    if (labelFormatter) return <div className={cn("font-script text-lg leading-none font-semibold", labelClassName)}>{labelFormatter(value, payload)}</div>
    if (!value) return null
    return <div className={cn("font-script text-lg leading-none font-semibold", labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <Paper
      data-slot="chart-tooltip"
      stock="slip"
      edge="cut"
      tilt={0.7}
      seed="chart-tooltip"
      className={cn("grid min-w-[8rem] items-start gap-1.5 px-3 py-2 font-hand text-[13px] text-foreground", className)}
      {...(props as React.ComponentProps<"div">)}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key) ?? (item.dataKey ? config[item.dataKey] : undefined)
            const indicatorColor = color ?? (item.payload?.fill as string | undefined) ?? item.color
            return (
              <div key={index} className={cn("flex w-full flex-wrap items-stretch gap-2 [&>svg:not(.absolute)]:h-2.5 [&>svg:not(.absolute)]:w-2.5 [&>svg:not(.absolute)]:text-muted-foreground", indicator === "dot" && "items-center")}>
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator &&
                      (item.slot !== undefined ? (
                        indicator === "dashed" ? null : (
                          <ChartSwatch
                            palette={item.slot}
                            pattern={item.pattern}
                            marker={item.marker}
                            line={item.kind === "line" && indicator === "dot"}
                            className={cn(indicator === "line" && "h-auto w-1.5 self-stretch")}
                          />
                        )
                      ) : (
                        <span aria-hidden="true" className="size-2.5 shrink-0 bg-(--color-bg)" style={{ "--color-bg": indicatorColor } as React.CSSProperties} />
                      ))
                    )}
                    {indicator === "dashed" && !hideIndicator ? <span aria-hidden="true" className="w-0 shrink-0 border-[1.5px] border-dashed border-(--color-border)" style={{ "--color-border": indicatorColor } as React.CSSProperties} /> : null}
                    <div className={cn("flex flex-1 justify-between gap-4 leading-none", nestLabel ? "items-end" : "items-center")}>
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                      </div>
                      {item.value != null && (
                        <span className="font-bold text-foreground tabular-nums">
                          {typeof item.value === "number" ? formatNumber(item.value) : String(item.value)}
                          {item.unit ? <span className="ms-0.5 font-normal text-muted-foreground">{item.unit}</span> : null}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </Paper>
  )
}

type ChartLegendContentProps = React.ComponentProps<"div"> & {
  hideIcon?: boolean
  verticalAlign?: "top" | "bottom"
  payload?: unknown
  nameKey?: string
  keys?: readonly string[]
  toggle?: boolean
}

function ChartLegendContent({ className, hideIcon = false, verticalAlign = "bottom", payload: _payload, nameKey: _nameKey, keys, toggle: canToggle = true, ...props }: ChartLegendContentProps) {
  const { config, store, hidden, toggle, keys: configKeys, patterns } = useChart()
  const st = useStoreState(store)
  void _payload
  void _nameKey
  const entries: LegendEntry[] = st.legend.length
    ? st.legend.filter((e) => !keys || keys.includes(e.key))
    : configKeys
        .filter((k) => !keys || keys.includes(k))
        .map((k, i) => {
          const look = seriesLook("bar", i, configKeys.length, patterns, config[k] ?? {})
          return { key: k, slot: i, pattern: look.pattern, marker: look.marker, dash: look.dash, kind: "bar" as XYKind }
        })
  const ordered = keys ? keys.flatMap((k) => entries.filter((e) => e.key === k)) : entries
  if (!ordered.length) return null
  return (
    <div data-slot="chart-legend" className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5", verticalAlign === "top" ? "pb-3" : "pt-3", className)} {...props}>
      {ordered.map((e) => {
        const item = config[e.key]
        const off = hidden.has(e.key)
        const body = (
          <>
            {item?.icon && !hideIcon ? (
              <item.icon />
            ) : (
              <ChartSwatch palette={e.slot} pattern={e.pattern} marker={e.kind === "line" ? e.marker : undefined} line={e.kind === "line"} />
            )}
            <span className={cn("font-hand text-sm", off && "text-muted-foreground line-through decoration-wavy decoration-1")}>{item?.label ?? e.key}</span>
          </>
        )
        return canToggle ? (
          <button
            key={e.key}
            type="button"
            data-slot="chart-legend-item"
            aria-pressed={!off}
            onClick={() => toggle(e.key)}
            className={cn("inline-flex min-h-6 min-w-6 items-center gap-1.5 px-1.5 hover:ll-swipe [&>svg:not(.absolute)]:h-3 [&>svg:not(.absolute)]:w-3 [&>svg:not(.absolute)]:text-muted-foreground", off && "opacity-70")}
          >
            {body}
          </button>
        ) : (
          <div key={e.key} data-slot="chart-legend-item" className="inline-flex min-h-6 items-center gap-1.5 px-1.5 [&>svg:not(.absolute)]:h-3 [&>svg:not(.absolute)]:w-3 [&>svg:not(.absolute)]:text-muted-foreground">
            {body}
          </div>
        )
      })}
    </div>
  )
}

type ChartLegendProps = Omit<ChartLegendContentProps, "content"> & {
  content?: React.ReactElement
}

function ChartLegend({ content, ...props }: ChartLegendProps) {
  return content ? React.cloneElement(content as React.ReactElement<Record<string, unknown>>, props) : <ChartLegendContent {...props} />
}

type Standalone = {
  onSelect?: (info: { index: number; series: number | null }) => void
  "data-slot"?: string
  className?: string
  config?: ChartConfig
  tooltip?: boolean
  legend?: boolean | "top" | "bottom"
}

function useSelfContained(props: Standalone & { className?: string }, autoConfig: () => ChartConfig, hasLegend: boolean, render: () => React.ReactNode, containerProps?: Partial<ChartContainerProps>): React.ReactNode {
  const ctx = React.useContext(ChartContext)
  const auto = props.config ? undefined : autoConfig()
  const autoKey = auto ? Object.keys(auto).join("\u0000") : ""
  const config = React.useMemo(() => props.config ?? auto ?? {}, [props.config, autoKey]) // eslint-disable-line react-hooks/exhaustive-deps
  if (ctx) return render()
  const legend = props.legend ?? hasLegend
  return (
    <ChartContainer config={config} className={props.className} {...containerProps}>
      {legend === "top" ? <ChartLegend verticalAlign="top" /> : null}
      {render()}
      {props.tooltip === false ? null : <ChartTooltip />}
      {legend === true || legend === "bottom" ? <ChartLegend /> : null}
    </ChartContainer>
  )
}

function useLegend(store: ChartStore, entries: LegendEntry[]) {
  const key = JSON.stringify(entries)
  React.useLayoutEffect(() => {
    store.set({ legend: entries })
    return () => store.set({ legend: [] })
  }, [store, key]) // eslint-disable-line react-hooks/exhaustive-deps
}

type XYChartProps = Standalone & {
  data: readonly Row[]
  xKey?: string
  series?: readonly string[]
  kinds?: Readonly<Record<string, XYKind>>
  stacked?: boolean
  curve?: "smooth" | "linear" | "step"
  yDomain?: readonly [DomainEnd, DomainEnd]
  xDomain?: readonly [DomainEnd, DomainEnd]
  zero?: boolean
  xFormatter?: (value: unknown, index: number) => string
  yFormatter?: (value: number) => string
  valueFormatter?: (value: number) => string
  dots?: "auto" | boolean
  showValues?: "auto" | boolean
  sizeKey?: string
  showGrid?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  annotations?: readonly ChartAnnotation[]
  references?: readonly ChartReference[]
  highlights?: readonly ChartHighlight[]
  label?: string
  description?: string
  accessibilityLayer?: boolean
  xLabel?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

type BarChartProps = XYChartProps & {
  horizontal?: boolean
  layout?: "horizontal" | "vertical"
}

const KIND_NOUN: Record<XYKind, string> = { bar: "Bar chart", line: "Line chart", area: "Area chart", scatter: "Scatter chart" }

function inferXKey(rows: readonly Row[]): string {
  const first = rows[0] ?? {}
  const text = Object.keys(first).find((k) => typeof first[k] === "string" && toNum(first[k]) === null)
  return text ?? Object.keys(first)[0] ?? "x"
}

function XYChartBody(props: XYChartProps & { kind: XYKind; horizontal?: boolean }) {
  const {
    kind, data, xKey, series, kinds, stacked, horizontal, curve, yDomain, xDomain, zero, xFormatter, yFormatter, valueFormatter, dots, showValues, showGrid = true, showXAxis = true, showYAxis = true,
    annotations, references, highlights, label, description, xLabel, loading, emptyText, animate, seed, onActiveChange, sizeKey,
  } = props
  const ctx = useChart()
  const xk = xKey ?? inferXKey(data)
  const keys = React.useMemo(() => (series ? [...series] : inferSeries(data, xk, ctx.config)), [series, data, xk, ctx.config])
  const inputs = React.useMemo<SeriesInput[]>(
    () =>
      keys.map((k, i) => {
        const at = ctx.keys.indexOf(k)
        const c = ctx.config[k]
        return { key: k, name: labelText(ctx.config, k), slot: at >= 0 ? at : i, kind: kinds?.[k], pattern: c?.pattern, marker: c?.marker, dash: c?.dash }
      }),
    [keys, ctx.keys, ctx.config, kinds],
  )
  const built = React.useMemo(
    () =>
      buildXYRows({
        rows: data, xKey: xk, series: inputs, kind, stacked, horizontal, curve, domain: yDomain, xDomain, zero, xFormat: xFormatter, yFormat: yFormatter, valueFormat: valueFormatter,
        dots, values: showValues ?? "auto", grid: showGrid, showX: showXAxis, showY: showYAxis, notes: annotations, refs: references, bands: highlights, patterns: ctx.patterns, hidden: ctx.hidden,
        state: loading ? "loading" : undefined, stateText: loading ? "Loading" : emptyText, sizeKey,
      }),
    [sizeKey, data, xk, inputs, kind, stacked, horizontal, curve, yDomain, xDomain, zero, xFormatter, yFormatter, valueFormatter, dots, showValues, showGrid, showXAxis, showYAxis, annotations, references, highlights, ctx.patterns, ctx.hidden, loading, emptyText],
  )
  const spec: XYSpec = built.spec
  const rows = built.rows
  const vf = valueFormatter ?? formatNumber
  const noun = spec.series.some((s) => s.kind !== kind) ? "Chart" : KIND_NOUN[kind]
  const name = label ?? noun
  const summary = React.useMemo(() => `${summarizeXY(spec, { kind: noun, title: label, format: vf })}${description ? ` ${description}` : ""}`, [spec, noun, label, vf, description])
  const table = React.useMemo(() => tableXY(spec, { format: vf, xHead: xLabel ?? xk, xFormat: xFormatter ? (v) => xFormatter(v, 0) : undefined }), [spec, vf, xLabel, xk, xFormatter])

  useLegend(
    ctx.store,
    inputs.map((s) => {
      const k = s.kind ?? kind
      const look = seriesLook(k, s.slot ?? 0, inputs.length, ctx.patterns, s)
      return { key: s.key, slot: s.slot ?? 0, pattern: look.pattern, marker: look.marker, dash: look.dash, kind: k }
    }),
  )

  const describe = React.useCallback(
    (index: number, si: number | null, L: ChartLayoutBase): Described | null => {
      const xl = L as XYLayout
      const scatter = kind === "scatter"
      if (scatter) {
        const p = xl.pointOf[index]
        if (!p) return null
        const s = spec.series[p.s]
        const row = rows[p.j]
        const x = s.xs?.[p.j] ?? 0
        const xs = xFormatter ? xFormatter(x, p.j) : formatNumber(x)
        const y = s.values[p.j]
        const items: ChartTooltipItem[] = [{ dataKey: s.key, name: s.name, value: isNum(y) ? y : null, color: `var(--color-${s.key})`, fill: `var(--color-${s.key})`, payload: row, slot: s.slot, pattern: s.pattern, marker: s.marker, kind: "scatter" }]
        return { label: `${xLabel ?? xk} ${xs}`, payload: items, announce: `${s.name}: ${xs}, ${isNum(y) ? vf(y) : "no value"}` }
      }
      const row = rows[index]
      const items: ChartTooltipItem[] = spec.series.flatMap((s): ChartTooltipItem[] => {
        const v = s.values[index]
        if (!isNum(v)) return []
        return [{ dataKey: s.key, name: s.name, value: v, color: `var(--color-${s.key})`, fill: `var(--color-${s.key})`, payload: row, slot: s.slot, pattern: s.pattern, marker: s.marker, kind: s.kind }]
      })
      const spoken = si == null ? items : items.filter((it) => it.dataKey === spec.series[si]?.key)
      const cat = spec.cats[index] ?? ""
      return { label: cat, payload: items, announce: `${cat}: ${(spoken.length ? spoken : items).map((it) => `${it.name} ${vf(it.value as number)}`).join(", ")}` }
    },
    [spec, rows, kind, xFormatter, xLabel, xk, vf],
  )

  return (
    <ChartCanvas
      slot={props["data-slot"]}
      recipe={xyRecipe}
      spec={spec}
      kindLabel={noun}
      label={name}
      summary={summary}
      table={table}
      describe={describe}
      seriesCount={kind === "scatter" ? 0 : spec.series.length > 1 ? spec.series.length : 0}
      animate={animate}
      seed={seed}
      onActiveChange={onActiveChange}
      onSelect={props.onSelect}
      interactive={spec.state === "ready"}
    />
  )
}

function XYChart({ kind, horizontal, ...props }: XYChartProps & { kind: XYKind; horizontal?: boolean }) {
  const body = <XYChartBody kind={kind} horizontal={horizontal} {...props} />
  const xk = props.xKey ?? inferXKey(props.data)
  const seriesKeys = props.series ? [...props.series] : inferSeries(props.data, xk, props.config)
  return useSelfContained(
    props,
    () => Object.fromEntries(seriesKeys.map((k) => [k, { label: k }])) as ChartConfig,
    seriesKeys.length > 1,
    () => body,
  )
}

function BarChart({ layout, horizontal, ...props }: BarChartProps) {
  return <XYChart data-slot="bar-chart" kind="bar" horizontal={horizontal ?? layout === "vertical"} {...props} />
}
function LineChart(props: XYChartProps) {
  return <XYChart data-slot="line-chart" kind="line" {...props} />
}
function AreaChart(props: XYChartProps) {
  return <XYChart data-slot="area-chart" kind="area" {...props} />
}
function ScatterChart(props: XYChartProps) {
  return <XYChart data-slot="scatter-chart" kind="scatter" {...props} />
}

type ChartCenter = { value: React.ReactNode; label?: React.ReactNode }

function ChartCenterLabel({ value, label, className }: ChartCenter & { className?: string }) {
  return (
    <div data-slot="chart-center" className={cn("flex flex-col items-center text-center leading-none", className)}>
      <span className="font-script text-[2rem] leading-none font-bold text-foreground tabular-nums calm:font-hand calm:text-2xl">{value}</span>
      {label ? <span className="mt-1 font-hand text-[13px] text-muted-foreground">{label}</span> : null}
    </div>
  )
}

const isCenterObject = (c: unknown): c is ChartCenter => typeof c === "object" && c !== null && !React.isValidElement(c) && "value" in c

function AtPoint({ x, y, box, children }: { x: number; y: number; box: { w: number; h: number }; children: React.ReactNode }) {
  return (
    <div className="absolute" style={{ left: `${round((x / box.w) * 100, 3)}%`, top: `${round((y / box.h) * 100, 3)}%`, transform: "translate(-50%, -50%)" }}>
      {children}
    </div>
  )
}

type PieChartProps = Standalone & {
  data: readonly Row[]
  nameKey?: string
  valueKey?: string
  innerRadius?: number
  startAngle?: number
  showLabels?: boolean
  valueFormatter?: (value: number) => string
  centerLabel?: React.ReactNode | ChartCenter | ((info: { total: number; active: { name: string; value: number; percent: number } | null }) => React.ReactNode)
  label?: string
  description?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

function PieCenter({ store, L, total, slices, centerLabel }: { store: ChartStore; L: PieLayout; total: number; slices: PieSpec["slices"]; centerLabel: NonNullable<PieChartProps["centerLabel"]> }) {
  const st = useStoreState(store)
  let content: React.ReactNode
  if (typeof centerLabel === "function") {
    const a = st.active ? slices[L.sliceOf[st.active.index]] : undefined
    content = centerLabel({ total, active: a ? { name: a.name, value: a.value, percent: total ? a.value / total : 0 } : null })
  } else content = isCenterObject(centerLabel) ? <ChartCenterLabel {...centerLabel} /> : centerLabel
  return (
    <AtPoint x={L.cx} y={L.cy} box={{ w: L.w, h: L.h }}>
      {content}
    </AtPoint>
  )
}

function PieChartBody(props: PieChartProps) {
  const { data, nameKey, valueKey, innerRadius = 0, startAngle = 0, showLabels = true, valueFormatter, centerLabel, label, description, loading, emptyText, animate, seed, onActiveChange } = props
  const ctx = useChart()
  const nk = nameKey ?? inferXKey(data)
  const vk = valueKey ?? inferSeries(data, nk, undefined)[0] ?? "value"
  const vf = valueFormatter ?? formatNumber
  const all = React.useMemo(
    () =>
      data.map((r, i) => {
        const key = String(r[nk] ?? i)
        const at = ctx.keys.indexOf(key)
        return { key, name: labelText(ctx.config, key), slot: at >= 0 ? at : i, value: toNum(r[vk]) ?? 0, row: r }
      }),
    [data, nk, vk, ctx.keys, ctx.config],
  )
  const spec = React.useMemo<PieSpec>(() => {
    const drawn = all.filter((s) => !ctx.hidden.has(s.key))
    return {
      type: "pie",
      slices: drawn.map((s) => ({ key: s.key, name: s.name, slot: s.slot, value: s.value, pattern: ctx.patterns === false || all.length < 2 ? ("solid" as Pattern) : ((ctx.config[s.key]?.pattern && ctx.config[s.key]?.pattern !== "auto" ? ctx.config[s.key]?.pattern : PATTERNS[s.slot % PATTERNS.length]) as Pattern) })),
      inner: Math.max(0, Math.min(0.9, innerRadius)),
      start: startAngle,
      labels: showLabels,
      patterns: ctx.patterns !== false,
      state: loading ? "loading" : drawn.reduce((n, s) => n + s.value, 0) > 0 ? "ready" : "empty",
      stateText: loading ? "Loading" : emptyText,
    }
  }, [all, ctx.hidden, ctx.patterns, ctx.config, innerRadius, startAngle, showLabels, loading, emptyText])
  const total = spec.slices.reduce((n, s) => n + s.value, 0)
  const pct = React.useMemo(() => shares(spec.slices.map((s) => s.value)), [spec.slices])
  const noun = innerRadius > 0 ? "Donut chart" : "Pie chart"
  const name = label ?? noun
  const summary = React.useMemo(() => {
    if (spec.state === "loading") return `${name}. Loading.`
    if (spec.state === "empty") return `${name}. No data.`
    const parts = spec.slices.map((s, i) => `${s.name} ${vf(s.value)} (${pct[i]})`)
    return `${label ? `${label}. ` : ""}${noun} of ${spec.slices.length} slice${spec.slices.length === 1 ? "" : "s"}, total ${vf(total)}: ${parts.join(", ")}.${description ? ` ${description}` : ""}`
  }, [spec, total, vf, name, label, noun, description, pct])
  const table = React.useMemo<TableModel>(() => ({ head: [nk, vk, "Share"], rows: spec.slices.map((s, i) => [s.name, vf(s.value), pct[i]]) }), [spec, nk, vk, vf, pct])

  useLegend(
    ctx.store,
    all.map((s) => ({ key: s.key, slot: s.slot, pattern: (ctx.patterns === false || all.length < 2 ? "solid" : PATTERNS[s.slot % PATTERNS.length]) as Pattern, marker: "circle" as MarkerShape, dash: "solid" as Dash, kind: "slice" as const })),
  )

  const describe = React.useCallback(
    (index: number, _si: number | null, L: ChartLayoutBase): Described | null => {
      const pl = L as PieLayout
      const sl = spec.slices[pl.sliceOf[index]]
      if (!sl) return null
      const share = pct[pl.sliceOf[index]]
      const row = all.find((a) => a.key === sl.key)?.row
      return {
        label: sl.name,
        payload: [{ dataKey: sl.key, name: sl.name, value: sl.value, color: `var(--color-${sl.key})`, fill: `var(--color-${sl.key})`, payload: row, slot: sl.slot, pattern: sl.pattern, kind: "bar" as XYKind, unit: ` (${share})` }],
        announce: `${sl.name}: ${vf(sl.value)}, ${share}`,
      }
    },
    [spec, pct, all, vf],
  )

  return (
    <ChartCanvas
      slot={props["data-slot"] ?? "pie-chart"}
      recipe={pieRecipe}
      spec={spec}
      kindLabel={noun}
      label={name}
      summary={summary}
      table={table}
      describe={describe}
      animate={animate}
      seed={seed}
      onActiveChange={onActiveChange}
      onSelect={props.onSelect}
      interactive={spec.state === "ready"}
      overlay={centerLabel != null && spec.state === "ready" ? (L) => <PieCenter store={ctx.store} L={L as PieLayout} total={total} slices={spec.slices} centerLabel={centerLabel} /> : undefined}
    />
  )
}

function PieChart(props: PieChartProps) {
  const nk = props.nameKey ?? inferXKey(props.data)
  return useSelfContained(
    props,
    () => Object.fromEntries(props.data.map((r) => [String(r[nk]), { label: String(r[nk]) }])) as ChartConfig,
    true,
    () => <PieChartBody {...props} />,
  )
}
function DonutChart({ innerRadius = 0.58, ...props }: PieChartProps) {
  return <PieChart data-slot="donut-chart" innerRadius={innerRadius} {...props} />
}

type RadarChartProps = Standalone & {
  data: readonly Row[]
  xKey?: string
  series?: readonly string[]
  max?: number
  levels?: number
  fill?: boolean
  dots?: boolean
  valueFormatter?: (value: number) => string
  label?: string
  description?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

function RadarChartBody(props: RadarChartProps) {
  const { data, xKey, series, max, levels = 4, fill = true, dots = true, valueFormatter, label, description, loading, emptyText, animate, seed, onActiveChange } = props
  const ctx = useChart()
  const xk = xKey ?? inferXKey(data)
  const keys = React.useMemo(() => (series ? [...series] : inferSeries(data, xk, ctx.config)), [series, data, xk, ctx.config])
  const vf = valueFormatter ?? formatNumber
  const rimValue = React.useMemo(() => {
    if (max) return max
    return radarRim(Math.max(0, ...keys.flatMap((k) => data.map((r) => toNum(r[k]) ?? 0))), levels)
  }, [max, keys, data, levels])
  const spec = React.useMemo<RadarSpec>(() => {
    const drawn = keys.filter((k) => !ctx.hidden.has(k))
    const rs = drawn.map((k) => {
      const at = ctx.keys.indexOf(k)
      const slot = at >= 0 ? at : keys.indexOf(k)
      const look = seriesLook("area", slot, keys.length, ctx.patterns, ctx.config[k] ?? {})
      return { key: k, name: labelText(ctx.config, k), slot, pattern: look.pattern, marker: look.marker, values: data.map((r) => toNum(r[k])) }
    })
    const empty = !rs.length || data.length < 3
    return {
      type: "radar",
      axes: data.map((r) => String(r[xk] ?? "")),
      series: rs,
      max: rimValue,
      levels,
      ringLabels: Array.from({ length: levels }, (_, l) => formatCompact((rimValue * (levels - l)) / levels)),
      fill,
      patterns: ctx.patterns !== false,
      dots,
      state: loading ? "loading" : empty ? "empty" : "ready",
      stateText: loading ? "Loading" : emptyText,
    }
  }, [keys, ctx.hidden, ctx.keys, ctx.config, ctx.patterns, data, xk, rimValue, levels, fill, dots, loading, emptyText])
  const name = label ?? "Radar chart"
  const summary = React.useMemo(() => {
    if (spec.state === "loading") return `${name}. Loading.`
    if (spec.state === "empty") return `${name}. No data.`
    const each = spec.series.map((s) => `${s.name}: ${spec.axes.map((a, i) => `${a} ${isNum(s.values[i]) ? vf(s.values[i] as number) : "none"}`).join(", ")}`)
    return `${label ? `${label}. ` : ""}Radar chart with ${spec.axes.length} axes and ${spec.series.length} series, scaled to ${vf(spec.max)}. ${each.join(". ")}.${description ? ` ${description}` : ""}`
  }, [spec, vf, name, label, description])
  const table = React.useMemo<TableModel>(() => ({ head: [xk, ...spec.series.map((s) => s.name)], rows: spec.axes.map((a, i) => [a, ...spec.series.map((s) => (isNum(s.values[i]) ? vf(s.values[i] as number) : ""))]) }), [spec, xk, vf])

  useLegend(
    ctx.store,
    keys.map((k) => {
      const at = ctx.keys.indexOf(k)
      const slot = at >= 0 ? at : keys.indexOf(k)
      const look = seriesLook("area", slot, keys.length, ctx.patterns, ctx.config[k] ?? {})
      return { key: k, slot, pattern: look.pattern, marker: look.marker, dash: "solid" as Dash, kind: "area" as XYKind }
    }),
  )
  const describe = React.useCallback(
    (index: number): Described | null => {
      const axis = spec.axes[index]
      if (axis === undefined) return null
      const items: ChartTooltipItem[] = spec.series.flatMap((s): ChartTooltipItem[] => (isNum(s.values[index]) ? [{ dataKey: s.key, name: s.name, value: s.values[index], color: `var(--color-${s.key})`, fill: `var(--color-${s.key})`, payload: data[index], slot: s.slot, pattern: s.pattern, marker: s.marker, kind: "area" }] : []))
      return { label: axis, payload: items, announce: `${axis}: ${items.map((i) => `${i.name} ${vf(i.value as number)}`).join(", ")}` }
    },
    [spec, data, vf],
  )
  return (
    <ChartCanvas slot={props["data-slot"] ?? "radar-chart"} recipe={radarRecipe} spec={spec} kindLabel="Radar chart" label={name} summary={summary} table={table} describe={describe} animate={animate} seed={seed} onActiveChange={onActiveChange} onSelect={props.onSelect} interactive={spec.state === "ready"} />
  )
}

function RadarChart(props: RadarChartProps) {
  const xk = props.xKey ?? inferXKey(props.data)
  const keys = props.series ? [...props.series] : inferSeries(props.data, xk, props.config)
  return useSelfContained(props, () => Object.fromEntries(keys.map((k) => [k, { label: k }])) as ChartConfig, keys.length > 1, () => <RadarChartBody {...props} />)
}

type RadialChartProps = Standalone & {
  data: readonly Row[]
  nameKey?: string
  valueKey?: string
  max?: number
  startAngle?: number
  endAngle?: number
  valueFormatter?: (value: number) => string
  centerLabel?: React.ReactNode | ChartCenter
  label?: string
  description?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

function RadialChartBody(props: RadialChartProps) {
  const { data, nameKey, valueKey, max = 100, startAngle = 0, endAngle = 270, valueFormatter, centerLabel, label, description, loading, emptyText, animate, seed, onActiveChange } = props
  const ctx = useChart()
  const nk = nameKey ?? inferXKey(data)
  const vk = valueKey ?? inferSeries(data, nk, undefined)[0] ?? "value"
  const vf = valueFormatter ?? formatNumber
  const all = React.useMemo(
    () =>
      data.map((r, i) => {
        const key = String(r[nk] ?? i)
        const at = ctx.keys.indexOf(key)
        return { key, name: labelText(ctx.config, key), slot: at >= 0 ? at : i, value: toNum(r[vk]) ?? 0, max: toNum(r.max) ?? max, row: r }
      }),
    [data, nk, vk, ctx.keys, ctx.config, max],
  )
  const spec = React.useMemo<RadialSpec>(() => {
    const drawn = all.filter((a) => !ctx.hidden.has(a.key))
    return {
      type: "radial",
      rings: drawn.map((a) => ({ key: a.key, name: a.name, slot: a.slot, pattern: ctx.patterns === false || all.length < 2 ? "solid" : PATTERNS[a.slot % PATTERNS.length], value: a.value, max: a.max })),
      start: startAngle,
      end: endAngle,
      patterns: ctx.patterns !== false,
      state: loading ? "loading" : drawn.length ? "ready" : "empty",
      stateText: loading ? "Loading" : emptyText,
    }
  }, [all, ctx.hidden, ctx.patterns, startAngle, endAngle, loading, emptyText])
  const name = label ?? "Radial bar chart"
  const summary = React.useMemo(() => (spec.state === "ready" ? `${label ? `${label}. ` : ""}Radial bar chart with ${spec.rings.length} ring${spec.rings.length === 1 ? "" : "s"}: ${spec.rings.map((r) => `${r.name} ${vf(r.value)} of ${vf(r.max)}`).join(", ")}.${description ? ` ${description}` : ""}` : `${name}. ${spec.state === "loading" ? "Loading." : "No data."}`), [spec, vf, name, label, description])
  const table = React.useMemo<TableModel>(() => ({ head: [nk, vk, "Of"], rows: spec.rings.map((r) => [r.name, vf(r.value), vf(r.max)]) }), [spec, nk, vk, vf])
  useLegend(ctx.store, all.map((a) => ({ key: a.key, slot: a.slot, pattern: (ctx.patterns === false || all.length < 2 ? "solid" : PATTERNS[a.slot % PATTERNS.length]) as Pattern, marker: "circle" as MarkerShape, dash: "solid" as Dash, kind: "slice" as const })))
  const describe = React.useCallback(
    (index: number): Described | null => {
      const r = spec.rings[index]
      if (!r) return null
      return { label: r.name, payload: [{ dataKey: r.key, name: r.name, value: r.value, color: `var(--color-${r.key})`, fill: `var(--color-${r.key})`, slot: r.slot, pattern: r.pattern, kind: "bar", unit: ` of ${vf(r.max)}` }], announce: `${r.name}: ${vf(r.value)} of ${vf(r.max)}` }
    },
    [spec, vf],
  )
  return (
    <ChartCanvas
      slot={props["data-slot"] ?? "radial-chart"}
      recipe={radialRecipe}
      spec={spec}
      kindLabel="Radial bar chart"
      label={name}
      summary={summary}
      table={table}
      describe={describe}
      animate={animate}
      seed={seed}
      onActiveChange={onActiveChange}
      onSelect={props.onSelect}
      interactive={spec.state === "ready"}
      overlay={centerLabel != null && spec.state === "ready" ? (L) => <AtPoint x={(L as ReturnType<typeof layoutRadial>).cx} y={(L as ReturnType<typeof layoutRadial>).cy} box={{ w: L.w, h: L.h }}>{isCenterObject(centerLabel) ? <ChartCenterLabel {...centerLabel} /> : centerLabel}</AtPoint> : undefined}
    />
  )
}

function RadialChart(props: RadialChartProps) {
  const nk = props.nameKey ?? inferXKey(props.data)
  return useSelfContained(props, () => Object.fromEntries(props.data.map((r) => [String(r[nk]), { label: String(r[nk]) }])) as ChartConfig, props.data.length > 1, () => <RadialChartBody {...props} />)
}

const ZONE_TONE = { good: 2, warn: 3, bad: 5, info: 1, brand: 0 } as const
type GaugeZoneInput = { to: number; tone?: keyof typeof ZONE_TONE | number }

type GaugeProps = Standalone & {
  value: number
  min?: number
  max?: number
  zones?: readonly GaugeZoneInput[]
  sweep?: number
  ticks?: number
  valueFormatter?: (value: number) => string
  children?: React.ReactNode
  label?: string
  description?: string
  loading?: boolean
  animate?: boolean
  seed?: string | number
}

function GaugeBody(props: GaugeProps) {
  const { min = 0, max = 100, zones, sweep = 180, ticks = 10, valueFormatter, children, label, description, loading, animate, seed } = props
  const value = Number.isFinite(props.value) ? props.value : min
  const vf = valueFormatter ?? formatNumber
  const ctx = useChart()
  const spec = React.useMemo<GaugeSpec>(
    () => ({
      type: "gauge",
      value,
      min,
      max,
      zones: (zones ?? []).map((z, k) => ({ to: z.to, slot: typeof z.tone === "number" ? z.tone : ZONE_TONE[z.tone ?? (["good", "warn", "bad"] as const)[k % 3]], pattern: PATTERNS[k % PATTERNS.length] })),
      sweep,
      ticks,
      minLabel: vf(min),
      maxLabel: vf(max),
      patterns: ctx.patterns !== false,
      state: loading ? "loading" : "ready",
    }),
    [value, min, max, zones, sweep, ticks, vf, ctx.patterns, loading],
  )
  const name = label ?? "Gauge"
  const zone = spec.zones.length ? (zones ?? []).find((z) => value <= z.to) : undefined
  const text = `${vf(value)} of ${vf(max)}${zone && typeof zone.tone === "string" ? `, ${zone.tone}` : ""}`
  const summary = `${label ? `${label}. ` : ""}Gauge reading ${vf(value)} on a scale from ${vf(min)} to ${vf(max)}.${description ? ` ${description}` : ""}`
  const table: TableModel = { head: ["Reading", "Minimum", "Maximum"], rows: [[vf(value), vf(min), vf(max)]] }
  return (
    <ChartCanvas
      slot={props["data-slot"] ?? "gauge"}
      recipe={gaugeRecipe}
      spec={spec}
      kindLabel="Gauge"
      label={name}
      summary={summary}
      table={table}
      describe={() => null}
      interactive={false}
      animate={animate}
      seed={seed}
      meter={{ min, max, now: Math.max(min, Math.min(max, value)), text }}
      overlay={(L) => {
        const g = layoutGauge(spec, { w: L.w, h: L.h })
        return (
          <AtPoint x={g.cx} y={g.cy + (spec.sweep <= 180 ? 26 : 14)} box={{ w: L.w, h: L.h }}>
            {children ?? <ChartCenterLabel value={vf(value)} />}
          </AtPoint>
        )
      }}
    />
  )
}

function Gauge(props: GaugeProps) {
  return useSelfContained(props, () => ({}), false, () => <GaugeBody {...props} />, { className: cn("aspect-[2/1] max-w-md", props.className) })
}

type SparklineProps = Standalone & {
  data: readonly (number | null)[] | readonly Row[]
  dataKey?: string
  xKey?: string
  variant?: "line" | "area" | "bar"
  slot?: number
  series?: string
  ends?: boolean
  extremes?: boolean
  valueFormatter?: (value: number) => string
  interactive?: boolean
  label?: string
  animate?: boolean
  seed?: string | number
}

function SparklineBody(props: SparklineProps) {
  const { data, dataKey, xKey, variant = "line", slot, series, ends = true, extremes = false, valueFormatter, interactive = false, label, animate = false, seed } = props
  const ctx = useChart()
  const vf = valueFormatter ?? formatNumber
  const values = React.useMemo(() => {
    const all = (data as readonly unknown[]).map((d) => (typeof d === "object" && d !== null ? toNum((d as Row)[dataKey ?? "value"]) : toNum(d)))
    return all.length > 600 ? lttb(all.map((v, i) => [i, v ?? 0] as [number, number]), 600).map((i) => all[i]) : all
  }, [data, dataKey])
  const at = series ? ctx.keys.indexOf(series) : -1
  const sl = slot ?? (at >= 0 ? at : 0)
  const spec = React.useMemo<SparkSpec>(() => {
    const real = values.filter(isNum)
    const lo = real.length ? Math.min(...real) : 0
    const hi = real.length ? Math.max(...real) : 1
    const pad = variant === "bar" ? 0 : (hi - lo || 1) * 0.04
    return { type: "spark", variant, values, min: variant === "bar" ? Math.min(0, lo) : lo - pad, max: hi + pad, slot: sl, ends, extremes, state: real.length ? "ready" : "empty" }
  }, [values, variant, sl, ends, extremes])
  const real = values.filter(isNum)
  const trend = real.length > 1 ? (real[real.length - 1] > real[0] ? "rising" : real[real.length - 1] < real[0] ? "falling" : "flat") : "flat"
  const name = label ?? "Trend"
  const summary = real.length ? `${name}: ${real.length} points from ${vf(real[0])} to ${vf(real[real.length - 1])}, lowest ${vf(Math.min(...real))}, highest ${vf(Math.max(...real))}, ${trend}.` : `${name}: no data.`
  const cat = (i: number) => (xKey && typeof data[i] === "object" && data[i] !== null ? String((data[i] as Row)[xKey] ?? i + 1) : `Point ${i + 1}`)
  const table = React.useMemo<TableModel | null>(
    () =>
      interactive
        ? { head: [xKey ?? "Point", dataKey ?? "Value"], rows: values.slice(0, TABLE_ROW_CAP).map((v, i) => [cat(i), isNum(v) ? vf(v) : ""]), clipped: values.length > TABLE_ROW_CAP ? { shown: TABLE_ROW_CAP, total: values.length } : undefined }
        : null,
    [interactive, values, xKey, dataKey, vf], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const describe = React.useCallback(
    (index: number): Described | null => {
      const v = values[index]
      if (!isNum(v)) return null
      return { label: cat(index), payload: [{ dataKey: dataKey ?? "value", name: name, value: v, color: `var(--ll-${SLOT_KEYS[sl % SLOT_KEYS.length]})`, payload: typeof data[index] === "object" ? (data[index] as Row) : undefined, slot: sl, kind: "line" }], announce: `${cat(index)}: ${vf(v)}` }
    },
    [values, sl, name, vf, data, dataKey], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return <ChartCanvas slot={props["data-slot"] ?? "sparkline"} recipe={sparkRecipe} spec={spec} kindLabel="Sparkline" label={name} summary={summary} table={table} describe={describe} interactive={interactive && spec.state === "ready"} animate={animate} seed={seed} onSelect={props.onSelect} />
}

function Sparkline(props: SparklineProps) {
  const cfg = React.useMemo(() => props.config ?? ({} as ChartConfig), [props.config])
  const ctx = React.useContext(ChartContext)
  if (ctx) return <SparklineBody {...props} />
  return (
    <ChartContainer config={cfg} className={cn("aspect-auto h-10 w-28", props.className)}>
      <SparklineBody {...props} />
      {props.interactive && props.tooltip !== false ? <ChartTooltip /> : null}
    </ChartContainer>
  )
}

type TallyChartProps = Standalone & {
  data: readonly Row[]
  nameKey?: string
  valueKey?: string
  unit?: number
  valueFormatter?: (value: number) => string
  label?: string
  description?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

function TallyChartBody(props: TallyChartProps) {
  const { data, nameKey, valueKey, unit = 0, valueFormatter, label, description, loading, emptyText, animate, seed, onActiveChange } = props
  const ctx = useChart()
  const nk = nameKey ?? inferXKey(data)
  const vk = valueKey ?? inferSeries(data, nk, undefined)[0] ?? "value"
  const vf = valueFormatter ?? formatNumber
  const all = React.useMemo(
    () =>
      data.map((r, i) => {
        const key = String(r[nk] ?? i)
        const at = ctx.keys.indexOf(key)
        return { key, name: labelText(ctx.config, key), slot: at >= 0 ? at : i, count: Math.max(0, Math.round(toNum(r[vk]) ?? 0)), row: r }
      }),
    [data, nk, vk, ctx.keys, ctx.config],
  )
  const spec = React.useMemo<TallySpec>(() => {
    const drawn = all.filter((a) => !ctx.hidden.has(a.key))
    return { type: "tally", rows: drawn.map((a) => ({ key: a.key, name: a.name, slot: a.slot, count: a.count })), unit, totals: drawn.map((a) => vf(a.count)), state: loading ? "loading" : drawn.length ? "ready" : "empty", stateText: loading ? "Loading" : emptyText }
  }, [all, ctx.hidden, unit, vf, loading, emptyText])
  const name = label ?? "Tally chart"
  const summary = spec.state === "ready" ? `${label ? `${label}. ` : ""}Tally chart: ${spec.rows.map((r) => `${r.name} ${vf(r.count)}`).join(", ")}.${description ? ` ${description}` : ""}` : `${name}. ${spec.state === "loading" ? "Loading." : "No data."}`
  const table = React.useMemo<TableModel>(() => ({ head: [nk, vk], rows: spec.rows.map((r) => [r.name, vf(r.count)]) }), [spec, nk, vk, vf])
  useLegend(ctx.store, all.map((a) => ({ key: a.key, slot: a.slot, pattern: "solid" as Pattern, marker: "circle" as MarkerShape, dash: "solid" as Dash, kind: "bar" as XYKind })))
  const describe = React.useCallback(
    (index: number): Described | null => {
      const r = spec.rows[index]
      if (!r) return null
      return { label: r.name, payload: [{ dataKey: r.key, name: r.name, value: r.count, color: `var(--color-${r.key})`, slot: r.slot, kind: "bar" }], announce: `${r.name}: ${vf(r.count)}` }
    },
    [spec, vf],
  )
  return <ChartCanvas slot={props["data-slot"] ?? "tally-chart"} recipe={tallyRecipe} spec={spec} kindLabel="Tally chart" label={name} summary={summary} table={table} describe={describe} animate={animate} seed={seed} onActiveChange={onActiveChange} onSelect={props.onSelect} interactive={spec.state === "ready"} />
}

function TallyChart(props: TallyChartProps) {
  const nk = props.nameKey ?? inferXKey(props.data)
  return useSelfContained(props, () => Object.fromEntries(props.data.map((r) => [String(r[nk]), { label: String(r[nk]) }])) as ChartConfig, false, () => <TallyChartBody {...props} />, { className: cn("aspect-[16/9]", props.className) })
}

type HeatmapProps = Standalone & {
  data: readonly Row[]
  variant?: "calendar" | "grid"
  dateKey?: string
  valueKey?: string
  weeks?: number
  end?: string | Date
  weekStart?: 0 | 1
  rowKey?: string
  colKey?: string
  rows?: readonly string[]
  cols?: readonly string[]
  levels?: number
  thresholds?: readonly number[]
  slot?: number
  series?: string
  unit?: string
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  label?: string
  description?: string
  loading?: boolean
  emptyText?: string
  animate?: boolean
  seed?: string | number
  onActiveChange?: (info: { index: number; series: number | null } | null) => void
}

function HeatmapBody(props: HeatmapProps) {
  const { data, variant = "calendar", dateKey = "date", valueKey = "value", weeks, end, weekStart = 0, rowKey = "row", colKey = "col", rows, cols, levels = 5, thresholds, slot, series, unit, valueFormatter, showLegend = true, label, description, loading, emptyText, animate, seed, onActiveChange } = props
  const ctx = useChart()
  const vf = valueFormatter ?? formatNumber
  const at = series ? ctx.keys.indexOf(series) : -1
  const sl = slot ?? (at >= 0 ? at : 2)
  const cells = React.useMemo(
    () => (variant === "grid" ? buildGrid(data.map((r) => ({ row: r[rowKey], col: r[colKey], value: r[valueKey] })), { rows, cols, levels, thresholds }) : buildCalendar(data.map((r) => ({ date: r[dateKey], value: r[valueKey] })), { weeks, end, weekStart, levels, thresholds })),
    [variant, data, rowKey, colKey, valueKey, dateKey, rows, cols, levels, thresholds, weeks, end, weekStart],
  )
  const spec = React.useMemo<HeatSpec>(
    () => ({ type: "heat", cols: cells.cols, rows: cells.rows, levels: cells.levels, levelCount: levels, colLabels: cells.colLabels, rowLabels: cells.rowLabels, slot: sl, variant, legend: showLegend ? { less: "Less", more: "More" } : null, patterns: ctx.patterns !== false, state: loading ? "loading" : cells.levels.some((l) => l >= 0) ? "ready" : "empty", stateText: loading ? "Loading" : emptyText }),
    [cells, levels, sl, variant, showLegend, ctx.patterns, loading, emptyText],
  )
  const cellName = (k: number): string => {
    if (variant === "grid") return `${cells.rowLabels[Math.floor(k / cells.cols)]?.text ?? ""}, ${cells.colLabels[k % cells.cols]?.text ?? ""}`
    return formatDay(cells.days[k], true)
  }
  const total = cells.values.reduce<number>((n, v) => n + (isNum(v) ? v : 0), 0)
  const name = label ?? (variant === "grid" ? "Heat map" : "Calendar heat map")
  const summary = spec.state === "ready" ? `${label ? `${label}. ` : ""}${variant === "grid" ? "Heat map" : "Calendar heat map"} of ${cells.levels.filter((l) => l >= 0).length} ${variant === "grid" ? "cells" : "days"}, total ${vf(total)}${unit ? ` ${unit}` : ""}, busiest ${vf(cells.max)}.${description ? ` ${description}` : ""}` : `${name}. ${spec.state === "loading" ? "Loading." : "No data."}`
  const table = React.useMemo<TableModel>(() => {
    const rowsOut: string[][] = []
    cells.levels.forEach((lv, k) => {
      if (lv >= 0 && isNum(cells.values[k]) && (variant === "grid" || (cells.values[k] as number) > 0)) rowsOut.push([cellName(k), vf(cells.values[k] as number)])
    })
    return { head: [variant === "grid" ? "Cell" : "Day", unit ?? "Value"], rows: rowsOut.slice(0, 240), clipped: rowsOut.length > 240 ? { shown: 240, total: rowsOut.length } : undefined }
  }, [cells, variant, unit, vf]) // eslint-disable-line react-hooks/exhaustive-deps
  const describe = React.useCallback(
    (index: number): Described | null => {
      const v = cells.values[index]
      if (cells.levels[index] < 0 || !isNum(v)) return null
      const cn = cellName(index)
      return { label: cn, payload: [{ dataKey: valueKey, name: unit ?? "Value", value: v, color: `var(--ll-${SLOT_KEYS[sl % SLOT_KEYS.length]})`, slot: sl, kind: "bar" }], announce: `${cn}: ${vf(v)}${unit ? ` ${unit}` : ""}` }
    },
    [cells, sl, unit, vf, valueKey], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return <ChartCanvas slot={props["data-slot"] ?? "heatmap"} recipe={heatRecipe} spec={spec} kindLabel="Heat map" label={name} summary={summary} table={table} describe={describe} animate={animate} seed={seed} onActiveChange={onActiveChange} onSelect={props.onSelect} interactive={spec.state === "ready"} />
}

function Heatmap(props: HeatmapProps) {
  const ratio = props.variant === "grid" ? "aspect-[16/10]" : "aspect-[53/14]"
  return useSelfContained(props, () => ({}), false, () => <HeatmapBody {...props} />, { className: cn(ratio, props.className) })
}

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartSwatch,
  ChartCenterLabel,
  useChart,
  BarChart,
  LineChart,
  AreaChart,
  ScatterChart,
  PieChart,
  DonutChart,
  RadarChart,
  RadialChart,
  Gauge,
  Sparkline,
  TallyChart,
  Heatmap,
}
export type {
  ChartContainerProps,
  ChartTooltipProps,
  ChartTooltipContentProps,
  ChartLegendProps,
  ChartLegendContentProps,
  XYChartProps,
  BarChartProps,
  PieChartProps,
  RadarChartProps,
  RadialChartProps,
  GaugeProps,
  SparklineProps,
  TallyChartProps,
  HeatmapProps,
}
