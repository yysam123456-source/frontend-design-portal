// @ts-nocheck
import Component from '../../vendor/animata/card/survey-card'

const previewProps = {
    items: [
      {
        vote: 50,
        itemName: "Charmander",
      },
      {
        vote: 60,
        itemName: "Pikachu",
      },
      {
        vote: 20,
        itemName: "Squirtle",
      },
    ],
    width: 250, // Fixed width
    surveyTitle: "Pokemon Survey ?",
  }

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-100' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-100 p-8'}>
      <div style={compact ? { transform: 'scale(0.48)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
