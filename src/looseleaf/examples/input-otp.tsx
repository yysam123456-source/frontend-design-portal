// @ts-nocheck
import * as React from "react"

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../vendor/ui/input-otp"
import { Label } from "../vendor/ui/label"

export const meta = {
  title: "Six digits",
  description: "Click and type, or paste \"482915\" (three digits are already in). The box with the caret wears the blue ring and a blinking pencil stroke; each digit writes itself in; the dash is only decoration.",
  layout: "center" as const,
  height: 220,
}

export default function Example() {
  const [value, setValue] = React.useState("482")
  return (
    <div className="grid gap-3">
      <Label htmlFor="otp-six">One-time code</Label>
      <InputOTP id="otp-six" maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="font-hand text-sm text-ink-muted" aria-live="polite">
        {value === "" ? "Enter your one-time password." : `You entered: ${value}`}
      </p>
    </div>
  )
}
