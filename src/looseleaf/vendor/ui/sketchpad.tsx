// @ts-nocheck
"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { Button } from ".//button"
import { Paper, type PaperProps } from ".//paper"
import { useInk, useInkTier, useMergedRef } from "../lib/ink/react"
import {
  DARK_INKS,
  DRAW_TOOLS,
  SKETCH_COLORS,
  SKETCH_SIZES,
  canvasFrameRecipe,
  cursorMarkup,
  sketchSizeRecipe,
  sketchSwatchRecipe,
  sketchToolRecipe,
  strokeHit,
  strokeMarkup,
  strokesToSvg,
  svgDataUrl,
  type DrawTool,
  type SketchColor,
  type SketchPoint,
  type SketchSizeName,
  type SketchStroke,
  type SketchTool,
} from "../lib/ink/recipes/sketchpad-ink"
import { svgToPngDataUrl } from "../lib/sketch-export"
import { cn } from "../lib/utils"

type StrokeInput = Omit<SketchStroke, "id"> & { id?: string }

interface SketchpadHandle {
  undo(): void
  redo(): void
  clear(): void
  replay(): void
  strokes(): SketchStroke[]
  toSVG(options?: ExportOptions): string
  toDataURL(options?: ExportOptions): string
  toPNG(options?: ExportOptions & { scale?: number }): Promise<string | null>
}

interface ExportOptions {
  background?: boolean
  margin?: number
  title?: string
}

const TOOL_LABEL: Record<SketchTool, string> = { felt: "Felt", brush: "Brush", pencil: "Pencil", marker: "Marker", highlighter: "Highlighter", eraser: "Eraser" }
const COLOR_LABEL: Record<SketchColor, string> = { ink: "Ink", "ink-you": "Blue", red: "Red", green: "Green", marker: "Terracotta", tangerine: "Orange", hi: "Yellow", teal: "Teal", grape: "Purple", bubblegum: "Pink" }
const SIZE_LABEL: Record<SketchSizeName, string> = { fine: "Fine", medium: "Medium", bold: "Bold" }
const KEY_TOOL: Record<string, SketchTool> = { f: "felt", b: "brush", p: "pencil", m: "marker", h: "highlighter", e: "eraser" }
const SIZE_STEPS = [SKETCH_SIZES.fine, SKETCH_SIZES.medium, SKETCH_SIZES.bold]
const DEFAULT_TOOLS: readonly SketchTool[] = ["felt", "pencil", "marker", "highlighter", "eraser"]
const HISTORY = 100
const NO_IDS: ReadonlySet<string> = new Set()

const round1 = (v: number) => Math.round(v * 10) / 10
const isDrawTool = (t: SketchTool): t is DrawTool => (DRAW_TOOLS as readonly string[]).includes(t)
const sizeName = (size: number): SketchSizeName | undefined => (Object.keys(SKETCH_SIZES) as SketchSizeName[]).find((k) => Math.abs(SKETCH_SIZES[k] - size) < 0.05)

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void, boolean] {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange],
  )
  return [controlled ? value : inner, set, controlled]
}

function withIds(strokes: readonly StrokeInput[]): SketchStroke[] {
  return strokes.every((s) => s.id) ? (strokes as SketchStroke[]) : strokes.map((s, i) => (s.id ? (s as SketchStroke) : { ...s, id: `i${i}` }))
}

interface SketchpadContextValue {
  strokes: SketchStroke[]
  width: number
  height: number
  tool: SketchTool
  tools: readonly SketchTool[]
  color: SketchColor
  size: number
  readOnly: boolean
  disabled: boolean
  canUndo: boolean
  canRedo: boolean
  replaying: boolean
  replayKey: number
  replaySpeed: number
  seed: string
  announce: string
  rootRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLDivElement | null>
  selectTool(t: SketchTool): void
  setColor(c: SketchColor): void
  setSize(s: number): void
  commit(next: SketchStroke[], message: string): void
  nextId(): string
  say(message: string): void
  undo(): void
  redo(): void
  clear(): void
}

const SketchpadContext = React.createContext<SketchpadContextValue | null>(null)

function useSketchpad(): SketchpadContextValue {
  const ctx = React.useContext(SketchpadContext)
  if (!ctx) throw new Error("Sketchpad parts must be used inside <Sketchpad>")
  return ctx
}

const count = (n: number) => `${n} ${n === 1 ? "stroke" : "strokes"}`

type SketchpadProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "color"> & {
  value?: readonly StrokeInput[]
  defaultValue?: readonly StrokeInput[]
  onValueChange?: (strokes: SketchStroke[]) => void
  tool?: SketchTool
  defaultTool?: SketchTool
  onToolChange?: (tool: SketchTool) => void
  tools?: readonly SketchTool[]
  color?: SketchColor
  defaultColor?: SketchColor
  onColorChange?: (color: SketchColor) => void
  size?: number
  defaultSize?: number
  onSizeChange?: (size: number) => void
  width?: number
  height?: number
  readOnly?: boolean
  disabled?: boolean
  replay?: boolean
  replaySpeed?: number
  apiRef?: React.Ref<SketchpadHandle>
  seed?: string | number
}

function Sketchpad({
  className,
  children,
  ref,
  value,
  defaultValue,
  onValueChange,
  tool: toolProp,
  defaultTool = "felt",
  onToolChange,
  tools = DEFAULT_TOOLS,
  color: colorProp,
  defaultColor = "ink",
  onColorChange,
  size: sizeProp,
  defaultSize = SKETCH_SIZES.medium,
  onSizeChange,
  width = 640,
  height = 400,
  readOnly = false,
  disabled = false,
  replay = false,
  replaySpeed = 1,
  apiRef,
  seed,
  ...props
}: SketchpadProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLDivElement | null>(null)
  const lastButton = React.useRef<HTMLButtonElement | null>(null)
  const idBase = React.useId()
  const [strokesRaw, setStrokes, strokesControlled] = useControllable<readonly StrokeInput[]>(value, defaultValue ?? [], onValueChange as ((v: readonly StrokeInput[]) => void) | undefined)
  const strokes = React.useMemo(() => withIds(strokesRaw), [strokesRaw])
  const [tool, setToolRaw] = useControllable<SketchTool>(toolProp, defaultTool, onToolChange)
  const [color, setColor] = useControllable<SketchColor>(colorProp, defaultColor, onColorChange)
  const [size, setSize] = useControllable<number>(sizeProp, defaultSize, onSizeChange)
  const [announce, setAnnounce] = React.useState("")
  const [replayN, setReplayN] = React.useState(0)

  const latest = React.useRef({ strokes, color, tool })
  latest.current = { strokes, color, tool }
  const hist = React.useRef<{ past: SketchStroke[][]; future: SketchStroke[][]; last: readonly StrokeInput[] | null }>({ past: [], future: [], last: null })
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  const counter = React.useRef(0)

  React.useEffect(() => {
    if (strokesControlled && value !== hist.current.last && (hist.current.past.length || hist.current.future.length)) {
      hist.current.past = []
      hist.current.future = []
      force()
    }
  }, [value, strokesControlled])

  const emit = React.useCallback(
    (next: SketchStroke[]) => {
      hist.current.last = next
      setStrokes(next)
    },
    [setStrokes],
  )

  const commit = React.useCallback(
    (next: SketchStroke[], message: string) => {
      const h = hist.current
      h.past.push(latest.current.strokes)
      if (h.past.length > HISTORY) h.past.shift()
      h.future = []
      emit(next)
      setAnnounce(`${message} ${count(next.length)}.`)
    },
    [emit],
  )

  const undo = React.useCallback(() => {
    const h = hist.current
    const prev = h.past.pop()
    if (!prev) return
    h.future.push(latest.current.strokes)
    emit(prev)
    setAnnounce(`Undone. ${count(prev.length)}.`)
    force()
  }, [emit])

  const redo = React.useCallback(() => {
    const h = hist.current
    const next = h.future.pop()
    if (!next) return
    h.past.push(latest.current.strokes)
    emit(next)
    setAnnounce(`Redone. ${count(next.length)}.`)
    force()
  }, [emit])

  const clear = React.useCallback(() => {
    if (!latest.current.strokes.length) return
    commit([], "Cleared.")
  }, [commit])

  const selectTool = React.useCallback(
    (t: SketchTool) => {
      const prev = latest.current.tool
      setToolRaw(t)
      const c = latest.current.color
      if (t === "highlighter" && DARK_INKS.has(c)) setColor("hi")
      else if (prev === "highlighter" && t !== "highlighter" && c === "hi") setColor("ink")
    },
    [setToolRaw, setColor],
  )

  const nextId = React.useCallback(() => {
    const used = new Set(latest.current.strokes.map((s) => s.id))
    let id: string
    do id = `s${(counter.current++).toString(36)}`
    while (used.has(id))
    return id
  }, [])

  const resolve = React.useCallback((name: string) => {
    const el = rootRef.current
    if (!el || typeof getComputedStyle === "undefined") return undefined
    return getComputedStyle(el).getPropertyValue(name).trim() || undefined
  }, [])

  const toSVG = React.useCallback(
    (o: ExportOptions = {}) =>
      strokesToSvg(latest.current.strokes, {
        width,
        height,
        resolve,
        margin: o.margin,
        title: o.title,
        background: o.background === false ? undefined : (resolve("--ll-paper") ?? "var(--ll-paper)"),
      }),
    [width, height, resolve],
  )

  React.useImperativeHandle(
    apiRef,
    (): SketchpadHandle => ({
      undo,
      redo,
      clear,
      replay: () => setReplayN((n) => n + 1),
      strokes: () => latest.current.strokes,
      toSVG,
      toDataURL: (o) => svgDataUrl(toSVG(o)),
      toPNG: (o = {}) => {
        const m = o.margin ?? 0
        return svgToPngDataUrl(svgDataUrl(toSVG(o)), width + 2 * m, height + 2 * m, o.scale)
      },
    }),
    [undo, redo, clear, toSVG, width, height],
  )

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onIn = (e: FocusEvent) => {
      lastButton.current = e.target instanceof HTMLButtonElement ? e.target : null
    }
    const onOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLButtonElement && !e.target.disabled) lastButton.current = null
    }
    root.addEventListener("focusin", onIn)
    root.addEventListener("focusout", onOut)
    return () => {
      root.removeEventListener("focusin", onIn)
      root.removeEventListener("focusout", onOut)
    }
  }, [])
  React.useEffect(() => {
    const root = rootRef.current
    const now = document.activeElement
    const was = lastButton.current
    const stranded = now instanceof HTMLButtonElement ? now : now === document.body || !now ? was : null
    if (stranded?.disabled && root?.contains(stranded)) {
      lastButton.current = null
      canvasRef.current?.focus({ preventScroll: true })
    }
  })

  const interactive = !readOnly && !disabled
  const replaying = replay || replayN > 0
  const ctx: SketchpadContextValue = {
    strokes,
    width,
    height,
    tool,
    tools,
    color,
    size,
    readOnly,
    disabled,
    canUndo: interactive && hist.current.past.length > 0,
    canRedo: interactive && hist.current.future.length > 0,
    replaying,
    replayKey: replayN,
    replaySpeed,
    seed: `${idBase}${seed ?? ""}`,
    announce,
    rootRef,
    canvasRef,
    selectTool,
    setColor,
    setSize,
    commit,
    nextId,
    say: setAnnounce,
    undo,
    redo,
    clear,
  }

  return (
    <SketchpadContext.Provider value={ctx}>
      <div data-slot="sketchpad" data-disabled={disabled ? "" : undefined} data-readonly={readOnly ? "" : undefined} ref={useMergedRef(rootRef, ref)} className={cn("flex w-full flex-col gap-3", className)} {...props}>
        {children ?? (
          <>
            {readOnly ? null : (
              <SketchpadToolbar>
                <SketchpadTools />
                <span className="ms-auto flex items-center gap-2">
                  <SketchpadUndo />
                  <SketchpadRedo />
                  <SketchpadClear />
                </span>
                <div className="flex w-full flex-wrap items-center gap-x-4">
                  <SketchpadColors />
                  <SketchpadSizes />
                </div>
              </SketchpadToolbar>
            )}
            <SketchpadCanvas />
          </>
        )}
      </div>
    </SketchpadContext.Provider>
  )
}

function SketchpadToolbar({ className, children, ...props }: Omit<PaperProps, "stock" | "edge" | "tilt">) {
  return (
    <Paper
      data-slot="sketchpad-toolbar"
      role="group"
      aria-label="Drawing tools"
      stock="slip"
      edge="cut"
      tilt={false}
      shadow="hair"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5", className)}
      {...props}
    >
      {children}
    </Paper>
  )
}

type GroupProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Root>, "value" | "defaultValue" | "onValueChange" | "orientation">

function SketchpadTools({ className, children, tools: toolsProp, ...props }: GroupProps & { tools?: readonly SketchTool[] }) {
  const ctx = useSketchpad()
  const tools = toolsProp ?? ctx.tools
  return (
    <RadioGroupPrimitive.Root
      data-slot="sketchpad-tools"
      aria-label="Tool"
      orientation="horizontal"
      value={ctx.tool}
      onValueChange={(v) => ctx.selectTool(v as SketchTool)}
      disabled={ctx.disabled || ctx.readOnly}
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      {...props}
    >
      {children ?? tools.map((t) => <SketchpadTool key={t} value={t} />)}
    </RadioGroupPrimitive.Root>
  )
}

type ItemProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "value"> & { seed?: string | number }

function SketchpadTool({ value, className, children, seed, ref, ...props }: ItemProps & { value: SketchTool }) {
  const ctx = useSketchpad()
  const { hostRef, hostProps, node } = useInk({ recipe: sketchToolRecipe, params: { tool: value, color: ctx.color }, kind: "sketchpad-tool", seed })
  return (
    <RadioGroupPrimitive.Item
      data-slot="sketchpad-tool"
      data-tool={value}
      value={value}
      ref={useMergedRef<HTMLButtonElement>(hostRef, ref)}
      {...hostProps}
      className={cn(
        "relative isolate inline-flex h-[52px] min-w-16 cursor-pointer flex-col items-center justify-end px-2 pb-[5px] font-hand text-[14px] leading-none font-bold whitespace-nowrap text-ink transition-[translate] duration-(--ll-dur-press) ease-out active:translate-y-(--ll-press-sink) disabled:pointer-events-none disabled:text-pencil-text",
        "forced-colors:data-[state=checked]:[outline:3px_solid_Highlight]!",
        className,
      )}
      {...props}
    >
      {node}
      <span className="ll-ink-room">{children ?? TOOL_LABEL[value]}</span>
    </RadioGroupPrimitive.Item>
  )
}

function SketchpadColors({ className, children, colors = SKETCH_COLORS, ...props }: GroupProps & { colors?: readonly SketchColor[] }) {
  const ctx = useSketchpad()
  return (
    <RadioGroupPrimitive.Root
      data-slot="sketchpad-colors"
      aria-label="Color"
      orientation="horizontal"
      value={ctx.color}
      onValueChange={(v) => ctx.setColor(v as SketchColor)}
      disabled={ctx.disabled || ctx.readOnly}
      className={cn("flex flex-wrap items-center", className)}
      {...props}
    >
      {children ?? colors.map((c) => <SketchpadColor key={c} value={c} />)}
    </RadioGroupPrimitive.Root>
  )
}

function SketchpadColor({ value, className, seed, ref, style, "aria-label": label, ...props }: ItemProps & { value: SketchColor }) {
  const { hostRef, hostProps, node } = useInk({ recipe: sketchSwatchRecipe, params: { color: value }, kind: "sketchpad-swatch", seed })
  return (
    <RadioGroupPrimitive.Item
      data-slot="sketchpad-color"
      data-color={value}
      value={value}
      aria-label={label ?? COLOR_LABEL[value]}
      ref={useMergedRef<HTMLButtonElement>(hostRef, ref)}
      {...hostProps}
      style={{ "--sw": `var(--ll-${value})`, ...style } as React.CSSProperties}
      className={cn("relative isolate inline-flex size-7 cursor-pointer items-center justify-center after:absolute after:-inset-px disabled:pointer-events-none disabled:opacity-60 forced-colors:[forced-color-adjust:none] forced-colors:bg-(--sw) forced-colors:data-[state=checked]:[outline:3px_solid_Highlight]!", className)}
      {...props}
    >
      {node}
    </RadioGroupPrimitive.Item>
  )
}

function SketchpadSizes({ className, children, ...props }: GroupProps) {
  const ctx = useSketchpad()
  return (
    <RadioGroupPrimitive.Root
      data-slot="sketchpad-sizes"
      aria-label="Width"
      orientation="horizontal"
      value={sizeName(ctx.size) ?? ""}
      onValueChange={(v) => ctx.setSize(SKETCH_SIZES[v as SketchSizeName])}
      disabled={ctx.disabled || ctx.readOnly}
      className={cn("flex items-center", className)}
      {...props}
    >
      {children ?? (Object.keys(SKETCH_SIZES) as SketchSizeName[]).map((s) => <SketchpadSize key={s} value={s} />)}
    </RadioGroupPrimitive.Root>
  )
}

function SketchpadSize({ value, className, seed, ref, "aria-label": label, ...props }: ItemProps & { value: SketchSizeName }) {
  const { hostRef, hostProps, node } = useInk({ recipe: sketchSizeRecipe, params: { size: value }, kind: "sketchpad-size", seed })
  return (
    <RadioGroupPrimitive.Item
      data-slot="sketchpad-size"
      data-size={value}
      value={value}
      aria-label={label ?? `${SIZE_LABEL[value]} line`}
      ref={useMergedRef<HTMLButtonElement>(hostRef, ref)}
      {...hostProps}
      className={cn("relative isolate inline-flex size-7 cursor-pointer items-center justify-center disabled:pointer-events-none disabled:opacity-60 forced-colors:after:absolute forced-colors:after:top-1/2 forced-colors:after:left-1/2 forced-colors:after:size-2 forced-colors:after:-translate-1/2 forced-colors:after:rounded-full forced-colors:after:bg-[CanvasText] forced-colors:data-[state=checked]:[outline:3px_solid_Highlight]!", className)}
      {...props}
    >
      {node}
    </RadioGroupPrimitive.Item>
  )
}

type ButtonProps = React.ComponentProps<typeof Button>

function SketchpadUndo({ children, onClick, ...props }: ButtonProps) {
  const ctx = useSketchpad()
  return (
    <Button
      data-slot="sketchpad-undo"
      variant="ghost"
      size="sm"
      type="button"
      disabled={!ctx.canUndo}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.undo()
      }}
      {...props}
    >
      {children ?? "Undo"}
    </Button>
  )
}

function SketchpadRedo({ children, onClick, ...props }: ButtonProps) {
  const ctx = useSketchpad()
  return (
    <Button
      data-slot="sketchpad-redo"
      variant="ghost"
      size="sm"
      type="button"
      disabled={!ctx.canRedo}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.redo()
      }}
      {...props}
    >
      {children ?? "Redo"}
    </Button>
  )
}

function SketchpadClear({ children, onClick, ...props }: ButtonProps) {
  const ctx = useSketchpad()
  return (
    <Button
      data-slot="sketchpad-clear"
      variant="ghost"
      size="sm"
      type="button"
      disabled={ctx.disabled || ctx.readOnly || !ctx.strokes.length}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.clear()
      }}
      {...props}
    >
      {children ?? "Clear"}
    </Button>
  )
}

interface ReplayTiming {
  delay: number
  dur: number
}

const StrokeShape = React.memo(function StrokeShape({ stroke, dim, replay, maskId, width, height }: { stroke: SketchStroke; dim: boolean; replay: ReplayTiming | null; maskId: string; width: number; height: number }) {
  const tier = useInkTier()
  const m = strokeMarkup(stroke, { tier })
  const style = dim ? { opacity: 0.22 } : undefined
  if (!replay) return <g data-stroke={stroke.id} style={style} dangerouslySetInnerHTML={{ __html: m.svg }} />
  const w = Math.max(8, strokeWidthOf(stroke) * 1.6 + 6)
  return (
    <g data-stroke={stroke.id} mask={`url(#${maskId})`} style={style}>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={width + 40} height={height + 40}>
        <path
          d={m.centre}
          pathLength={1}
          fill="none"
          stroke="var(--ll-photo)"
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ll-draw"
          style={{ "--ll-draw-delay": `${replay.delay.toFixed(2)}s`, animationDuration: `${replay.dur.toFixed(2)}s`, animationTimingFunction: "linear" } as React.CSSProperties}
        />
      </mask>
      <g dangerouslySetInnerHTML={{ __html: m.svg }} />
    </g>
  )
})

const strokeWidthOf = (s: SketchStroke): number => (s.tool === "highlighter" ? 14 : s.tool === "marker" ? 8 : 3.4) * s.size

interface Gesture {
  pointer: number | "key"
  kind: string
  tool: SketchTool
  color: SketchColor
  size: number
  pts: SketchPoint[]
  tail: SketchPoint | null
  erase: Set<string> | null
}

const SAMPLE_GAP = 0.8
const LIVE_POINTS = 480
const PALM_MS = 1500

function preview(pts: SketchPoint[]): SketchPoint[] {
  if (pts.length <= LIVE_POINTS) return pts.slice()
  let k = 2
  while (pts.length / k > LIVE_POINTS) k *= 2
  const out: SketchPoint[] = []
  for (let i = 0; i < pts.length; i += k) out.push(pts[i])
  const tail = pts[pts.length - 1]
  if (out[out.length - 1] !== tail) out.push(tail)
  return out
}

function thin(pts: SketchPoint[]): SketchPoint[] {
  const out: SketchPoint[] = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1.5) out.push(p)
  }
  const tail = pts[pts.length - 1]
  if (out.length > 1 && out[out.length - 1] !== tail) out.push(tail)
  return out
}

const PAPERS: Record<NonNullable<SketchpadCanvasProps["paper"]>, Pick<PaperProps, "stock" | "rules">> = {
  plain: { stock: "paper", rules: "none" },
  ruled: { stock: "paper", rules: "ruled" },
  graph: { stock: "graph" },
  dots: { stock: "dot-grid" },
  kraft: { stock: "kraft", rules: "none" },
}

type SketchpadCanvasProps = Omit<React.ComponentProps<"div">, "children"> & {
  paper?: "plain" | "ruled" | "graph" | "dots" | "kraft"
  paperProps?: Omit<PaperProps, "children" | "ref">
  label?: string
  children?: React.ReactNode
  seed?: string | number
}

function SketchpadCanvas({ className, children, paper = "plain", paperProps, label = "Drawing", seed, ref, onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, onBlur, ...props }: SketchpadCanvasProps) {
  const ctx = useSketchpad()
  const tier = useInkTier()
  const { hostRef, hostProps, node } = useInk({ recipe: canvasFrameRecipe, params: {}, kind: "sketchpad-canvas", size: [ctx.width, ctx.height], seed })
  const help = React.useId()
  const uid = ctx.seed.replace(/[^a-zA-Z0-9]/g, "")
  const surface = React.useRef<SVGSVGElement | null>(null)
  const gesture = React.useRef<Gesture | null>(null)
  const penSeen = React.useRef(Number.NEGATIVE_INFINITY)
  const frame = React.useRef(0)
  const [live, setLive] = React.useState<SketchStroke | null>(null)
  const [erasing, setErasing] = React.useState<ReadonlySet<string>>(NO_IDS)
  const [cursor, setCursor] = React.useState<[number, number] | null>(null)
  const interactive = !ctx.readOnly && !ctx.disabled
  const { width: W, height: H } = ctx

  React.useEffect(
    () => () => {
      if (frame.current && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(frame.current)
    },
    [],
  )

  const project = (clientX: number, clientY: number): SketchPoint => {
    const r = surface.current?.getBoundingClientRect()
    const sx = r && r.width ? W / r.width : 1
    const sy = r && r.height ? H / r.height : 1
    return [round1(Math.min(W, Math.max(0, ((clientX ?? 0) - (r?.left ?? 0)) * sx))), round1(Math.min(H, Math.max(0, ((clientY ?? 0) - (r?.top ?? 0)) * sy)))]
  }

  const liveOf = (g: Gesture): SketchStroke => ({ id: "live", tool: g.tool as DrawTool, color: g.color, size: g.size, pts: preview(g.pts) })
  const flush = () => {
    const g = gesture.current
    if (g && g.tool !== "eraser") setLive(liveOf(g))
  }
  const schedule = () => {
    if (frame.current) return
    if (typeof requestAnimationFrame === "undefined") return flush()
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      flush()
    })
  }
  const eraseAt = (g: Gesture, x: number, y: number) => {
    const set = g.erase as Set<string>
    let changed = false
    for (const s of ctx.strokes) {
      if (!set.has(s.id) && strokeHit(s, x, y, 9)) {
        set.add(s.id)
        changed = true
      }
    }
    if (changed) setErasing(new Set(set))
  }
  const begin = (pointer: Gesture["pointer"], kind: string, pt: SketchPoint, eraser: boolean) => {
    const tool: SketchTool = eraser ? "eraser" : ctx.tool
    const g: Gesture = { pointer, kind, tool, color: ctx.color, size: ctx.size, pts: [pt], tail: null, erase: tool === "eraser" ? new Set() : null }
    gesture.current = g
    if (g.erase) eraseAt(g, pt[0], pt[1])
    else setLive(liveOf(g))
  }
  const extend = (pt: SketchPoint) => {
    const g = gesture.current
    if (!g) return
    const last = g.pts[g.pts.length - 1]
    if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) < SAMPLE_GAP) {
      g.tail = pt
      return
    }
    g.tail = null
    g.pts.push(pt)
    if (g.erase) eraseAt(g, pt[0], pt[1])
    else schedule()
  }
  const end = (cancel: boolean) => {
    const g = gesture.current
    if (!g) return
    gesture.current = null
    if (frame.current && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(frame.current)
    frame.current = 0
    setLive(null)
    if (g.erase) {
      setErasing(NO_IDS)
      if (!cancel && g.erase.size) {
        const gone = g.erase
        ctx.commit(ctx.strokes.filter((s) => !gone.has(s.id)), `Erased ${count(gone.size)}.`)
      }
      return
    }
    if (cancel || !isDrawTool(g.tool)) return
    if (g.tail) {
      const held = g.pts[g.pts.length - 1][2]
      g.pts.push(held !== undefined && g.tail[2] === undefined ? [g.tail[0], g.tail[1], held] : g.tail)
    }
    ctx.commit([...ctx.strokes, { id: ctx.nextId(), tool: g.tool, color: g.color, size: g.size, pts: thin(g.pts) }], "Stroke added.")
  }

  React.useEffect(() => {
    if (!interactive && gesture.current) end(true)
  })

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (!interactive || e.defaultPrevented) return
    const type = e.pointerType || "mouse"
    if (type === "mouse" && (e.button ?? 0) !== 0) return
    if (type === "pen") {
      penSeen.current = e.timeStamp
      if (gesture.current?.kind === "touch") end(true)
    } else if (type === "touch" && e.timeStamp - penSeen.current < PALM_MS) return
    if (gesture.current) return
    e.currentTarget.focus({ preventScroll: true })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
    }
    setCursor(null)
    const p = project(e.clientX, e.clientY)
    if (type === "pen" && e.pressure > 0) p[2] = Math.round(e.pressure * 100) / 100
    begin(e.pointerId, type, p, (type === "pen" && (e.buttons & 32) !== 0) || ctx.tool === "eraser")
    e.preventDefault()
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (e.pointerType === "pen") penSeen.current = e.timeStamp
    const g = gesture.current
    if (!g || g.pointer !== e.pointerId) return
    const list = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : []
    for (const c of list.length ? list : [e.nativeEvent]) {
      const p = project(c.clientX, c.clientY)
      if (e.pointerType === "pen" && c.pressure > 0) p[2] = Math.round(c.pressure * 100) / 100
      extend(p)
    }
  }
  const onUp = (cancel: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (cancel) onPointerCancel?.(e)
    else onPointerUp?.(e)
    if (e.pointerType === "pen") penSeen.current = e.timeStamp
    const g = gesture.current
    if (!g || g.pointer !== e.pointerId) return
    if (!cancel) {
      const p = project(e.clientX, e.clientY)
      const held = g.pts[g.pts.length - 1][2]
      if (g.kind === "pen" && held !== undefined) p[2] = held
      if (g.pts.length > 1 || Math.hypot(p[0] - g.pts[0][0], p[1] - g.pts[0][1]) > 1) extend(p)
    }
    end(cancel)
  }
  const onLost = (e: React.PointerEvent<HTMLDivElement>) => {
    onLostPointerCapture?.(e)
    if (gesture.current && gesture.current.pointer === e.pointerId) end(false)
  }

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const k = e.key
    const mod = e.metaKey || e.ctrlKey
    if (mod && k.toLowerCase() === "z") {
      e.preventDefault()
      if (e.shiftKey) ctx.redo()
      else ctx.undo()
      return
    }
    if (mod && k.toLowerCase() === "y") {
      e.preventDefault()
      ctx.redo()
      return
    }
    if (!interactive || mod || e.altKey && !k.startsWith("Arrow") || e.target !== e.currentTarget) return
    const tool = KEY_TOOL[k.toLowerCase()]
    if (tool && k.length === 1) {
      if (ctx.tools.includes(tool)) {
        e.preventDefault()
        ctx.selectTool(tool)
        ctx.say(`${TOOL_LABEL[tool]}.`)
      }
      return
    }
    if (k === "[" || k === "]") {
      e.preventDefault()
      const i = SIZE_STEPS.reduce((best, v, j) => (Math.abs(v - ctx.size) < Math.abs(SIZE_STEPS[best] - ctx.size) ? j : best), 0)
      const next = SIZE_STEPS[Math.min(SIZE_STEPS.length - 1, Math.max(0, i + (k === "]" ? 1 : -1)))]
      ctx.setSize(next)
      ctx.say(`${SIZE_LABEL[sizeName(next) ?? "medium"]} line.`)
      return
    }
    if (k.startsWith("Arrow")) {
      e.preventDefault()
      const d = e.shiftKey ? 32 : e.altKey ? 2 : 8
      const [x, y] = cursor ?? [W / 2, H / 2]
      const nx = round1(Math.min(W, Math.max(0, x + (k === "ArrowRight" ? d : k === "ArrowLeft" ? -d : 0))))
      const ny = round1(Math.min(H, Math.max(0, y + (k === "ArrowDown" ? d : k === "ArrowUp" ? -d : 0))))
      setCursor([nx, ny])
      if (gesture.current?.pointer === "key") extend([nx, ny])
      return
    }
    if (k === " " || k === "Enter") {
      e.preventDefault()
      const at = cursor ?? [W / 2, H / 2]
      setCursor([at[0], at[1]])
      if (gesture.current?.pointer === "key") end(false)
      else if (!gesture.current) {
        begin("key", "key", [at[0], at[1]], ctx.tool === "eraser")
        ctx.say(ctx.tool === "eraser" ? "Eraser down." : "Pen down.")
      }
      return
    }
    if (k === "Escape") {
      if (gesture.current?.pointer === "key") {
        end(true)
        ctx.say("Stroke canceled.")
      } else setCursor(null)
    }
  }

  const dropKeyboard = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    if (gesture.current?.pointer === "key") end(false)
    if (!e.currentTarget.contains(e.relatedTarget)) setCursor(null)
  }

  const p = PAPERS[paper]
  const timing = React.useMemo<ReplayTiming[] | null>(() => {
    if (!ctx.replaying) return null
    let t = 0.2
    return ctx.strokes.map((s) => {
      const dur = Math.min(2.4, Math.max(0.14, strokeMarkup(s, { tier }).length / (420 * ctx.replaySpeed)))
      const r = { delay: t, dur }
      t += dur + 0.08
      return r
    })
  }, [ctx.replaying, ctx.strokes, ctx.replaySpeed, tier])
  const liveMarkup = React.useMemo(() => (live ? strokeMarkup(live, { tier, live: true }).svg : ""), [live, tier])
  const cursorSvg = React.useMemo(() => cursorMarkup(uid), [uid])

  const a11y = interactive
    ? ({ role: "application", "aria-roledescription": "drawing canvas", "aria-label": label, "aria-describedby": help, tabIndex: 0 } as const)
    : ({ role: "img", "aria-label": `${label}, ${count(ctx.strokes.length)}`, "aria-disabled": ctx.disabled || undefined } as const)

  return (
    <div
      data-slot="sketchpad-canvas"
      data-tool={interactive ? ctx.tool : undefined}
      data-drawing={live ? "" : undefined}
      ref={useMergedRef<HTMLDivElement>(hostRef, ref, ctx.canvasRef)}
      {...hostProps}
      {...a11y}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp(false)}
      onPointerCancel={onUp(true)}
      onLostPointerCapture={onLost}
      onKeyDown={onKey}
      onBlur={dropKeyboard}
      className={cn("relative isolate touch-none select-none", interactive ? (ctx.tool === "eraser" ? "cursor-cell" : "cursor-crosshair") : "cursor-default", className)}
      {...props}
    >
      {node}
      <Paper
        data-slot="sketchpad-paper"
        edge="cut"
        tilt={false}
        {...p}
        {...paperProps}
        className={cn("w-full", paperProps?.className)}
        style={{ aspectRatio: `${W} / ${H}`, ...paperProps?.style }}
      >
        {children}
        <svg
          ref={surface}
          data-slot="sketchpad-surface"
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full forced-color-adjust-none"
        >
          <g data-slot="sketchpad-strokes" key={ctx.replayKey}>
            {ctx.strokes.map((s, i) => (
              <StrokeShape key={s.id} stroke={s} dim={erasing.has(s.id)} replay={timing?.[i] ?? null} maskId={`ll-replay-${uid}-${i}`} width={W} height={H} />
            ))}
          </g>
          {live ? <g data-slot="sketchpad-live" dangerouslySetInnerHTML={{ __html: liveMarkup }} /> : null}
          {cursor ? <g data-slot="sketchpad-cursor" transform={`translate(${cursor[0]} ${cursor[1]})`} dangerouslySetInnerHTML={{ __html: cursorSvg }} /> : null}
        </svg>
      </Paper>
      <span id={help} className="sr-only">
        Draw with a pointer, or use the arrow keys to move a cursor and Space to put the pen down and lift it. F, B, P, M, H and E pick a tool, the bracket keys change the width, Control Z undoes.
      </span>
      <span role="status" className="sr-only">
        {ctx.announce}
      </span>
    </div>
  )
}

export {
  Sketchpad,
  SketchpadToolbar,
  SketchpadTools,
  SketchpadTool,
  SketchpadColors,
  SketchpadColor,
  SketchpadSizes,
  SketchpadSize,
  SketchpadUndo,
  SketchpadRedo,
  SketchpadClear,
  SketchpadCanvas,
  useSketchpad,
}
export type { SketchpadProps, SketchpadCanvasProps, SketchpadHandle, SketchStroke, SketchTool, SketchColor, SketchPoint, ExportOptions as SketchpadExportOptions }
