// @ts-nocheck
import { useEffect, useRef } from 'react'
import { OceanEngine } from '../../vendor/ascii-sharks/engine'
import type { SharkSpec } from '../../vendor/ascii-sharks/world'

// A lone ASCII thresher shark leads a boids fish school on a zero-dependency canvas.
const SHARKS: SharkSpec[] = [{ kind: 'thresher', size: 1 }]

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
