import type { Metadata, Viewport } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Ban,
  ChartLine,
  ChartPie,
  Check,
  Clock,
  Gem,
  Info,
  KeyRound,
  MonitorPlay,
  MousePointerClick,
  ShieldCheck,
  Sprout,
  Wallet,
  X,
} from "lucide-react";

import { CheckoutForm } from "@/components/sales/v3-checkout-form";
import {
  AnchorNavigation,
  CompoundCalculator,
  CountUp,
  DebtBars,
  FleeFromDebt,
  FosTabs,
  KaratExplorer,
  PayYourselfFirst,
  Reveal,
  StickyBar,
  TapChecklist,
  WaitTimer,
  type FosPanel,
} from "@/components/sales/v3-motion";
import {
  BriefingPhone,
  RecordSheetPhone,
  StockAnalyzerPhone,
  ToolsPhone,
} from "@/components/sales/phone-mockups";
import { ViewContentTracker } from "@/components/sales/tiktok-events";
import { COURSE_TIERS } from "@/lib/money-mastery";
import { getPaymentProviderName } from "@/lib/payment-registry";
import { SITE_ORIGIN, storefrontMetadata } from "@/lib/seo";
import { SALES_TESTIMONIALS } from "@/lib/sales-testimonials";

import "./v3.css";

/**
 * Money Mastery Code · variant C.
 *
 * A port of ./index.html, which is a self-contained mobile-first sales
 * page: sheets of colour stacked over each other, a volt-lime call to
 * action, and a handful of small interactive demos that each restate one
 * rule from the course. It is the third storefront variant and shares the
 * /api/checkout path with the other two.
 *
 * Two substitutions were made during the port, both deliberate:
 *
 *   1. The FOS·AI section's five tab panels held hand-built mock-ups
 *      showing invented figures. They now carry the real screens from
 *      components/sales/phone-mockups.tsx, the same four the other
 *      variants show, so every number on this page is one FOS·AI
 *      actually produces. The panels are still server-rendered: only the
 *      tab strip hydrates.
 *   2. The testimonial section shipped five placeholder cards. It now
 *      renders the real student messages and screenshots.
 *
 * Everything else is the mock, faithfully: the sheets, the marquee, the
 * pay-yourself-first slider, the karat explorer, the wait timer, the
 * debt list and the punchline that depends on it.
 */

export const metadata: Metadata = storefrontMetadata();

/**
 * The mock set its own theme colour to the forest green.
 *
 * A page's `viewport` replaces the layout's wholesale rather than
 * merging key by key, so the layout's width, scale and user-scalable
 * settings are restated here. Dropping them would silently re-enable
 * pinch zoom on this route alone.
 */
export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/* Marks this page as the challenger wherever a purchase is attributed. */
const VARIANT = "c" as const;

/* ── Copy ────────────────────────────────────────────────────────── */

const MARQUEE_PHRASES = ["Make money", "Manage money", "Multiply money"];

const ROUTES = [
  {
    href: "#gold",
    icon: Gem,
    tag: "Day 5 · Lecture 7",
    title: "If you came for gold",
    body: "Purity and karat. The four tests for checking whether gold is genuine. Where to buy it in Nigeria. How to see today’s price.",
  },
  {
    href: "#mutual-funds",
    icon: ChartPie,
    tag: "Day 5 · Lecture 7",
    title: "If you came for mutual funds",
    body: "What a mutual fund actually is, what NAV means, and the real difference between an equity fund and a money market fund.",
  },
  {
    href: "#lecture-8",
    icon: ChartLine,
    tag: "Days 6 & 7 · Lecture 8",
    title: "If you saw the stock valuation demo",
    body: "Market cap, EPS, P/E and dividend yield, worked through live, plus the limits of those numbers.",
  },
  {
    href: "#code-2",
    icon: Wallet,
    tag: "Days 2 & 3 · Lectures 3 to 5",
    title: "If you came for budgeting, tracking and paying yourself first",
    body: "All three in depth, plus the impulse-spending rule, why separate accounts simplify everything, and the daily habit of recording what comes in and goes out.",
  },
  {
    href: "#code-1",
    icon: Sprout,
    tag: "Day 1 · Lectures 1 & 2",
    title: "If you’re new to managing money entirely",
    body: "Start at Day 1. Lectures 1 and 2 assume you’ve never been taught any of this.",
  },
];

const SAFETY_RULES = [
  "Don’t invest in anything you don’t understand.",
  "Don’t invest in an unregistered platform or app. Verify SEC registration first.",
  "Don’t give anyone money to invest for you.",
  "Don’t invest in anything promising outrageous returns for minimal risk.",
  "If it’s too good to be true, it probably isn’t.",
];

const VEHICLES_LE7 = [
  {
    id: "t-bills",
    term: "T-bills",
    body: "Lending to the government for 91, 182 or 364 days. What you actually pay and what you get back at maturity. Why there’s a ₦50 million minimum on the primary market but you can start at ₦10,000 through apps.",
  },
  {
    id: "bonds",
    term: "Bonds",
    body: "The same idea over a longer term, paying interest quarterly and returning your capital at maturity.",
  },
  {
    id: "mutual-funds",
    term: "Mutual funds",
    body: "A bucket. Money goes in, a professional invests it, the value updates daily. Equity versus money market, and which is which.",
  },
  {
    id: "reits",
    term: "REITs",
    body: "Real estate without buying a property. Why 90 percent of the income must legally go back to investors as dividends.",
  },
  {
    id: "gold",
    term: "Gold",
    body: "Purity and karat. The four tests for checking whether gold is genuine. Where to buy it. How to check the live price.",
  },
];

const VEHICLES_LE8 = [
  {
    id: "stocks",
    term: "Stocks",
    body: "What owning a share means. Reading a company’s size, profit and value using market cap, EPS and P/E. Dividend yield. What dollar-cost averaging does and when it doesn’t help. US and Nigerian exchanges, and the sectors worth understanding.",
  },
  {
    id: "real-estate",
    term: "Real estate",
    body: "Buying and selling, land banking, rentals. The paperwork that decides whether a transaction is real: Certificate of Occupancy, deed of assignment, survey plan, governor’s consent. This is where more people lose money than anywhere else on this list.",
  },
  {
    id: "agriculture",
    term: "Agriculture",
    body: "Cultivation, processing, storage, livestock, fisheries, forestry. And why it pairs with property rather than competing with it.",
  },
  {
    id: "the-finish",
    term: "And the finish",
    body: "How to sell yourself, your ideas and your business.",
  },
];

const CALCULATORS = [
  "Return on investment (ROI)",
  "Compound interest",
  "Inflation",
  "Retirement",
  "Financial goal planning",
  "Dollar-cost averaging (DCA)",
  "Emergency funds",
  "Currency conversion",
  "Tax",
  "Savings targets",
];

const FAQS = [
  {
    q: "Is this investment advice?",
    a: "No. I explain how the vehicles work and how to think about risk. I don’t tell you what to buy, and neither should anyone who does without being licensed and regulated to.",
  },
  {
    q: "I came here for gold. Will I actually get it?",
    a: "Day 5, Lecture 7. Purity, how to check whether gold is genuine, where to buy it, how to check the live price. It’s one of eight lectures, so you’ll also get the money management that determines how much you can put into it at all.",
  },
  {
    q: "I came for the stock valuation demo.",
    a: "Days 6 and 7, Lecture 8. The same demo, plus what those numbers don’t tell you.",
  },
  {
    q: "Do I need investment experience?",
    a: "No. Lecture 1 assumes nothing.",
  },
  {
    q: "How long do I have to finish it?",
    a: "As long as you like. There’s no expiry.",
  },
  {
    q: "What’s the difference between the two options?",
    a: "The workshop is the teaching. The bundle adds FOS·AI, the tool. Take the workshop if you want to understand the material. Take the bundle if you want to keep real records while you work through it.",
  },
  {
    q: "Do I get corrections if you update the material?",
    a: "Yes. Lifetime access includes anything I fix later.",
  },
];

const WORKSHOP_INCLUDES = [
  "All eight lectures, plus the hedging bonus",
  "Full slide deck",
  "Lifetime access, including later corrections",
  "WhatsApp support community",
];

const FOSAI_INCLUDES = [
  "Financial health overview",
  "Money management: income, expenses, budget, assets",
  "Investment research",
  "Financial calculators",
  // Deliberately not "the FOS·AI assistant". The tab above says plainly
  // that it is still being built, and a price card that lists it as
  // included is a promise the product cannot keep on day one. This line
  // covers it instead: whatever ships later, the buyer already owns it.
  "Every FOS·AI capability released from now on, at no extra cost",
];

const HOW_STEPS = [
  {
    icon: Clock,
    title: "Eight lectures",
    body: "About an hour each, across eight days of recorded material.",
  },
  {
    icon: Ban,
    title: "No schedule. No cohort.",
    body: "You start when you start, and you finish in about a week.",
  },
  {
    icon: KeyRound,
    title: "Lifetime access",
    body: "Including any corrections I make later. If I get something wrong and fix it, you get the fix.",
  },
  {
    icon: MonitorPlay,
    title: "The full slide deck",
    body: "Yours to keep and refer back to.",
  },
];

/* ── FOS·AI panels ───────────────────────────────────────────────── */

const FOS_PANELS: FosPanel[] = [
  {
    id: "health",
    label: "Financial health",
    content: (
      <>
        <div>
          <h3>Financial health overview</h3>
          <p>
            Bring aspects of your financial position together in a financial
            health profile, helping you get a clearer view of where you
            stand.
          </p>
        </div>
        <figure className="v3-shot">
          <BriefingPhone />
          <figcaption>Financial health</figcaption>
        </figure>
      </>
    ),
  },
  {
    id: "money",
    label: "Money management",
    content: (
      <>
        <div>
          <h3>Money management</h3>
          <p>
            Record your income and expenses. Shows your cashflow month to
            month so patterns become visible. Builds a budget and tracks
            you against it. Keeps a running view of the assets you hold. All
            in one financial management environment.
          </p>
        </div>
        <figure className="v3-shot">
          <RecordSheetPhone />
          <figcaption>Budget</figcaption>
        </figure>
      </>
    ),
  },
  {
    id: "calc",
    label: "Calculators",
    content: (
      <>
        <div>
          <h3>Financial calculators</h3>
          <p>Use tools for calculations involving:</p>
          <ul className="chips">
            {CALCULATORS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>The exact results of any calculator depend on the information you enter.</p>
        </div>
        {/* Both, stacked. The real Tools screen shows what the tab is, and
            the live calculator is the only thing on the page that lets a
            reader put their own numbers into the course's argument. */}
        <div className="v3-shot-stack">
          <figure className="v3-shot">
            <ToolsPhone />
            <figcaption>Tools</figcaption>
          </figure>
          <CompoundCalculator />
        </div>
      </>
    ),
  },
  {
    id: "assistant",
    label: "Assistant",
    content: (
      <>
        <div>
          <h3>FOS·AI assistant</h3>
          <p>
            For explaining a term or working through a question from the
            lectures. This one is still being built, so it is not something
            to wait for. Every other capability here is available now, and
            your access keeps up with whatever FOS·AI gains from here on.
          </p>
        </div>
        <div className="notice" style={{ margin: 0 }}>
          <p style={{ margin: 0 }}>
            No mock screen here on purpose. When the assistant ships, this
            tab will carry the real one.
          </p>
        </div>
      </>
    ),
  },
  /* Last on purpose, and the order is load-bearing rather than editorial.
     The pills are laid out as two columns on a phone, so a panel in this
     position is the one that takes the full width of the final row. Move
     it and the grid needs a `:nth-child` rule instead of the single
     `:last-child` it uses now. */
  {
    id: "research",
    label: "Investment research",
    content: (
      <>
        <div>
          <h3>Investment research</h3>
          <p>
            Explore stock information and analysis to support your own
            research. This is an aid to understanding, not a substitute for
            independent judgment or professional advice.
          </p>
        </div>
        <figure className="v3-shot">
          <StockAnalyzerPhone />
          <figcaption>Research</figcaption>
        </figure>
      </>
    ),
  },
];

/* ── Page ────────────────────────────────────────────────────────── */

export default function MoneyMasteryCodeVariantC() {
  const course = COURSE_TIERS.find((t) => t.id === "course") ?? COURSE_TIERS[0];
  const bundle = COURSE_TIERS.find((t) => t.featured) ?? COURSE_TIERS[1];

  // Read on the server and handed to the form, which shows the Flutterwave
  // payment-method guide only when that is the provider checkout will use.
  const provider = getPaymentProviderName();

  return (
    <div className="v3-root">
      <ViewContentTracker variant="c" />

      {/* Every reveal renders its element at opacity 0 and lets JavaScript
          bring it in. If that script never arrives, the sales argument
          would be invisible, so pin it open as a floor. */}
      <noscript>
        <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <a href="#main" className="v3-skip">
        Skip to content
      </a>

      <AnchorNavigation />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="hero dark">
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__ring hero__ring--a" />
          <span className="hero__ring hero__ring--b" />
          <svg
            className="hero__naira"
            viewBox="0 0 100 100"
            fill="none"
            stroke="#fff"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M24 86V14l52 72V14" />
            <path d="M8 38h84M8 62h84" />
          </svg>
        </div>

        <div className="wrap-wide hero__in">
          <span className="badge">
            <i /> Prosper Betiang
          </span>

          <p className="wordmark" aria-label="Money Mastery Code">
            <span>Money</span>
            <span>Mastery</span>
            <span className="code">Code</span>
          </p>

          <h1>
            A good salary doesn’t automatically make you wealthy. Without a
            clear strategy, your income will continue to{" "}
            <mark>disappear</mark> without building lasting wealth.
          </h1>
          <p className="hero__sub">
            The Money Mastery Code shows you how to make more money, manage it
            intentionally, and put it to work through investments.
          </p>

          <ul className="tiles" aria-label="At a glance">
            <li>
              <b>8</b>
              <span>recorded workshops</span>
            </li>
            <li>
              <b>∞</b>
              <span>lifetime access</span>
            </li>
            <li>
              <b>
                <Sprout className="ic" aria-hidden="true" />
              </b>
              <span>beginner-friendly</span>
            </li>
          </ul>

          <a className="btn" href="#options" id="hero-cta">
            Discover the Money Mastery Code
          </a>

          {/* The track holds two identical halves, because the -50%
              keyframe only lands on a boundary when it does. Each half
              repeats the cycle twice so it stays wider than any
              viewport. */}
          <div className="marquee" aria-hidden="true">
            <div className="marquee__track">
              {[0, 1].map((group) => (
                <div className="marquee__group" key={group}>
                  {[0, 1].map((repeat) =>
                    MARQUEE_PHRASES.map((phrase) => (
                      <span key={`${group}-${repeat}-${phrase}`}>{phrase}</span>
                    )),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Problem ───────────────────────────────────────── */}
        <section
          className="scene scene--white"
          id="problem"
          aria-labelledby="problem-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="problem-h">
              The problem this was built to solve
            </Reveal>
            <Reveal as="p" className="statement">
              You earn, and it doesn’t accumulate.
            </Reveal>
            <Reveal as="p" className="lead">
              You get paid. Bills appear. Something else always remains to sort out. 
              By the time you look up, there
              isn’t enough left to do anything with.
            </Reveal>
            <Reveal as="p">
              The gap between what you earn and what you keep usually isn’t
              discipline. It’s information. And financial education in Nigeria
              has an access problem. It is the most gate-kept resource in Nigeria. The people who
              teach it well mostly teach it to people who already have money,
              and the people who teach everyone else usually teach only a small, almost insignificant part of it.
            </Reveal>
            <Reveal as="p">
              So here’s what most people learn, one fragment at a time:
              someone says cut your spending. Someone else says invest more.
              Nobody shows you how those two decisions are connected, or which
              one has been quietly fighting the other.
            </Reveal>

            <ul className="trio">
              <Reveal as="li">
                <Check className="ic" aria-hidden="true" />
                <span>
                  You can be excellent at budgeting and have nothing to invest.
                </span>
              </Reveal>
              <Reveal as="li" delay={0.08}>
                <Check className="ic" aria-hidden="true" />
                <span>You can earn more and end up in the same place.</span>
              </Reveal>
              <Reveal as="li" delay={0.16}>
                <Check className="ic" aria-hidden="true" />
                <span>
                  You can invest carefully and never notice you had no system
                  for keeping anything in the first place.
                </span>
              </Reveal>
            </ul>

            <Reveal>
              <PayYourselfFirst />
            </Reveal>
          </div>
        </section>

        {/* ── Where did you come from ────────────────────────── */}
        <section
          className="scene scene--lilac"
          id="start"
          aria-labelledby="start-h"
        >
          <div className="wrap-wide">
            <Reveal as="h2" id="start-h">
              Where did you come from?
            </Reveal>
            <Reveal as="p" className="lead">
              Most people find this page from a short lesson on money. Here’s
              the part you came for.
            </Reveal>

            <nav className="routes" aria-label="Jump to the lecture you came for">
              {ROUTES.map((route) => {
                const Icon = route.icon;
                return (
                  <Reveal key={route.href} as="a" className="route" href={route.href}>
                    <span className="route__ic">
                      <Icon className="ic" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="route__tag">{route.tag}</span>
                      <span className="route__t">{route.title}</span>
                      <span className="route__d">{route.body}</span>
                    </span>
                    <ArrowRight className="ic" aria-hidden="true" />
                  </Reveal>
                );
              })}
            </nav>
          </div>
        </section>

        {/* ── Note from Prosper ─────────────────────────────── */}
        <section
          className="scene scene--indigo dark"
          id="note"
          aria-labelledby="note-h"
        >
          <div className="wrap">
            <Reveal className="me">
              <div className="me__av" aria-hidden="true">
                PB
              </div>
              <div>
                <b>Prosper Betiang</b>
                <span>Your instructor</span>
              </div>
            </Reveal>

            <Reveal as="h2" id="note-h">
              A note from Prosper
            </Reveal>
            <Reveal as="p">
              I’m Prosper Betiang. Money Mastery Code grew out of a lesson I
              experienced firsthand.
            </Reveal>
            <Reveal as="p">
              A friend and I came into money around the same period. My friend
              received a larger share than I did. But my understanding of money
              helped me preserve and grow what I had, while my friend later
              found himself needing to borrow money from me.
            </Reveal>
            <Reveal as="p">That experience made something clear to me.</Reveal>
            <Reveal as="p" className="pullcard">
              The amount of money you receive is not the only thing that shapes
              your financial outcome. What you understand about money matters
              too.
            </Reveal>
            <Reveal as="p">
              Since then I’ve taught and spoken about financial literacy in
              different settings, from corporate to religious, including the
              Interswitch student community, the Thrive Financial Conference,
              United Evangelical Church, and events I’ve organised myself.
            </Reveal>
            <Reveal as="p">
              My approach rests on one belief: principles matter when you
              understand them well enough to apply them. I’m not interested in
              selling the fantasy of getting rich quickly. I want to break
              complex ideas down so ordinary people can understand them,
              question what they hear, and make deliberate decisions about their
              money.
            </Reveal>
            <Reveal as="p" className="sign">
              Prosper Betiang
            </Reveal>
          </div>
        </section>

        {/* ── Who it's for ──────────────────────────────────── */}
        <section
          className="scene scene--white"
          id="who"
          aria-labelledby="who-h"
        >
          <div className="wrap-wide">
            <div className="split">
              <div>
                <Reveal as="h2" id="who-h">
                  Who this is for
                </Reveal>
                <Reveal as="p">
                  This is for you if any of this sounds familiar. Tap the ones
                  that do:
                </Reveal>
                <Reveal>
                  <TapChecklist />
                </Reveal>
              </div>

              <Reveal className="nofit">
                <h3>It may not be for you if:</h3>
                <ul>
                  <li>
                    <X className="ic" aria-hidden="true" />
                    <span>
                      <strong>You want to be told what to buy.</strong> I don’t
                      do that, not in the workshop and not afterwards. I explain
                      how things work, and which one you choose is yours.
                    </span>
                  </li>
                  <li>
                    <X className="ic" aria-hidden="true" />
                    <span>
                      <strong>You want someone to manage your money.</strong>{" "}
                      The workshop equips you to make every decision yourself.
                    </span>
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── The eight lectures ────────────────────────────── */}
        <section
          className="scene scene--lilac"
          id="lectures"
          aria-labelledby="lectures-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="lectures-h">
              The eight lectures
            </Reveal>
            <Reveal as="p" className="lead">
              Three codes, in the order they actually work. Tap any lecture to
              see what’s inside.
            </Reveal>

            {/* Code 1 */}
            <Reveal className="codeblock codeblock--1" id="code-1">
              <div className="codeblock__head">
                <p className="codeblock__k">Code 1 · Day 1</p>
                <h3 className="codeblock__t">Making money</h3>
              </div>

              <details className="acc" id="lecture-1">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 1</small>
                    The different kinds of income
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    Why earning more and building wealth are different problems.
                    The seven types of income, from salary to royalties, and why
                    most of the wealth on this continent comes from ownership
                    rather than a payslip. We look at where the ten richest men
                    in Africa actually got their money.
                  </p>
                </div>
              </details>

              <details className="acc" id="lecture-2">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 2</small>
                    Offline and online income streams
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    What each one realistically looks like, what it costs to
                    start, and how to pick one that fits your actual life rather
                    than the one that sounds best.
                  </p>
                </div>
              </details>
            </Reveal>

            {/* Code 2 */}
            <Reveal className="codeblock codeblock--2" id="code-2">
              <div className="codeblock__head">
                <p className="codeblock__k">Code 2 · Days 2 and 3</p>
                <h3 className="codeblock__t">Keeping money</h3>
              </div>

              <details className="acc" id="lecture-3">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 3</small>
                    Rule 101: pay yourself first
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    Ten percent of everything you earn is yours to keep. Every
                    other expense comes out of the remaining ninety. We work it
                    through on a ₦100,000 month.
                  </p>
                </div>
              </details>

              <details className="acc" id="lecture-4">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 4</small>
                    Debt: identify, isolate, divide and conquer
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    Good debt and bad debt. Why the highest-interest debt goes
                    first even when it’s the smallest, worked through with real
                    numbers at ₦1,000,000. And the list of debts to run from.
                  </p>
                </div>
              </details>

              <details className="acc" id="lecture-5">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 5</small>
                    The two-day-and-twelve-hour rule, and your money system
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    Where impulse spending actually comes from. The wait rule
                    that cuts it. Budgeting you’ll keep, why separate accounts
                    make everything simpler, and the daily habit of recording
                    what comes in and what goes out.
                  </p>
                </div>
              </details>
            </Reveal>

            {/* Code 3 */}
            <Reveal className="codeblock codeblock--3" id="code-3">
              <div className="codeblock__head">
                <p className="codeblock__k">Code 3 · Days 4 to 8</p>
                <h3 className="codeblock__t">Putting money to work</h3>
              </div>

              <details className="acc" id="lecture-6">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 6</small>
                    Foundations, and the rules that keep you safe
                  </span>
                </summary>
                <div className="acc__body">
                  <p>
                    What investment actually is. Investing in yourself, in
                    relationships, and in assets. The thirteen terms you need
                    before anything else makes sense. How investments group by
                    risk and by timeframe. Then the rules that matter more than
                    the rest:
                  </p>
                  <ul className="safety">
                    {SAFETY_RULES.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </details>

              <details className="acc" id="lecture-7">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 7</small>
                    T-bills, bonds, mutual funds, REITs, and gold
                    <span className="pill">
                      The lecture most people come for
                    </span>
                  </span>
                </summary>
                <div className="acc__body">
                  <dl className="vehicles">
                    {VEHICLES_LE7.map((vehicle) => (
                      <div key={vehicle.id} id={vehicle.id}>
                        <dt>{vehicle.term}</dt>
                        <dd>{vehicle.body}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>

              <details className="acc" id="lecture-8">
                <summary>
                  <span className="acc__t">
                    <small>Lecture 8 · Days 6 and 7</small>
                    Stocks, real estate, agriculture
                  </span>
                </summary>
                <div className="acc__body">
                  <dl className="vehicles">
                    {VEHICLES_LE8.map((vehicle) => (
                      <div key={vehicle.id} id={vehicle.id}>
                        <dt>{vehicle.term}</dt>
                        <dd>{vehicle.body}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            </Reveal>

            <Reveal className="bonus">
              <h3>Bonus: hedging and selling · Day 8</h3>
              <p>
                Forward contracts, futures, options and swaps — how you protect
                a position you can’t control. Then how to sell yourself, your
                ideas and your business. Advanced, and included.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── From the deck ─────────────────────────────────── */}
        <section
          className="scene scene--night dark"
          id="slides"
          aria-labelledby="slides-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="slides-h">
              Three things from the deck
            </Reveal>
            <Reveal as="p" className="lead">
              Self-paced means the slides are the workshop. These are straight
              from the material. Play with them.
            </Reveal>

            <Reveal>
              <KaratExplorer />
            </Reveal>

            <Reveal className="card">
              <p className="card__cap">
                Why the smallest debt often costs you the most
              </p>
              <p className="card__src">From Lecture 4</p>
              <p>
                You owe ₦100,000 at 5 percent compounding, and ₦50,000 at 10
                percent compounding. Both for five months.
              </p>
              <dl className="sum">
                <div>
                  <dt>The ₦100,000 grows to</dt>
                  <dd>₦102,096.08</dd>
                </div>
                <div>
                  <dt>The ₦50,000 grows to</dt>
                  <dd>₦52,122.08</dd>
                </div>
              </dl>
              <p>You pay ₦2,122 for owing 50k. and ₦2,096 for owing 100k. That gap looks small. Run it at ₦1,000,000 instead.</p>
              <DebtBars />
              <p className="verdict">
                Do you see that the expensive debt costs ₦21,480 more? Even though the amount is smaller.
              </p>
            </Reveal>

            <Reveal className="card" id="impulse">
              <p className="card__cap">The rule that does the most work</p>
              <p className="card__src">From Lecture 5</p>
              <blockquote className="quote-d">
                <p>
                  You’ve imagined what you’d buy with a fortune. Aliko Dangote
                  has that fortune, and he isn’t buying all of it.
                </p>
                <p>
                  On one rough estimate, we calculated how much Dangote would spend daily if he held ₦500,000 in liquid cash.
                  The analysis showed that his daily spending would be about ₦250. Seems confusing? You&apos;d understand when you go through the workshop. 
                  The point is, even with a fortune, he doesn&apos;t spend it all at once.
                </p>
                <p>
                  So the most effective thing you can do about an impulse is{" "}
                  <strong>never buy instantly</strong>. See something you feel
                  you need, wait two days and twelve hours. If it’s still there
                  then, it’s probably real. In my experience the feeling usually
                  fades well before that.
                </p>
              </blockquote>

              <WaitTimer />
            </Reveal>
          </div>
        </section>

        {/* ── Flee from debt ───────────────────────────────── */}
        <section
          className="scene scene--lilac"
          id="flee"
          aria-labelledby="flee-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="flee-h">
              Flee from debt
            </Reveal>
            <Reveal as="p" className="lead">
              One rule from Lecture 4, because it’s the one people remember.
            </Reveal>
            <Reveal as="p" className="flee__lead">
              Don’t take debts from:
            </Reveal>

            <Reveal>
              <FleeFromDebt />
            </Reveal>
          </div>
        </section>

        {/* ── What this is not ─────────────────────────────── */}
        <section
          className="scene scene--white"
          id="not"
          aria-labelledby="not-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="not-h">
              What this workshop is not
            </Reveal>

            <Reveal className="no">
              <span className="no__x">
                <X className="ic" aria-hidden="true" />
              </span>
              <p>
                <strong>It is not investment advice.</strong> I will not tell
                you what to buy, what to sell, or when. Not in the workshop,
                not afterwards, not on WhatsApp.
              </p>
            </Reveal>

            <Reveal className="no">
              <span className="no__x">
                <X className="ic" aria-hidden="true" />
              </span>
              <p>
                <strong>
                  It will not manage your money or open anything in your name.
                </strong>{" "}
                Every decision stays yours.
              </p>
            </Reveal>

            <Reveal className="no no--info">
              <span className="no__x">
                <Info className="ic" aria-hidden="true" />
              </span>
              <p>
                The figures in the slides are examples, recorded at the time
                of teaching. T-bill rates, index values and prices move
                constantly. Treat every number as an illustration of how
                something works, not a quote of what it is today.
              </p>
            </Reveal>

            <Reveal className="no no--info">
              <span className="no__x">
                <Info className="ic" aria-hidden="true" />
              </span>
              <p>
                <strong>
                  The platforms named in the workshop are named so you know
                  what exists and what to check.
                </strong>{" "}
                Naming them is not a recommendation to use any of them. Before
                you put money anywhere, ensure it is SEC registered and
                verified, as taught in the workshop.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section
          className="scene scene--lilac"
          id="how"
          aria-labelledby="how-h"
        >
          <div className="wrap-wide">
            <Reveal as="h2" id="how-h">
              How it works
            </Reveal>
            <ul className="how">
              {HOW_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal
                    as="li"
                    key={step.title}
                    delay={index * 0.06}
                  >
                    <Icon className="ic" aria-hidden="true" />
                    <b>{step.title}</b>
                    <span>{step.body}</span>
                  </Reveal>
                );
              })}
            </ul>

            <div className="after">
              <Reveal as="h3">What happens after you pay</Reveal>

              <Reveal className="step">
                <span className="step__n">1</span>
                <p>
                  You’ll get a confirmation link immediately, sent to the
                  email you provide during checkout.
                </p>
              </Reveal>

              <Reveal className="step">
                <span className="step__n">2</span>
                <p>
                  You’ll also be directed to message me on WhatsApp, where I’ll welcome you
                  and add you to the support community.
                </p>
              </Reveal>

              <Reveal className="secure">
                <ShieldCheck className="ic" aria-hidden="true" />
                <div>
                  <p>
                    <strong>
                      We will never ask you to pay into a personal account,
                      and we will never ask for your OTP, PIN or password.
                    </strong>{" "}
                    If a message claiming to be from us asks for any of those,
                    it isn’t us. The SEC has already warned about impersonators
                    using exactly this tactic during recent public share offers.
                  </p>
                  <p>
                    Our official account name and payment processor is{" "}
                    <strong>The Pixeltique</strong> powered by Paystack.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FOS·AI ────────────────────────────────────────── */}
        <section
          className="scene scene--indigo dark"
          id="fosai"
          aria-labelledby="fosai-h"
        >
          <div className="wrap-wide">
            <Reveal as="p" className="lead" style={{ marginBottom: "0.5rem" }}>
              And that&rsquo;s not all...
            </Reveal>
            <Reveal as="h2" id="fosai-h">
              FOS·AI, your personal finance assistant in your pocket
            </Reveal>
            <Reveal as="p" className="lead">
              Knowledge is powerful. Having tools to apply it can make it more
              practical.
            </Reveal>
            <Reveal as="p">
              FOS·AI is a Financial Operating System (FOS) designed to help you
              engage with your finances beyond the workshop. Money Mastery Code
              teaches you the principles. FOS·AI adds practical tools for working
              with financial information, exploring calculations, and reviewing
              your financial position.
            </Reveal>

            <Reveal as="h3" style={{ marginTop: "1.75rem" }}>
              What you can do in FOS·AI
            </Reveal>

            {/* Said here because a grid of pills no longer reads as a tab
                strip by position: without this line a reader has no reason
                to expect that tapping one of them shows a screen. */}
            <Reveal as="p" className="fos__hint">
              <MousePointerClick className="ic" aria-hidden="true" />
              Tap any one of these to see what it looks like.
            </Reveal>

            <Reveal>
              <FosTabs panels={FOS_PANELS} />
            </Reveal>

            <Reveal className="notice">
              <h3>What FOS·AI is not</h3>
              <p>
                FOS·AI is a private financial tool.{" "}
                <strong>
                  It is not a bank account. It does not hold, move or invest
                  your money, and it isn’t connected to any broker, fund or
                  investment platform.
                </strong>{" "}
                It records what you enter and does nothing else with it.
              </p>
            </Reveal>

            <Reveal as="a" className="privacy" id="privacy-link" href="/privacy">
              Read the FOS·AI privacy statement
              <ArrowRight className="ic" style={{ width: "1.2rem", height: "1.2rem" }} aria-hidden="true" />
            </Reveal>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section
          className="scene scene--white"
          id="students"
          aria-labelledby="students-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="students-h">
              What participants have said
            </Reveal>

            <div className="quotes">
              {SALES_TESTIMONIALS.map((item) => (
                <figure className="quote" key={item.image}>
                  <div className="quote__shot">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      width={720}
                      height={1280}
                      className="object-contain"
                      sizes="(max-width: 640px) 82vw, 20rem"
                    />
                  </div>
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption>
                    <cite>{item.name}</cite>
                    <span className="ctx">{item.context}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <p className="quote__note">
              Screenshots from the participant WhatsApp group. Twenty-nine people
              have been through this material so far. And their results speak for them.
            </p>
          </div>
        </section>

        {/* ── Options ──────────────────────────────────────── */}
        <section
          className="scene scene--lilac"
          id="options"
          aria-labelledby="options-h"
        >
          <div className="wrap-wide">
            <Reveal as="h2" id="options-h">
              Your options
            </Reveal>

            <div className="options">
              <Reveal as="article" className="plan">
                <h3>The Workshop</h3>
                <p className="plan__price">{course.displayPrice}</p>
                <ul>
                  {WORKSHOP_INCLUDES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <CheckoutForm
                  tier={course}
                  label="Get the workshop for ₦15,000"
                  variant={VARIANT}
                  provider={provider}
                />
              </Reveal>

              <Reveal
                as="article"
                className="plan plan--bundle"
                delay={0.1}
              >
                <span className="plan__flag">Best option</span>
                <h3>The Workshop + FOS·AI</h3>
                <p className="plan__price">{bundle.displayPrice}</p>
                <p className="plan__math">
                  ₦15,000 workshop + ₦8,000 FOS·AI
                </p>
                <p className="plan__lead">Everything in The Workshop:</p>
                <ul>
                  {WORKSHOP_INCLUDES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="plan__plus">
                  <p className="plan__plus-k">Plus full access to FOS·AI</p>
                  <ul>
                    {FOSAI_INCLUDES.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="plan__diff">
                  <strong>The difference is ₦8,000.</strong> Take this if you
                  want to run the system, not just understand it.
                </p>
                <CheckoutForm
                  tier={bundle}
                  label="Get the complete bundle for ₦23,000"
                  variant={VARIANT}
                  provider={provider}
                />
                <p className="plan__fine">
                  <strong>
                    FOS·AI access is included permanently from your purchase
                    date.
                  </strong>{" "}
                  No renewal, no expiry.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Guarantee ────────────────────────────────────── */}
        <section
          className="scene scene--white"
          id="guarantee"
          aria-labelledby="guarantee-h"
        >
          <div className="wrap">
            <Reveal className="badge180" aria-hidden="true">
              <b>
                <CountUp value={180} />
              </b>
              <span>days</span>
            </Reveal>
            <Reveal as="h2" id="guarantee-h">
              The 180-day guarantee
            </Reveal>
            <Reveal as="p" className="lead">
              You have 180 days to decide whether this was worth it to you.
            </Reveal>
            <Reveal as="p">
              That’s deliberately longer than it needs to be. Eight one-hour
              lectures take about a week to finish, but people live with
              financial ideas for years, and a short refund window quietly
              rewards people who never got round to it.
            </Reveal>
            <Reveal as="p">
              If it isn’t right for you, ask for a full refund within 180 days
              of purchase. No argument, no forms, no questions about why.
            </Reveal>
            <Reveal as="p">
              Email{" "}
              <a
                className="refund-mail"
                href="mailto:refunds@betiangli.xyz?subject=Money%20Mastery%20Code%20refund%20request"
              >
                refunds@betiangli.xyz
              </a>
              .
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section
          className="scene scene--lilac faq"
          id="faq"
          aria-labelledby="faq-h"
        >
          <div className="wrap">
            <Reveal as="h2" id="faq-h">
              Questions people actually ask
            </Reveal>

            {FAQS.map((faq) => (
              <details className="acc" key={faq.q}>
                <summary>{faq.q}</summary>
                <div className="acc__body">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <footer className="scene scene--night dark final" id="final">
        <div className="wrap">
          <Reveal as="h2">Start with Lecture one</Reveal>
          <Reveal as="p" className="lead">
            Eight lectures. About 1 hour each. Beginner friendly.
          </Reveal>
          <Reveal as="p">
            You already know something isn’t working. That’s usually what makes
            people look. What comes after that is just accurate information and
            aggressive implementation, and it takes about as long as eight
            evenings.
          </Reveal>
          <Reveal as="a" className="btn" href="#options">
            Choose your option
          </Reveal>
          <Reveal as="p" className="sign">
            Prosper Betiang
          </Reveal>

          <p className="fine">
            Money Mastery Code is personal finance education.
            Refunds:{" "}
            <a href="mailto:refunds@betiangli.xyz">refunds@betiangli.xyz</a>
            <br />© 2026 Prosper Betiang
            {/* Absolute, not a relative link. On the sales hostname the proxy
                rewrites every path outside /money-mastery-code/, so /privacy
                would return another copy of this page. */}
            <br />
            <a href={`${SITE_ORIGIN}/privacy#sales-pages`}>Privacy notice for these sales pages</a>
          </p>
        </div>
      </footer>

      <StickyBar />
    </div>
  );
}