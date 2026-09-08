// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/dot-matrix/DotMatrixBackground'

const Component = ComponentModule.DotMatrixBackground
const previewProps = {
  "speed": 1,
  "gridScale": 60,
  "mouseAmount": 0.04,
  "pulseSpeed": 0.4,
  "hue": 0,
  "radius": 0.15,
  "opacity": 0.35
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
