// @ts-nocheck
import * as ComponentModule from '../../vendor/zelda-hyrule-ui/components/Modal/Modal'

const Component = ComponentModule.default
const previewProps = {
    variant: 'default',
    type: 'main',
    icon: 'shrine',
  value: 42,
  modifier: 'bonus',
  quality: 3,
  size: 96,
  title: 'Temple of Time',
  subtitle: 'Ancient Hyrule interface',
  text: 'Zelda Hyrule UI',
  label: 'Preview',
  description: 'Generated from the original React component source.',
  current: 7,
  max: 10,
  total: 12,
  count: 5,
  amount: 320,
  temperature: 23,
  weather: 'sunny',
  active: true,
  selected: true,
  progress: 68,
  onClick: () => {},
  actions: [
    { id: 'jump', label: 'Jump', button: 'A', icon: 'A' },
    { id: 'attack', label: 'Attack', button: 'Y', icon: 'Y' },
  ],
  cards: [
    { id: 'c1', title: 'Master Sword', description: 'Legendary blade', image: '', color: '#38bdf8' },
    { id: 'c2', title: 'Hylian Shield', description: 'Ancient shield', image: '', color: '#fbbf24' },
  ],
  hearts: Array.from({ length: 10 }, (_, index) => ({ id: index, filled: index < 7 })),
  items: [
    { id: 'master-sword', name: 'Master Sword', title: 'Master Sword', value: 30, selected: true },
    { id: 'hylian-shield', name: 'Hylian Shield', title: 'Hylian Shield', value: 90 },
  ],
  quests: [
    { id: 'q1', title: 'Recover the Master Sword', type: 'main', completed: false },
    { id: 'q2', title: 'Seek the shrine', type: 'shrine', completed: true },
  ],
}

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-[#061816] text-[#d8f6ff]' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-[#061816] p-8 text-[#d8f6ff]'}>
      <div style={compact ? { transform: 'scale(0.58)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps}>Zelda Hyrule UI</Component>
      </div>
    </div>
  )
}
