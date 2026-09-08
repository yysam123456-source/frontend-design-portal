// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/warp-field/WarpFieldBackground'

const Component = ComponentModule.WarpFieldBackground
const previewProps = {
  "speed": 15,
  "streakOpacity": 0.6,
  "tileOpacity": 0.9,
  "fov": 75,
  "hue": 0,
  "saturation": 1,
  "brightness": 1
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
