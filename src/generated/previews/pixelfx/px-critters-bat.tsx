// @ts-nocheck
import { useEffect, useRef } from 'react'
import * as FxModule from '../../vendor/pixelfx/fx/critters/bat.js'
import { createFrame, clearFrame, createFx, composite } from '../../vendor/pixelfx/core/index.js'

export default function Preview({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const meta = FxModule.meta || {}
    const [W, H] = meta.size || [160, 160]
    const [ox, oy] = meta.origin || [W / 2, H / 2]
    canvas.width = W
    canvas.height = H
    const frame = createFrame(W, H)
    const img = ctx.createImageData(W, H)
    const fx = createFx(FxModule, { x: ox, y: oy, seed: 7 })
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      fx.update(dt)
      clearFrame(frame)
      fx.draw(frame, 'back')
      fx.draw(frame, 'front')
      composite(frame, img.data, null)
      ctx.putImageData(img, 0, 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={
        compact
          ? 'flex h-full w-full items-center justify-center overflow-hidden bg-[#0a0e14]'
          : 'flex min-h-[360px] w-full items-center justify-center overflow-hidden bg-[#0a0e14] p-8'
      }
    >
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated', width: '100%', maxWidth: '480px', height: 'auto' }}
      />
    </div>
  )
}
