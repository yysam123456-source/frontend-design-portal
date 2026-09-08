// @ts-nocheck
import * as ComponentModule from '../../vendor/threeui/typography-vortex/TypographyVortexCanvas'

const Component = ComponentModule.TypographyVortexCanvas
const previewProps = {
  "mode": "dark",
  "speed": 1,
  "ringGrowth": 1.21,
  "opacity": 1,
  "dissolveRadius": 1,
  "particleAmount": 1,
  "suctionDuration": 920
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
