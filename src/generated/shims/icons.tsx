import type { SVGProps } from 'react'
export const Icon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="12" r="9" /></svg>
export const Dribbble = Icon
export const Facebook = Icon
export const Linkedin = Icon
export const X = Icon
export const Icons = new Proxy({}, { get: () => Icon }) as Record<string, typeof Icon>
