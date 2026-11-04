// @ts-nocheck
"use client"

import * as React from "react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { Paper, type PaperProps } from ".//paper"
import { TextareaControl } from ".//textarea"
import { useInk, useMergedRef } from "../lib/ink/react"
import { promptInputBodyRecipe } from "../lib/ink/recipes/prompt-input-ink"
import { cn } from "../lib/utils"

type PromptInputStatus = "ready" | "submitted" | "streaming" | "error"
type PromptInputTrigger = string | { char: string; atStart?: boolean }
type PromptInputActiveTrigger = { char: string; query: string; from: number; to: number }

type PromptInputContextValue = {
  value: string
  setValue: (value: string) => void
  status: PromptInputStatus
  busy: boolean
  disabled: boolean
  allowEmpty: boolean
  lockWhileStreaming: boolean
  submitOn: "enter" | "mod-enter"
  flight: number
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  submit: () => void
  stop: () => void
  focus: () => void
  trigger: PromptInputActiveTrigger | null
  setCaret: (n: number) => void
  replaceTrigger: (text: string, options?: { space?: boolean }) => void
  dismissTrigger: () => void
  listId: string
  list: HTMLElement | null
  setList: (el: HTMLElement | null) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  composing: React.RefObject<boolean>
}

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null)

function usePromptInput(): PromptInputContextValue {
  const c = React.useContext(PromptInputContext)
  if (!c) throw new Error("usePromptInput must be used inside <PromptInput>")
  return c
}

function detectTrigger(value: string, caret: number, triggers: readonly PromptInputTrigger[]): PromptInputActiveTrigger | null {
  if (!triggers.length || caret < 1 || caret > value.length) return null
  let start = caret
  while (start > 0 && !/\s/.test(value[start - 1])) start--
  const word = value.slice(start, caret)
  for (const t of triggers) {
    const char = typeof t === "string" ? t : t.char
    const atStart = typeof t === "string" ? false : !!t.atStart
    if (char && word.startsWith(char) && (!atStart || start === 0)) return { char, query: word.slice(char.length), from: start, to: caret }
  }
  return null
}

const KEYFRAMES = `
@keyframes ll-plane{0%{transform:none;opacity:1}46%{transform:translate(20px,-18px) rotate(-16deg) scale(.85);opacity:0}47%{transform:translate(-16px,12px) rotate(8deg) scale(.85);opacity:0}100%{transform:none;opacity:1}}
`

type PromptInputProps = Omit<PaperProps, "as" | "onSubmit" | "children" | "ref"> &
  Omit<React.ComponentProps<"form">, "onSubmit" | "className" | "style" | "children" | "ref" | "defaultValue"> & {
    ref?: React.Ref<HTMLFormElement>
    children?: React.ReactNode
    onSubmit?: (value: string, event: React.FormEvent<HTMLFormElement>) => void
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    status?: PromptInputStatus
    onStop?: () => void
    disabled?: boolean
    allowEmpty?: boolean
    clearOnSubmit?: boolean
    lockWhileStreaming?: boolean
    submitOn?: "enter" | "mod-enter"
    triggers?: readonly PromptInputTrigger[]
    onTriggerChange?: (trigger: PromptInputActiveTrigger | null) => void
  }

function PromptInput({
  className,
  onSubmit,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  status = "ready",
  onStop,
  disabled = false,
  allowEmpty = false,
  clearOnSubmit = true,
  lockWhileStreaming = false,
  submitOn = "enter",
  triggers = [],
  onTriggerChange,
  stock = "napkin",
  seed,
  ref,
  children,
  ...props
}: PromptInputProps) {
  const controlled = valueProp !== undefined
  const [inner, setInner] = React.useState(defaultValue)
  const value = controlled ? valueProp : inner
  const [flight, setFlight] = React.useState(0)
  const [caret, setCaret] = React.useState(0)
  const [dismissed, setDismissed] = React.useState<{ from: number; char: string } | null>(null)
  const [list, setList] = React.useState<HTMLElement | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const composing = React.useRef(false)
  const pendingCaret = React.useRef<number | null>(null)
  const listId = React.useId()
  const busy = status === "submitted" || status === "streaming"

  const setValue = React.useCallback(
    (v: string) => {
      if (!controlled) setInner(v)
      onValueChange?.(v)
    },
    [controlled, onValueChange]
  )

  const found = React.useMemo(() => detectTrigger(value, caret, triggers), [value, caret, triggers])
  const trigger = found && dismissed && dismissed.from === found.from && dismissed.char === found.char ? null : found
  const lastTrigger = React.useRef<PromptInputActiveTrigger | null>(null)
  React.useEffect(() => {
    const prev = lastTrigger.current
    const same = prev === trigger || (prev && trigger && prev.char === trigger.char && prev.query === trigger.query && prev.from === trigger.from)
    lastTrigger.current = trigger
    if (!same) onTriggerChange?.(trigger)
  }, [trigger, onTriggerChange])
  React.useEffect(() => {
    if (dismissed && (!found || found.from !== dismissed.from || found.char !== dismissed.char)) setDismissed(null)
  }, [found, dismissed])

  React.useLayoutEffect(() => {
    const pos = pendingCaret.current
    const el = textareaRef.current
    if (pos !== null && el) {
      pendingCaret.current = null
      el.setSelectionRange(pos, pos)
      setCaret(pos)
    }
  })

  const replaceTrigger = React.useCallback(
    (text: string, options?: { space?: boolean }) => {
      if (!trigger) return
      const before = value.slice(0, trigger.from)
      const after = value.slice(trigger.to)
      const insert = text + (options?.space !== false && !after.startsWith(" ") ? " " : "")
      pendingCaret.current = before.length + insert.length
      setValue(before + insert + after)
      textareaRef.current?.focus()
    },
    [trigger, value, setValue]
  )
  const dismissTrigger = React.useCallback(() => {
    if (trigger) setDismissed({ from: trigger.from, char: trigger.char })
  }, [trigger])

  const focus = React.useCallback(() => textareaRef.current?.focus(), [])
  const submit = React.useCallback(() => {
    if (disabled || busy) return
    if (!allowEmpty && !value.trim()) return
    formRef.current?.requestSubmit()
  }, [disabled, busy, allowEmpty, value])
  const stop = React.useCallback(() => onStop?.(), [onStop])

  const ctx = React.useMemo<PromptInputContextValue>(
    () => ({ value, setValue, status, busy, disabled, allowEmpty, lockWhileStreaming, submitOn, flight, textareaRef, submit, stop, focus, trigger, setCaret, replaceTrigger, dismissTrigger, listId, list, setList, activeId, setActiveId, composing }),
    [value, setValue, status, busy, disabled, allowEmpty, lockWhileStreaming, submitOn, flight, submit, stop, focus, trigger, replaceTrigger, dismissTrigger, listId, list, activeId]
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (disabled || busy) return
    if (!allowEmpty && !value.trim()) return
    onSubmit?.(value, e)
    if (!controlled && clearOnSubmit) setInner("")
    setFlight((f) => f + 1)
    setCaret(0)
    textareaRef.current?.focus()
  }

  return (
    <PromptInputContext.Provider value={ctx}>
      <style href="ll-prompt-input" precedence="low">
        {KEYFRAMES}
      </style>
      <Paper
        as="form"
        data-slot="prompt-input"
        data-status={status}
        data-disabled={disabled ? "" : undefined}
        stock={stock}
        seed={seed}
        ref={useMergedRef<HTMLElement>(formRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLElement>}
        className={cn("group/prompt-input relative flex w-full min-w-0 flex-col gap-1 px-5 py-3 font-hand text-foreground compact:px-4 compact:py-2.5 calm:px-3 calm:py-2", className)}
        onSubmit={handleSubmit as never}
        {...(props as object)}
      >
        {children}
      </Paper>
    </PromptInputContext.Provider>
  )
}

function PromptInputAttachments({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="prompt-input-attachments" className={cn("flex flex-wrap gap-3 px-1 pt-3 empty:hidden", className)} {...props} />
}

function PromptInputBody({ className, children, ref, ...props }: React.ComponentProps<"div">) {
  const { disabled } = usePromptInput()
  const { hostRef, hostProps, node } = useInk({ recipe: promptInputBodyRecipe, params: { disabled }, kind: "field", still: true })
  return (
    <div
      data-slot="prompt-input-body"
      data-ink-focus="within"
      ref={useMergedRef<HTMLElement>(hostRef, ref as React.Ref<HTMLElement> | undefined) as React.Ref<HTMLDivElement>}
      {...hostProps}
      className={cn("relative isolate flex min-h-12 min-w-0 flex-1 pb-2", className)}
      {...props}
    >
      {node}
      {children}
    </div>
  )
}

function PromptInputTextarea({
  className,
  onKeyDown,
  onChange,
  onSelect,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  placeholder = "what are we making?",
  name = "message",
  minRows = 1,
  maxRows = 8,
  ref,
  ...props
}: Omit<React.ComponentProps<"textarea">, "value" | "defaultValue"> & {
  minRows?: number
  maxRows?: number
}) {
  const c = usePromptInput()
  const localRef = React.useRef<HTMLTextAreaElement | null>(null)
  const merged = useMergedRef<HTMLTextAreaElement>(localRef, c.textareaRef, ref)
  const optionsOpen = !!c.trigger && !!c.list?.isConnected && c.list.querySelector('[role="option"]:not([aria-disabled="true"])') !== null

  React.useLayoutEffect(() => {
    const el = localRef.current
    if (!el || (typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content"))) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [c.value])

  const options = (): HTMLElement[] => (c.list ? Array.from(c.list.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])')) : [])
  const move = (dir: 1 | -1) => {
    const all = options()
    if (!all.length) return
    const at = all.findIndex((o) => o.id === c.activeId)
    const next = all[(at + dir + all.length) % all.length]
    c.setActiveId(next.id)
    next.scrollIntoView?.({ block: "nearest" })
  }

  return (
    <TextareaControl
      data-slot="prompt-input-textarea"
      dir="auto"
      ref={merged}
      name={name}
      rows={minRows}
      placeholder={placeholder}
      value={c.value}
      disabled={c.disabled}
      readOnly={c.lockWhileStreaming && c.busy}
      aria-label={props["aria-label"] === undefined && props["aria-labelledby"] === undefined && props.id === undefined ? "Message" : undefined}
      aria-autocomplete={c.trigger ? "list" : undefined}
      aria-haspopup={c.trigger ? "listbox" : undefined}
      aria-controls={optionsOpen ? c.listId : undefined}
      aria-activedescendant={optionsOpen && c.activeId ? c.activeId : undefined}
      style={{ maxHeight: `calc(${maxRows} * 2rem + 1rem)` }}
      className={cn(
        "resize-none overflow-y-auto px-1 py-1.5 font-script text-[1.65rem] leading-8 text-ink-you caret-ink-you placeholder:text-pencil-text compact:text-[1.5rem] calm:text-[1.35rem] calm:leading-7",
        className
      )}
      onChange={(e) => {
        c.setValue(e.currentTarget.value)
        c.setCaret(e.currentTarget.selectionStart ?? e.currentTarget.value.length)
        onChange?.(e)
      }}
      onSelect={(e) => {
        c.setCaret(e.currentTarget.selectionStart ?? 0)
        onSelect?.(e)
      }}
      onCompositionStart={(e) => {
        c.composing.current = true
        onCompositionStart?.(e)
      }}
      onCompositionEnd={(e) => {
        c.composing.current = false
        onCompositionEnd?.(e)
      }}
      onBlur={(e) => {
        c.composing.current = false
        onBlur?.(e)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.nativeEvent.isComposing || c.composing.current || e.keyCode === 229) return
        if (optionsOpen) {
          if (e.key === "ArrowDown") return void (e.preventDefault(), move(1))
          if (e.key === "ArrowUp") return void (e.preventDefault(), move(-1))
          if (e.key === "Escape") return void (e.preventDefault(), c.dismissTrigger())
          if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
            const active = options().find((o) => o.id === c.activeId) ?? options()[0]
            if (active) return void (e.preventDefault(), active.click())
          }
        }
        if (e.key !== "Enter" || e.shiftKey) return
        const mod = e.ctrlKey || e.metaKey
        if (c.submitOn === "enter" ? !mod && !e.altKey : mod) {
          e.preventDefault()
          if (!e.repeat) c.submit()
        }
      }}
      {...props}
    />
  )
}

function PromptInputFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="prompt-input-footer" className={cn("flex items-center justify-between gap-2 pt-1", className)} {...props} />
}

function PromptInputTools({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="prompt-input-tools" role="group" className={cn("flex items-center gap-1", className)} {...props} />
}

function PromptInputButton({ variant = "ghost", size = "sm", className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="prompt-input-button" type="button" variant={variant} size={size} className={cn(className)} {...props} />
}

function PromptInputHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="prompt-input-hint" className={cn("m-0 px-1 text-sm text-muted-foreground", className)} {...props} />
}

function PromptInputSubmit({ className, children, onClick, ref, ...props }: Omit<React.ComponentProps<typeof Button>, "type">) {
  const c = usePromptInput()
  const stopping = c.busy
  const empty = !c.allowEmpty && !c.value.trim()
  const self = React.useRef<HTMLButtonElement | null>(null)
  const wasStopping = React.useRef(stopping)
  const { focus } = c
  React.useEffect(() => {
    if (wasStopping.current && !stopping && self.current && document.activeElement === self.current) focus()
    wasStopping.current = stopping
  }, [stopping, focus])
  return (
    <Button
      ref={useMergedRef<HTMLButtonElement>(self, ref as React.Ref<HTMLButtonElement> | undefined)}
      data-slot="prompt-input-submit"
      data-status={c.status}
      type={stopping ? "button" : "submit"}
      size="icon"
      variant={stopping ? "outline" : "default"}
      aria-label={stopping ? "Stop generating" : "Send message"}
      disabled={!stopping && (c.disabled || empty)}
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e)
        if (stopping && !e.defaultPrevented) c.stop()
      }}
      {...props}
    >
      {children ?? (
        <span key={c.flight} data-flying={c.flight ? "" : undefined} className="inline-flex data-flying:animate-[ll-plane_0.9s_ease-in-out_both]">
          <Icon name={stopping ? "square" : "send"} size={18} />
        </span>
      )}
    </Button>
  )
}

function PromptInputSuggestions({
  trigger: only,
  open,
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  trigger?: string
  open?: boolean
}) {
  const c = usePromptInput()
  const show = open ?? (!!c.trigger && (only === undefined || c.trigger.char === only))
  const { setList, setActiveId, activeId } = c
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const merged = useMergedRef<HTMLDivElement>(localRef, ref)
  React.useLayoutEffect(() => {
    if (!show) return
    setList(localRef.current)
    return () => setList(null)
  }, [show, setList])
  React.useLayoutEffect(() => {
    if (!show) return
    const ids = Array.from(localRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? []).map((o) => o.id)
    if (ids.length === 0) {
      if (activeId !== null) setActiveId(null)
    } else if (!activeId || !ids.includes(activeId)) setActiveId(ids[0])
  })
  if (!show) return null
  return (
    <Paper
      data-slot="prompt-input-suggestions"
      role="listbox"
      aria-label="Suggestions"
      id={c.listId}
      ref={merged as React.Ref<HTMLElement>}
      stock="slip"
      tilt={false}
      className={cn("absolute inset-x-2 bottom-full z-(--ll-z-raised) mb-3 max-h-60 overflow-y-auto p-1.5", className)}
      onMouseDown={(e: React.MouseEvent<HTMLElement>) => e.preventDefault()}
      {...(props as object)}
    >
      {children}
    </Paper>
  )
}

function PromptInputSuggestion({
  onSelect,
  disabled,
  className,
  onClick,
  onPointerMove,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "onSelect"> & {
  onSelect?: () => void
  disabled?: boolean
}) {
  const c = usePromptInput()
  const id = React.useId()
  const active = c.activeId === id
  return (
    <div
      data-slot="prompt-input-suggestion"
      role="option"
      id={id}
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-active={active ? "" : undefined}
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[15px] select-none data-[active]:ll-swipe aria-disabled:cursor-not-allowed aria-disabled:text-pencil-text",
        className
      )}
      onPointerMove={(e) => {
        if (!disabled && !active) c.setActiveId(id)
        onPointerMove?.(e)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (!disabled && !e.defaultPrevented) onSelect?.()
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  PromptInput,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputHint,
  PromptInputSubmit,
  PromptInputSuggestions,
  PromptInputSuggestion,
  usePromptInput,
}
export type { PromptInputProps, PromptInputStatus, PromptInputTrigger, PromptInputActiveTrigger, PromptInputContextValue }
