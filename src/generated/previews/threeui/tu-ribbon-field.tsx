// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/ribbon-field/RibbonFieldBackground'

const Component = ComponentModule.RibbonFieldBackground
const previewProps = {
  "speed": 1,
  "pointerAmount": 1,
  "smoothing": 0.035,
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
