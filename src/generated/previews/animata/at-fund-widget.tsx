// @ts-nocheck
import Component from '../../vendor/animata/widget/fund-widget'

const previewProps = {
    funds: [
      { value: "2.7Cr", change: 12, label: "Stocks" },
      { value: "3.5Cr", change: -8, label: "Funds" },
      { value: "1.2Cr", change: 6, label: "Deposits" },
    ],
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
