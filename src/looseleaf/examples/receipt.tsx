// @ts-nocheck
import { Receipt, ReceiptFooter, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptTotal } from "../vendor/ui/receipt"

export const meta = {
  title: "A receipt",
  description: "Pinked at both ends, typed, the lines a description list. The total is bigger; nothing else is.",
  layout: "center" as const,
  stage: "desk" as const,
}

export default function Example() {
  return (
    <Receipt as="article" seed="till" aria-label="Receipt from Looseleaf Cafe">
      <ReceiptHeader>
        <span>Looseleaf Cafe</span>
        <span>12 rue de l&apos;Eau</span>
        <span>25 sep 2026 14:02</span>
      </ReceiptHeader>
      <ReceiptLines>
        <ReceiptLine qty={1} price="4.50">
          oat latte
        </ReceiptLine>
        <ReceiptLine qty={1} price="3.40">
          flat white
        </ReceiptLine>
        <ReceiptLine qty={2} price="6.20">
          almond croissant
        </ReceiptLine>
      </ReceiptLines>
      <ReceiptTotal>14.10</ReceiptTotal>
      <ReceiptFooter>thank you - come again</ReceiptFooter>
    </Receipt>
  )
}
