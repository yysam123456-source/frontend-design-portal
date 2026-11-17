// @ts-nocheck
import * as ComponentModule from '../../vendor/pinui/components/CartCard'
const Component = ComponentModule.default

export default function Preview({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden"
        style={{ background: '#eeece6' }}
      >
        <div style={{ width: 480, height: 480, flex: 'none', transform: 'scale(0.35)', transformOrigin: 'center' }}>
          <Component />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full overflow-hidden" style={{ background: '#eeece6' }}>
      <Component />
    </div>
  )
}
