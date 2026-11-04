// @ts-nocheck
import { Alert, AlertDescription, AlertTitle } from "../vendor/ui/alert"
import { Icon } from "../vendor/ui/icon"

export const meta = {
  title: "Default and destructive",
  description: "The two upstream variants. An icon put first is circled in the alert's marker; the destructive alert is told apart by red hatching in its margin, not by red alone.",
  layout: "stack" as const,
}

export default function Example() {
  return (
    <div className="grid w-full max-w-xl items-start gap-5">
      <Alert>
        <Icon name="info" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app using the cli.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <Icon name="circle-alert" />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>
          <p>Please verify your billing information and try again.</p>
          <ul className="list-inside list-disc text-sm">
            <li>Check your card details</li>
            <li>Ensure sufficient funds</li>
            <li>Verify billing address</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
