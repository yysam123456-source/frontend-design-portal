// @ts-nocheck
import Component from '../../vendor/animata/button/swipe-button'

const previewProps = {
    className: "",
    secondText: "Get access",
    firstText: "Get access",
    firstClass: "bg-orange-500 text-white",
    secondClass: "bg-red-500 text-white",
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
