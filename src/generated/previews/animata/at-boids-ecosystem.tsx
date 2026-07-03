// @ts-nocheck
import Component from '../../vendor/animata/background/boids-ecosystem'

const previewProps = {
    count: 140,
    cursorRadius: 110,
    background: "#0b0b12",
    palette: ["#f5f5f4", "#fde68a", "#93c5fd", "#fca5a5"],
  }

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-100' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-100 p-8'}>
      <div style={compact ? { transform: 'scale(0.48)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
