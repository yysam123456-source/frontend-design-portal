// @ts-nocheck
"use client"

import * as React from "react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { Paper, type PaperProps } from ".//paper"
import { diffResult, diffStats, langFromFileName, normaliseLang, parseDiff, tokenizeLines, type DiffLine, type Lang, type Token, type TokenType } from "../lib/code-highlight"
import { useInk, useMergedRef } from "../lib/ink/react"
import { makeRng } from "../lib/ink/rng"
import { codeBodyRecipe, codeRuleRecipe } from "../lib/ink/recipes/code-block-ink"
import { cn } from "../lib/utils"

const TOKEN_CLASS: Partial<Record<TokenType, string>> = {
  keyword: "text-(--ll-code-keyword)",
  literal: "text-(--ll-code-literal)",
  number: "text-(--ll-code-number)",
  tag: "text-(--ll-code-tag)",
  function: "text-(--ll-code-function)",
  type: "text-(--ll-code-type)",
  attr: "text-(--ll-code-attr)",
  variable: "text-(--ll-code-variable)",
  string: "text-(--ll-code-string)",
  comment: "text-(--ll-code-comment)",
  punct: "text-(--ll-code-punct)",
}

type Model = {
  code: string
  language: Lang
  diff: boolean
  lines: Array<{ tokens: Token[]; kind: DiffLine["kind"] | "plain"; n: number | null }>
  text: string
  stats: { added: number; removed: number } | null
}

function buildModel(code: string, language: Lang, diff: boolean, startLine: number): Model {
  if (diff) {
    const rows = parseDiff(code)
    const tokens = tokenizeLines(rows.map((r) => r.text).join("\n"), language === "diff" ? "text" : language)
    let n = startLine
    const lines = rows.map((r, i) => ({ tokens: tokens[i] ?? [], kind: r.kind, n: r.kind === "del" || r.kind === "meta" ? null : n++ }))
    return { code, language, diff, lines, text: diffResult(rows), stats: diffStats(rows) }
  }
  const text = code.endsWith("\n") ? code.slice(0, -1) : code
  const tokens = tokenizeLines(text, language)
  return { code, language, diff, lines: tokens.map((t, i) => ({ tokens: t, kind: "plain" as const, n: startLine + i })), text, stats: null }
}

type Ctx = {
  model: Model
  filename?: string
  lineNumbers: boolean
  wrap: boolean
  seed: string
}
const CodeBlockContext = React.createContext<Ctx | null>(null)
function useCode(): Ctx {
  const c = React.useContext(CodeBlockContext)
  if (!c) throw new Error("CodeBlock parts must be used inside <CodeBlock>")
  return c
}

function strikePath(seed: string): { a: string; b: string } {
  const r = makeRng(seed)
  const y = (v: number) => (4 + v + r.gauss(0, 0.35)).toFixed(2)
  return {
    a: `M0 ${y(0.1)} C24 ${y(-0.8)} 44 ${y(0.9)} 66 ${y(-0.2)} S92 ${y(0.6)} 100 ${y(-0.4)}`,
    b: `M2 ${y(1.1)} C30 ${y(0.4)} 58 ${y(1.6)} 98 ${y(0.9)}`,
  }
}
function tickPath(seed: string): string {
  const r = makeRng(seed)
  const j = () => r.gauss(0, 0.5)
  return `M${(1.6 + j()).toFixed(2)} ${(7.4 + j()).toFixed(2)} L${(5.1 + j()).toFixed(2)} ${(11.4 + j()).toFixed(2)} L${(12.6 + j()).toFixed(2)} ${(2.2 + j()).toFixed(2)}`
}

function Strike({ seed }: { seed: string }) {
  const p = strikePath(seed)
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 8" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-2 w-[calc(100%+4px)] -translate-y-1/2 overflow-visible text-red">
      <path d={p.b} fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} vectorEffect="non-scaling-stroke" />
      <path d={p.a} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
function Tick({ seed }: { seed: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 14 14" className="pointer-events-none absolute start-1.5 top-1/2 size-3.5 -translate-y-1/2 overflow-visible text-green">
      <path d={tickPath(seed)} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const was = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.setAttribute("aria-hidden", "true")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.append(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      was?.focus({ preventScroll: true })
      return ok
    } catch {
      return false
    }
  }
}

function selectCodeOf(button: Element): void {
  const code = button.closest('[data-slot="code-block"]')?.querySelector('[data-slot="code-block-code"]')
  const selection = typeof window === "undefined" ? null : window.getSelection?.()
  if (!code || !selection) return
  const range = document.createRange()
  range.selectNodeContents(code)
  selection.removeAllRanges()
  selection.addRange(range)
}

type CodeBlockProps = Omit<PaperProps, "as" | "children"> & {
  code?: string
  language?: string
  filename?: string
  lineNumbers?: boolean
  diff?: boolean
  wrap?: boolean
  startLine?: number
  copyable?: boolean
  tone?: "dark" | "paper"
  children?: React.ReactNode
}

function CodeBlock({
  code = "",
  language,
  filename,
  lineNumbers = false,
  diff,
  wrap = false,
  startLine = 1,
  copyable = true,
  stock = "slip",
  tape = "top",
  tone = "dark",
  seed,
  className,
  children,
  ref,
  ...props
}: CodeBlockProps) {
  const id = React.useId()
  const s = seed === undefined ? id : String(seed)
  const lang: Lang = language ? normaliseLang(language) : filename ? langFromFileName(filename) : "text"
  const isDiff = diff ?? lang === "diff"
  const model = React.useMemo(() => buildModel(code, lang, isDiff, startLine), [code, lang, isDiff, startLine])
  const ctx = React.useMemo<Ctx>(() => ({ model, filename, lineNumbers, wrap, seed: s }), [model, filename, lineNumbers, wrap, s])
  return (
    <CodeBlockContext.Provider value={ctx}>
      <Paper
        as="figure"
        data-slot="code-block"
        data-tone={tone}
        data-language={lang}
        data-diff={isDiff ? "" : undefined}
        stock={stock}
        tape={tape}
        seed={s}
        ref={ref}
        aria-label={filename ?? (lang === "text" ? "Code" : `${lang} code`)}
        className={cn("m-0 flex max-w-full min-w-0 flex-col text-ink", className)}
        {...props}
      >
        {children ?? (
          <>
            <CodeBlockHeader>
              <CodeBlockTitle />
              <CodeBlockStats />
              {copyable ? (
                <CodeBlockActions>
                  <CodeBlockCopy />
                </CodeBlockActions>
              ) : null}
            </CodeBlockHeader>
            <CodeBlockContent />
          </>
        )}
      </Paper>
    </CodeBlockContext.Provider>
  )
}

function CodeBlockHeader({ className, children, ref, ...props }: React.ComponentProps<"div">) {
  const { seed } = useCode()
  const { hostRef, hostProps, node } = useInk({ recipe: codeRuleRecipe, params: {}, kind: "rule", seed: `${seed}|rule`, still: true })
  return (
    <div
      data-slot="code-block-header"
      ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
      {...hostProps}
      className={cn("relative isolate flex min-w-0 items-center gap-3 px-4 pt-3.5 pb-2.5 font-type text-[13px] tracking-wide text-ink-muted forced-colors:border-b forced-colors:border-dashed forced-colors:border-[CanvasText] forced-colors:outline-none!", className)}
      {...props}
    >
      {node}
      {children}
    </div>
  )
}

function CodeBlockTitle({ className, children, ...props }: React.ComponentProps<"span">) {
  const { filename, model } = useCode()
  return (
    <span data-slot="code-block-title" className={cn("ll-ink-room min-w-0 flex-1 truncate", className)} {...props}>
      {children ?? filename ?? model.language}
    </span>
  )
}

function CodeBlockStats({ className, ...props }: React.ComponentProps<"span">) {
  const { model } = useCode()
  if (!model.stats) return null
  return (
    <span data-slot="code-block-stats" className={cn("flex shrink-0 gap-2 tabular-nums", className)} {...props}>
      <span className="text-green">
        <span aria-hidden="true">+</span>
        <span className="sr-only">Added </span>
        {model.stats.added}
      </span>
      <span className="text-red">
        <span aria-hidden="true">-</span>
        <span className="sr-only">Removed </span>
        {model.stats.removed}
      </span>
    </span>
  )
}

function CodeBlockActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="code-block-actions" className={cn("flex shrink-0 items-center gap-1", className)} {...props} />
}

function CodeBlockCopy({ className, children, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { model } = useCode()
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle")
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <>
      <Button
        data-slot="code-block-copy"
        type="button"
        variant="ghost"
        size="xs"
        aria-label="Copy code"
        className={cn("font-type font-normal tracking-wide text-ink-muted", className)}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented) return
          const button = e.currentTarget
          void copyText(model.text).then((ok) => {
            if (!ok) selectCodeOf(button)
            setState(ok ? "copied" : "failed")
            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => setState("idle"), 1800)
          })
        }}
        {...props}
      >
        {children ?? (
          <>
            <Icon name={state === "copied" ? "check" : "copy"} />
            {state === "copied" ? "copied" : state === "failed" ? "press Ctrl+C" : "copy"}
          </>
        )}
      </Button>
      <span data-slot="code-block-status" role="status" className="sr-only">
        {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : ""}
      </span>
    </>
  )
}

function CodeBlockContent({
  code,
  language,
  className,
  ref,
  ...props
}: React.ComponentProps<"pre"> & { code?: string; language?: string }) {
  const ctx = useCode()
  const own = React.useMemo(
    () => (code !== undefined ? buildModel(code, language ? normaliseLang(language) : ctx.model.language, ctx.model.diff, 1) : null),
    [code, language, ctx.model.language, ctx.model.diff]
  )
  const model = own ?? ctx.model
  const { hostRef, hostProps, node } = useInk({ recipe: codeBodyRecipe, params: {}, kind: "code", seed: `${ctx.seed}|body`, still: true })
  return (
    <div data-slot="code-block-body" data-ink-focus="within" ref={hostRef} {...hostProps} className="relative isolate min-w-0">
      {node}
      <pre
        data-slot="code-block-pre"
        ref={ref}
        dir="ltr"
        tabIndex={0}
        className={cn(
          "m-0 max-w-full min-w-0 overflow-x-auto px-4 pt-3 pb-4 font-mono text-[13.5px] leading-[1.7] text-ink outline-hidden [scrollbar-width:thin] calm:text-[13px] calm:leading-[1.6]",
          ctx.wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre",
          className
        )}
        {...props}
      >
        <code data-slot="code-block-code" className={cn("block", ctx.wrap ? "w-full" : "w-max min-w-full", "[&>[data-slot=code-line]:nth-child(7n+3)]:opacity-[0.94] [&>[data-slot=code-line]:nth-child(11n+6)]:opacity-[0.9]")}>
          {model.lines.map((l, i) => {
            const removed = l.kind === "del"
            const added = l.kind === "add"
            const meta = l.kind === "meta"
            const Row = added ? "ins" : removed ? "del" : "span"
            const body = l.tokens.map((t, k) => (
              <span key={k} className={TOKEN_CLASS[t.type]}>
                {t.text}
              </span>
            ))
            return (
              <Row
                key={i}
                data-slot="code-line"
                data-line={ctx.lineNumbers && l.n !== null ? l.n : undefined}
                data-diff={added ? "add" : removed ? "del" : undefined}
                className={cn(
                  "relative block min-h-lh no-underline",
                  ctx.lineNumbers ? (model.diff ? "ps-14" : "ps-11") : model.diff ? "ps-7" : undefined,
                  ctx.lineNumbers && "before:pointer-events-none before:absolute before:w-8 before:text-end before:text-pencil-text before:tabular-nums before:select-none before:content-[attr(data-line)]",
                  ctx.lineNumbers && (model.diff ? "before:start-5" : "before:start-0"),
                  meta && "text-pencil-text"
                )}
              >
                {model.diff && added ? <Tick seed={`${ctx.seed}|t${i}`} /> : null}
                {model.diff && added ? <span className="sr-only select-none">Added: </span> : null}
                {removed ? <span className="sr-only select-none">Removed: </span> : null}
                {removed ? (
                  <span className="relative inline-block max-w-full text-ink-muted">
                    {body}
                    <Strike seed={`${ctx.seed}|s${i}`} />
                  </span>
                ) : (
                  body
                )}
                {i < model.lines.length - 1 ? "\n" : null}
              </Row>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

export { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockStats, CodeBlockActions, CodeBlockCopy, CodeBlockContent }
export type { CodeBlockProps }
