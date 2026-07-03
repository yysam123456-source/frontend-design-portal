import type { ImgHTMLAttributes } from 'react'

export default function Image(props: ImgHTMLAttributes<HTMLImageElement> & { src: any; alt?: string }) {
  const src = typeof props.src === 'string' ? props.src : props.src?.src || ''
  return <img {...props} src={src} alt={props.alt || ''} />
}
