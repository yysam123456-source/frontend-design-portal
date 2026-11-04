// @ts-nocheck
import { Bubble, BubbleContent } from "../vendor/ui/bubble"
import { Message, MessageContent } from "../vendor/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../vendor/ui/message-scroller"

export const meta = {
  title: "A transcript that opens at the end",
  description: "It opens on the newest message. Scroll up and the page fades at the top, the jump button wakes; press it and you glide back down.",
  layout: "stack" as const,
  stage: "desk" as const,
  height: 420,
}

const LINES = [
  "Did the tags make it into the build?",
  "They did. The filter row is next.",
  "Can you draw the chips a little smaller?",
  "Smaller, yes. Two pixels off the padding.",
  "And the count at the top?",
  "It says 12 but the list has 11.",
  "Off by one, as ever.",
  "Found it: the archived note still counts.",
  "Fixed. Do you want a test for it?",
  "Yes please. One that would have caught it.",
  "Written. It fails on the old code and passes on the new.",
  "Lovely. Ship it after lunch?",
]

export default function Example() {
  return (
    <div className="mx-auto h-[380px] w-full max-w-md">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {LINES.map((text, i) => (
                <MessageScrollerItem key={i} messageId={`m${i}`}>
                  <Message align={i % 2 ? "end" : "start"}>
                    <MessageContent>
                      <Bubble variant={i % 2 ? "default" : "muted"}>
                        <BubbleContent seed={`line-${i}`}>{text}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  )
}
