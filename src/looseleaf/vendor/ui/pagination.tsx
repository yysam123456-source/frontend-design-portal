// @ts-nocheck
import * as React from "react"

import { Button } from ".//button"
import { Icon } from ".//icon"
import { cn } from "../lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav role="navigation" aria-label="pagination" data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1.5", className)} {...props} />
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({ className, isActive, disabled, size = "icon", onClick, children, ...props }: PaginationLinkProps) {
  return (
    <Button asChild variant={isActive ? "secondary" : "ghost"} size={size} className={className} disabled={disabled}>
      <a aria-current={isActive ? "page" : undefined} data-slot="pagination-link" data-active={isActive} onClick={disabled ? undefined : onClick} {...props}>
        {children}
      </a>
    </Button>
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5 sm:ps-2.5", className)} {...props}>
      <Icon name="chevron-left" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5 sm:pe-2.5", className)} {...props}>
      <span className="hidden sm:block">Next</span>
      <Icon name="chevron-right" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-9 items-center justify-center text-ink-soft", className)} {...props}>
      <Icon name="ellipsis" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis }
