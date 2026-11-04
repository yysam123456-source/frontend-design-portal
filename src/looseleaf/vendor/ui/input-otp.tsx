// @ts-nocheck
"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

import { Icon } from ".//icon"
import { useInk, useMergedRef } from "../lib/ink/react"
import { otpCss, otpSlotRecipe } from "../lib/ink/recipes/input-otp-ink"
import { cn } from "../lib/utils"

const stripSeparators = (pasted: string): string => pasted.replace(/[\s\u2010-\u2015-]+/g, "")

const InvalidContext = React.createContext<{ invalid: boolean; disabled: boolean; touched: boolean }>({ invalid: false, disabled: false, touched: false })

function InputOTP({
  className,
  containerClassName,
  invalid,
  disabled,
  onChange,
  pasteTransformer = stripSeparators,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
  invalid?: boolean
}) {
  const [touched, setTouched] = React.useState(false)
  const bad = !!invalid || props["aria-invalid"] === true || props["aria-invalid"] === "true"
  const value = React.useMemo(() => ({ invalid: bad, disabled: !!disabled, touched }), [bad, disabled, touched])
  return (
    <InvalidContext.Provider value={value}>
      <style href="ll-input-otp" precedence="low">
        {otpCss()}
      </style>
      <OTPInput
        data-slot="input-otp"
        data-touched={touched ? "" : undefined}
        aria-invalid={bad || undefined}
        disabled={disabled}
        pasteTransformer={pasteTransformer}
        containerClassName={cn("group/otp flex max-w-full flex-nowrap items-center gap-3 has-disabled:cursor-not-allowed", containerClassName)}
        className={cn("disabled:cursor-not-allowed", className)}
        onChange={(v) => {
          setTouched(true)
          onChange?.(v)
        }}
        {...props}
      />
    </InvalidContext.Provider>
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-otp-group" className={cn("flex min-w-0 items-center gap-1.5 calm:gap-1", className)} {...props} />
}

function InputOTPSlot({
  index,
  className,
  seed,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
  seed?: string | number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { invalid, disabled, touched } = React.useContext(InvalidContext)
  const { char, hasFakeCaret, isActive, placeholderChar } = inputOTPContext?.slots[index] ?? {}
  const { hostRef, hostProps, node } = useInk({
    recipe: otpSlotRecipe,
    params: { invalid, disabled, active: !!isActive, filled: !!char },
    kind: "field",
    seed,
    still: true,
  })
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-filled={char ? "true" : undefined}
      data-focus-visible={isActive ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      ref={useMergedRef<HTMLDivElement>(hostRef, ref)}
      {...hostProps}
      className={cn(
        "relative isolate flex h-12 w-10 min-w-6 items-center justify-center font-script text-[1.75rem] leading-none font-semibold text-(--ll-input-ink) select-none compact:h-10 compact:w-9 calm:h-9 calm:w-8 calm:text-2xl",
        "data-[active=true]:z-10 forced-colors:border forced-colors:border-[CanvasText]",
        disabled && "text-pencil-text",
        className
      )}
      {...props}
    >
      {node}
      {char ? (
        <span key={char} className={cn(touched && "animate-pop")}>
          {char}
        </span>
      ) : (
        placeholderChar && <span className="text-(--ll-placeholder)">{placeholderChar}</span>
      )}
      {hasFakeCaret && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span data-part="caret" />
        </span>
      )}
    </div>
  )
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" className={cn("shrink-0 text-ink-soft", className)} {...props}>
      <Icon name="minus" size={20} />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS }
