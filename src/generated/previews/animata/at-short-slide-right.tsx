// @ts-nocheck
import * as ComponentModule from '../../vendor/animata/text/short-slide-right'

const Component = ComponentModule.default
const previewProps = { text: 'Preview Component', className: 'text-4xl font-bold' }

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-950 p-8 text-white'}>
      <div style={compact ? { transform: 'scale(0.52)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>Animata Preview</Component>
      </div>
    </div>
  )
}
