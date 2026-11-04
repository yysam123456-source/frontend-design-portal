import type { ImgHTMLAttributes } from 'react'

/**
 * Minimal drop-in for next/image — a plain <img> that accepts the same
 * props surface used by the Phoenix Crown port (this is a Vite build,
 * there is no Next.js runtime). `priority` is accepted and ignored.
 */
export default function Image(
  props: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean },
) {
  const rest = { ...props }
  delete rest.priority
  return <img {...rest} />
}
