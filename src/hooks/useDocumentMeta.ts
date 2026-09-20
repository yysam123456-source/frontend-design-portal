import { useEffect } from 'react'

export interface DocumentMeta {
  title: string
  description: string
  canonical: string
}

const SITE_ORIGIN = 'https://fxlab.craftisle.com'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Zero-dependency per-view document metadata.
 *
 * The SPA has three real routes (/ , /components , /showcases). Each one needs its own
 * title / description / canonical so that Google's JS rendering does not attribute every
 * view to the same head tags. Static catalogue pages (/projects/*, /categories/*,
 * /components/*) do NOT rely on this — they ship their own meta in generated HTML.
 */
export function useDocumentMeta(meta: DocumentMeta) {
  const { title, description, canonical } = meta

  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertCanonical(canonical)
  }, [title, description, canonical])
}

export { SITE_ORIGIN }
