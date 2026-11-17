// @ts-nocheck
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import "./odometer-pricing.css";

/**
 * Odometer Pricing — three plans and a billing switch.
 *
 * Switching between monthly and annual rolls every price like an odometer,
 * digit by digit, and slips "billed yearly" in above the period. The popular
 * plan glows blue with a grain straight from the Figma effect, and a short,
 * faint light trail follows a mouse across it. Everything is sized from one
 * unit so the whole stage always fits the viewport height; below 1024px in
 * portrait the plans become a swipeable row that opens on the popular one.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type Billing = "annual" | "monthly";

type Plan = {
  id: string;
  name: string;
  price: Record<Billing, number>;
  features: string[];
  popular?: boolean;
};

// Annual billing = 20% off, shown as the effective monthly price.
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 20, annual: 16 },
    features: [
      "Limited decision runs per month",
      "Access to core AI agents",
      "Basic structured outputs",
      "Standard reasoning depth",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: { monthly: 99, annual: 79 },
    popular: true,
    features: [
      "Higher decision limits",
      "Multiple expert agents",
      "Debate style reasoning",
      "Context aware memory",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: { monthly: 299, annual: 239 },
    features: [
      "Unlimited decision runs",
      "Custom AI agents",
      "Team collaboration dashboard",
      "Dedicated account manager",
      "SLA & priority support",
    ],
  },
];

const POPULAR_INDEX = PLANS.findIndex((p) => p.popular);

/* ---------- entrance choreography ---------- */

const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE_OUT, delay },
  }),
};

// cards: no filter (keeps the Growth card's grain texture from re-rasterising every frame)
const cardIn: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE_OUT, delay },
  }),
};

const featureIn: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: (delay: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  }),
};

/* ---------- pieces ---------- */

function Tick() {
  return (
    <svg className="op-plan__tick" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42Z" />
    </svg>
  );
}

/** Blurred blue ellipse with white grain — the Growth card's background, straight from the Figma effect. */
function GrowthGlow() {
  return (
    <svg className="op-plan__glow" viewBox="0 0 866 893" preserveAspectRatio="none" aria-hidden>
      <defs>
        <filter id="growth-glow" x="0" y="0" width="866" height="893" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="75" result="blur" />
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="2227" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="grain">
            <feFuncA type="discrete" tableValues={`${"1 ".repeat(51)}${"0 ".repeat(49)}`.trim()} />
          </feComponentTransfer>
          <feComposite operator="in" in="grain" in2="blur" result="grainClipped" />
          <feFlood floodColor="#ffffff" floodOpacity="0.25" result="white" />
          <feComposite operator="in" in="white" in2="grainClipped" result="speckle" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="speckle" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="433" cy="446.5" rx="283" ry="296.5" fill="#008bff" filter="url(#growth-glow)" />
    </svg>
  );
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One odometer wheel: a 0–9 strip that springs to the target digit. */
function DigitWheel({ digit, delay }: { digit: number; delay: number }) {
  return (
    <span className="op-roll__win">
      <motion.span
        className="op-roll__col"
        initial={false}
        animate={{ y: `${-digit}em` }}
        transition={{ type: "spring", visualDuration: 0.75, bounce: 0.16, delay }}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </motion.span>
    </span>
  );
}

function Price({ value, billing }: { value: number; billing: Billing }) {
  const digits = String(value).split("").map(Number);
  return (
    <p className="op-plan__price">
      <span className="op-plan__amount" role="text" aria-label={`$${value} per month${billing === "annual" ? ", billed yearly" : ""}`}>
        <span className="op-plan__currency" aria-hidden>
          $
        </span>
        <span className="op-roll" aria-hidden>
          {digits.map((d, i) => (
            // keyed by place value so each wheel persists and rolls between prices
            <DigitWheel key={digits.length - i} digit={d} delay={i * 0.06} />
          ))}
        </span>
      </span>
      <span className="op-plan__per" aria-hidden>
        <AnimatePresence initial={false}>
          {billing === "annual" && (
            <motion.span
              className="op-plan__note"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE_OUT, delay: 0.15 } }}
              exit={{ opacity: 0, y: 6, filter: "blur(4px)", transition: { duration: 0.25, ease: "easeIn" } }}
            >
              billed yearly
            </motion.span>
          )}
        </AnimatePresence>
        <span>/ month</span>
      </span>
    </p>
  );
}

/**
 * Short, faint light trail + soft spotlight that follows the cursor across the popular card.
 * Precise pointers only (mouse / trackpad); never mounts on touch devices.
 */
function CursorTrail({ host }: { host: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const LIFE = 240; // ms a trail point lives — keeps the tail short
    const pts: { x: number; y: number; t: number }[] = [];
    const spot = { x: 0, y: 0, a: 0, target: 0 };
    let dpr = 1, w = 0, h = 0, raf = 0, last = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const frame = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      spot.a += (spot.target - spot.a) * Math.min(1, dt / 140);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (spot.a > 0.002) {
        const g = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 150);
        g.addColorStop(0, `rgba(255,255,255,${0.12 * spot.a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      if (pts.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(255,255,255,0.6)";
        ctx.shadowBlur = 8;
        for (let i = 1; i < pts.length; i++) {
          const life = 1 - (now - pts[i].t) / LIFE; // 1 at the cursor → 0 at the tail
          const k = life * life;
          ctx.strokeStyle = `rgba(255,255,255,${0.28 * k})`;
          ctx.lineWidth = 1 + 3 * k;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // keep animating only while there is something to draw or fade
      if (pts.length || Math.abs(spot.target - spot.a) > 0.002 || spot.a > 0.002) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        last = 0;
      }
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      pts.push({ x, y, t: performance.now() });
      spot.x = x;
      spot.y = y;
      spot.target = 1;
      wake();
    };
    const onLeave = () => {
      spot.target = 0;
      wake();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [host]);

  return <canvas ref={canvasRef} className="op-plan__trail" aria-hidden />;
}

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setFine(mq.matches && !reduce.matches);
    update();
    mq.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);
  return fine;
}

function PlanCard({
  plan,
  billing,
  delay,
  active,
}: {
  plan: Plan;
  billing: Billing;
  delay: number;
  active: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const finePointer = useFinePointer();
  return (
    <motion.article
      ref={cardRef}
      className={`op-plan${plan.popular ? " op-plan--popular" : ""}${active ? " is-active" : ""}`}
      aria-labelledby={`plan-${plan.id}`}
      variants={cardIn}
      initial="hidden"
      animate="show"
      custom={delay}
    >
      {plan.popular && <GrowthGlow />}
      {plan.popular && finePointer && <CursorTrail host={cardRef} />}

      <div className="op-plan__body">
        <div className="op-plan__head">
          <h2 id={`plan-${plan.id}`} className="op-plan__name">
            {plan.name}
          </h2>
          {plan.popular && <span className="op-plan__badge">Most Popular</span>}
        </div>

        <Price value={plan.price[billing]} billing={billing} />

        <motion.a
          href="#start-trial"
          className="op-plan__cta"
          whileTap={{ scale: 0.98 }}
          onClick={(e) => e.preventDefault()}
        >
          Start Free Trial
        </motion.a>

        <ul className="op-plan__features">
          {plan.features.map((f, i) => (
            <motion.li key={f} variants={featureIn} initial="hidden" animate="show" custom={delay + 0.35 + i * 0.05}>
              <Tick />
              <span>{f}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const options: { id: Billing; label: string }[] = [
    { id: "annual", label: "Bill annually" },
    { id: "monthly", label: "Bill monthly" },
  ];
  return (
    <motion.div
      className="op-billing"
      role="radiogroup"
      aria-label="Billing period"
      variants={rise}
      initial="hidden"
      animate="show"
      custom={0.3}
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`op-billing__opt${on ? " is-on" : ""}`}
            onClick={() => onChange(o.id)}
          >
            {on && (
              <motion.span
                layoutId="billing-pill"
                className="op-billing__pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="op-billing__label">{o.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

/* ---------- carousel (below 1024px) ---------- */

function useCarousel(trackRef: RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState(POPULAR_INDEX);

  const cards = () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>(".op-plan") ?? []);
  const isCarousel = () => {
    const t = trackRef.current;
    return !!t && t.scrollWidth > t.clientWidth + 1;
  };
  const leftFor = (el: HTMLElement) => {
    const t = trackRef.current!;
    return el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2;
  };

  // open on the most popular plan, without animating
  useLayoutEffect(() => {
    const t = trackRef.current;
    const el = cards()[POPULAR_INDEX];
    if (t && el && isCarousel()) t.scrollLeft = leftFor(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = t.scrollLeft + t.clientWidth / 2;
        let best = 0, dist = Infinity;
        cards().forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < dist) (dist = d), (best = i);
        });
        setActive(best);
      });
    };
    // keep the chosen card centred when the viewport changes (rotation, resize)
    const ro = new ResizeObserver(() => {
      const el = cards()[activeRef.current];
      if (el && isCarousel()) t.scrollLeft = leftFor(el);
    });
    t.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(t);
    return () => {
      cancelAnimationFrame(raf);
      t.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRef = useRef(active);
  activeRef.current = active;

  const goTo = useCallback((i: number) => {
    const t = trackRef.current;
    const el = cards()[i];
    if (t && el) t.scrollTo({ left: leftFor(el), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { active, goTo };
}

/* ---------- page ---------- */

const CARD_DELAYS = [0.62, 0.5, 0.74]; // the popular plan lands first, its neighbours follow

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const trackRef = useRef<HTMLDivElement>(null);
  const { active, goTo } = useCarousel(trackRef);

  return (
    <main className="op-pricing-page">
      <section className="op-pricing" aria-labelledby="pricing-title">
        <div className="op-pricing__head">
          <h1 id="pricing-title" className="op-pricing__title">
            {["Plans", "and"].map((w, i) => (
              <motion.span key={w} className="op-pricing__word" variants={rise} initial="hidden" animate="show" custom={0.05 + i * 0.07}>
                {w}
              </motion.span>
            ))}
            <motion.span className="op-pricing__word op-pricing__word--accent" variants={rise} initial="hidden" animate="show" custom={0.19}>
              Pricing
            </motion.span>
          </h1>
          <BillingToggle value={billing} onChange={setBilling} />
        </div>

        <div className="op-pricing__track" ref={trackRef} data-lenis-prevent-horizontal>
          {PLANS.map((p, i) => (
            <PlanCard key={p.id} plan={p} billing={billing} delay={CARD_DELAYS[i]} active={i === active} />
          ))}
        </div>

        <motion.div
          className="op-pricing__dots"
          role="tablist"
          aria-label="Plans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {PLANS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${p.name} plan`}
              className={`op-pricing__dot${i === active ? " is-on" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </motion.div>
      </section>
    </main>
  );
}
