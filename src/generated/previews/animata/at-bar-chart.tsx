// @ts-nocheck
import Component from '../../vendor/animata/graphs/bar-chart'

const previewProps = {
    items: [
      {
        label: "A",
        progress: 45,
        className: "rounded-md bg-blue-600/45",
      },
      { label: "B", progress: 25, className: "rounded-md bg-blue-600/25" },
      { label: "C", progress: 15, className: "rounded-md bg-blue-600/15" },
      { label: "B", progress: 10, className: "rounded-md bg-blue-600/20" },
      { label: "C", progress: 15, className: "rounded-md bg-blue-600/15" },
      { label: "D", progress: 30, className: "rounded-md bg-blue-600/30" },
      { label: "E", progress: 70, className: "rounded-md bg-blue-600/70" },
      {
        label: "A",
        progress: 45,
        className: "rounded-md bg-blue-600/45",
      },
      { label: "B", progress: 10, className: "rounded-md bg-blue-600/20" },
      { label: "C", progress: 15, className: "rounded-md bg-blue-600/15" },
      { label: "B", progress: 10, className: "rounded-md bg-blue-600/20" },
      { label: "B", progress: 10, className: "rounded-md bg-blue-600/20" },
      { label: "B", progress: 10, className: "rounded-md bg-blue-600/20" },
      { label: "C", progress: 85, className: "rounded-md bg-blue-600/85" },
      {
        label: "D",
        progress: 90,
        className: "rounded-md bg-blue-600/90",
      },
      { label: "E", progress: 15, className: "rounded-md bg-blue-600/15" },
    ],
    height: 4 * 12, // h-12 * 4
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
