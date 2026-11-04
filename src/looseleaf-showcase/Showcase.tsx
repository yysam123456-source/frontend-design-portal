import { useEffect, useState } from 'react'
import { Desk } from '../looseleaf/vendor/ui/desk'
import { Button } from '../looseleaf/vendor/ui/button'
import { Label } from '../looseleaf/vendor/ui/label'
import { Switch } from '../looseleaf/vendor/ui/switch'
import { Slider } from '../looseleaf/vendor/ui/slider'
import { Bubble, BubbleContent, BubbleGroup } from '../looseleaf/vendor/ui/bubble'
import { Corkboard, CorkboardNote } from '../looseleaf/vendor/ui/corkboard'
import { Polaroid, PolaroidCaption, PolaroidImage } from '../looseleaf/vendor/ui/polaroid'
import { Rating } from '../looseleaf/vendor/ui/rating'
import { Stamp } from '../looseleaf/vendor/ui/stamp'
import { StickerSheet, StickerSheetItem } from '../looseleaf/vendor/ui/sticker-sheet'
import { Tally } from '../looseleaf/vendor/ui/tally'
import { SignaturePad } from '../looseleaf/vendor/ui/signature-pad'
import { TearOff, TearOffBody, TearOffStub } from '../looseleaf/vendor/ui/tear-off'
import ReceiptPaper from './ReceiptPaper'

const ROUTE_COMPONENTS = '/components/'
const REPO = 'https://github.com/kevintngo/looseleaf'

function go(path: string) {
  const target = window.top ?? window
  target.location.href = path
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.ll-reveal'))
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    nodes.forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [])
}

const NOTES = [
  {
    id: 'source',
    x: 28,
    y: 54,
    stock: 'sticky-yellow',
    rotate: -3,
    n: '01',
    title: 'Ships as source',
    body: 'Copy one file into your repo. No runtime package, no provider tree, no theme jail.',
    tag: 'zero dependency',
  },
  {
    id: 'drawn',
    x: 238,
    y: 22,
    stock: 'sticky-pink',
    rotate: 2.4,
    n: '02',
    title: 'Drawn, not faked',
    body: 'Every border is an SVG stroke with a seed. It scales past 4K without turning into mush.',
    tag: 'svg ink',
  },
  {
    id: 'states',
    x: 448,
    y: 76,
    stock: 'sticky-green',
    rotate: -1.6,
    n: '03',
    title: 'Real states',
    body: 'Hover, focus, disabled, dark, RTL. The wobble respects every one of them.',
    tag: 'a11y included',
  },
  {
    id: 'paper',
    x: 660,
    y: 34,
    stock: 'sticky-blue',
    rotate: 3,
    n: '04',
    title: 'Paper, not plastic',
    body: 'Fibres, stocks, tape, pins and soft shadows. Depth without a single photograph.',
    tag: '3d by ink',
  },
  {
    id: 'tailwind',
    x: 116,
    y: 304,
    stock: 'sticky-orange',
    rotate: 2.2,
    n: '05',
    title: 'Tailwind v4 native',
    body: 'Tokens, variants and utilities line up with your existing theme and dark mode.',
    tag: 'copy + paste',
  },
  {
    id: 'mit',
    x: 534,
    y: 318,
    stock: 'sticky-yellow',
    rotate: -2.4,
    n: '06',
    title: 'MIT, no strings',
    body: 'Ship it in client work, paid products, weird side projects. Attribution is a kindness, not a cage.',
    tag: 'do what you want',
  },
] as const

const STICKERS = [
  'coffee-to-go',
  'boba-tea',
  'cat-loaf',
  'monstera-leaf',
  'ringed-planet',
  'astronaut-helmet',
  'pencil-cup',
  'thumbs-up',
  'party-popper',
  'stamp-paid',
  'popcorn-tub',
  'sun-shades',
]

function MiniControls() {
  const [pressure, setPressure] = useState([62])
  const [snap, setSnap] = useState(true)
  return (
    <div className="grid w-full gap-4">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <Label className="text-[13px]">Pencil pressure</Label>
          <output className="ll-num font-script text-xl leading-none text-ink-you">{pressure[0]}</output>
        </div>
        <Slider value={pressure} onValueChange={setPressure} max={100} step={1} aria-label="Pencil pressure" />
      </div>
      <div className="flex items-center gap-2.5">
        <Switch checked={snap} onCheckedChange={setSnap} id="llshow-snap" aria-label="Snap to grid" />
        <Label htmlFor="llshow-snap" className="text-[13px]">
          Snap to grid
        </Label>
      </div>
    </div>
  )
}

function MiniChat() {
  return (
    <BubbleGroup className="w-full gap-2.5">
      <Bubble align="start">
        <BubbleContent className="text-[12px] leading-tight" seed="llshow-chat-a">
          Can we make the whole site feel like paper?
        </BubbleContent>
      </Bubble>
      <Bubble align="end" variant="secondary">
        <BubbleContent className="text-[12px] leading-tight" seed="llshow-chat-b">
          It already does. Try dragging the receipt.
        </BubbleContent>
      </Bubble>
    </BubbleGroup>
  )
}

export default function Showcase() {
  const [rating, setRating] = useState(4)
  const [torn, setTorn] = useState(false)
  useReveal()

  return (
    <Desk className="llshow" objects={['coffee', 'pencil', 'clips', 'pins']} lamp={0.7} seed="llshow-desk">
      {/* ── 01 · Hero: a receipt with real paper physics ─────────── */}
      <section id="act-1" className="llshow-hero">
        <div className="hero-copy ll-reveal">
          <p className="llshow-eyebrow">LOOSELEAF · 123 COMPONENTS · MIT · REACT 19</p>
          <h1 className="llshow-title">
            A UI kit that
            <br />
            feels like <span className="llshow-underline">paper.</span>
          </h1>
          <p className="llshow-lede">
            Kevin Ngo&apos;s Looseleaf is a stationery cupboard for React: buttons with pencil wobble, receipts with
            pinked edges, stickers that actually peel. Every border is drawn by hand — and every piece is yours to keep.
          </p>
          <div className="hero-actions">
            <Button size="lg" onClick={() => go(ROUTE_COMPONENTS)}>
              Browse 123 components
            </Button>
            <Button variant="ghost" size="lg" onClick={() => window.open(REPO, '_blank', 'noopener')}>
              GitHub ↗
            </Button>
          </div>
          <dl className="hero-facts">
            <div>
              <dt>123</dt>
              <dd>components</dd>
            </div>
            <div>
              <dt>160</dt>
              <dd>icons</dd>
            </div>
            <div>
              <dt>58</dt>
              <dd>stickers</dd>
            </div>
            <div>
              <dt>0</dt>
              <dd>runtime deps</dd>
            </div>
          </dl>
        </div>

        <div className="hero-paper ll-reveal">
          <div className="paper-stage">
            <ReceiptPaper className="receipt-canvas" />
          </div>
          <p className="paper-caption">
            <span>DRAG THE SHEET — IT BENDS, THEN SETTLES</span>
            <span>VERLET · 27 × 50 GRID · TOP EDGE PINNED</span>
          </p>
        </div>

        <div className="llshow-scroll" aria-hidden="true">
          <span>SCROLL</span>
          <i />
        </div>
      </section>

      {/* ── 02 · Sticky notes on a corkboard ─────────────────────── */}
      <section id="act-2" className="llshow-section ll-reveal">
        <header className="llshow-head">
          <p className="llshow-eyebrow">02 · THE PITCH, IN STICKY NOTES</p>
          <h2 className="llshow-h2">Six reasons it earns a place in your next build.</h2>
          <p className="llshow-sub">
            These are real <code>CorkboardNote</code> components. Pick one up and move it. Press R to turn it.
          </p>
        </header>

        <div className="board-scroll">
          <Corkboard className="llshow-board" label="Looseleaf reasons board" seed="llshow-board">
            {NOTES.map((note) => (
              <CorkboardNote
                key={note.id}
                id={note.id}
                x={note.x}
                y={note.y}
                rotate={note.rotate}
                stock={note.stock}
                label={note.title}
              >
                <div className="llshow-note">
                  <span className="llshow-note-n">{note.n}</span>
                  <span className="llshow-note-title">{note.title}</span>
                  <span className="llshow-note-body">{note.body}</span>
                  <span className="llshow-note-tag">{note.tag}</span>
                </div>
              </CorkboardNote>
            ))}
          </Corkboard>
        </div>
      </section>

      {/* ── 03 · Polaroids with live components ──────────────────── */}
      <section id="act-3" className="llshow-section ll-reveal">
        <header className="llshow-head">
          <p className="llshow-eyebrow">03 · LIVE, NOT A SCREENSHOT</p>
          <h2 className="llshow-h2">Every photo is a running component.</h2>
          <p className="llshow-sub">
            No screenshots were harmed in this showcase. Flip the switch, drag the slider, hover the stars.
          </p>
        </header>

        <div className="polaroid-shelf">
          <div className="polaroid-item tilt-a">
            <Polaroid seed="llshow-polaroid-buttons">
              <PolaroidImage label="Looseleaf buttons" seed="llshow-photo-buttons">
                <div className="polaroid-live polaroid-live-buttons">
                  <Button size="sm">Save changes</Button>
                  <Button size="sm" variant="outline">
                    Discard
                  </Button>
                  <Button size="sm" variant="ghost">
                    Preview
                  </Button>
                </div>
              </PolaroidImage>
              <PolaroidCaption>Buttons that sit on the page</PolaroidCaption>
            </Polaroid>
          </div>

          <div className="polaroid-item tilt-b">
            <Polaroid seed="llshow-polaroid-controls">
              <PolaroidImage label="Looseleaf switch and slider" seed="llshow-photo-controls">
                <div className="polaroid-live polaroid-live-controls">
                  <MiniControls />
                </div>
              </PolaroidImage>
              <PolaroidCaption>Controls you can actually use</PolaroidCaption>
            </Polaroid>
          </div>

          <div className="polaroid-item tilt-c">
            <Polaroid seed="llshow-polaroid-chat">
              <PolaroidImage label="Looseleaf chat bubbles" seed="llshow-photo-chat">
                <div className="polaroid-live polaroid-live-chat">
                  <MiniChat />
                </div>
              </PolaroidImage>
              <PolaroidCaption>Conversation, drawn by hand</PolaroidCaption>
            </Polaroid>
          </div>

          <div className="polaroid-item tilt-d">
            <Polaroid seed="llshow-polaroid-rating">
              <PolaroidImage label="Looseleaf rating and tally" seed="llshow-photo-rating">
                <div className="polaroid-live polaroid-live-rating">
                  <Rating value={rating} onValueChange={setRating} aria-label="Rate Looseleaf" />
                  <div className="flex items-center gap-3">
                    <Tally count={rating * 2} size="sm" label={`${rating * 2} marks`} />
                    <span className="font-hand text-[12px] text-ink-soft">{rating} / 5, honestly</span>
                  </div>
                </div>
              </PolaroidImage>
              <PolaroidCaption>Stars with real state</PolaroidCaption>
            </Polaroid>
          </div>
        </div>
      </section>

      {/* ── 04 · Peel a sticker ──────────────────────────────────── */}
      <section id="act-4" className="llshow-section llshow-sticker-section ll-reveal">
        <div className="sticker-copy">
          <p className="llshow-eyebrow">04 · TAKE SOMETHING WITH YOU</p>
          <h2 className="llshow-h2">Peel a sticker. Stick it anywhere.</h2>
          <p className="llshow-sub">
            This is one real <code>StickerSheet</code>: press a sticker and it lifts off the glassine, leaving its
            kiss-cut outline behind. Press the outline to put it back.
          </p>
          <div className="stamp-row" aria-hidden="true">
            <Stamp text="SHIP IT" shape="rect" ink="red" tilt={-7} w={168} h={56} seed="llshow-ship" />
            <Stamp text="MIT" shape="round" ink="green" tilt={6} w={92} h={92} ring="FREE TO USE * FREE TO SHIP *" seed="llshow-mit" />
            <Stamp text="HAND DRAWN" shape="rect" ink="ink-you" tilt={3} w={190} h={54} dashed seed="llshow-hand" />
          </div>
        </div>

        <div className="sticker-sheet-wrap">
          <StickerSheet title="Looseleaf sticker sheet no. 01" columns={4} size={64} defaultPeeled={['stamp-paid']}>
            {STICKERS.map((name) => (
              <StickerSheetItem key={name} name={name} />
            ))}
          </StickerSheet>
        </div>
      </section>

      {/* ── 05 · Sign, then tear the stub ────────────────────────── */}
      <section id="act-5" className="llshow-section llshow-final ll-reveal">
        <div className="final-copy">
          <p className="llshow-eyebrow">05 · SIGN THE GUESTBOOK</p>
          <h2 className="llshow-h2">One signature. One stub. One rabbit hole.</h2>
          <p className="llshow-sub">
            Draw your name with a mouse, a finger or a pen — the brush swells where you lean on it. Then pull the stub
            away and keep the address.
          </p>
          <SignaturePad className="llshow-signature" width={420} height={150} seed="llshow-signature" />
        </div>

        <div className="final-ticket">
          <TearOff onTornChange={setTorn}>
            <TearOffBody className="llshow-ticket-body">
              <span className="llshow-ticket-kicker">LOOSELEAF · ADMIT ONE</span>
              <span className="llshow-ticket-title">The whole drawer</span>
              <span className="llshow-ticket-meta">123 components · 160 icons · 58 stickers · 62 blocks</span>
              {torn ? (
                <Button className="mt-3" onClick={() => go(ROUTE_COMPONENTS)}>
                  Open the component drawer →
                </Button>
              ) : (
                <span className="llshow-ticket-hint">Pull the stub to unlock the link.</span>
              )}
            </TearOffBody>
            <TearOffStub className="w-36" label="Tear off the ticket stub">
              <span className="font-script text-3xl leading-none">FREE</span>
              <span className="font-type text-xs leading-7 tracking-[0.18em] text-pencil-text">ADMIT ONE</span>
              <span className="font-type text-[10px] text-pencil-text">NO. 0123</span>
            </TearOffStub>
          </TearOff>
        </div>
      </section>

      <footer className="llshow-footer">
        <div>
          <span className="llshow-footer-mark">Looseleaf</span>
          <span className="llshow-footer-copy">Hand-drawn UI by Kevin Ngo · MIT · integrated into this portal</span>
        </div>
        <div className="llshow-footer-links">
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={ROUTE_COMPONENTS} target="_top">
            Components
          </a>
        </div>
      </footer>
    </Desk>
  )
}
