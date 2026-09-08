// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/orbital-sphere/OrbitalSphereBackground'

const Component = ComponentModule.OrbitalSphereBackground
const previewProps = {
  "speed": 1,
  "particleSize": 0.015,
  "particleOpacity": 0.8,
  "orbitOpacity": 0.25,
  "hue": 0,
  "scale": 1,
  "haloOpacity": 0.2
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
