// @ts-nocheck
import { Paper } from "../vendor/ui/paper"
import { StampButton, StampSurface } from "../vendor/ui/stamp-button"

export const meta = {
  title: "Stamp the page",
  description: "Press the stamp and an impression lands on the document with a thump; the page gives a little. Press it again and a fresh strike replaces the last (Approve twice is still one APPROVED).",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <StampSurface className="w-full max-w-md">
      <Paper stock="slip" tilt={false} className="p-6 pb-4 text-ink">
        <h3 className="font-script text-3xl">Invoice 2026-031</h3>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-pencil-text">To</dt>
          <dd>The Paper Club</dd>
          <dt className="text-pencil-text">For</dt>
          <dd>Twelve notebooks, felt tips</dd>
          <dt className="text-pencil-text">Total</dt>
          <dd className="ll-num">$ 148.00</dd>
        </dl>
        <div className="mt-24 flex items-end gap-4">
          <StampButton stamp="stamp-approved" place={{ x: 0.66, y: 0.5 }}>
            Approve
          </StampButton>
          <StampButton stamp="stamp-void" place={{ x: 0.5, y: 0.42 }}>
            Void
          </StampButton>
        </div>
      </Paper>
    </StampSurface>
  )
}
