// @ts-nocheck
import Component from '../../vendor/animata/card/score-card'

const previewProps = { text: 'Preview Component', items: [
      { id: 'a', title: 'Home', name: 'Home', icon: <span>⌂</span>, href: '#' },
      { id: 'b', title: 'Search', name: 'Search', icon: <span>⌕</span>, href: '#' },
      { id: 'c', title: 'Settings', name: 'Settings', icon: <span>⚙</span>, href: '#' }
    ], className: 'text-4xl font-bold' }

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-100' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-100 p-8'}>
      <div style={compact ? { transform: 'scale(0.48)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
