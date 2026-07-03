// @ts-nocheck
import Component from '../../vendor/animata/feature-cards/confirmation-message'

const previewProps = {
    successMessage: "Process Successful",
    labelName: "Animata",
    labelMessage: `The Confirmation Message component is a sleek, animated UI element that displays a checkmark with a success message.
      It expands to reveal a personalized detailed description of the process.`,
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
