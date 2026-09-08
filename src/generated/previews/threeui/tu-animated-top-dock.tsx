// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/animated-top-dock/AnimatedTopDock'

const Component = ComponentModule.AnimatedTopDock
const previewProps = {
  "proximity": 122,
  "spring": 0.19,
  "damping": 0.7,
  "widthGrowth": 17,
  "heightGrowth": 16,
  "drop": 3.5
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
