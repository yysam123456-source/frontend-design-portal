// @ts-nocheck
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../vendor/ui/table"

export const meta = {
  title: "Invoices",
  description: "The whole family: a header with a double rule, rows ruled by hand in pencil, a footer with its own double rule and a caption written underneath. Hover a row to see the swipe.",
  layout: "stack" as const,
}

const invoices = [
  { invoice: "INV001", status: "Paid", method: "Credit card", amount: "$250.00" },
  { invoice: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { invoice: "INV003", status: "Unpaid", method: "Bank transfer", amount: "$350.00" },
  { invoice: "INV004", status: "Paid", method: "Credit card", amount: "$450.00" },
  { invoice: "INV005", status: "Paid", method: "PayPal", amount: "$550.00" },
]

export default function Example() {
  return (
    <Table className="max-w-xl">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-bold">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="ll-num text-end">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="ll-num text-end">$1,750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
