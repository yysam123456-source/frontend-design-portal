// @ts-nocheck
import { useEffect, useRef } from 'react'
import { OceanEngine } from '../../vendor/ascii-sharks/engine'
import type { SharkSpec } from '../../vendor/ascii-sharks/world'

// A mixed school of ASCII sharks — big hammerhead leads, thresher/mako/nurse step down in size.
const SHARKS: SharkSpec[] = [
  { kind: 'hammerhead', size: 1 },
  { kind: 'thresher', size: 0.78 },
  { kind: 'mako', size: 0.64 },
  { kind: 'nurse', size: 0.5 },
]

export default function Preview({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new OceanEngine(canvas, SHARKS)
    return () => engine.destroy()
  }, [])

  return (
    <div
      className={
        compact
          ? 'h-full w-full overflow-hidden bg-[#04070d]'
          : 'min-h-[380px] w-full overflow-hidden bg-[#04070d]'
      }
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          display: 'block',
          fontFamily: 'ui-monospace, Menlo, Consolas, "Courier New", monospace',
        }}
      />
    </div>
  )
}
