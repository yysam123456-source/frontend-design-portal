// @ts-nocheck
import { IndexCard, IndexCardContent, IndexCardFooter, IndexCardHeader, IndexCardTitle } from "../vendor/ui/index-card"

export const meta = {
  title: "An index card",
  description: "A red header rule, blue lines every 30 px, and text that sits on them. The title goes above the red line; the footer at the foot.",
  layout: "stack" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <IndexCard seed="recipes">
      <IndexCardHeader>
        <IndexCardTitle>Recipes</IndexCardTitle>
      </IndexCardHeader>
      <IndexCardContent>
        <p>oat porridge, the slow way</p>
        <p>soup that forgives</p>
        <p>toast, honestly</p>
      </IndexCardContent>
      <IndexCardFooter>
        <span className="ll-num">no. 0042</span>
        <span className="ll-num">p. 3</span>
      </IndexCardFooter>
    </IndexCard>
  )
}
