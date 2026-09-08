// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/emerald-horizon/EmeraldHorizonBackground'

const Component = ComponentModule.EmeraldHorizonBackground
const previewProps = {
  "speed": 1,
  "waveScale": 1,
  "variation": 1,
  "hue": 0,
  "glow": 1,
  "vignette": 1
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
