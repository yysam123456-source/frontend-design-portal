// @ts-nocheck
import Component from '../../vendor/animata/button/animated-follow-button'

const previewProps = {
    initialText: "Follow",
    changeText: "Following!",
    className: "h-16 bg-green-100 text-green-700 flex rounded-full items-center justify-center",
    changeTextClassName:
      "h-16 bg-green-700 text-green-100 rounded-full text-white flex items-center justify-center",
    animationType: "up-to-down",
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
