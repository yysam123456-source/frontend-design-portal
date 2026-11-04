// @ts-nocheck
import { Bubble, BubbleContent, BubbleGroup } from "../vendor/ui/bubble"
import { Mascot } from "../vendor/ui/mascot"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "../vendor/ui/message"

export const meta = {
  title: "A thread",
  description: "Two speakers. The footer of the first message rides above the avatar, so the avatar keeps standing beside the last bubble.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <MessageGroup className="mx-auto w-full max-w-lg gap-5 px-3 pb-4">
      <Message align="end">
        <MessageContent>
          <MessageHeader className="justify-end">Ada</MessageHeader>
          <Bubble variant="default">
            <BubbleContent seed="thread-1">Which of these should I fix first?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Mascot pose="write" size={40} seed="thread-mascot" />
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Stubby</MessageHeader>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent seed="thread-2">The failing test. Everything else can wait until it is green.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent seed="thread-3">It is a one-line fix in filter.ts.</BubbleContent>
            </Bubble>
          </BubbleGroup>
          <MessageFooter>edited a minute ago</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  )
}
