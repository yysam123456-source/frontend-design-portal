// @ts-nocheck
"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { animate } from "motion/react";
import "./presence-cards.css";

/**
 * Presence Cards — two cards on a shared canvas, worked on live by four
 * people at once, and by you.
 *
 * An Activity heatmap and a Content card sit on a soft peach field. necati and
 * artur paint the heatmap, each in their own half of it; kev drags a corner
 * radius handle on the artwork and puts it back; tiago sweeps a text selection
 * across the title. Every cursor moves on a spring the way a hand moves a
 * mouse, dips when it presses and rings when it clicks. Your own pointer
 * carries a "you" tag.
 *
 * Everything they do, you can do too. Paint the heatmap. Drag any of the four
 * round handles to set the artwork's corner radius, with a live readout, or
 * focus the handle and use the arrow keys. Press the artwork to change its
 * colours. Press the title or the line under it to select it, press again (or
 * double-click, or Enter) to rewrite it. Whatever you have your hands on, the
 * collaborator working there steps back to give you room, and picks up from
 * where you left it.
 *
 * The scene is laid out in design pixels and scaled to whatever box it is
 * given. It has two arrangements, the cards side by side and the cards
 * stacked, and takes whichever lets it be drawn larger, so on a phone it
 * stacks rather than shrinking to nothing. Every position the cursors aim
 * for is measured from a card, so the same choreography plays in both.
 *
 * Nothing runs while the scene is off screen or the tab is hidden, and with
 * reduced motion it fades in once and holds still.
 */

export type PresenceCardsProps = {
  theme?: "light" | "dark";
  /** Take the container's whole box. Without it the scene is 480px tall with rounded corners. */
  fill?: boolean;
  /** The collaborators' loops. Off, the cursors arrive and rest at home. */
  autoplay?: boolean;
};

type Pt = [number, number];
type CardId = "activity" | "content";
type Layout = { name: "wide" | "tall"; w: number; h: number } & Record<CardId, Pt>;

/* ── the two arrangements, in design pixels ───────────────────────────── */
const WIDE: Layout = { name: "wide", w: 960, h: 520, activity: [148, 240], content: [522, 56] };
const TALL: Layout = { name: "tall", w: 520, h: 640, content: [85, 60], activity: [85, 340] };
/* the scene reads best a little smaller than its box: room around it, and never blown up */
const MAX_SCALE = 1.15;
const BREATH_WIDE = 0.8;
/* the stacked arrangement already carries the name tags' room at its sides */
const BREATH_TALL = 0.94;

function fit(w: number, h: number): { layout: Layout; scale: number } {
  const wide = Math.min(w / WIDE.w, h / WIDE.h);
  const tall = Math.min(w / TALL.w, h / TALL.h);
  /* side by side is the drawing; stacking only when it buys real size */
  const layout = tall > wide * 1.3 ? TALL : WIDE;
  const scale = Math.min(layout === TALL ? tall * BREATH_TALL : wide * BREATH_WIDE, MAX_SCALE);
  return { layout, scale: Math.max(scale, 0.1) };
}

/* ── motion tokens ─────────────────────────────────────────────────────── */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const TRAVEL = { type: "spring", duration: 0.95, bounce: 0.14 } as const; /* a hand moving a mouse */
const DRAG = { type: "spring", duration: 0.7, bounce: 0.1 } as const; /* slower, deliberate */
const POP = { type: "spring", duration: 0.5, bounce: 0.42 } as const; /* a liquid pop for fills */
const SOFT = { type: "spring", duration: 0.6, bounce: 0.22 } as const;
const SNAP = { type: "spring", duration: 0.35, bounce: 0.2 } as const; /* a key press on the radius */
const FOLLOW = { type: "spring", stiffness: 420, damping: 34, mass: 0.6 } as const;
const INSTANT = { duration: 0 } as const;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ── heatmap ───────────────────────────────────────────────────────────── */
const COLS = 10;
const ROWS = 7;
const PITCH_X = 26.2;
const PITCH_Y = 26;
/* the first cell, measured from the Activity card */
const GRID: Pt = [80, 41];
/* col,row → level: the cells lit in the drawing */
const INITIAL: Record<string, number> = {
  "4,0": 2, "8,1": 1, "2,2": 3, "3,2": 2, "1,3": 3,
  "5,4": 1, "7,4": 1, "2,5": 3, "1,6": 3, "8,6": 1,
};
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { c, r, level: INITIAL[`${c},${r}`] ?? 0 };
});
const cellCenter = (i: number): Pt => [GRID[0] + CELLS[i].c * PITCH_X + 10, GRID[1] + CELLS[i].r * PITCH_Y + 10];

/* ── the artwork ───────────────────────────────────────────────────────── */
const RADIUS_MIN = 0;
const RADIUS_MAX = 48;
const RADIUS_REST = 16;
/* the handles sit 20px in from the frame's corners at the resting radius, and travel 0.8px per px of radius */
const HANDLE_TRAVEL = 0.8;

/* each palette: sky top, sky bottom, far hill, near hill, front hill, window top, window bottom, icons */
const PALETTES = [
  { name: "Sky", c: ["#e6ecfc", "#bccbf4", "#9db6ee", "#6e93e4", "#86a5ea", "#f3f5fe", "#d9dff7", "#587cd6"] },
  { name: "Mint", c: ["#e3f6ee", "#b9e6d2", "#8fd3b6", "#4fb38c", "#74c7a4", "#f2fbf7", "#d5efe3", "#3a9a74"] },
  { name: "Peach", c: ["#fdeee6", "#f8cdb9", "#f4ac8f", "#e9805e", "#f09a7b", "#fff6f1", "#fadfd2", "#d0643f"] },
  { name: "Lilac", c: ["#f0eafd", "#d3c6f6", "#b6a2ee", "#8f72e0", "#a690ea", "#f7f4fe", "#e2daf8", "#7353cf"] },
] as const;

/* ── the text ──────────────────────────────────────────────────────────── */
type Field = "title" | "subtitle";
const MAX_CHARS = 14;
/* where the selection starts, from the Content card; it is as wide as the text, up to the card's edge */
const HIGHLIGHT: Record<Field, { left: number; top: number; height: number }> = {
  title: { left: 194, top: 64, height: 52 },
  subtitle: { left: 194, top: 122, height: 48 },
};
const HIGHLIGHT_MAX = 330 - 194;

/* ── the four collaborators ───────────────────────────────────────────── */
type Who = "necati" | "artur" | "tiago" | "kev";
/*
 * The arrow is drawn with its tip on the cursor's origin, pointing up and to
 * the left; `flip` mirrors it so each tip points the way it does in the
 * drawing, and the name sits on the opposite side of it.
 */
const PEOPLE: Record<Who, { color: string; card: CardId; home: Pt; flip: string; label: CSSProperties }> = {
  necati: { color: "#f7953b", card: "activity", home: [67, 57], flip: "scale(-1,-1)", label: { right: 31, bottom: 29 } },
  artur: { color: "#e7797d", card: "activity", home: [302, 85], flip: "scale(-1,1)", label: { right: 24, top: 37 } },
  tiago: { color: "#4f7fe3", card: "content", home: [225, 49], flip: "scale(1,-1)", label: { left: 28, bottom: 37 } },
  kev: { color: "#f04a31", card: "content", home: [113, 174], flip: "scale(1,1)", label: { left: 22, top: 42 } },
};
const WHO = Object.keys(PEOPLE) as Who[];
type CursorParts = {
  el: HTMLDivElement | null;
  body: HTMLDivElement | null;
  arrow: HTMLDivElement | null;
  ring: HTMLSpanElement | null;
  label: HTMLSpanElement | null;
};

/* kev's handle, and where he drags it from; tiago's sweep starts here — all from the Content card */
const GRAB: Pt = [150, 151];
const SWEEP_FROM: Pt = [196, 92];

/* how long something you touched stays yours before its collaborator comes back to it */
const HOLD_MS = 5000;

/* ── the loops stop by throwing this, from whichever await they are in ─ */
const STOP = Symbol("stop");

export default function PresenceCards({ theme = "light", fill = false, autoplay = true }: PresenceCardsProps) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>(WIDE);
  const layoutRef = useRef<Layout>(WIDE);
  const scaleRef = useRef(1);

  const cellEls = useRef<(HTMLDivElement | null)[]>([]);
  const fillEls = useRef<(HTMLDivElement | null)[]>([]);
  /* what each cell holds now, and whether it is still one of the drawing's own */
  const cellState = useRef(CELLS.map((cell) => ({ level: cell.level, pinned: cell.level > 0 })));

  const cardEls = useRef<Partial<Record<CardId, HTMLElement | null>>>({});
  const artRef = useRef<HTMLDivElement>(null);
  const radiusEls = useRef<(HTMLSpanElement | null)[]>([]);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const textEls = useRef<Record<Field, HTMLParagraphElement | null>>({ title: null, subtitle: null });
  const tagRef = useRef<HTMLSpanElement>(null);
  const cursorEls = useRef(
    Object.fromEntries(
      WHO.map((who) => [who, { el: null, body: null, arrow: null, ring: null, label: null } as CursorParts]),
    ) as Record<Who, CursorParts>,
  );

  const reduceRef = useRef(false);

  /* ── the Content card's state ───────────────────────────────────────── */
  const radiusRef = useRef(RADIUS_REST);
  const [palette, setPalette] = useState(0);
  const [text, setText] = useState<Record<Field, string>>({ title: "Content", subtitle: "Welcome" });
  /* bumped on every commit, so an edited line is remounted rather than reconciled against what the visitor typed */
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<Field | null>(null);
  const editingRef = useRef<Field | null>(null);
  /* which line the visitor has selected, if any */
  const selectedRef = useRef<Field | null>(null);
  const deselectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* until when the artwork and the text are the visitor's */
  const claim = useRef({ art: 0, text: 0 });
  const owns = (what: "art" | "text") =>
    Date.now() < claim.current[what] || (what === "text" && editingRef.current !== null);
  const take = (what: "art" | "text") => {
    claim.current[what] = Date.now() + HOLD_MS;
  };

  /* ── where things are, in the scene's own pixels ─────────────────────── */
  const at = (card: CardId, [x, y]: Pt): Pt => {
    const origin = layoutRef.current[card];
    return [origin[0] + x, origin[1] + y];
  };

  /* ── fitting the scene to its box ────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const measure = () => {
      const { width, height } = root.getBoundingClientRect();
      if (!width || !height) return;
      const next = fit(width, height);
      scaleRef.current = next.scale;
      stage.style.transform = `scale(${next.scale})`;
      if (next.layout !== layoutRef.current) {
        layoutRef.current = next.layout;
        setLayout(next.layout);
        /* everyone back home in the new arrangement, at once — a cursor gliding across a reflow reads as a glitch */
        for (const who of WHO) {
          const el = cursorEls.current[who].el;
          if (el) {
            const [x, y] = at(PEOPLE[who].card, PEOPLE[who].home);
            animate(el, { x, y }, INSTANT);
          }
        }
      }
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(root);
    return () => watch.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── painting one cell ──────────────────────────────────────────────── */
  const setCell = (i: number, level: number) => {
    const fillEl = fillEls.current[i];
    cellState.current[i].level = level;
    if (!fillEl) return;
    if (level) {
      fillEl.dataset.level = String(level);
      if (reduceRef.current) return animate(fillEl, { opacity: 1, scale: 1 }, { duration: 0.15 });
      return animate(fillEl, { opacity: [0, 1], scale: [0.45, 1] }, POP);
    }
    /* the colour stays on while it fades, so it leaves as what it was */
    return animate(fillEl, { opacity: 0, scale: 0.8 }, { duration: 0.2, ease: EASE_OUT });
  };

  const onCell = (i: number) => {
    const state = cellState.current[i];
    state.pinned = false; /* the visitor has taken it over */
    setCell(i, state.level ? 0 : 3);
  };

  /* ── the corner radius: one number, the art and four handles follow it ─ */
  const applyRadius = (value: number, how: object = INSTANT) => {
    const radius = clamp(value, RADIUS_MIN, RADIUS_MAX);
    radiusRef.current = radius;
    const inset = (radius - RADIUS_REST) * HANDLE_TRAVEL;
    radiusEls.current.forEach((handle) => {
      if (!handle) return;
      animate(handle, { x: inset * Number(handle.dataset.sx), y: inset * Number(handle.dataset.sy) }, how);
    });
    const rounded = String(Math.round(radius));
    if (readoutRef.current) readoutRef.current.textContent = `Radius ${rounded}`;
    radiusEls.current[3]?.setAttribute("aria-valuenow", rounded);
    const art = artRef.current;
    return art ? animate(art, { borderRadius: `${radius}px` }, how) : undefined;
  };

  const showReadout = (on: boolean) => {
    if (rootRef.current) rootRef.current.dataset.radius = on ? "on" : "";
  };
  const readoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashReadout = () => {
    showReadout(true);
    if (readoutTimer.current) clearTimeout(readoutTimer.current);
    readoutTimer.current = setTimeout(() => showReadout(false), 900);
  };

  const onHandleDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const sx = Number(handle.dataset.sx);
    const sy = Number(handle.dataset.sy);
    const start = radiusRef.current;
    const x0 = event.clientX;
    const y0 = event.clientY;
    take("art");
    showReadout(true);
    handle.dataset.dragging = "";
    const move = (e: globalThis.PointerEvent) => {
      /* pulling a handle in towards the middle rounds the corner; out towards its corner squares it */
      const inward = ((e.clientX - x0) * sx + (e.clientY - y0) * sy) / 2 / scaleRef.current;
      applyRadius(start + inward / HANDLE_TRAVEL);
      take("art");
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      delete handle.dataset.dragging;
      take("art");
      flashReadout();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  const onHandleKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    const step = event.shiftKey ? 8 : 2;
    const now = radiusRef.current;
    const next =
      event.key === "ArrowUp" || event.key === "ArrowRight" ? now + step
      : event.key === "ArrowDown" || event.key === "ArrowLeft" ? now - step
      : event.key === "Home" ? RADIUS_MIN
      : event.key === "End" ? RADIUS_MAX
      : null;
    if (next === null) return;
    event.preventDefault();
    take("art");
    applyRadius(next, reduceRef.current ? INSTANT : SNAP);
    flashReadout();
  };

  /* ── the artwork's colours ──────────────────────────────────────────── */
  const nextPalette = () => {
    take("art");
    setPalette((p) => (p + 1) % PALETTES.length);
    const art = artRef.current;
    if (art && !reduceRef.current) animate(art, { scale: [0.93, 1] }, { type: "spring", duration: 0.45, bounce: 0.45 });
  };

  /* ── the text: select, then rewrite ─────────────────────────────────── */
  /* sizes the selection to the line it is on, in design pixels; returns its width */
  const fitHighlight = (field: Field) => {
    const highlight = highlightRef.current;
    const line = textEls.current[field];
    if (!highlight) return HIGHLIGHT_MAX;
    const width = clamp((line?.offsetWidth ?? 120) + 8, 24, HIGHLIGHT_MAX);
    const spot = HIGHLIGHT[field];
    Object.assign(highlight.style, {
      left: `${spot.left}px`,
      top: `${spot.top}px`,
      height: `${spot.height}px`,
      width: `${width}px`,
    });
    return width;
  };

  const clearSelection = () => {
    if (deselectTimer.current) clearTimeout(deselectTimer.current);
    deselectTimer.current = null;
    if (selectedRef.current && highlightRef.current) {
      animate(highlightRef.current, { opacity: 0 }, { duration: 0.2, ease: EASE_OUT });
    }
    selectedRef.current = null;
  };

  const select = (field: Field) => {
    const highlight = highlightRef.current;
    if (!highlight) return;
    take("text");
    fitHighlight(field);
    highlight.dataset.owner = "you";
    selectedRef.current = field;
    animate(
      highlight,
      { scaleX: [0, 1], opacity: 1 },
      reduceRef.current ? INSTANT : { duration: 0.32, ease: EASE_IN_OUT },
    );
    if (deselectTimer.current) clearTimeout(deselectTimer.current);
    deselectTimer.current = setTimeout(clearSelection, 2600);
  };

  const startEditing = (field: Field) => {
    clearSelection();
    take("text");
    editingRef.current = field;
    setEditing(field);
  };

  /* a press selects the line; a press on the line already selected (or a double-click) rewrites it */
  const onTextClick = (field: Field) => {
    if (editingRef.current === field) return;
    if (selectedRef.current === field) startEditing(field);
    else select(field);
  };

  const onTextKey = (field: Field, event: KeyboardEvent<HTMLParagraphElement>) => {
    if (editingRef.current === field) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.textContent = text[field];
        event.currentTarget.blur();
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startEditing(field);
    }
  };

  const commit = (field: Field, el: HTMLParagraphElement) => {
    const typed = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    editingRef.current = null;
    setEditing(null);
    take("text");
    /* where overflow: clip is missing the card is a scroll box, and the caret may have slid it */
    const card = cardEls.current.content;
    if (card) card.scrollLeft = 0;
    setText((now) => ({ ...now, [field]: typed || now[field] }));
    setVersion((v) => v + 1);
  };

  /* once a line turns editable: focus it and select all of it, as a double-click in a design tool does */
  useEffect(() => {
    if (!editing) return;
    const el = textEls.current[editing];
    if (!el) return;
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  /* ── the scene: entrance, then four people at work ──────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    reduceRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;

    /* the loops wait here whenever the scene is off screen or the tab is hidden */
    let onScreen = false;
    let waiters: (() => void)[] = [];
    const awake = () => onScreen && !document.hidden;
    const wake = () => {
      if (!awake()) return;
      const ready = waiters;
      waiters = [];
      ready.forEach((go) => go());
    };
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      wake();
    });
    seen.observe(root);
    document.addEventListener("visibilitychange", wake);

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const check = () => {
      if (!alive) throw STOP;
    };
    const gate = async () => {
      check();
      if (!awake()) await new Promise<void>((go) => waiters.push(go));
      check();
    };
    const sleep = async (s: number) => {
      await new Promise<void>((go) => {
        const t = setTimeout(() => {
          timers.delete(t);
          go();
        }, s * 1000);
        timers.add(t);
      });
      await gate();
    };
    const run = async (p: unknown) => {
      await p;
      check();
    };

    const parts = (who: Who) => cursorEls.current[who];
    const moveTo = (who: Who, [x, y]: Pt, options: object = TRAVEL) =>
      animate(parts(who).el!, { x, y }, options);
    const press = (who: Who) => {
      animate(parts(who).label!, { scale: 0.96 }, { duration: 0.12, ease: EASE_OUT });
      return animate(parts(who).arrow!, { scale: 0.84 }, { duration: 0.12, ease: EASE_OUT });
    };
    const release = (who: Who) => {
      animate(parts(who).label!, { scale: 1 }, SOFT);
      return animate(parts(who).arrow!, { scale: 1 }, SOFT);
    };
    const click = async (who: Who) => {
      await run(press(who));
      animate(parts(who).ring!, { scale: [0.3, 1.5], opacity: [0.55, 0] }, { duration: 0.5, ease: EASE_OUT });
      await run(release(who));
    };
    const home = (who: Who) => at(PEOPLE[who].card, PEOPLE[who].home);

    /* a collaborator whose thing the visitor has taken lets go, goes home, and waits until it is free */
    const Yield = Symbol("yield");
    const stepBack = async (who: Who, what: "art" | "text") => {
      release(who);
      await run(moveTo(who, home(who)));
      while (owns(what)) await sleep(0.6);
      await sleep(rand(0.8, 1.6));
    };
    const mine = (what: "art" | "text") => {
      if (owns(what)) throw Yield;
    };
    /*
     * One step of work on something the visitor may take at any moment: it
     * ends when the step does or the moment it is taken, whichever is first —
     * an animation the visitor interrupts is never waited on.
     */
    const step = async (work: unknown, what: "art" | "text") => {
      let done = false;
      const taken = new Promise<void>((resolve) => {
        const tick = () => {
          if (done || !alive || owns(what)) return resolve();
          const t = setTimeout(() => {
            timers.delete(t);
            tick();
          }, 120);
          timers.add(t);
        };
        tick();
      });
      await Promise.race([work, taken]);
      done = true;
      check();
      mine(what);
    };

    /* necati and artur paint the heatmap, each in their own half of it */
    const painter = async (who: Who, minCol: number, maxCol: number, delay: number) => {
      await sleep(delay);
      let sinceHome = 0;
      for (;;) {
        const free = CELLS.map((_, i) => i).filter(
          (i) => CELLS[i].c >= minCol && CELLS[i].c <= maxCol && !cellState.current[i].pinned,
        );
        const lit = free.filter((i) => cellState.current[i].level);
        /* keep the board close to the drawing: light a few, then tidy up */
        const dark = free.filter((i) => !cellState.current[i].level);
        const target = lit.length >= 3 || !dark.length ? pick(lit.length ? lit : free) : pick(dark);
        if (target === undefined) return;
        await run(moveTo(who, at("activity", cellCenter(target))));
        await click(who);
        setCell(target, cellState.current[target].level ? 0 : pick([1, 2, 3, 3]));
        await sleep(rand(0.5, 1.3));
        if (++sinceHome >= 3) {
          sinceHome = 0;
          await run(moveTo(who, home(who)));
          await sleep(rand(1.6, 3));
        }
      }
    };

    /*
     * kev drags the bottom-right radius handle and puts it back — from wherever
     * the radius is, so a corner the visitor set is the one he returns to.
     */
    const kev = async () => {
      await sleep(1.8);
      for (;;) {
        try {
          mine("art");
          const base = radiusRef.current;
          const to = base <= RADIUS_MAX - 16 ? base + 16 : base - 16;
          const handleAt = (radius: number): Pt => {
            const inset = (radius - RADIUS_REST) * HANDLE_TRAVEL;
            return [GRAB[0] - inset, GRAB[1] - inset];
          };
          await step(moveTo("kev", at("content", handleAt(base))), "art");
          await step(press("kev"), "art");
          await step(Promise.all([moveTo("kev", at("content", handleAt(to)), DRAG), applyRadius(to, DRAG)]), "art");
          await step(release("kev"), "art");
          await sleep(1.1);
          mine("art");
          await step(press("kev"), "art");
          await step(Promise.all([moveTo("kev", at("content", handleAt(base)), DRAG), applyRadius(base, DRAG)]), "art");
          await run(release("kev"));
          await sleep(0.3);
          await run(moveTo("kev", home("kev")));
          await sleep(rand(3, 4.5));
        } catch (error) {
          if (error !== Yield) throw error;
          await stepBack("kev", "art");
        }
      }
    };

    /* tiago sweeps a selection across the title, as wide as whatever it says */
    const tiago = async () => {
      await sleep(3.4);
      const sweep = { duration: 0.75, ease: EASE_IN_OUT };
      for (;;) {
        try {
          mine("text");
          await step(moveTo("tiago", at("content", SWEEP_FROM)), "text");
          await step(press("tiago"), "text");
          const highlight = highlightRef.current!;
          const width = fitHighlight("title");
          highlight.dataset.owner = "tiago";
          const [x, y] = at("content", [SWEEP_FROM[0] + width - 10, SWEEP_FROM[1]]);
          await step(
            Promise.all([
              animate(parts("tiago").el!, { x, y }, sweep),
              animate(highlight, { scaleX: [0, 1], opacity: 1 }, sweep),
            ]),
            "text",
          );
          await step(release("tiago"), "text");
          await sleep(1.3);
          mine("text");
          if (highlight.dataset.owner === "tiago") {
            animate(highlight, { opacity: 0 }, { duration: 0.25, ease: EASE_OUT });
          }
          await run(moveTo("tiago", home("tiago")));
          await sleep(rand(3.5, 5));
        } catch (error) {
          if (error !== Yield) throw error;
          await stepBack("tiago", "text");
        }
      }
    };

    const guard = (loop: Promise<void>) =>
      loop.catch((error) => {
        if (error !== STOP) throw error;
      });

    /* everyone starts at home */
    for (const who of WHO) {
      const [x, y] = home(who);
      animate(parts(who).el!, { x, y }, INSTANT);
    }

    const cards = (["activity", "content"] as const).map((id) => cardEls.current[id]).filter(Boolean) as HTMLElement[];
    const bodies = WHO.map((who) => parts(who).body).filter(Boolean) as HTMLElement[];
    const cellNodes = cellEls.current.filter(Boolean) as HTMLElement[];

    const enter = async () => {
      if (reduceRef.current) {
        /* gentler: one short fade, no travel, no loop */
        animate([...cards, ...bodies, ...cellNodes], { opacity: [0, 1] }, { duration: 0.25, ease: "easeOut" });
        return;
      }
      await gate();
      animate(
        cards,
        { opacity: [0, 1], scale: [0.95, 1], y: [14, 0] },
        { type: "spring", duration: 0.8, bounce: 0.18, delay: (i: number) => 0.05 + i * 0.09 },
      );
      /* the heatmap washes in column by column — opacity only, the cells own a CSS transform for hover */
      animate(
        cellNodes,
        { opacity: [0, 1] },
        { duration: 0.45, ease: EASE_OUT, delay: (i: number) => 0.3 + CELLS[i].c * 0.035 + CELLS[i].r * 0.012 },
      );
      /* people arrive one after another */
      await run(
        animate(
          bodies,
          { opacity: [0, 1], scale: [0.9, 1] },
          { type: "spring", duration: 0.5, bounce: 0.3, delay: (i: number) => 0.75 + i * 0.07 },
        ),
      );
      if (!autoplay) return;
      guard(painter("necati", 0, 3, 0.4));
      guard(painter("artur", 4, 8, 1.3));
      guard(kev());
      guard(tiago());
    };
    guard(enter());

    return () => {
      alive = false;
      seen.disconnect();
      document.removeEventListener("visibilitychange", wake);
      timers.forEach(clearTimeout);
      /* release anything parked at the gate so it sees it is over */
      waiters.forEach((go) => go());
      waiters = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  /* the timers the visitor's own actions set */
  useEffect(
    () => () => {
      if (deselectTimer.current) clearTimeout(deselectTimer.current);
      if (readoutTimer.current) clearTimeout(readoutTimer.current);
    },
    [],
  );

  /* ── the visitor's own name tag, trailing a mouse ───────────────────── */
  const tagShown = useRef(false);
  const onPointerMove = (event: PointerEvent) => {
    const tag = tagRef.current;
    const stage = stageRef.current;
    if (!tag || !stage || event.pointerType !== "mouse") return;
    const box = stage.getBoundingClientRect();
    const scale = scaleRef.current;
    const to = { x: (event.clientX - box.left) / scale + 16, y: (event.clientY - box.top) / scale + 20 };
    if (!tagShown.current) {
      tagShown.current = true;
      animate(tag, to, INSTANT);
      animate(tag, { opacity: 1, scale: [0.9, 1] }, { duration: 0.18, ease: EASE_OUT });
      return;
    }
    animate(tag, to, reduceRef.current ? INSTANT : FOLLOW);
  };
  const onPointerLeave = () => {
    const tag = tagRef.current;
    if (!tag || !tagShown.current) return;
    tagShown.current = false;
    animate(tag, { opacity: 0, scale: 0.9 }, { duration: 0.15, ease: EASE_OUT });
  };

  const place = (card: CardId): CSSProperties => ({ left: layout[card][0], top: layout[card][1] });
  const colors = PALETTES[palette].c;
  const sky = `ppres-sky-${uid}`;
  const win = `ppres-win-${uid}`;

  const line = (field: Field) => {
    const live = editing === field;
    return (
      <p
        key={`${field}-${version}`}
        ref={(el) => {
          textEls.current[field] = el;
        }}
        className={`ppres__${field}`}
        data-editing={live || undefined}
        tabIndex={0}
        role="textbox"
        aria-label={field === "title" ? "Title" : "Subtitle"}
        aria-readonly={!live}
        contentEditable={live}
        suppressContentEditableWarning
        spellCheck={false}
        onClick={() => onTextClick(field)}
        onDoubleClick={() => startEditing(field)}
        onKeyDown={(event) => onTextKey(field, event)}
        onBlur={(event) => {
          if (editingRef.current === field) commit(field, event.currentTarget);
        }}
        onBeforeInput={(event) => {
          /* one line, and short enough to stay a title */
          const el = event.currentTarget;
          const data = (event.nativeEvent as InputEvent).data ?? "";
          const picked = window.getSelection()?.toString().length ?? 0;
          if (/\n/.test(data) || (el.textContent ?? "").length - picked + data.length > MAX_CHARS) event.preventDefault();
        }}
        onPaste={(event) => {
          event.preventDefault();
          const plain = event.clipboardData.getData("text/plain").replace(/\s+/g, " ").trim();
          document.execCommand("insertText", false, plain.slice(0, MAX_CHARS));
        }}
      >
        {text[field]}
      </p>
    );
  };

  return (
    <div
      ref={rootRef}
      className="ppres"
      data-theme={theme}
      data-fill={fill || undefined}
      data-layout={layout.name}
      role="group"
      aria-label="Two cards being edited live by four collaborators, and by you"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* soft peach blooms behind everything */}
      <div className="ppres__blooms" aria-hidden="true">
        <i className="ppres__bloom ppres__bloom--1" />
        <i className="ppres__bloom ppres__bloom--2" />
        <i className="ppres__bloom ppres__bloom--3" />
        <i className="ppres__bloom ppres__bloom--4" />
        <i className="ppres__bloom ppres__bloom--5" />
      </div>

      <div ref={stageRef} className="ppres__stage" style={{ width: layout.w, height: layout.h }}>
        {/* ── Activity ─────────────────────────────────────────────── */}
        <section
          ref={(el) => {
            cardEls.current.activity = el;
          }}
          className="ppres__card ppres__card--activity"
          style={place("activity")}
          aria-label="Activity"
        >
          <span className="ppres__axis" style={{ left: 80, top: 11 }}>Jul</span>
          <span className="ppres__axis" style={{ left: 209, top: 11 }}>Aug</span>
          <span className="ppres__axis" style={{ left: 18, top: 64 }}>Mon</span>
          <span className="ppres__axis" style={{ left: 18, top: 116 }}>Wed</span>
          <span className="ppres__axis" style={{ left: 18, top: 168 }}>Fri</span>

          <div className="ppres__grid" style={{ left: GRID[0], top: GRID[1] }} aria-hidden="true">
            {CELLS.map((cell, i) => (
              <div
                key={i}
                ref={(el) => {
                  cellEls.current[i] = el;
                }}
                className="ppres__cell"
                style={{ left: cell.c * PITCH_X, top: cell.r * PITCH_Y }}
                onPointerDown={() => onCell(i)}
              >
                <div
                  ref={(el) => {
                    fillEls.current[i] = el;
                  }}
                  className="ppres__fill"
                  data-level={cell.level || undefined}
                  style={{ opacity: cell.level ? 1 : 0 }}
                />
              </div>
            ))}
          </div>

          <div className="ppres__fade ppres__fade--soft" aria-hidden="true" />
        </section>

        {/* ── Content ──────────────────────────────────────────────── */}
        <section
          ref={(el) => {
            cardEls.current.content = el;
          }}
          className="ppres__card ppres__card--content"
          style={place("content")}
          aria-label="Content"
        >
          {/* the selected artwork */}
          <div className="ppres__frame">
            <div
              ref={artRef}
              className="ppres__art"
              role="button"
              tabIndex={0}
              aria-label={`Artwork colours: ${PALETTES[palette].name}. Press to change.`}
              onClick={nextPalette}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  nextPalette();
                }
              }}
            >
              <svg viewBox="0 0 124 124" aria-hidden="true">
                <defs>
                  <linearGradient id={sky} x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" style={{ stopColor: colors[0] }} />
                    <stop offset="1" style={{ stopColor: colors[1] }} />
                  </linearGradient>
                  <linearGradient id={win} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" style={{ stopColor: colors[5] }} />
                    <stop offset="1" style={{ stopColor: colors[6] }} />
                  </linearGradient>
                </defs>
                <rect width="124" height="124" fill={`url(#${sky})`} />
                <path d="M0 78 C24 60 40 96 66 84 S108 52 124 70 V124 H0 Z" style={{ fill: colors[2] }} />
                <path d="M30 124 C52 92 84 104 124 66 V124 Z" style={{ fill: colors[3] }} />
                <path d="M0 96 C18 84 30 104 48 100 S70 92 78 124 H0 Z" style={{ fill: colors[4] }} opacity="0.8" />
                <rect x="13" y="24" width="100" height="72" rx="13" fill={`url(#${win})`} stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.5" />
                <g fill="none" style={{ stroke: colors[7] }} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M49 40 H58" />
                  <rect x="69" y="35.5" width="9" height="9" rx="1.5" />
                  <path d="M89.5 35.5 L98.5 44.5 M98.5 35.5 L89.5 44.5" />
                </g>
                <rect y="103" width="124" height="21" fill="#f4f6fc" />
                {/* one swatch per palette: the live one is drawn larger */}
                {PALETTES.map((_, p) => (
                  <rect
                    key={p}
                    x={35.5 + p * 14}
                    y="109"
                    width="9"
                    height="9"
                    rx="2.2"
                    className="ppres__swatch"
                    data-on={palette === p || undefined}
                    style={{ fill: PALETTES[p].c[3] }}
                  />
                ))}
              </svg>
            </div>

            {/* the selection frame, its corner squares and the four radius handles */}
            <div className="ppres__select" aria-hidden="true" />
            <span className="ppres__corner" style={{ left: -5, top: -5 }} aria-hidden="true" />
            <span className="ppres__corner" style={{ right: -5, top: -5 }} aria-hidden="true" />
            <span className="ppres__corner" style={{ left: -5, bottom: -5 }} aria-hidden="true" />
            <span className="ppres__corner" style={{ right: -5, bottom: -5 }} aria-hidden="true" />
            {(
              [
                [1, 1, { left: 20, top: 20 }],
                [-1, 1, { right: 20, top: 20 }],
                [1, -1, { left: 20, bottom: 20 }],
                [-1, -1, { right: 20, bottom: 20 }],
              ] as const
            ).map(([sx, sy, spot], i) => {
              /* one handle stands for all four to the keyboard and to screen readers */
              const slider = i === 3;
              return (
                <span
                  key={i}
                  ref={(el) => {
                    radiusEls.current[i] = el;
                  }}
                  className="ppres__radius"
                  data-sx={sx}
                  data-sy={sy}
                  style={{ ...spot, cursor: sx * sy > 0 ? "nwse-resize" : "nesw-resize" }}
                  onPointerDown={onHandleDown}
                  {...(slider
                    ? {
                        role: "slider",
                        tabIndex: 0,
                        "aria-label": "Corner radius",
                        "aria-valuemin": RADIUS_MIN,
                        "aria-valuemax": RADIUS_MAX,
                        "aria-valuenow": RADIUS_REST,
                        onKeyDown: onHandleKey,
                        onFocus: () => showReadout(true),
                        onBlur: () => showReadout(false),
                      }
                    : { "aria-hidden": true })}
                />
              );
            })}
            <span ref={readoutRef} className="ppres__readout" aria-hidden="true">
              Radius {RADIUS_REST}
            </span>
          </div>

          {/* the text selection: tiago's sweeps across the title, yours lands on whichever line you press */}
          <div ref={highlightRef} className="ppres__highlight" data-owner="tiago" aria-hidden="true" />

          {line("title")}
          {line("subtitle")}

          <div className="ppres__fade" aria-hidden="true" />
        </section>

        {/* ── the cursors ─────────────────────────────────────────── */}
        <div className="ppres__cursors" aria-hidden="true">
          {WHO.map((who) => {
            const person = PEOPLE[who];
            const slot = cursorEls.current[who];
            return (
              <div
                key={who}
                ref={(el) => {
                  slot.el = el;
                }}
                className="ppres__cursor"
              >
                <div
                  ref={(el) => {
                    slot.body = el;
                  }}
                  className="ppres__body"
                >
                  <span
                    ref={(el) => {
                      slot.ring = el;
                    }}
                    className="ppres__ring"
                    style={{ borderColor: person.color }}
                  />
                  <div
                    ref={(el) => {
                      slot.arrow = el;
                    }}
                    className="ppres__arrow"
                  >
                    <svg width="48" height="54" viewBox="-5 -5 48 54" style={{ transform: person.flip }}>
                      <path d="M1 1 L13 42 L20.5 25 L38 19 Z" fill="none" stroke="#fff" strokeWidth="8" strokeLinejoin="round" />
                      <path d="M1 1 L13 42 L20.5 25 L38 19 Z" fill={person.color} stroke={person.color} strokeWidth="3" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span
                    ref={(el) => {
                      slot.label = el;
                    }}
                    className="ppres__name"
                    style={{ ...person.label, background: person.color }}
                  >
                    {who}
                  </span>
                </div>
              </div>
            );
          })}
          <span ref={tagRef} className="ppres__you">
            you
          </span>
        </div>
      </div>
    </div>
  );
}
