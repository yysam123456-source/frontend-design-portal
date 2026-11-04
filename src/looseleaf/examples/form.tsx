// @ts-nocheck
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "../vendor/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../vendor/ui/form"
import { Input } from "../vendor/ui/input"

export const meta = {
  title: "Default",
  description: "react-hook-form with a zod schema. Press Save with the fields empty: the labels and boxes turn red pencil and each message is written under its field with a wavy underline. Fix one and its message goes on the next change.",
  layout: "stack" as const,
}

const schema = z.object({
  username: z.string().min(2, "Your name needs at least 2 letters."),
  email: z.string().email("Enter an address like ada@notes.dev."),
})

export default function Example() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "" },
  })
  const [saved, setSaved] = React.useState("")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => setSaved(`Saved ${v.username} <${v.email}>`))} className="grid w-full max-w-sm gap-5" noValidate>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Ada" {...field} />
              </FormControl>
              <FormDescription>Shown on the pages you write.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ada@notes.dev" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Save</Button>
          <span role="status" className="text-sm text-ink-muted">
            {saved}
          </span>
        </div>
      </form>
    </Form>
  )
}
