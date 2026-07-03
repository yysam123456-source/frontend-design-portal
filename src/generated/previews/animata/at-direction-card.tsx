// @ts-nocheck
import Component from '../../vendor/animata/widget/direction-card'

const previewProps = { text: 'Preview Component', directionValues: [
      { distance: 350, direction: 'right', to: 'Gurkha St.', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg> },
      { distance: 700, direction: 'left', to: 'Rounding St.', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M19 12H5M12 5l-7 7 7 7"/></svg> },
      { distance: 100, direction: 'straight', to: 'Hwy 16', iconType: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg> }
    ], items: [
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
