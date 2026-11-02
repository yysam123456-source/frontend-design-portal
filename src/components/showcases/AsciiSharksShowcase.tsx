// @ts-nocheck
import { useEffect, useRef } from 'react'
import { OceanEngine } from '../../generated/vendor/ascii-sharks/engine'
import type { SharkSpec } from '../../generated/vendor/ascii-sharks/world'

/* ═══════════════════════════════════════════════════════════════
   ASCII OCEAN — stackedlol/ascii-sharks 全屏沉浸展示
   8 种 ASCII 鲨鱼 + Reynolds boids 鱼群，零依赖 canvas 实时渲染
   ═══════════════════════════════════════════════════════════════ */

const SHARKS: SharkSpec[] = [
  { kind: 'greathammer', size: 1 },
  { kind: 'hammerhead', size: 0.84 },
  { kind: 'tiger', size: 0.72 },
  { kind: 'thresher', size: 0.64 },
  { kind: 'mako', size: 0.56 },
  { kind: 'zebra', size: 0.48 },
  { kind: 'nurse', size: 0.42 },
  { kind: 'classic', size: 0.38 },
]

export default function AsciiSharksShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new OceanEngine(canvas, SHARKS)
    return () => engine.destroy()
  }, [])

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-[#04070d]">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          display: 'block',
          fontFamily: 'ui-monospace, Menlo, Consolas, "Courier New", monospace',
        }}
      />
      <div className="pointer-events-none fixed right-5 bottom-5 z-20 text-right select-none">
        <div className="text-white/90 text-sm font-semibold tracking-[0.2em]">
          ASCII OCEAN
        </div>
        <div className="mt-1 text-white/45 text-xs">
          8 shark species · Reynolds boids fish · zero dependencies
        </div>
        <a
          href="https://github.com/stackedlol/ascii-sharks"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto mt-1 inline-block text-cyan-300/70 text-xs hover:text-cyan-200 transition-colors"
        >
          github.com/stackedlol/ascii-sharks
        </a>
      </div>
    </div>
  )
}
