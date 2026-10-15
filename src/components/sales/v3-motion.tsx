"use client";

/**
 * Client islands for the Money Mastery Code v3 storefront.
 *
 * v3/index.html was a single static file with one inline script at the
 * bottom. Ported to the app router, the page is a Server Component that
 * ships static HTML, and everything the old script used to drive lives
 * here as isolated leaves. Two substitutions were made in the port:
 *
 *   1. The FOS-AI tab panels' hand-built phone mock-ups were replaced by
 *      the real screens from phone-mockups.tsx. Those stay server-rendered
 *      and reach this island as `children`, so the mock-ups never enter
 *      the client bundle.
 *   2. The placeholder testimonial cards were replaced by the real
 *      student messages (see lib/sales-testimonials).
 *
 * Three rules hold across every island:
 *
 * 1. No window scroll listener anywhere. Scroll-gated visibility is read
 *    through framer-motion scroll values or IntersectionObserver, both of
 *    which run outside React's render cycle. The only `setState` fires on
 *    a threshold *crossing*, never per frame.
 * 2. Every effect collapses under `prefers-reduced-motion`. Entrances land
 *    on their resting state, counters show their final figures, the wait
 *    timer resolves immediately, and the sticky bar stays reachable
 *    without animating.
 * 3. Numbers that matter to the argument are formatted through one
 *    `naira()` helper, so the slider, the calculator and the countdown
 *    can never disagree on how a figure reads.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* The naira sign, written as an escape so it survives any re-encoding of
   this file. Same trick as lib/money-mastery.ts. */
const NAI = "\u20a6";

/* Naira 1,250,000. One helper, so no two figures on the page disagree. */
function naira(value: number): string {
  return `${NAI}${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/* ── Reveal ──────────────────────────────────────────────────────── */

/**
 * The mock's `.rv` scroll reveal, ported.
 *
 * The mock shipped the elements at opacity 0 and let an
 * IntersectionObserver add `.in`. Same behaviour here, but the observer
 * is framer-motion's `whileInView`, so the page never hydrates a
 * document-wide listener. `once: true` because every one of these
 * entrances is a first impression, not a loop.
 *
 * A `<noscript>` floor on the page pins the initial state open, so a
 * reader without JavaScript sees the argument rather than a blank page.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = "",
  style,
  id,
  href,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  /** Lets a revealed heading carry the `id` its section is labelled by. */
  id?: string;
  /** Only meaningful with `as="a"`. The route cards and the two CTAs. */
  href?: string;
  as?:
    | "div"
    | "p"
    | "h2"
    | "h3"
    | "li"
    | "span"
    | "figure"
    | "blockquote"
    | "nav"
    | "a"
    | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    return (
      <Tag id={id} href={href} className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      id={id}
      href={href}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/* ── CountUp ─────────────────────────────────────────────────────── */

/**
 * Counts once, on first view. The 180 is the only number on this page
 * worth counting to: it is the whole guarantee, and a figure that arrives
 * by animating reads as a figure you can check.
 */
export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  // Null until the animation starts, so reduced-motion never sets it and
  // the final number is simply derived rather than pushed through an effect.
  const [shown, setShown] = useState<number | null>(null);
  const current = shown ?? (reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;

    const controls = animate(0, value, {
      duration: 1,
      ease: EASE,
      onUpdate: (latest) => setShown(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduce, value]);

  return <span ref={ref}>{current}</span>;
}

/* ── Pay yourself first ──────────────────────────────────────────── */

const PYF_CHIPS = [50_000, 100_000, 250_000, 500_000];

/**
 * The 10% rule, on the reader's own income.
 *
 * The whole course rests on this one ordering, so the demo performs the
 * ordering rather than describing it. The three chips exist because a
 * range input alone makes most people guess, and the annual figure is
 * tweened rather than snapped so the year reads as a consequence of the
 * month.
 */
export function PayYourselfFirst() {
  const reduce = useReducedMotion();
  const [income, setIncome] = useState(100_000);

  /* The annual total here, and the purity reading below, are motion
     values rather than React state. Both tween continuously from whatever
     they currently read to a new target on every slider move, and routing
     those updates a second through setState would re-render the whole
     card on every frame just to move one figure. */

  const year = useMotionValue(120_000);
  const yearText = useTransform(year, (value) => naira(value));

  useEffect(() => {
    const to = income * 1.2;
    if (reduce) {
      year.set(to);
      return;
    }
    const controls = animate(year, to, { duration: 0.4, ease: EASE });
    return () => controls.stop();
  }, [income, reduce, year]);

  const progress = ((income - 20_000) / (1_000_000 - 20_000)) * 100;

  return (
    <div className="pyf">
      <p className="pyf__k">Rule 101 from Lecture 3, in ten seconds</p>
      <p className="pyf__q">Slide to your monthly income</p>

      <output className="pyf__income" htmlFor="v3-pyf">
        {naira(income)}
      </output>

      <input
        id="v3-pyf"
        type="range"
        min={20_000}
        max={1_000_000}
        step={5_000}
        value={income}
        aria-label="Monthly income in naira"
        onChange={(event) => setIncome(Number(event.target.value))}
        style={{ "--p": `${progress}%` } as CSSProperties}
      />

      <div className="pyf__chips">
        {PYF_CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === income}
            onClick={() => setIncome(value)}
          >
            {`${NAI}${value / 1_000}k`}
          </button>
        ))}
      </div>

      <div className="pyf__split" aria-hidden="true">
        <i className="k" />
        <i className="r" />
      </div>

      <div className="pyf__legend">
        <div>
          <span>Yours to keep (10%)</span>
          <b>{naira(income * 0.1)}</b>
        </div>
        <div>
          <span>Every other expense comes out of the remaining 90%</span>
          <b>{naira(income * 0.9)}</b>
        </div>
      </div>

      <p className="pyf__year">
        In a year of paying yourself first, that&rsquo;s{" "}
        <motion.b>{yearText}</motion.b> kept, before you invest any of it.
      </p>
    </div>
  );
}

/* ── Tap checklist ───────────────────────────────────────────────── */

const TICKS = [
  "You earn a real income and it never seems to accumulate.",
  "You\u2019ve tried budgeting and it didn\u2019t survive the first unexpected expense.",
  "You know you should be investing but you can\u2019t tell a real opportunity from a persuasive one.",
  "You\u2019ve heard people talk about gold, T-bills or mutual funds and you\u2019d rather not be the person still nodding along.",
];

const TICK_MESSAGES = [
  "Tap everything that sounds like you.",
  "That\u2019s one. Keep going.",
  "Two so far. Anything else?",
  "Three. This was built for people like you.",
  "All four. This was built for exactly you.",
];

/**
 * The self-qualification checklist.
 *
 * The message under the list is the only place the page tells the reader
 * what to do next, and it escalates with the count rather than firing a
 * generic prompt. Every tick still leaves the section readable as four
 * statements about the reader, so a zero-tap pass is not a dead end.
 */
export function TapChecklist() {
  const [picked, setPicked] = useState<number[]>([]);

  function toggle(index: number) {
    setPicked((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  }

  return (
    <div>
      {TICKS.map((tick, index) => (
        <button
          key={tick}
          type="button"
          className="tick"
          aria-pressed={picked.includes(index)}
          onClick={() => toggle(index)}
        >
          <span className="tick__box" aria-hidden="true">
            <svg
              className="ic"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span>{tick}</span>
        </button>
      ))}

      <p className="tickmsg" aria-live="polite">
        {TICK_MESSAGES[picked.length]}
      </p>
    </div>
  );
}

/* ── Karat explorer ──────────────────────────────────────────────── */

const KARATS = [
  { label: "24K", purity: 99.9 },
  { label: "22K", purity: 91.7 },
  { label: "18K", purity: 75 },
  { label: "14K", purity: 58.3 },
];

/**
 * Gold purity, from Lecture 7.
 *
 * The number is tweened rather than swapped because the point of the demo
 * is the *jump* between karats: 24K and 22K are a few parts of pure gold
 * apart and cost very differently, and a number that blinks between values
 * hides exactly that.
 */
export function KaratExplorer() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  const purity = useMotionValue(KARATS[0].purity);
  const purityText = useTransform(
    purity,
    (value) => `${Math.round(value * 10) / 10}%`,
  );

  const active = KARATS[index];
  const target = active.purity;

  useEffect(() => {
    if (reduce) {
      purity.set(target);
      return;
    }
    const controls = animate(purity, target, { duration: 0.45, ease: EASE });
    return () => controls.stop();
  }, [target, reduce, purity]);

  return (
    <div className="card">
      <p className="card__cap">What purity actually means</p>
      <p className="card__src">From Lecture 7</p>

      <div className="karat__tabs" role="group" aria-label="Choose a karat">
        {KARATS.map((karat, i) => (
          <button
            key={karat.label}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {karat.label}
          </button>
        ))}
      </div>

      <motion.div className="karat__num" aria-live="polite">
        {purityText}
      </motion.div>
      <p className="karat__lbl">
        pure <span>{active.label}</span> gold
      </p>

      <div className="karat__bar" aria-hidden="true">
        <i style={{ width: `${active.purity}%` }} />
      </div>
      <div className="karat__key" aria-hidden="true">
        <span>Pure gold</span>
        <span>Other metals</span>
      </div>
    </div>
  );
}

/* ── Two days and twelve hours ───────────────────────────────────── */

/**
 * The wait rule from Lecture 5, as something you can push rather than read.
 *
 * Sixty hours run in about three and a half seconds: long enough to feel
 * like waiting, far short of the point where anyone stops watching. The
 * verdict is withheld until the bar completes, which is the lesson. The
 * payoff for sitting with the urge is not knowing it was nothing.
 */
export function WaitTimer() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    // Reduced-motion resolves in a single frame rather than skipping the
    // intermediate states, so the end state is identical either way.
    const duration = reduce ? 1 : 3400;
    const start = performance.now();

    function step(now: number) {
      const elapsed = Math.min(1, (now - start) / duration);
      setProgress(elapsed);

      if (elapsed < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
      }
    }

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [running, reduce]);

  const done = progress >= 1;

  return (
    <div className="wait">
      <p className="wait__k">Try the wait</p>

      <button
        type="button"
        className="btn btn--night btn--block"
        onClick={() => {
          setProgress(0);
          setRunning(true);
        }}
        disabled={running}
      >
        {running
          ? "Waiting\u2026"
          : done
            ? "Run it again"
            : "I just saw something I need"}
      </button>

      <div className="wait__meter" aria-hidden="true">
        <b>{Math.round(progress * 60)} hours</b>
        <span>of 60 (2 days 12 hours)</span>
      </div>

      <span className="track" aria-hidden="true">
        <span
          className="fill fill--indigo"
          style={{ width: `${progress * 100}%` }}
        />
      </span>

      <p className="wait__msg" aria-live="polite">
        {done
          ? "Still want it? Then it\u2019s probably real. Often, the feeling has already faded."
          : ""}
      </p>
    </div>
  );
}

/* ── Flee from debt ──────────────────────────────────────────────── */

const DEBT_CHIPS = [
  "Banks",
  "Loan sharks",
  "Loan apps",
  "Your friends",
  "Your church",
  "Your boss",
  "Your children",
  "Your neighbour",
];

/**
 * Lecture 4's punchline, made to arrive.
 *
 * The chips are a checklist for no reason other than that a crossed-off
 * list is satisfying, and the last line only lands once every chip is
 * struck. Under reduced-motion the punchline still pops, it just does so
 * without the overshoot.
 */
export function FleeFromDebt() {
  const reduce = useReducedMotion();
  const [struck, setStruck] = useState<number[]>([]);
  const punch = useRef<HTMLParagraphElement>(null);
  const pop = useRef<ReturnType<typeof animate> | null>(null);

  const remaining = DEBT_CHIPS.length - struck.length;

  /**
   * Fired straight from the tap rather than from an effect watching
   * `struck`. An effect would fire on the render *after* the last chip,
   * which reads as a half-second of dead air between the cross-off and
   * the line it is setting up.
   */
  function popPunch() {
    if (!punch.current || reduce) return;
    pop.current?.stop();
    pop.current = animate(
      punch.current,
      { scale: [0.94, 1.04, 1] },
      { duration: 0.5, ease: EASE },
    );
  }

  function toggle(index: number) {
    const next = struck.includes(index)
      ? struck.filter((value) => value !== index)
      : [...struck, index];

    setStruck(next);
    if (next.length === DEBT_CHIPS.length) popPunch();
  }

  useEffect(() => () => pop.current?.stop(), []);

  return (
    <>
      <div className="chipgrid">
        {DEBT_CHIPS.map((chip, index) => (
          <button
            key={chip}
            type="button"
            className="dchip"
            aria-pressed={struck.includes(index)}
            aria-label={`Don\u2019t take debts from ${chip.toLowerCase()}`}
            onClick={() => toggle(index)}
          >
            <svg
              className="ic"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span>{chip}</span>
          </button>
        ))}
      </div>

      <p className="flee__hint" aria-live="polite">
        {remaining === 0
          ? "All crossed off. Now read the last line."
          : remaining < DEBT_CHIPS.length
            ? `${remaining} to go.`
            : "Tap each one to cross it off."}
      </p>

      <p className="punch" ref={punch}>
        And don&rsquo;t take debts from me.
      </p>
    </>
  );
}

/* ── FOS-AI tabs ─────────────────────────────────────────────────── */

export type FosPanel = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * The pill grid, and nothing else.
 *
 * Panels arrive as server-rendered `children` and this island only owns
 * `aria-selected` and the `hidden` attribute. That is deliberate: the
 * panels hold the real product screens, and routing them through here
 * would drag the phone mock-ups into the client bundle for the sake of
 * eleven buttons.
 *
 * The pills are laid out as a grid rather than a scrolling strip. A
 * horizontal scroller hides two of the five capabilities past the right
 * edge of a phone with nothing to say so, and the reader never finds out
 * what else FOS·AI does. Two columns puts all five on screen at once,
 * with the last pill taking the full width so the last row reads as a
 * deliberate full-width row rather than as one item short of a third
 * column.
 *
 * Arrow keys, Home and End all move the selection, matching the WAI-ARIA
 * tabs pattern, with the roving tabindex the pattern requires.
 */
export function FosTabs({ panels }: { panels: FosPanel[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  const select = useCallback((index: number) => setActive(index), []);

  function onKeyDown(event: React.KeyboardEvent) {
    let next: number | null = null;

    if (event.key === "ArrowRight") next = (active + 1) % panels.length;
    else if (event.key === "ArrowLeft")
      next = (active - 1 + panels.length) % panels.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = panels.length - 1;

    if (next === null) return;

    event.preventDefault();
    select(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  return (
    <div>
      <div
        className="fos__tabs"
        role="tablist"
        aria-label="FOS\u00b7AI features"
        onKeyDown={onKeyDown}
      >
        {panels.map((panel, index) => (
          <button
            key={panel.id}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
          >
            <span>{panel.label}</span>
            {/* On every pill, not just the selected one. In a grid the
                pills no longer read as a tab strip by position alone, so
                each one carries its own "this opens something" signal. */}
            <svg
              className="fos__go"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>

      {panels.map((panel, index) => (
        <div
          key={panel.id}
          id={`${baseId}-panel-${index}`}
          className="fos__panel"
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== active}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}

/* ── Compound interest ───────────────────────────────────────────── */

/**
 * One calculator, live, from the FOS-AI Tools tab.
 *
 * Compound interest is the only calculation in the course where the
 * reader's own numbers change the answer by an order of magnitude, so it
 * is the one worth typing into. Everything else is listed as a chip
 * rather than faked.
 *
 * The inputs hold strings, not numbers. Clearing a field has to leave the
 * field empty, and a `NaN` value writes the string "NaN" into it, so the
 * parse happens on the way out and an empty field simply has no answer.
 */
export function CompoundCalculator() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState("5");

  const p = Number(principal);
  const r = Number(rate);
  const n = Number(years);

  const valid =
    principal.trim() !== "" &&
    rate.trim() !== "" &&
    years.trim() !== "" &&
    Number.isFinite(p) &&
    Number.isFinite(r) &&
    Number.isFinite(n) &&
    p >= 0 &&
    r >= 0 &&
    n >= 0;

  const result = valid ? p * Math.pow(1 + r / 100, n) : null;

  return (
    <div className="calc">
      <p className="calc__k">Try one: compound interest</p>

      <label htmlFor="v3-cp">Amount ({NAI})</label>
      <input
        id="v3-cp"
        type="number"
        inputMode="numeric"
        min={0}
        value={principal}
        onChange={(event) => setPrincipal(event.target.value)}
      />

      <label htmlFor="v3-cr">Yearly rate (%)</label>
      <input
        id="v3-cr"
        type="number"
        inputMode="decimal"
        min={0}
        step={0.5}
        value={rate}
        onChange={(event) => setRate(event.target.value)}
      />

      <label htmlFor="v3-cn">Years</label>
      <input
        id="v3-cn"
        type="number"
        inputMode="numeric"
        min={0}
        max={60}
        value={years}
        onChange={(event) => setYears(event.target.value)}
      />

      <p className="calc__out" aria-live="polite">
        After {valid ? n : "\u2013"} years, it grows to{" "}
        <b>{result === null ? "\u2013" : naira(result)}</b>
      </p>

      <p className="small">
        An illustration of how compounding works, not a prediction of any
        return.
      </p>
    </div>
  );
}

/* ── Sticky bar ──────────────────────────────────────────────────── */

/**
 * The phone-only enrol bar.
 *
 * Two conditions, both deliberate. It stays parked until the hero's own
 * CTA has scrolled away, so the page never shows two asks for the same
 * intent. And it hides again while the price cards are on screen,
 * because those cards already carry the checkout forms.
 *
 * Both facts come from IntersectionObserver thresholds, so React only
 * re-renders on the frames where the answer actually changes.
 */
export function StickyBar() {
  const [pastHero, setPastHero] = useState(false);
  const [atPrice, setAtPrice] = useState(false);
  const [atFinal, setAtFinal] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "hero-cta") {
            // Inverted on purpose: the hero's own CTA is the thing that
            // has to *leave* before the bar may take its place.
            setPastHero(!entry.isIntersecting);
          } else if (entry.target.id === "options") {
            setAtPrice(entry.isIntersecting);
          } else if (entry.target.id === "final") {
            setAtFinal(entry.isIntersecting);
          }
        }
      },
      { threshold: 0 },
    );

    for (const id of ["hero-cta", "options", "final"]) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, []);

  const visible = pastHero && !atPrice && !atFinal;

  return (
    <div className={`bar dark${visible ? " is-on" : ""}`} aria-hidden={!visible}>
      <div className="bar__txt">
        <strong>Money Mastery Code</strong>
        <span>From {naira(15_000)}</span>
      </div>
      <a className="btn" href="#options" tabIndex={visible ? undefined : -1}>
        Choose option
      </a>
    </div>
  );
}

/* ── Anchor navigation ───────────────────────────────────────────── */

/**
 * Makes every in-page link on the page actually arrive.
 *
 * Two jobs, both of which the browser cannot do on its own.
 *
 * 1. "Where did you come from?" points at `#gold`, `#mutual-funds` and
 *    `#lecture-8`, all of which live inside a closed `<details>`. Opening
 *    those first is what makes a link to a collapsed lecture reach its
 *    target instead of parking on a closed row.
 * 2. Every jump is scrolled by hand, because preventing the default is
 *    unavoidable for the collapsed ones and a default that only runs for
 *    some links is worse than none. The hero CTA, the sticky bar and the
 *    footer's "Choose your option" all depend on this.
 *
 * Renders nothing. It is mounted once, near the top of the page.
 */
export function AnchorNavigation() {
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    function openAncestors(target: Element) {
      for (
        let node: Element | null = target;
        node && node !== document.body;
        node = node.parentElement
      ) {
        if (node.tagName === "DETAILS") (node as HTMLDetailsElement).open = true;
      }
    }

    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;

      // The privacy link is a real destination, not a jump target.
      if (!anchor || anchor.id === "privacy-link") return;

      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      /* Every in-page jump is handled here rather than left to the browser.
       * Two reasons, and the second is why the default action cannot simply be
       * allowed to run:
       *
       *   1. `#gold`, `#mutual-funds` and `#lecture-8` live inside a closed
       *      <details>. The ancestors have to be opened first, and the browser
       *      would already have given up on the scroll by then.
       *   2. `preventDefault()` is unavoidable in that case, so the scroll has
       *      to be performed by hand for *every* jump or the target ones are
       *      the only ones that arrive. `replaceState` rewrites the URL without
       *      navigating, so on its own it moves nothing on screen. */
      event.preventDefault();
      openAncestors(target);
      history.replaceState(null, "", `#${id}`);

      // One frame after the details have opened, so the target is measured
      // against the expanded layout rather than the collapsed one.
      requestAnimationFrame(() => {
        target.scrollIntoView({
          block: "start",
          behavior: reducedMotion ? "auto" : "smooth",
        });
      });
    }

    function onHashChange() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) openAncestors(target);
    }

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);

    // A deep link that arrives before hydration still has to open.
    if (window.location.hash.length > 1) {
      requestAnimationFrame(onHashChange);
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}

/* ── Debt bars ───────────────────────────────────────────────────── */

/**
 * The two debt bars from Lecture 4, drawn on first view.
 *
 * `scaleX` rather than `width`, so the track keeps its real width in the
 * server-rendered tree and the bar is only ever a transform. If the
 * script never arrives, the reader sees the full comparison instead of
 * two empty tracks.
 */
export function DebtBars() {
  const reduce = useReducedMotion();

  return (
    <div
      role="group"
      aria-label={`Interest paid on ${naira(1_000_000)}: ${naira(42_440)} at 10 percent, ${naira(20_960)} at 5 percent`}
    >
      <div className="bars__row">
        <p>
          <span>At 10 percent you repay</span>
          <b>{naira(1_042_440)}</b>
        </p>
        <span className="track">
          <motion.span
            className="fill"
            style={{ width: "100%", transformOrigin: "left center" }}
            initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
          />
        </span>
      </div>

      <div className="bars__row">
        <p>
          <span>At 5 percent you repay</span>
          <b>{naira(1_020_960)}</b>
        </p>
        <span className="track">
          <motion.span
            className="fill fill--indigo"
            style={{ width: "49.4%", transformOrigin: "left center" }}
            initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
          />
        </span>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Bars show the interest paid on top of the {naira(1_000_000)}.
      </p>
    </div>
  );
}