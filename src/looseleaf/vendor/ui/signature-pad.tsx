// @ts-nocheck
"use client"

import * as React from "react"

import { Button } from ".//button"
import { Input } from ".//input"
import { Sketchpad, SketchpadCanvas, type SketchColor, type SketchStroke } from ".//sketchpad"
import { useInk, useMergedRef } from "../lib/ink/react"
import { signatureBaselineRecipe, typedSignature } from "../lib/ink/recipes/signature-pad-ink"
import { strokesToSvg, svgDataUrl } from "../lib/ink/recipes/sketchpad-ink"
import { svgToPngDataUrl } from "../lib/sketch-export"
import { cn } from "../lib/utils"

type SignatureMode = "draw" | "type"

interface SignatureDetail {
  mode: SignatureMode
  strokes: SketchStroke[]
  text: string
}

interface SignaturePadContextValue {
  mode: SignatureMode
  setMode(m: SignatureMode): void
  typed: string
  setTyped(t: string): void
  strokes: SketchStroke[]
  setStrokes(s: SketchStroke[]): void
  value: string
  signed: boolean
  clear(): void
  width: number
  height: number
  disabled: boolean
  readOnly: boolean
  invalid: boolean
  message: string
  typedFallback: boolean
  seed: string
  penColor: SketchColor
  focusTyped(): void
}

const SignaturePadContext = React.createContext<SignaturePadContextValue | null>(null)

function useSignaturePad(): SignaturePadContextValue {
  const ctx = React.useContext(SignaturePadContext)
  if (!ctx) throw new Error("SignaturePad parts must be used inside <SignaturePad>")
  return ctx
}

type SignaturePadProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "color"> & {
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, detail: SignatureDetail) => void
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  message?: string
  mode?: SignatureMode
  defaultMode?: SignatureMode
  onModeChange?: (mode: SignatureMode) => void
  typedFallback?: boolean
  penColor?: SketchColor
  pen?: "brush" | "felt"
  format?: "svg" | "png"
  width?: number
  height?: number
  seed?: string | number
}

function SignaturePad({
  className,
  children,
  ref,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  required,
  disabled = false,
  readOnly = false,
  invalid: invalidProp = false,
  message = "Please sign in the box.",
  mode: modeProp,
  defaultMode = "draw",
  onModeChange,
  typedFallback = true,
  penColor = "ink-you",
  pen = "brush",
  format = "svg",
  width = 480,
  height = 180,
  seed,
  ...props
}: SignaturePadProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [strokes, setStrokesState] = React.useState<SketchStroke[]>([])
  const [typed, setTypedState] = React.useState("")
  const [modeInner, setModeInner] = React.useState<SignatureMode>(defaultMode)
  const [valueInner, setValueInner] = React.useState(defaultValue)
  const [invalidForm, setInvalidForm] = React.useState(false)
  const mode = modeProp ?? modeInner
  const value = valueProp ?? valueInner
  const uid = React.useId()
  const token = React.useRef(0)
  const published = React.useRef(valueProp ?? defaultValue)

  const resolve = React.useCallback((n: string) => {
    const el = rootRef.current
    return el && typeof getComputedStyle !== "undefined" ? getComputedStyle(el).getPropertyValue(n).trim() || undefined : undefined
  }, [])

  const compose = React.useCallback(
    (m: SignatureMode, s: SketchStroke[], t: string): string => {
      const pad = 6
      let svg = ""
      if (m === "draw" && s.length) svg = strokesToSvg(s, { width, height, resolve, margin: pad, title: "Signature" })
      else if (m === "type" && t.trim()) {
        const sig = typedSignature(t, width, height, `${uid}${seed ?? ""}`)
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${width + 2 * pad} ${height + 2 * pad}" width="${width + 2 * pad}" height="${height + 2 * pad}" role="img"><title>Signature</title>${sig.svg}</svg>`
        svg = svg.replace(/var\((--ll-[a-z0-9-]+)\)/g, (whole, n: string) => resolve(n) || whole)
      }
      return svg ? svgDataUrl(svg) : ""
    },
    [width, height, resolve, uid, seed],
  )

  const publish = React.useCallback(
    (m: SignatureMode, s: SketchStroke[], t: string) => {
      const detail: SignatureDetail = { mode: m, strokes: s, text: t }
      const svgUrl = compose(m, s, t)
      const put = (v: string) => {
        published.current = v
        setValueInner(v)
        onValueChange?.(v, detail)
      }
      const mine = ++token.current
      if (format === "png" && svgUrl) {
        const pad = 6
        void svgToPngDataUrl(svgUrl, width + 2 * pad, height + 2 * pad, 2).then((png) => {
          if (mine === token.current) put(png ?? svgUrl)
        })
      } else put(svgUrl)
      if (svgUrl) setInvalidForm(false)
    },
    [compose, format, width, height, onValueChange],
  )

  const setStrokes = (s: SketchStroke[]) => {
    setStrokesState(s)
    publish("draw", s, typed)
  }
  const setTyped = (t: string) => {
    setTypedState(t)
    publish("type", strokes, t)
  }
  const setMode = (m: SignatureMode) => {
    setModeInner(m)
    onModeChange?.(m)
    publish(m, strokes, typed)
  }
  const clear = () => {
    if (mode === "type") {
      setTypedState("")
      publish("type", strokes, "")
    } else {
      setStrokesState([])
      publish("draw", [], typed)
    }
  }

  React.useEffect(() => {
    if (valueProp === undefined || valueProp === published.current) return
    published.current = valueProp
    setStrokesState([])
    setTypedState("")
  }, [valueProp])

  React.useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const onReset = () => {
      if (!strokes.length && !typed && !value) return
      setStrokesState([])
      setTypedState("")
      publish(mode, [], "")
    }
    form.addEventListener("reset", onReset)
    return () => form.removeEventListener("reset", onReset)
  }, [strokes.length, typed, value, mode, publish])

  React.useEffect(() => {
    inputRef.current?.setCustomValidity(required && !value ? message : "")
  }, [required, value, message])

  const invalid = invalidProp || invalidForm
  const ctx: SignaturePadContextValue = {
    mode,
    setMode,
    typed,
    setTyped,
    strokes,
    setStrokes,
    value,
    signed: !!value,
    clear,
    width,
    height,
    disabled,
    readOnly,
    invalid,
    message,
    typedFallback,
    seed: `${uid}${seed ?? ""}`,
    penColor,
    focusTyped: () => rootRef.current?.querySelector<HTMLElement>('[data-slot="signature-typed"] input')?.focus(),
  }

  return (
    <SignaturePadContext.Provider value={ctx}>
      <Sketchpad
        data-slot="signature-pad"
        data-mode={mode}
        data-invalid={invalid ? "" : undefined}
        ref={useMergedRef<HTMLDivElement>(rootRef, ref)}
        className={cn("max-w-xl gap-2", className)}
        tool={pen}
        tools={[pen]}
        color={penColor}
        size={pen === "brush" ? 0.95 : 1.2}
        value={strokes}
        onValueChange={setStrokes}
        readOnly={readOnly || mode === "type"}
        disabled={disabled}
        width={width}
        height={height}
        seed={seed}
        {...props}
      >
        {children ?? (
          <>
            <SignaturePadCanvas />
            <SignaturePadTyped />
            {readOnly ? null : (
              <div className="flex items-center justify-between gap-2">
                <SignaturePadClear />
                {typedFallback ? <SignaturePadModeToggle /> : null}
              </div>
            )}
          </>
        )}
        {name || required ? (
          <input
            ref={inputRef}
            type="text"
            name={name}
            value={value}
            required={required}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            onChange={() => {}}
            onInvalid={(e) => {
              e.preventDefault()
              setInvalidForm(true)
              rootRef.current?.querySelector<HTMLElement>(mode === "type" ? '[data-slot="signature-typed"] input' : '[data-slot="signature-canvas"]')?.focus()
            }}
            className="sr-only"
          />
        ) : null}
        {invalid ? (
          <p role="alert" className="font-script text-xl leading-none text-red">
            {message}
          </p>
        ) : null}
      </Sketchpad>
    </SignaturePadContext.Provider>
  )
}

function Guides() {
  const ctx = useSignaturePad()
  const { hostRef, hostProps, node } = useInk({ recipe: signatureBaselineRecipe, params: { invalid: ctx.invalid }, kind: "signature-baseline", size: [ctx.width, ctx.height], seed: `${ctx.seed}|line` })
  const typedSvg = React.useMemo(() => (ctx.mode === "type" ? typedSignature(ctx.typed, ctx.width, ctx.height, ctx.seed).svg : ""), [ctx.mode, ctx.typed, ctx.width, ctx.height, ctx.seed])
  const empty = !ctx.strokes.length && !ctx.typed.trim() && !ctx.value
  return (
    <>
      <div ref={hostRef} {...hostProps} data-slot="signature-baseline" className="pointer-events-none absolute inset-0 isolate">
        {node}
      </div>
      {typedSvg ? <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${ctx.width} ${ctx.height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full forced-color-adjust-none" dangerouslySetInnerHTML={{ __html: typedSvg }} /> : null}
      {ctx.value && !ctx.strokes.length && !ctx.typed.trim() ? (
        <img data-slot="signature-image" src={ctx.value} alt="Signature" className="pointer-events-none absolute inset-0 size-full object-contain" />
      ) : null}
      {empty ? (
        <span aria-hidden="true" className="pointer-events-none absolute start-[12%] font-script text-2xl leading-none text-pencil-text" style={{ top: "calc(72% - 2.4rem)" }}>
          {ctx.mode === "type" ? "Type your name below" : "Sign here"}
        </span>
      ) : null}
    </>
  )
}

function SignaturePadCanvas({ className, ...props }: Omit<React.ComponentProps<typeof SketchpadCanvas>, "children" | "label">) {
  const ctx = useSignaturePad()
  const label = ctx.mode === "type" ? (ctx.typed.trim() ? `Signature, typed: ${ctx.typed.trim()}` : "Signature, typed") : "Signature"
  return (
    <SketchpadCanvas
      data-slot="signature-canvas"
      paper="plain"
      label="Signature"
      {...(ctx.mode === "type" ? { "aria-label": label } : {})}
      className={cn("w-full", className)}
      paperProps={{ stock: "slip", shadow: "hair" }}
      {...props}
    >
      <Guides />
    </SketchpadCanvas>
  )
}

function SignaturePadClear({ children, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const ctx = useSignaturePad()
  return (
    <Button
      data-slot="signature-clear"
      type="button"
      variant="ghost"
      size="sm"
      disabled={ctx.disabled || ctx.readOnly || !(ctx.mode === "type" ? ctx.typed : ctx.strokes.length)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        ctx.clear()
        if (ctx.mode === "type") ctx.focusTyped()
      }}
      {...props}
    >
      {children ?? "Clear"}
    </Button>
  )
}

function SignaturePadModeToggle({ children, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const ctx = useSignaturePad()
  return (
    <Button
      data-slot="signature-mode"
      type="button"
      variant="link"
      size="sm"
      disabled={ctx.disabled || ctx.readOnly}
      aria-pressed={ctx.mode === "type"}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.setMode(ctx.mode === "type" ? "draw" : "type")
      }}
      {...props}
    >
      {children ?? (ctx.mode === "type" ? "Draw instead" : "Type instead")}
    </Button>
  )
}

function SignaturePadTyped({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "value" | "defaultValue">) {
  const ctx = useSignaturePad()
  if (ctx.mode !== "type") return null
  return (
    <div data-slot="signature-typed" className={cn("w-full pt-1", className)}>
      <Input
        type="text"
        autoComplete="name"
        aria-label="Type your full name"
        placeholder="Type your full name"
        value={ctx.typed}
        onChange={(e) => ctx.setTyped(e.target.value)}
        disabled={ctx.disabled}
        className="w-full font-script text-2xl"
        {...props}
      />
    </div>
  )
}

export { SignaturePad, SignaturePadCanvas, SignaturePadClear, SignaturePadModeToggle, SignaturePadTyped, useSignaturePad }
export type { SignaturePadProps, SignatureDetail, SignatureMode }
