// @ts-nocheck
import * as ComponentModule from '../../vendor/eldoraui/component/blur-fade'

const Component = ComponentModule.BlurFade
const previewProps = { className: '', duration: 0.5, delay: 0.05 }
const previewChildren = (
  <div className="flex min-w-64 flex-col gap-3">
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90">Eldora UI</div>
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70">Generated live preview</div>
  </div>
)

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-neutral-950 p-8 text-white'}>
      <div style={compact ? { transform: 'scale(0.62)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>{previewChildren}</Component>
      </div>
    </div>
  )
}
