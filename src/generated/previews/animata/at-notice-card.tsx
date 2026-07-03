// @ts-nocheck
import Component from '../../vendor/animata/card/notice-card'

const previewProps = {
    acceptText: "Accept",
    title: "To your attention!",
    description:
      "Due to severe weather conditions, we will be closed from 11th to 14th of January.",
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
