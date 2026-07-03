// @ts-nocheck
import * as ComponentModule from '../../vendor/animata/card/card-stack'

const CardStack = ComponentModule.default
const cards = [
  { id: 'alpha', title: 'Alpha', description: 'First generated card' },
  { id: 'beta', title: 'Beta', description: 'Second generated card' },
  { id: 'gamma', title: 'Gamma', description: 'Third generated card' },
]

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 text-white' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-950 p-8 text-white'}>
      <div className="relative h-64 w-72" style={compact ? { transform: 'scale(0.62)', transformOrigin: 'center' } : undefined}>
        <CardStack items={cards} autoplay>
          <CardStack.Viewport className="relative h-full w-full">
            <CardStack.List>
              {(card: any) => (
                <CardStack.Card className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="mt-3 text-sm text-slate-500">{card.description}</p>
                </CardStack.Card>
              )}
            </CardStack.List>
            <CardStack.Trigger full aria-label="Next card" />
          </CardStack.Viewport>
        </CardStack>
      </div>
    </div>
  )
}
