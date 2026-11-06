/*
 * <ascii-art>: any piece in the ascii.rest library, as one tag.
 * Part of ascii.rest by @bas3line (https://github.com/bas3line), MIT licensed.
 *
 * This is the portal's trimmed copy of the upstream element: it defines only
 * <ascii-art> (not <ascii-banner>), and it loads the self-hosted font from
 * /ascii-rest/fonts instead of ascii.rest, so the whole runtime works offline.
 *
 *   <script type="module" src="/ascii-rest/ascii-art.js"></script>
 *   <ascii-art piece="donut"></ascii-art>
 *
 * Attributes:
 *   piece    a piece's file name: "donut", "night-coast"
 *   src      or the URL of any module that follows the piece contract
 *   fps      overrides the piece's frame rate
 *   options  JSON overriding the piece's option defaults: '{"text":"hello"}'
 *   label    what the picture shows, for screen readers
 *   mono     draws a coloured piece as text in one ink, like any other
 */
import { isPiece, load } from './library.js'
import { mount, pieceIn } from './mount.js'

const STYLE =
  '@font-face{font-family:"ascii.rest mono";src:url(/ascii-rest/fonts/ascii-rest-mono.woff2) format("woff2");unicode-range:U+00B0,U+00B7,U+2022,U+2500-259F,U+25CF;font-display:swap}' +
  ':where(ascii-art){display:block}:where(ascii-art>pre){margin:0;font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","ascii.rest mono",monospace;line-height:1.2;letter-spacing:0;white-space:pre;font-variant-ligatures:none}'

const Base = typeof HTMLElement === 'undefined' ? class {} : HTMLElement
const queued = new WeakSet()
const soon = (el, start) => {
  if (queued.has(el)) return
  queued.add(el)
  queueMicrotask(() => {
    queued.delete(el)
    if (el.isConnected) start()
  })
}

export class AsciiArt extends Base {
  static observedAttributes = ['piece', 'src', 'fps', 'options', 'label', 'mono']
  #stop = null
  #run = 0
  connectedCallback() {
    soon(this, () => this.#start())
  }
  disconnectedCallback() {
    this.#run++
    this.#stop?.()
    this.#stop = null
  }
  attributeChangedCallback() {
    if (this.isConnected) soon(this, () => this.#start())
  }
  async #start() {
    const run = ++this.#run
    const name = this.getAttribute('piece') ?? ''
    const src = this.getAttribute('src')
    let piece
    let options
    try {
      if (src) piece = pieceIn(await import(new URL(src, document.baseURI).href), src)
      else if (isPiece(name)) piece = await load[name]()
      else return
      options = JSON.parse(this.getAttribute('options') || '{}')
    } catch (error) {
      console.warn(`<ascii-art> could not load ${src || name}:`, error)
      return
    }
    if (run !== this.#run) return
    const fps = this.getAttribute('fps')
    if (fps !== null && fps !== '' && !Number.isNaN(+fps)) options.fps = +fps
    const el = document.createElement(piece.meta.palette && !this.hasAttribute('mono') ? 'canvas' : 'pre')
    el.setAttribute('role', 'img')
    el.setAttribute('aria-label', this.getAttribute('label') || piece.meta.name)
    this.#stop?.()
    this.replaceChildren(el)
    this.#stop = mount(el, piece, options)
  }
}

export function define(tag = 'ascii-art') {
  if (typeof customElements === 'undefined') return
  if (customElements.get(tag)) return
  const style = document.createElement('style')
  style.textContent = tag === 'ascii-art' ? STYLE : STYLE.replaceAll('ascii-art', tag)
  document.head.append(style)
  customElements.define(tag, AsciiArt)
}

define()
