// @ts-nocheck
"use client"

import * as React from "react"

import { Icon } from ".//icon"
import { Mascot } from ".//mascot"
import { useFormReset } from "../hooks/use-form-reset"
import { useInk, useMergedRef } from "../lib/ink/react"
import { dropzoneItemRecipe, dropzoneRecipe } from "../lib/ink/recipes/dropzone-ink"
import { cn } from "../lib/utils"

type ErrorCode = "file-invalid-type" | "file-too-large" | "file-too-small" | "too-many-files" | "validator"

interface FileError {
  code: ErrorCode
  message: string
}

interface FileRejection {
  file: File
  errors: FileError[]
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

const tokensOf = (accept?: string | readonly string[]): string[] =>
  (typeof accept === "string" ? accept.split(",") : accept ? [...accept] : []).map((t) => t.trim()).filter(Boolean)

function matchesAccept(file: Pick<File, "name" | "type">, accept?: string | readonly string[]): boolean {
  const tokens = tokensOf(accept).map((t) => t.toLowerCase())
  if (tokens.length === 0) return true
  const name = file.name.toLowerCase()
  const type = (file.type || "").toLowerCase()
  return tokens.some((t) => (t.startsWith(".") ? name.endsWith(t) : t.endsWith("/*") ? type.startsWith(t.slice(0, -1)) : type === t))
}

const sameFile = (a: File, b: File): boolean => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

type Messages = Partial<Record<ErrorCode, string | ((file: File) => string)>>

function describeLimits(o: { accept?: string | readonly string[]; maxSize?: number; maxFiles?: number; multiple?: boolean }): string {
  const tokens = tokensOf(o.accept)
  const kinds = tokens.map((t) => {
    if (t.startsWith(".")) return t.slice(1).toUpperCase()
    if (t === "image/*") return "Images"
    if (t === "video/*") return "Videos"
    if (t === "audio/*") return "Audio"
    if (t === "text/*") return "Text files"
    const sub = t.split("/")[1]
    return sub && sub !== "*" ? sub.toUpperCase() : t
  })
  const parts: string[] = []
  if (kinds.length) parts.push(kinds.join(", "))
  if (o.maxSize) parts.push(`${parts.length ? "up to" : "Up to"} ${formatBytes(o.maxSize)}${o.multiple === false ? "" : " each"}`)
  if (o.maxFiles && o.multiple !== false) parts.push(`${parts.length ? "at most" : "At most"} ${o.maxFiles} file${o.maxFiles === 1 ? "" : "s"}`)
  return parts.join(" ")
}

interface DropzoneContextValue {
  files: File[]
  rejections: FileRejection[]
  isDragOver: boolean
  setDragOver: (over: boolean) => void
  disabled: boolean
  invalid: boolean
  multiple: boolean
  accept?: string | readonly string[]
  maxSize?: number
  maxFiles?: number
  name?: string
  inputId?: string
  required?: boolean
  add: (list: FileList | File[] | null | undefined) => void
  remove: (file: File) => void
  clear: () => void
  clearRejections: () => void
  open: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null)

function useDropzone(): DropzoneContextValue {
  const ctx = React.useContext(DropzoneContext)
  if (!ctx) throw new Error("Dropzone parts must be used inside <Dropzone>")
  return ctx
}

interface DropzoneProps extends Omit<React.ComponentProps<"div">, "onDrop" | "defaultValue" | "children"> {
  files?: File[]
  defaultFiles?: File[]
  onFilesChange?: (files: File[]) => void
  accept?: string | readonly string[]
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  minSize?: number
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  name?: string
  id?: string
  validator?: (file: File) => FileError | null
  messages?: Messages
  onDrop?: (accepted: File[], rejected: FileRejection[]) => void
  onReject?: (rejected: FileRejection[]) => void
  children?: React.ReactNode
}

function Dropzone(props: DropzoneProps) {
  const {
    files: _files,
    defaultFiles,
    onFilesChange,
    accept,
    multiple = true,
    maxFiles,
    maxSize,
    minSize,
    disabled = false,
    invalid = false,
    required,
    name,
    id,
    validator,
    messages,
    onDrop,
    onReject,
    className,
    children,
    ...rest
  } = props
  void _files
  const controlled = "files" in props
  const [inner, setInner] = React.useState<File[]>(defaultFiles ?? [])
  const files = controlled ? (props.files ?? []) : inner
  const [rejections, setRejections] = React.useState<FileRejection[]>([])
  const [isDragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const latest = React.useRef(files)
  latest.current = files

  const setFiles = React.useCallback(
    (next: File[]) => {
      latest.current = next
      if (!controlled) setInner(next)
      onFilesChange?.(next)
    },
    [controlled, onFilesChange]
  )
  const say = (code: ErrorCode, file: File, fallback: string): FileError => {
    const m = messages?.[code]
    return { code, message: m === undefined ? fallback : typeof m === "function" ? m(file) : m }
  }
  const add = (list: FileList | File[] | null | undefined): void => {
    if (disabled || !list) return
    const incoming = Array.from(list)
    if (incoming.length === 0) return
    const accepted: File[] = []
    const rejected: FileRejection[] = []
    const room = multiple ? (maxFiles === undefined ? Infinity : Math.max(0, maxFiles - latest.current.length)) : 1
    for (const file of incoming) {
      const errors: FileError[] = []
      if (!matchesAccept(file, accept)) errors.push(say("file-invalid-type", file, `${file.name} is not a file type we take.`))
      if (maxSize !== undefined && file.size > maxSize) errors.push(say("file-too-large", file, `${file.name} is larger than ${formatBytes(maxSize)}.`))
      if (minSize !== undefined && file.size < minSize) errors.push(say("file-too-small", file, `${file.name} is smaller than ${formatBytes(minSize)}.`))
      const custom = errors.length === 0 ? validator?.(file) : null
      if (custom) errors.push(custom)
      if (errors.length === 0 && accepted.length >= room) errors.push(say("too-many-files", file, multiple ? `Only ${maxFiles} file${maxFiles === 1 ? "" : "s"} at a time.` : "One file at a time."))
      if (errors.length) rejected.push({ file, errors })
      else accepted.push(file)
    }
    setRejections(rejected)
    if (accepted.length) setFiles(multiple ? [...latest.current.filter((f) => !accepted.some((a) => sameFile(a, f))), ...accepted] : [accepted[0]])
    onDrop?.(accepted, rejected)
    if (rejected.length) onReject?.(rejected)
  }
  const remove = (file: File): void => {
    if (disabled) return
    setFiles(latest.current.filter((f) => f !== file))
    setRejections([])
  }
  const clear = (): void => {
    setFiles([])
    setRejections([])
  }
  const clearRejections = (): void => setRejections([])
  const open = (): void => {
    if (!disabled) inputRef.current?.click()
  }

  useFormReset(
    () => inputRef.current,
    () => {
      if (!controlled) setInner(defaultFiles ?? [])
      setRejections([])
    }
  )

  React.useEffect(() => {
    const input = inputRef.current
    if (!input || typeof DataTransfer === "undefined") return
    try {
      const dt = new DataTransfer()
      for (const f of files) dt.items.add(f)
      input.files = dt.files
    } catch {
    }
  }, [files])

  const ctx: DropzoneContextValue = {
    files, rejections, isDragOver, setDragOver, disabled, invalid, multiple, accept, maxSize, maxFiles, name, inputId: id, required, add, remove, clear, clearRejections, open, inputRef,
  }
  return (
    <DropzoneContext.Provider value={ctx}>
      <style href="ll-dropzone" precedence="low">
        {DROPZONE_CSS}
      </style>
      <div data-slot="dropzone" data-disabled={disabled ? "" : undefined} className={cn("flex w-full flex-col gap-3", className)} {...rest}>
        {children ?? (
          <>
            <DropzoneArea>
              <DropzoneIcon />
              <DropzoneTitle />
              <DropzoneDescription />
            </DropzoneArea>
            <DropzoneRejections />
            <DropzoneList />
          </>
        )}
      </div>
    </DropzoneContext.Provider>
  )
}

const DROPZONE_CSS =
  "@keyframes ll-dz-wiggle{0%,100%{rotate:0deg}25%{rotate:-.7deg}75%{rotate:.7deg}}" +
  "[data-slot=dropzone-area][data-drag-over]>svg[data-ink]{animation:ll-dz-wiggle calc(var(--ll-dur-boil) * 2) ease-in-out infinite}" +
  "[data-slot=dropzone-icon]{transition:translate var(--ll-dur-pop) var(--ll-ease-settle)}[data-slot=dropzone-area][data-drag-over] [data-slot=dropzone-icon]{translate:0 -3px}" +
  "@media (prefers-reduced-motion:reduce){[data-slot=dropzone-area][data-drag-over]>svg[data-ink]{animation:none}}[data-motion=reduced] [data-slot=dropzone-area][data-drag-over]>svg[data-ink]{animation:none}"

function DropzoneArea({
  className,
  children,
  seed,
  inputProps,
  ref,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: Omit<React.ComponentProps<"label">, "children"> & { children?: React.ReactNode; seed?: string | number; inputProps?: Omit<React.ComponentProps<"input">, "type" | "ref"> }) {
  const ctx = useDropzone()
  const depth = React.useRef(0)
  const { hostRef, hostProps, node } = useInk({
    recipe: dropzoneRecipe,
    params: { over: ctx.isDragOver && !ctx.disabled, invalid: ctx.invalid && !ctx.disabled, disabled: ctx.disabled },
    kind: "field",
    seed,
    still: true,
  })
  const hasFiles = (e: React.DragEvent): boolean => Array.from(e.dataTransfer?.types ?? []).includes("Files")
  return (
    <label
      data-slot="dropzone-area"
      data-drag-over={ctx.isDragOver && !ctx.disabled ? "" : undefined}
      data-invalid={ctx.invalid ? "" : undefined}
      data-disabled={ctx.disabled ? "" : undefined}
      data-ink-focus="within"
      ref={useMergedRef<HTMLLabelElement>(hostRef, ref)}
      {...hostProps}
      onDragEnter={(e) => {
        onDragEnter?.(e)
        if (ctx.disabled || !hasFiles(e)) return
        e.preventDefault()
        depth.current++
        ctx.setDragOver(true)
      }}
      onDragOver={(e) => {
        onDragOver?.(e)
        if (ctx.disabled || !hasFiles(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={(e) => {
        onDragLeave?.(e)
        if (ctx.disabled) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) ctx.setDragOver(false)
      }}
      onDrop={(e) => {
        onDrop?.(e)
        if (ctx.disabled) return
        e.preventDefault()
        depth.current = 0
        ctx.setDragOver(false)
        ctx.add(e.dataTransfer?.files)
      }}
      className={cn(
        "group/dz relative isolate flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-6 text-center font-hand text-base text-foreground has-disabled:cursor-not-allowed has-disabled:text-pencil-text compact:min-h-32 compact:p-5 calm:min-h-24 calm:p-3",
        "forced-colors:border forced-colors:border-dashed forced-colors:data-drag-over:border-solid",
        className
      )}
      {...props}
    >
      {node}
      <input
        type="file"
        data-slot="dropzone-input"
        className="peer sr-only"
        ref={ctx.inputRef}
        multiple={ctx.multiple}
        accept={tokensOf(ctx.accept).join(",") || undefined}
        name={ctx.name}
        id={ctx.inputId}
        required={ctx.required && ctx.files.length === 0}
        disabled={ctx.disabled}
        aria-invalid={ctx.invalid || undefined}
        onChange={(e) => {
          ctx.add(e.target.files)
          if (typeof DataTransfer === "undefined") e.target.value = ""
        }}
        {...inputProps}
      />
      {children}
    </label>
  )
}

function DropzoneIcon({ className, children, ...props }: React.ComponentProps<"span">) {
  const ctx = useDropzone()
  return (
    <span data-slot="dropzone-icon" aria-hidden="true" className={cn("grid size-16 place-items-center text-ink-soft group-has-disabled/dz:text-pencil-text", className)} {...props}>
      {children ?? (ctx.isDragOver && !ctx.disabled ? <Mascot pose="carry" size={64} /> : <Icon name="upload" size={32} weight={1.2} />)}
    </span>
  )
}

function DropzoneTitle({ className, children, ...props }: React.ComponentProps<"span">) {
  const ctx = useDropzone()
  return (
    <span data-slot="dropzone-title" className={cn("font-script text-[1.45rem] leading-tight font-semibold", className)} {...props}>
      {children ?? (
        <>
          {ctx.multiple ? "Drop files here or " : "Drop a file here or "}
          <span className="text-ink-you underline decoration-wavy decoration-1 underline-offset-4">browse</span>
        </>
      )}
    </span>
  )
}

function DropzoneDescription({ className, children, ...props }: React.ComponentProps<"span">) {
  const ctx = useDropzone()
  const text = children ?? describeLimits({ accept: ctx.accept, maxSize: ctx.maxSize, maxFiles: ctx.maxFiles, multiple: ctx.multiple })
  if (!text) return null
  return (
    <span data-slot="dropzone-description" className={cn("text-sm text-muted-foreground", className)} {...props}>
      {text}
    </span>
  )
}

function DropzoneRejections({ className, ...props }: React.ComponentProps<"div">) {
  const ctx = useDropzone()
  if (ctx.rejections.length === 0) return null
  return (
    <div data-slot="dropzone-rejections" role="alert" className={cn("font-hand text-sm text-red", className)} {...props}>
      <ul className="grid gap-1">
        {ctx.rejections.map((r, i) => (
          <li key={`${r.file.name}-${i}`} className="flex items-start gap-1.5">
            <Icon name="circle-alert" size={16} className="mt-0.5 shrink-0" />
            <span>{r.errors.map((e) => e.message).join(" ")}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DropzoneList({ className, children, ...props }: Omit<React.ComponentProps<"ul">, "children"> & { children?: (file: File, index: number) => React.ReactNode }) {
  const ctx = useDropzone()
  if (ctx.files.length === 0) return null
  return (
    <ul data-slot="dropzone-list" aria-label="Selected files" className={cn("grid", className)} {...props}>
      {ctx.files.map((f, i) => (children ? <React.Fragment key={`${f.name}-${f.size}-${f.lastModified}-${i}`}>{children(f, i)}</React.Fragment> : <DropzoneItem key={`${f.name}-${f.size}-${f.lastModified}-${i}`} file={f} />))}
    </ul>
  )
}

const iconFor = (file: File): string => (file.type.startsWith("image/") ? "image" : /pdf|text|word|document/.test(file.type) ? "file-text" : /zip|compressed|tar/.test(file.type) ? "archive" : "file")

function DropzoneItem({
  file,
  progress,
  status = "idle",
  error,
  thumbnail = true,
  onRemove,
  removeLabel,
  className,
  seed,
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  file: File
  progress?: number
  status?: "idle" | "uploading" | "done" | "error"
  error?: string
  thumbnail?: boolean
  onRemove?: () => void
  removeLabel?: string
  seed?: string | number
}) {
  const ctx = useDropzone()
  const { hostRef, hostProps, node } = useInk({ recipe: dropzoneItemRecipe, params: { status: status === "error" ? "error" : status === "done" ? "done" : "idle" }, kind: "rule", seed, still: true })
  const [preview, setPreview] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!thumbnail || !file.type.startsWith("image/") || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return
    let url: string
    try {
      url = URL.createObjectURL(file)
    } catch {
      return
    }
    setPreview(url)
    return () => {
      URL.revokeObjectURL(url)
      setPreview(null)
    }
  }, [file, thumbnail])
  return (
    <li
      data-slot="dropzone-item"
      data-status={status}
      ref={hostRef}
      {...hostProps}
      className={cn("relative isolate flex items-center gap-3 px-1 py-2.5 font-hand text-base", className)}
      {...props}
    >
      {node}
      <span
        data-slot="dropzone-item-media"
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center overflow-hidden text-ink-soft",
          preview ? "rotate-[-2deg] border-2 border-photo bg-photo shadow-[0_1px_2px_rgb(var(--ll-shade)/.35)]" : ""
        )}
      >
        {preview ? <img src={preview} alt="" decoding="async" loading="lazy" className="size-full object-cover" /> : <Icon name={iconFor(file)} size={24} />}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate font-bold">{file.name}</span>
        <span className={cn("truncate text-sm", status === "error" ? "text-red" : "text-muted-foreground")}>
          {status === "error" && error ? error : status === "done" ? `${formatBytes(file.size)}, done` : status === "uploading" && progress !== undefined ? `${formatBytes(file.size)}, ${Math.round(progress)}%` : formatBytes(file.size)}
        </span>
        {status === "uploading" && progress !== undefined && (
          <span role="progressbar" aria-label={`Uploading ${file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="mt-0.5 block h-1.5 w-full bg-pencil-mark/25">
            <span className="ll-swipe block h-full" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </span>
        )}
      </span>
      {status === "done" && <Icon name="circle-check" size={18} className="shrink-0 text-green" />}
      {status === "error" && <Icon name="circle-alert" size={18} className="shrink-0 text-red" />}
      <button
        type="button"
        data-slot="dropzone-item-remove"
        aria-label={removeLabel ?? `Remove ${file.name}`}
        disabled={ctx.disabled}
        onClick={() => {
          if (onRemove) onRemove()
          else ctx.remove(file)
          ctx.inputRef.current?.focus({ preventScroll: true })
        }}
        className="grid size-7 shrink-0 cursor-default place-items-center text-ink-soft outline-hidden hover:ll-swipe hover:text-ink focus-visible:ll-swipe focus-visible:text-ink focus-visible:[outline:2px_solid_var(--ll-focus)] focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:text-pencil-text"
      >
        <Icon name="x" size={14} />
      </button>
    </li>
  )
}

export { Dropzone, DropzoneArea, DropzoneIcon, DropzoneTitle, DropzoneDescription, DropzoneRejections, DropzoneList, DropzoneItem, useDropzone, formatBytes, matchesAccept }
export type { DropzoneProps, FileError, FileRejection, ErrorCode as DropzoneErrorCode }
