// @ts-nocheck
import { Envelope, EnvelopeAddress, EnvelopeFront, EnvelopeLetter, EnvelopeSender, EnvelopeTrigger } from "../vendor/ui/envelope"

export const meta = {
  title: "An envelope",
  description: "Press it, or Tab to it and press Space: the flap stands up behind and the letter slides out. Hover lifts the flap a sliver.",
  layout: "center" as const,
  stage: "desk" as const,
  height: 420,
}

export default function Example() {
  return (
    <Envelope seed="post" className="mt-12">
      <EnvelopeFront>
        <EnvelopeSender>
          The Stationer
          <br />
          High Street
        </EnvelopeSender>
        <EnvelopeAddress>
          <p>Ada Lovelace</p>
          <p>12 rue de l&apos;Eau</p>
          <p>Paris</p>
        </EnvelopeAddress>
        <EnvelopeTrigger>Read the letter from The Stationer</EnvelopeTrigger>
      </EnvelopeFront>
      <EnvelopeLetter>
        <p className="font-script text-3xl leading-none font-bold">Dear Ada,</p>
        <p className="mt-2">The flap is up and the letter comes out from behind the front.</p>
      </EnvelopeLetter>
    </Envelope>
  )
}
