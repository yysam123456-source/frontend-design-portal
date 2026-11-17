// @ts-nocheck
import * as ComponentModule from '../../vendor/pinui/blocx/ContactForm'
import '../../vendor/pinui/pinui-fonts.css'
const Component = ComponentModule.default

export default function Preview({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden"
        style={{ background: '#111111' }}
      >
        <div style={{ width: 1440, height: 810, flex: 'none', transform: 'scale(0.2)', transformOrigin: 'center' }}>
          <Component />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full overflow-hidden" style={{ background: '#111111' }}>
      <Component />
    </div>
  )
}
