// @ts-nocheck
import { Avatar, AvatarFallback } from "../vendor/ui/avatar"
import { Button } from "../vendor/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleIndicator, CollapsibleTrigger } from "../vendor/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../vendor/ui/dropdown-menu"
import { Icon } from "../vendor/ui/icon"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "../vendor/ui/sidebar"

export const meta = {
  title: "App sidebar",
  description:
    "The real thing: a team switcher in the header, a group with a collapsible sub-menu, projects with per-row actions and a count, and the account menu in the footer. The current page has the highlighter and the bracket in the margin. Try Ctrl/Cmd+B.",
  layout: "full" as const,
  height: 600,
  stage: "desk" as const,
}

const PLATFORM = [
  { title: "Playground", icon: "square-terminal", url: "#", isActive: false },
  { title: "Models", icon: "bot", url: "#", isActive: false },
  {
    title: "Documentation",
    icon: "book-open",
    url: "#",
    isActive: true,
    items: [
      { title: "Introduction", url: "#" },
      { title: "Get started", url: "#", isActive: true },
      { title: "Tutorials", url: "#" },
    ],
  },
  { title: "Settings", icon: "settings", url: "#", isActive: false },
]

const PROJECTS = [
  { name: "Design engineering", icon: "frame" },
  { name: "Sales & marketing", icon: "chart-pie", count: "12" },
  { name: "Travel", icon: "map" },
]

export default function Example() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden [transform:translateZ(0)]">
      <SidebarProvider className="h-full min-h-0">
        <Sidebar className="h-full" seed="app">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <span className="grid size-8 shrink-0 place-items-center bg-marker/80 text-ink">
                        <Icon name="book-open" />
                      </span>
                      <span className="grid flex-1 text-start leading-tight">
                        <span className="truncate font-bold">Looseleaf</span>
                        <span className="truncate text-xs text-muted-foreground">Notebook</span>
                      </span>
                      <Icon name="chevrons-up-down" className="ms-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    <DropdownMenuLabel>Notebooks</DropdownMenuLabel>
                    <DropdownMenuItem>
                      Looseleaf <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Field notes <DropdownMenuShortcut>⌘2</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Icon name="plus" /> Add notebook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PLATFORM.map((item) =>
                    item.items ? (
                      <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={item.isActive} tooltip={item.title}>
                              <Icon name={item.icon} />
                              <span>{item.title}</span>
                              <CollapsibleIndicator className="ms-auto" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((sub) => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton asChild isActive={sub.isActive}>
                                    <a href={sub.url} aria-current={sub.isActive ? "page" : undefined}>
                                      <span>{sub.title}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton tooltip={item.title}>
                          <Icon name={item.icon} />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PROJECTS.map((p) => (
                    <SidebarMenuItem key={p.name}>
                      <SidebarMenuButton tooltip={p.name}>
                        <Icon name={p.icon} />
                        <span>{p.name}</span>
                      </SidebarMenuButton>
                      {p.count ? (
                        <SidebarMenuBadge>{p.count}</SidebarMenuBadge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction showOnHover aria-label={`Actions for ${p.name}`}>
                              <Icon name="ellipsis" />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            <DropdownMenuItem>
                              <Icon name="folder" /> View project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Icon name="share" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              <Icon name="trash" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" tooltip="Account">
                      <Avatar className="size-8">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="grid flex-1 text-start leading-tight">
                        <span className="truncate font-bold">Jo Delacroix</span>
                        <span className="truncate text-xs text-muted-foreground">jo@looseleaf.example</span>
                      </span>
                      <Icon name="chevrons-up-down" className="ms-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuItem>
                      <Icon name="credit-card" /> Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Icon name="bell" /> Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Icon name="log-out" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="font-script text-2xl leading-none font-semibold">Get started</h2>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            The page beside the pad. Collapse it with the button, with Ctrl/Cmd+B, or by clicking the strip on its edge.
          </p>
          <Button variant="secondary" size="sm" className="mt-4 w-fit">
            <Icon name="sparkles" /> Continue
          </Button>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
