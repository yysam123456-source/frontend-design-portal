// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/bell-field/BellFieldBackground'

const Component = ComponentModule.BellFieldBackground
const previewProps = {
  "speed": 1,
  "pointerAmount": 1,
  "strikeDuration": 2400,
  "emberAmount": 1,
  "hue": 0,
  "saturation": 1,
  "brightness": 1,
  "opacity": 1
}

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#05060a',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
