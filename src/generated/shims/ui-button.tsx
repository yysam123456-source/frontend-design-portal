import type { ButtonHTMLAttributes } from 'react'
import { cn } from './utils'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('rounded-md px-3 py-2 text-sm font-medium', className)} {...props} />
}
