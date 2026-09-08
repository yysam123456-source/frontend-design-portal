// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/globe/GlobeCollection'

const Component = ComponentModule.GlobeCollection
const previewProps = {
  "speed": 1,
  "scale": 1,
  "smokeScale": 1,
  "smokeStrength": 1,
  "smokeSpeed": 1,
  "hue": 0,
  "saturation": 1,
  "glow": 1,
  "starDensity": 1,
  "starSpeed": 1,
  "starSize": 1,
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
