// @ts-nocheck
import { Button } from "../vendor/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../vendor/ui/card"
import { Input } from "../vendor/ui/input"
import { Label } from "../vendor/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../vendor/ui/tabs"

export const meta = {
  title: "Account and password",
  description: "Index-divider tabs: the active one is lifted and filled with highlighter, and the pencil baseline breaks under it. Arrow keys move between tabs, Home and End jump to the ends.",
  layout: "center" as const,
}

export default function Example() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card seed="tabs-account">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Make changes to your account here. Click save when you are done.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tabs-name">Name</Label>
              <Input id="tabs-name" defaultValue="Ada Lovelace" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tabs-username">Username</Label>
              <Input id="tabs-username" defaultValue="@ada" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card seed="tabs-password">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here. After saving, you will be logged out.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tabs-current">Current password</Label>
              <Input id="tabs-current" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tabs-new">New password</Label>
              <Input id="tabs-new" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
