import type { AnchorHTMLAttributes, ReactNode } from 'react'

export default function Link({ href = '#', children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) {
  return <a href={String(href)} {...props}>{children}</a>
}
