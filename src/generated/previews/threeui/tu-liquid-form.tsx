// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/liquid-form/LiquidFormBackground'

const Component = ComponentModule.LiquidFormBackground
const previewProps = {
  "speed": 1,
  "morph": 1,
  "noiseScale": 1,
  "mouseAmount": 0.15,
  "metal": 1,
  "camera": 5.5,
  "tintHue": 220,
  "tintAmount": 0
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
