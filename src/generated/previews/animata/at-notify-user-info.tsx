// @ts-nocheck
import Component from '../../vendor/animata/card/notify-user-info'

const previewProps = {
    aiName: "Rostra AI",
    userName: "Sandra",
    paperTopic: "neural conditions",
    doctorName: "DoctorLLM",
    earnings: "$0.25c",
    weekTotal: "$400",
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
