// @ts-nocheck
import { Ticket, TicketBody, TicketDescription, TicketNumber, TicketStub, TicketTitle } from "../vendor/ui/ticket"

export const meta = {
  title: "Admit one",
  description: "Concave corners, a bite out of both edges where the stub tears off, and a row of holes along the tear. The whole silhouette is drawn, holes and all.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Ticket seed="admit" role="group" aria-label="Ticket number 0042" className="max-w-md">
      <TicketBody>
        <TicketTitle>Admit one</TicketTitle>
        <TicketDescription>Le Grand Jardin</TicketDescription>
        <TicketNumber>No. 0042</TicketNumber>
      </TicketBody>
      <TicketStub>
        <TicketNumber className="text-lg">
          <span className="block text-xs">No.</span>
          0042
        </TicketNumber>
      </TicketStub>
    </Ticket>
  )
}
