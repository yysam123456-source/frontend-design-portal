// @ts-nocheck
import Component from '../../vendor/animata/background/blurry-blob'

const previewProps = {
    className: "rounded-xl opacity-45",
    firstBlobColor: "bg-purple-400",
    secondBlobColor: "bg-blue-400",
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
