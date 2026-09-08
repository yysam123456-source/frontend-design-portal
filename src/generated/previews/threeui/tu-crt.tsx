// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/crt/CrtBackground'

const Component = ComponentModule.CrtBackground
const previewProps = {
  "speed": 1,
  "typeSpeed": 1,
  "motion": 1,
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
