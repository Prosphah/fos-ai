import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  ChartLine,
  ChartPie,
  Check,
  Coins,
  Compass,
  CreditCard,
  FileText,
  Gift,
  GraduationCap,
  Infinity,
  Layers,
  MessageCircle,
  MonitorSmartphone,
  PiggyBank,
  RefreshCcw,
  Rocket,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  UserX,
  Video,
  Wallet,
} from "lucide-react";

import { CheckoutForm } from "@/components/sales/checkout-form";
import { FaqList } from "@/components/sales/faq-list";
import { HeroDebitAlerts } from "@/components/sales/hero-debit-alerts";
import {
  BriefingPhone,
  RecordSheetPhone,
  StockAnalyzerPhone,
  ToolsPhone,
} from "@/components/sales/phone-mockups";
import { SalesProgressBar } from "@/components/sales/sales-progress";
import { StickyEnrolBar } from "@/components/sales/sticky-enrol-bar";
import { Testimonials } from "@/components/sales/testimonials";
import { COURSE_TIERS } from "@/lib/money-mastery";
import { SITE_ORIGIN, storefrontMetadata } from "@/lib/seo";

export const metadata: Metadata = storefrontMetadata();

const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8";

/**
 * Attribution tag for purchases made on this page. Carried through
 * /api/checkout into Paystack metadata, then written to
 * enrollments.source_variant by the webhook, so the three storefronts can be
 * compared on conversion rather than on eyeballs.
 *
 * This is variant A, the near-black control. Declared here rather than passed
 * inline at each call site so the two pricing cards cannot drift apart, and so
 * the constant sits next to the metadata that describes this page.
 */
const VARIANT = "a" as const;

/* ── Copy ──────────────────────────────────────────────────── */

/* The lime banner under the hero.
   U+272E HEAVY SIX POINTED BLACK STAR, written as an escape so it survives
   any re-encoding of this file.

   Two rules keep the loop seamless. First, the track holds precisely two
   identical halves, because the -50% keyframe only lands on a boundary when
   it does. Second, one half has to be *wider than the viewport*, or the wrap
   point falls inside the visible band and the banner blinks empty for a
   moment. One cycle alone is nowhere near wide enough on a desktop, so each
   half repeats it MARQUEE_REPEATS times: at the largest font size a half
   measures roughly 700px, which carries a 4K display. */
const STAR = "\u272E";
const marqueeCycle = ["MAKE MONEY", STAR, "MANAGE MONEY", STAR, "MULTIPLY MONEY", STAR];
const marqueeHalves = [0, 1];
const MARQUEE_REPEATS = [0, 1, 2, 3, 4, 5];

const codes = [
  {
    n: "01",
    name: "Money Making",
    icon: TrendingUp,
    verb: "Understand how income is created.",
    body: "Learn about different types and sources of income, explore offline and online income opportunities, and examine how wealth is built through different economic activities. The goal is to broaden your understanding of earning beyond a single salary or source of income.",
    listLabel: "You'll explore",
    points: [
      "Different types of income",
      "The framework of multiple income streams",
      "How wealthy Africans have built wealth",
      "Offline income opportunities",
      "Online income opportunities",
      "The importance of developing your capacity to earn",
    ],
  },
  {
    n: "02",
    name: "Money Management",
    icon: Wallet,
    verb: "Learn how to give your money direction.",
    body: "Making money doesn't automatically mean keeping it. This section covers practical ways to understand your cash flow, make deliberate spending decisions, manage debt, and organize your finances.",
    listLabel: "You'll learn about",
    points: [
      "The “pay yourself first” principle and the 10% rule",
      "Identifying and prioritizing debt",
      "The “Identify, Isolate, Divide & Conquer” approach to debt repayment",
      "A practical method for reducing impulse spending",
      "Budgeting and allocating your income",
      "Segmenting your accounts for different purposes",
      "Tracking your income and expenses",
    ],
    close:
      "The point isn't to make you afraid to spend. It's to help you spend intentionally, understand your financial position, and stop leaving every financial decision to chance.",
  },
  {
    n: "03",
    name: "Money Multiplication",
    icon: Layers,
    verb: "Understand how money can be put to work.",
    body: "Investing is not simply sending money into an asset and hoping for the best. You need to understand what you're buying, why you might buy it, and what risks you're taking. This section introduces investment concepts and a range of investment vehicles, with practical demonstrations to help make the ideas less abstract.",
    listLabel: "You'll explore",
    points: [
      "What investing means and the role of risk",
      "Investment categories and terminology",
      "Bonds and Treasury bills",
      "Mutual funds and REITs",
      "Gold and other precious metals",
      "Stocks and ETFs",
      "Real estate and agriculture",
      "Dollar-cost averaging and related concepts",
      "Hedging and basic derivatives",
      "Investing in yourself and your relationships",
    ],
    close:
      "You'll also see practical demonstrations involving stock valuation, investing in gold, and navigating the Bamboo investment app.",
    note:
      "The workshop is educational. It does not promise investment returns or tell every learner to buy the same assets. Investment decisions should reflect your own circumstances, goals, and risk tolerance.",
  },
];

const pains = [
  {
    icon: ArrowRight,
    text: "You earn money, but by the end of the month, you’re not entirely sure where it went.",
  },
  {
    icon: CreditCard,
    text: "Debt has become a recurring part of your life, and you’re tired of trying to solve it without a clear plan.",
  },
  {
    icon: Scale,
    text: "You know you should budget, save, or invest, but the advice online is so contradictory that you’re not sure what to trust.",
  },
  {
    icon: ChartLine,
    text: "You’ve heard people talk about stocks, gold, Treasury bills, mutual funds, or ETFs, but the terminology makes investing feel more complicated than it needs to be.",
  },
  {
    icon: Compass,
    text: "Perhaps you’re already doing some of these things, but you want to understand the principles well enough to make decisions for yourself.",
  },
];

const painLabels = ["CASH FLOW", "DEBT", "INVESTING", "TOO MUCH ADVICE", "FURTHER ALONG"];

const shifts = [
  {
    from: "Instead of only asking, “Which stock should I buy?”,",
    to: "you can start asking, “How do I evaluate a stock, and what would make it worth considering?”",
  },
  {
    from: "Instead of wondering where your money went,",
    to: "you can build a habit of tracking it and understanding your cash flow.",
  },
  {
    from: "Instead of treating debt as one overwhelming problem,",
    to: "you can learn to identify what you owe and approach repayment more deliberately.",
  },
  {
    from: "Instead of thinking of gold only as jewellery,",
    to: "you can understand its role as an investment asset, including the trade-offs and risks involved.",
  },
  {
    from: "Instead of believing that every person who sounds successful has sound financial advice,",
    to: "you can assess the reasoning behind what they're saying.",
  },
];

const demonstrations = [
  {
    n: "01",
    icon: ChartPie,
    title: "See how stock valuation works",
    body: "Explore how a stock can be evaluated instead of buying simply because it is popular or someone online recommended it.",
  },
  {
    n: "02",
    icon: Coins,
    title: "See how gold investing works",
    body: "Understand gold as an investment option and follow a practical demonstration of getting started.",
  },
  {
    n: "03",
    icon: MonitorSmartphone,
    title: "See how an investment app works",
    body: "Follow a demonstration of navigating the Bamboo app, so the process feels less unfamiliar.",
  },
];

const forYou = [
  {
    icon: Compass,
    text: "You want a clearer foundation in personal finance.",
  },
  {
    icon: Wallet,
    text: "You earn money but want to manage it more intentionally.",
  },
  {
    icon: PiggyBank,
    text: "You need a practical starting point for budgeting and financial tracking.",
  },
  {
    icon: CreditCard,
    text: "You are dealing with debt and want to understand approaches to repayment.",
  },
  {
    icon: ChartLine,
    text: "You want to understand investment options beyond social media recommendations.",
  },
  {
    icon: Coins,
    text: "You are curious about stocks, gold, Treasury bills, mutual funds, or other investment vehicles.",
  },
  {
    icon: Target,
    text: "You want to learn the basics before making more informed financial decisions.",
  },
  {
    icon: BookOpen,
    text: "You are tired of financial content that makes big promises but leaves you confused about the fundamentals.",
  },
];

const notForYou = [
  {
    icon: Rocket,
    text: "You expect a secret formula that will make you rich overnight.",
  },
  {
    icon: BadgeDollarSign,
    text: "You want guaranteed investment returns.",
  },
  {
    icon: UserX,
    text: "You expect someone to choose investments for you without requiring you to understand the risks.",
  },
  {
    icon: RefreshCcw,
    text: "You are unwilling to examine your habits or apply what you learn.",
  },
];

const received = [
  {
    icon: Video,
    title: "The complete recorded workshop",
    body: "Eight recorded lectures, averaging approximately one hour each. Watch at your own pace and revisit lessons when you need to refresh your understanding.",
  },
  {
    icon: FileText,
    title: "Workshop slides for reference",
    body: "Keep the teaching material available as a quick reference while reviewing the lessons or revisiting a concept.",
  },
  {
    icon: Infinity,
    title: "Lifetime access to the workshop",
    body: "Return to the recorded lessons and slides whenever you need to revisit the material.",
  },
  {
    icon: MessageCircle,
    title: "Access to the WhatsApp support community",
    body: "Continue engaging with the financial ideas shared in the community, including thoughts and guidance I share beyond the original lessons.",
  },
  {
    icon: Gift,
    title: "Your choice of workshop access or workshop plus FOS·AI",
    body: "Choose the workshop on its own, or select the package that includes permanent access to FOS·AI, a financial operating system designed to help you put some of the principles into practice.",
  },
];

const fosaiCapabilities = [
  {
    icon: Activity,
    title: "Financial health overview",
    body: "Bring aspects of your financial position together in a financial health profile, helping you get a clearer view of where you stand.",
  },
  {
    icon: Wallet,
    title: "Money management",
    body: "Work with income, expenses, accounts, budgets, and transactions in one financial management environment.",
  },
  {
    icon: ChartLine,
    title: "Investment research",
    body: "Explore stock information and analysis to support your own research. This is an aid to understanding, not a substitute for independent judgment or professional advice.",
  },
];

const fosaiMore = [
  {
    title: "Return on investment",
    body: "Use calculators for ROI, compound interest, and inflation.",
  },
  {
    title: "Plan ahead",
    body: "Explore retirement, financial goal planning, dollar-cost averaging, emergency funds, and savings targets.",
  },
  {
    title: "Other calculations",
    body: "Use tools for currency conversion and tax calculations. Results depend on the information and assumptions entered.",
  },
];

const calculators = [
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

const courseIncludes = [
  "All 8 recorded lectures",
  "Workshop slides for reference",
  "Lifetime access to the workshop",
  "Access to the WhatsApp support community",
];

const bundleIncludes = [
  "Permanent access to FOS·AI — yours for good, no subscription, no renewal",
  "Financial health overview",
  "Money management tools for income, expenses, accounts, budgets, and transactions",
  "Stock research and analysis tools",
  "Financial calculators for common planning and investment calculations",
  "Every FOS·AI capability released from here on, at no extra cost",
];

const faqs = [
  {
    q: "Is Money Mastery Code suitable for beginners?",
    a: "Yes. The workshop is designed to introduce financial concepts in an accessible way. You do not need to be an experienced investor to begin.",
  },
  {
    q: "Is this a get-rich-quick program?",
    a: "No. Money Mastery Code focuses on financial literacy and repeatable principles. It does not promise overnight wealth or guaranteed returns.",
  },
  {
    q: "How is the workshop delivered?",
    a: "It is delivered as recorded video lessons. The teaching sessions have been recorded so you can learn at your own pace.",
  },
  {
    q: "How many lessons are included?",
    a: "There are eight recorded lectures, averaging approximately one hour each.",
  },
  {
    q: "Do I get lifetime access?",
    a: "Yes. You get lifetime access to the Money Mastery Code videos and workshop slides. On the ₦23,000 package, FOS·AI access is permanent too — there is no subscription and no renewal.",
  },
  {
    q: "Do I need to know how to invest already?",
    a: "No. The workshop introduces investment concepts and different asset classes, and includes practical demonstrations to help you understand how some processes work.",
  },
  {
    q: "Will you tell me exactly which stocks to buy?",
    a: "The workshop teaches concepts and methods for evaluating investments. It is not a promise of stock picks, individualized investment recommendations, or guaranteed performance.",
  },
  {
    q: "What is FOS·AI?",
    a: "FOS·AI is a financial operating system with tools for money management, financial calculations, stock research and analysis, and a financial health overview. Additional capabilities are in development and should not be assumed to be available until released.",
  },
  {
    q: "Does the ₦23,000 package include FOS·AI forever?",
    a: "Yes. FOS·AI access on the ₦23,000 package is permanent. It is a one-off payment with no subscription, no renewal and no expiry, and it includes every capability FOS·AI releases from here on. The workshop recordings and slides are lifetime access in exactly the same way.",
  },
  {
    q: "Do I get support after buying?",
    a: "You receive access to the WhatsApp support community, where financial thoughts and guidance are shared. This should not be interpreted as unlimited one-to-one financial advice unless that service is explicitly offered.",
  },
  {
    q: "How does the money-back guarantee work?",
    a: "You have 180 days from the date of purchase. Go through the lessons, study the material, and if it has not delivered the value you expected, email refunds@betiangli.xyz and we will sort out the refund. No argument, no forms.",
  },
  {
    q: "Will this workshop make me rich?",
    a: "No workshop can responsibly guarantee that. Money Mastery Code is designed to help you understand financial principles and make more informed decisions. Your outcomes will depend on your circumstances, decisions, consistency, and other factors outside the workshop.",
  },
];

/* ── Primitives ────────────────────────────────────────────── */

function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <p
      className="text-[11px] font-black uppercase tracking-[0.18em]"
      style={{ color: color ?? "var(--sales-accent)" }}
    >
      {children}
    </p>
  );
}

function Display({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-4 max-w-[760px] text-[clamp(34px,4.3vw,54px)] font-black leading-[1.02] tracking-[-0.055em] ${className}`}
    >
      {children}
    </h2>
  );
}

function Pill({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "invert" | "ghost";
  className?: string;
}) {
  const base =
    "sales-focus inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[14px] font-black leading-[1.2] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]";

  const styles: Record<string, React.CSSProperties> = {
    solid: {
      background: "var(--sales-accent)",
      color: "var(--sales-accent-contrast)",
      padding: "15px 21px",
    },
    invert: {
      background: "#17190f",
      color: "var(--sales-accent)",
      padding: "15px 21px",
    },
    ghost: {
      border: "1px solid var(--mm-line)",
      color: "#f4f3eb",
      padding: "15px 21px",
    },
  };

  return (
    <a href={href} className={`${base} ${className}`} style={styles[variant]}>
      {children}
    </a>
  );
}

/**
 * The guarantee mark.
 *
 * A hairline ring and nothing else. The badge does not need to restate what
 * the section around it already says — the eyebrow reads "The guarantee", the
 * heading says "Give the workshop a fair chance", the copy names the 180-day
 * window — so the mark carries one number and stops. No star, no rotation, no
 * wax-seal texture; those all compete with the lime CTA sitting directly
 * beneath it.
 *
 * The numeral-plus-small-suffix treatment is not new to this page: the problem
 * section sets its "01 / 03" counter the same way, so the seal reads as part
 * of the same system rather than a pasted-on sticker.
 *
 * Deliberately no `tabular-nums` on the figure. There is nothing to align it
 * against, and forcing every digit into the same advance gives the narrow "1"
 * a full slot's worth of dead space, which throws the whole number off the
 * ring's axis.
 */
function GuaranteeSeal() {
  return (
    <div className="relative mx-auto grid h-[132px] w-[132px] place-items-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          border: "1px solid rgba(213,255,101,0.42)",
          boxShadow:
            "inset 0 0 34px -8px rgba(213,255,101,0.22), 0 0 44px -14px rgba(213,255,101,0.34)",
        }}
      />
      <span className="relative text-center">
        <span
          className="block text-[44px] font-black leading-none tracking-[-0.045em]"
          style={{ color: "var(--sales-accent)" }}
        >
          180
        </span>
        <span
          className="mt-2.5 block text-[10px] font-black uppercase leading-none tracking-[0.26em]"
          style={{ color: "#94a06f" }}
        >
          Days
        </span>
      </span>
    </div>
  );
}

function PhoneFigure({
  children,
  caption,
  sub,
}: {
  children: ReactNode;
  caption: string;
  sub: string;
}) {
  return (
    <figure className="flex flex-col items-center">
      {children}
      <figcaption className="mt-5 max-w-[30ch] text-center">
        <p className="text-[13.5px] font-semibold">{caption}</p>
        <p className="mt-1.5 text-[12.5px] leading-6" style={{ color: "var(--sales-text-3)" }}>
          {sub}
        </p>
      </figcaption>
    </figure>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function MoneyMasteryCodePage() {
  const bundle = COURSE_TIERS.find((t) => t.featured) ?? COURSE_TIERS[0];
  const course = COURSE_TIERS.find((t) => !t.featured) ?? COURSE_TIERS[0];

  const muted = "#b8bcb1";

  return (
    <div className="font-sans text-[#f4f3eb]">
      <a
        href="#main"
        className="sales-focus sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ background: "var(--sales-accent)", color: "var(--sales-accent-contrast)" }}
      >
        Skip to content
      </a>

      <SalesProgressBar />

      {/* Nav */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: "var(--mm-line)",
          background: "rgba(16,18,15,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className={`${container} flex h-[72px] items-center justify-between gap-3 sm:h-[76px] sm:gap-5`}>
          {/* The mark is `shrink-0` because a flex item will happily squeeze
              below its declared width when the row gets tight, and a 34×34
              box squashed to 26px wide reads as a pill, not a logo. */}
          <a href="#top" className="sales-focus flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px]"
              style={{ background: "var(--sales-accent)", color: "#11140d" }}
            >
              <GraduationCap size={18} strokeWidth={2.2} />
            </span>
            {/* No `whitespace-nowrap` and no size breakpoint. `min-w-0` lets the
                box shrink when the row is tight, so the name stays on one
                line everywhere it fits and breaks to two only when there is
                genuinely no room — rather than at a guessed pixel width. */}
            <span className="min-w-0 text-[9.5px] font-black leading-[1.15] tracking-[0.015em] sm:text-[12px] sm:leading-none sm:tracking-[0.08em]">
              MONEY&nbsp;MASTERY CODE
            </span>
          </a>

          <nav
            className="hidden items-center gap-6 text-[13px] lg:flex"
            style={{ color: muted }}
          >
            <a href="#framework" className="sales-focus transition hover:text-[#f4f3eb]">
              The framework
            </a>
            <a href="#course" className="sales-focus transition hover:text-[#f4f3eb]">
              The workshop
            </a>
            <a href="#fos" className="sales-focus transition hover:text-[#f4f3eb]">
              FOS·AI
            </a>
            <a href="#faq" className="sales-focus transition hover:text-[#f4f3eb]">
              FAQs
            </a>
          </nav>

          {/* `!` on the padding is load-bearing: Pill sets it inline, and an
              inline declaration outranks any plain utility class, so without
              it this button stays 21px-wide regardless of what it asks for. */}
          <Pill
            href="#pricing"
            className="shrink-0 !px-3.5 !py-2.5 text-[12px] sm:!px-5 sm:!py-3 sm:text-[13px]"
          >
            Get workshop <span aria-hidden>↗</span>
          </Pill>
        </div>
      </header>

      <main id="main">
        {/* 1. Hero */}
        <section id="top" className="relative overflow-hidden border-b" style={{ borderColor: "var(--mm-line)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[170px] -top-[230px] h-[600px] w-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(213,255,101,0.16), transparent 68%)" }}
          />
          <div className={`${container} grid items-center gap-12 pb-[60px] pt-12 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:pb-[74px] lg:pt-[62px]`}>
            <div>
              <Eyebrow>Financial literacy. Without the fluff.</Eyebrow>
              <h1 className="mt-5 max-w-[760px] text-[clamp(40px,7vw,76px)] font-black leading-[0.98] tracking-[-0.06em]">
                Making money is one skill.{" "}
                <span style={{ color: "var(--sales-accent)" }}>
                  Knowing what to do with it is another.
                </span>
              </h1>
              <p className="mt-6 max-w-[620px] text-[17px] leading-8 sm:text-[18px]" style={{ color: muted }}>
                You can work hard, earn more, and still struggle to build wealth if
                you don’t know how money works.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Pill href="#pricing">
                  Get Money Mastery Code <span aria-hidden>↗</span>
                </Pill>
                <Pill variant="ghost" href="#framework">
                  See the framework
                </Pill>
              </div>
              <p className="mt-6 text-[12.5px] leading-6" style={{ color: "#92988a" }}>
                Eight recorded lectures. Lifetime access to the workshop. Learn at your own pace.
              </p>
            </div>

            <HeroDebitAlerts />
          </div>
        </section>

        {/* 1b. Marquee. One per page, and this is it. */}
        <div className="mm-marquee" aria-hidden>
          <div className="mm-marquee-track">
            {marqueeHalves.map((half) => (
              <span key={half}>
                {MARQUEE_REPEATS.map((repeat) =>
                  marqueeCycle.map((word, index) => (
                    <span key={`${half}-${repeat}-${index}`}>{word}</span>
                  )),
                )}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Stats strip */}
        <div className="border-b" style={{ borderColor: "var(--mm-line)" }}>
          <div className={`${container} grid sm:grid-cols-3`}>
            <div
              className="flex items-center justify-between gap-5 border-b py-6 sm:block sm:border-b-0 sm:border-r sm:py-7"
              style={{ borderColor: "var(--mm-line)" }}
            >
              <strong className="text-[20px] font-black tracking-[-0.04em]">8 recorded lectures</strong>
              <span className="mt-0 block text-right text-[12px] sm:mt-1 sm:text-left" style={{ color: muted }}>
                Approximately one hour each
              </span>
            </div>
            <div
              className="flex items-center justify-between gap-5 border-b py-6 sm:block sm:border-b-0 sm:border-r sm:py-7"
              style={{ borderColor: "var(--mm-line)" }}
            >
              <strong className="text-[20px] font-black tracking-[-0.04em]">Lifetime access</strong>
              <span className="mt-0 block text-right text-[12px] sm:mt-1 sm:text-left" style={{ color: muted }}>
                Revisit lessons and slides
              </span>
            </div>
            <div className="flex items-center justify-between gap-5 border-b py-6 sm:block sm:border-b-0 sm:py-7" style={{ borderColor: "var(--mm-line)" }}>
              <strong className="text-[20px] font-black tracking-[-0.04em]">Beginner-friendly</strong>
              <span className="mt-0 block text-right text-[12px] sm:mt-1 sm:text-left" style={{ color: muted }}>
                Practical concepts, no fluff
              </span>
            </div>
          </div>
        </div>

        {/* 3. The problem */}
        <section id="problem" style={{ background: "var(--mm-light)", color: "var(--mm-light-ink)" }}>
          <div className={`${container} grid gap-12 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-[52px] lg:py-[100px]`}>
            <aside className="self-start lg:sticky lg:top-[110px]">
              <Eyebrow color="var(--mm-lime-deep)">The problem</Eyebrow>
              <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] font-black leading-[1.02] tracking-[-0.055em]">
                You don’t have to be bad with money to be missing something important.
              </h2>
              <div
                className="mt-8 text-[clamp(54px,7vw,84px)] font-black leading-[0.9] tracking-[-0.08em] tabular-nums"
                style={{ color: "var(--mm-lime-glow)" }}
              >
                01<span className="text-[0.35em] tracking-[-0.02em]">&nbsp;/&nbsp;03</span>
              </div>
              <p className="mt-6 max-w-[40ch] text-[16px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                Earning money is only one part of building financial stability. What
                you do with the money you earn matters too.
              </p>
            </aside>

            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pains.slice(0, 4).map((pain, index) => (
                  <div
                    key={pain.text}
                    className="rounded-[18px] border p-6"
                    style={{ borderColor: "#c7cabe", background: "#f5f5ef" }}
                  >
                    <span className="mb-4 block text-[11px] font-black tracking-[0.1em]" style={{ color: "#748a32" }}>
                      0{index + 1} / {painLabels[index]}
                    </span>
                    <p className="text-[14px] font-semibold leading-7">{pain.text}</p>
                  </div>
                ))}
              </div>

              <div
                className="mt-3 rounded-[18px] border p-6 sm:col-span-2"
                style={{ borderColor: "#c7cabe", background: "#f5f5ef" }}
              >
                <span className="mb-4 block text-[11px] font-black tracking-[0.1em]" style={{ color: "#748a32" }}>
                  05 / {painLabels[4]}
                </span>
                <p className="text-[14px] font-semibold leading-7">{pains[4].text}</p>
              </div>

              <div className="mt-3 rounded-[18px] p-6 sm:p-7" style={{ background: "var(--sales-accent)", color: "#15170f" }}>
                <p className="text-[15px] font-bold leading-8">
                  These are different problems. But they share a common root:{" "}
                  <strong className="font-black">
                    you need a clearer understanding of how money works.
                  </strong>
                </p>
              </div>

              <div className="mt-12 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-12">
                <p className="mt-4 text-[22px] font-black leading-[1.2] tracking-[-0.03em] sm:text-[26px]">
                  The internet has no shortage of financial advice. It has a shortage of
                  people who can tell good advice from bad advice.
                </p>
                <div className="mt-6 space-y-5 lg:mt-0">
                  <p className="text-[15px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                    Someone can sound confident and still be wrong. A popular investment
                    can still be unsuitable for you. An impressive return can hide a
                    level of risk you don’t understand.
                  </p>
                  <p className="text-[15px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                    You shouldn’t have to blindly trust every person who talks about
                    money online.
                  </p>
                  <p className="text-[15px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                    You need enough financial literacy to ask better questions, understand
                    the trade-offs, and make decisions with your eyes open.
                  </p>
                  <p className="text-[15px] font-black leading-8">
                    That’s what <em>Money Mastery Code</em> is designed to help you
                    develop.
                  </p>
                </div>
              </div>

              <div className="mt-12 rounded-[20px] border p-6 sm:p-8" style={{ borderColor: "#c7cabe", background: "#f5f5ef" }}>
                <div className="space-y-5">
                  <p className="text-[15px] font-semibold leading-8">
                    <strong className="font-black">Money Mastery Code</strong> is a
                    practical, beginner-friendly workshop that teaches you how to make money,
                    manage what you earn, and understand how to put money to work.
                  </p>
                  <p className="text-[15px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                    Learn the principles behind budgeting, debt repayment, financial
                    tracking, gold, stocks, and other investment options. Then use what you
                    learn to make more informed financial decisions.
                  </p>
                  <p className="text-[15px] leading-8" style={{ color: "var(--mm-light-muted)" }}>
                    No promises of overnight wealth. No magical investment secrets. Just
                    practical financial knowledge you can keep using.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. The framework */}
        <section id="framework" className="scroll-mt-24" style={{ background: "var(--mm-panel)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow>The framework</Eyebrow>
              <Display>Make money. Manage money. Multiply money.</Display>
              <p className="mt-5 text-[17px] leading-8" style={{ color: muted }}>
                Money Mastery Code is built around three connected areas of financial
                literacy.
              </p>
            </header>

            <div className="mt-10 grid gap-3.5 lg:grid-cols-3">
              {codes.map((code, index) => {
                const [background, ink, glyph] = [
                  ["var(--sales-accent)", "#17190f", "↗"],
                  ["var(--mm-purple)", "#1c1728", "◉"],
                  ["#f2a76c", "#21160e", "✳"],
                ][index];
                return (
                  <article
                    key={code.n}
                    className="flex min-h-[340px] flex-col overflow-hidden rounded-[26px] p-7"
                    style={{ background, color: ink }}
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">
                      CODE {code.n} / {code.name.toUpperCase()}
                    </div>
                    <div className="my-9 text-[58px] font-black leading-none">{glyph}</div>
                    <h3 className="text-[27px] font-black leading-[1.02] tracking-[-0.045em]">
                      {code.verb}
                    </h3>
                    <p className="mt-3 text-[14px] leading-7 opacity-80">{code.body}</p>
                    <a
                      href="#course"
                      className="mt-auto pt-8 text-[11px] font-black uppercase tracking-[0.06em]"
                    >
                      Explore the lessons <span className="ml-1 text-[16px]">↘</span>
                    </a>
                  </article>
                );
              })}
            </div>

            <div id="course" className="scroll-mt-24 pt-14">
              <header className="max-w-[760px]">
                <h2 className="mt-4 text-[clamp(29px,3.4vw,42px)] font-black leading-[1.05] tracking-[-0.045em]">
                  Inside the three codes
                </h2>
                <p className="mt-4 text-[16px]" style={{ color: muted }}>
                  Explore the topics covered across the workshop.
                </p>
              </header>

              <div className="mt-8 grid gap-3 lg:grid-cols-2">
                <div
                  className="flex gap-4 rounded-[18px] border p-6"
                  style={{ background: "var(--mm-panel-2)", borderColor: "var(--mm-line)" }}
                >
                  <span
                    className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-[14px] text-[17px] font-black"
                    style={{ background: "var(--sales-accent)", color: "#17190f" }}
                  >
                    01
                  </span>
                  <div>
                    <h3 className="text-[17px] font-black">Money making</h3>
                    <p className="mt-1.5 text-[13px] leading-7" style={{ color: muted }}>
                      {codes[0].points.join("; ")}.
                    </p>
                  </div>
                </div>

                <div
                  className="flex gap-4 rounded-[18px] border p-6"
                  style={{ background: "var(--mm-panel-2)", borderColor: "var(--mm-line)" }}
                >
                  <span
                    className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-[14px] text-[17px] font-black"
                    style={{ background: "var(--sales-accent)", color: "#17190f" }}
                  >
                    02
                  </span>
                  <div>
                    <h3 className="text-[17px] font-black">Money management</h3>
                    <p className="mt-1.5 text-[13px] leading-7" style={{ color: muted }}>
                      {codes[1].points.join("; ")}.
                    </p>
                  </div>
                </div>

                <div
                  className="flex gap-4 rounded-[18px] border p-6"
                  style={{ background: "var(--mm-panel-2)", borderColor: "var(--mm-line)" }}
                >
                  <span
                    className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-[14px] text-[17px] font-black"
                    style={{ background: "var(--sales-accent)", color: "#17190f" }}
                  >
                    03
                  </span>
                  <div>
                    <h3 className="text-[17px] font-black">Money multiplication</h3>
                    <p className="mt-1.5 text-[13px] leading-7" style={{ color: muted }}>
                      {codes[2].points.join("; ")}.
                    </p>
                  </div>
                </div>

                <div
                  className="flex gap-4 rounded-[18px] border p-6"
                  style={{ background: "var(--mm-panel-2)", borderColor: "var(--mm-line)" }}
                >
                  <span
                    className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-[14px] text-[17px] font-black"
                    style={{ background: "var(--sales-accent)", color: "#17190f" }}
                  >
                    ↗
                  </span>
                  <div>
                    <h3 className="text-[17px] font-black">Practical applications</h3>
                    <p className="mt-1.5 text-[13px] leading-7" style={{ color: muted }}>
                      {codes[2].close}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t pt-6 sm:grid-cols-2" style={{ borderColor: "var(--mm-line)" }}>
                <p className="max-w-[60ch] text-[12.5px] leading-7" style={{ color: "#92988a" }}>
                  {codes[1].close}
                </p>
                <p className="max-w-[60ch] text-[12.5px] leading-7" style={{ color: "#92988a" }}>
                  {codes[2].note}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. The transformation */}
        <section style={{ background: "var(--mm-soil)" }}>
          <div className={`${container} grid gap-14 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:py-20`}>
            <div>
              <Eyebrow>The transformation</Eyebrow>
              <div className="mt-4 text-[clamp(27px,3.2vw,42px)] font-black leading-[1.12] tracking-[-0.04em]">
                Financial advice starts sounding different.
              </div>
              <p className="mt-4 text-[15px] leading-8" style={{ color: muted }}>
                When you build financial literacy, you can begin to move from simply
                hearing advice to evaluating it.
              </p>
            </div>

            <div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {shifts.map((shift, index) => (
                  <div
                    key={shift.from}
                    className={`rounded-[16px] border p-5 ${index === shifts.length - 1 ? "sm:col-span-2" : ""}`}
                    style={{ borderColor: "var(--mm-line)" }}
                  >
                    <span className="text-[14px] font-black leading-6 text-[#f4f3eb]">{shift.from}</span>
                    <p className="mt-1 text-[13px] leading-6" style={{ color: muted }}>
                      {shift.to}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t pt-8" style={{ borderColor: "var(--mm-line)" }}>
                <p className="text-[14px] leading-8" style={{ color: muted }}>
                  The goal is not to make you an expert overnight. It’s to help you become
                  a more informed, deliberate, and financially mature decision-maker.
                </p>
                <p className="text-[14px] leading-8" style={{ color: muted }}>
                  With consistent application, the principles can help you build a clearer
                  picture of your finances and make better-informed choices over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Practical demonstrations */}
        <section id="demonstrations" className="scroll-mt-24">
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow>Practical demonstrations</Eyebrow>
              <Display>Some things make more sense when you see how they work.</Display>
              <p className="mt-5 text-[17px] leading-8" style={{ color: muted }}>
                Money Mastery Code goes beyond explaining financial terminology. The
                workshop includes practical demonstrations that connect the concepts to
                real decisions and tools.
              </p>
            </header>

            <div className="mt-10 grid gap-3.5 lg:grid-cols-3">
              {demonstrations.map((demo) => {
                const Icon = demo.icon;
                return (
                  <article
                    key={demo.n}
                    className="flex min-h-[260px] flex-col rounded-[22px] border p-7"
                    style={{ background: "var(--mm-panel)", borderColor: "var(--mm-line)" }}
                  >
                    <div
                      className="mb-7 grid h-[50px] w-[50px] place-items-center rounded-[16px]"
                      style={{ background: "var(--mm-panel-2)", color: "var(--sales-accent)" }}
                    >
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[21px] font-black leading-[1.1] tracking-[-0.03em]">
                      {demo.title}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-7" style={{ color: muted }}>
                      {demo.body}
                    </p>
                  </article>
                );
              })}
            </div>

            <p className="mt-4 max-w-[74ch] text-[12px] leading-6" style={{ color: "#92988a" }}>
              These demonstrations are educational examples, not endorsements of a
              particular investment or guarantees of performance. Their purpose is to
              make the learning more concrete and help you understand the process.
            </p>
          </div>
        </section>

        {/* 7. Student messages */}
        <section id="proof" className="scroll-mt-24 border-t" style={{ borderColor: "var(--mm-line)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow>Student messages</Eyebrow>
              <Display>What students said afterwards.</Display>
              <p className="mt-5 text-[17px] leading-8" style={{ color: muted }}>
                Twenty-nine people have been through this material. These are their own
                messages, unedited.
              </p>
            </header>

            <div className="mt-10">
              <Testimonials />
            </div>
          </div>
        </section>

        {/* 8. Instructor */}
        <section id="instructor" className="overflow-hidden scroll-mt-24" style={{ background: "#d9ff72", color: "#17190f" }}>
          <div className={`${container} grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-[65px] lg:py-[100px]`}>
            <div className="relative mx-auto flex min-h-[360px] w-full items-center justify-center lg:min-h-[410px]">
              <div
                className="flex h-[270px] w-[230px] items-center justify-center rounded-[160px_160px_24px_24px] text-[96px] font-black tracking-[-0.1em] sm:h-[310px] sm:w-[260px] sm:text-[112px]"
                style={{
                  background: "linear-gradient(145deg,#b6d64c,#8ea63a)",
                  border: "1px solid #7e9828",
                  color: "#25310d",
                }}
              >
                PB
              </div>
              <div
                className="absolute bottom-[28px] left-0 rotate-[-7deg] rounded-[13px] px-4 py-3 text-[11px] font-black sm:bottom-[50px]"
                style={{ background: "#17190f", color: "#e5ff9a" }}
              >
                FINANCIAL LITERACY, MADE PRACTICAL
              </div>
            </div>

            <div>
              <Eyebrow color="#4d6416">Meet your instructor</Eyebrow>
              <h2 className="mt-3 max-w-[560px] text-[clamp(34px,4.4vw,56px)] font-black leading-[1] tracking-[-0.06em]">
                I care about what people can do with what they learn.
              </h2>
              <p className="mt-6 text-[16px] leading-8" style={{ color: "#363d28" }}>
                I’m <strong className="font-black">Prosper Betiang</strong>, and Money
                Mastery Code grew out of a lesson I experienced firsthand.
              </p>
              <p className="mt-4 text-[16px] leading-8" style={{ color: "#363d28" }}>
                A friend and I came into money around the same period. My friend received
                a larger share than I did. But my understanding of money helped me
                preserve and grow what I had, while my friend later found himself needing
                to borrow money from me.
              </p>
              <p className="mt-4 text-[16px] leading-8" style={{ color: "#363d28" }}>
                <strong className="font-black">
                  That experience made something very clear to me: the amount of money you
                  receive is not the only thing that shapes your financial outcome. What
                  you understand about money matters too.
                </strong>
              </p>
              <p className="mt-4 text-[16px] leading-8" style={{ color: "#363d28" }}>
                Since then, I’ve taught and spoken about financial literacy in different
                settings, from corporate to religious, including the Interswitch Community, Thrive Financial
                Conference, United Evangelical Church, and various events I’ve organized myself.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Interswitch community", "Thrive financial conference", "United Evangelical Church"].map((setting) => (
                  <span
                    key={setting}
                    className="rounded-full border px-3.5 py-2 text-[11px] font-black"
                    style={{ borderColor: "#849d34", color: "#363d28" }}
                  >
                    {setting}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 9. Audience */}
        <section id="audience" className="scroll-mt-24 border-t" style={{ borderColor: "var(--mm-line)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow>Is this for you?</Eyebrow>
              <Display>Build a stronger foundation for your financial decisions.</Display>
            </header>

            <div className="mt-10 grid gap-3.5 lg:grid-cols-2">
              <article
                className="rounded-[22px] border p-7 sm:p-8"
                style={{ background: "var(--mm-panel)", borderColor: "var(--mm-line)" }}
              >
                <h3 className="text-[24px] font-black leading-tight tracking-[-0.04em]">
                  Money Mastery Code may be for you if&hellip;
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {forYou.map((item) => (
                    <li key={item.text} className="flex gap-3 text-[14px] leading-7" style={{ color: muted }}>
                    <span
                      aria-hidden
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--sales-accent)" }}
                    />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </article>

              <article
                className="rounded-[22px] border p-7 sm:p-8"
                style={{ background: "#24201c", borderColor: "#674e3b" }}
              >
                <h3 className="text-[24px] font-black leading-tight tracking-[-0.04em]" style={{ color: "var(--mm-orange)" }}>
                  This workshop is not for you if&hellip;
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {notForYou.map((item) => (
                    <li key={item.text} className="flex gap-3 text-[14px] leading-7" style={{ color: muted }}>
                      <span
                        aria-hidden
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--mm-orange)" }}
                      />
                      {item.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t pt-6 text-[13px] leading-7" style={{ borderColor: "rgba(255,255,255,0.14)", color: muted }}>
                  Money Mastery Code teaches principles, not magic. The value you get
                  from it depends in part on what you do with the knowledge.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 10. What you receive */}
        <section id="included" className="scroll-mt-24" style={{ background: "var(--mm-soil)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow>What you receive</Eyebrow>
              <Display>More than eight hours of lessons sitting in one place.</Display>
              <p className="mt-5 text-[17px] leading-8" style={{ color: muted }}>
                Learn at your own pace, revisit the lessons, and keep the reference
                materials close.
              </p>
            </header>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {received.map((item, index) => {
                const Icon = item.icon;
                const last = index === received.length - 1;
                return (
                  <article
                    key={item.title}
                    className={`flex gap-4 rounded-[18px] border p-6 ${last ? "sm:col-span-2" : ""}`}
                    style={{ background: "var(--mm-panel-2)", borderColor: "var(--mm-line)" }}
                  >
                    <span
                      className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-[14px]"
                      style={{ background: "var(--sales-accent)", color: "#17190f" }}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-[17px] font-black leading-snug">{item.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-7" style={{ color: muted }}>
                        {item.body}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. FOS·AI */}
        <section id="fos" className="scroll-mt-24" style={{ background: "var(--mm-fos-bg)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <div className="grid gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:gap-14">
              <div>
                <Eyebrow color="var(--mm-purple)">Optional upgrade · FOS·AI</Eyebrow>
                <h2 className="mt-4 max-w-[620px] text-[clamp(36px,4.5vw,58px)] font-black leading-[1.02] tracking-[-0.06em]">
                  Knowledge is powerful. Having tools to apply it can make it more
                  practical.
                </h2>
                <p className="mt-5 max-w-[60ch] text-[16px] leading-8" style={{ color: "#a9a3bc" }}>
                  <strong className="font-black" style={{ color: "#ece8f4" }}>
                    FOS·AI
                  </strong>{" "}
                  is a Financial Operating System designed to help you engage with your
                  finances beyond the classroom.
                </p>
                <p className="mt-4 max-w-[60ch] text-[16px] leading-8" style={{ color: "#a9a3bc" }}>
                  Money Mastery Code teaches you the principles. FOS·AI adds practical
                  tools for working with financial information, exploring calculations,
                  and reviewing your financial position.
                </p>
              </div>

              <div
                className="rounded-[24px] border p-6"
                style={{ borderColor: "rgba(187,163,255,0.35)", background: "linear-gradient(145deg,#252130,#17151c)" }}
              >
                <div className="flex items-center justify-between text-[11px]" style={{ color: "#a9a3bc" }}>
                  <strong className="font-black tracking-[0.06em]">FOS·AI / FINANCIAL OVERVIEW</strong>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-black"
                    style={{ background: "var(--mm-purple)", color: "#1c1728" }}
                  >
                    PRODUCT PREVIEW
                  </span>
                </div>
                <div className="mt-6 text-[42px] font-black leading-[1.02] tracking-[-0.07em]">
                  Your money,
                  <br />
                  in context.{" "}
                  <small className="align-baseline text-[15px] tracking-normal" style={{ color: "var(--mm-purple)" }}>
                    ↗
                  </small>
                </div>
                <div className="mt-5 h-[7px] overflow-hidden rounded-[10px]" style={{ background: "#45404f" }}>
                  <span className="block h-full w-[68%]" style={{ background: "var(--mm-purple)" }} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {["Income & expenses", "Budgets & accounts", "Investment research", "Financial calculators"].map((item) => (
                    <span key={item} className="rounded-[10px] px-3 py-2.5 text-[11px] leading-5" style={{ background: "#302a3b", color: "#ded7ed" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...fosaiCapabilities, ...fosaiMore].map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[18px] border p-6"
                  style={{ borderColor: "rgba(187,163,255,0.2)", background: "#1e1b24" }}
                >
                  <div className="text-[11px] font-black tracking-[0.12em]" style={{ color: "var(--mm-purple)" }}>
                    {String(index + 1).padStart(2, "0")} / {item.title.toUpperCase()}
                  </div>
                  <p className="mt-4 text-[12.5px] leading-7" style={{ color: "#b8bcb1" }}>
                    {item.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-[14px] font-black">Financial calculators</p>
                  <span
                    className="grid h-5 w-5 place-items-center rounded-[6px]"
                    style={{ background: "rgba(187,163,255,0.18)", color: "var(--mm-purple)" }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {calculators.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border px-3.5 py-1.5 text-[12px]"
                      style={{ borderColor: "rgba(187,163,255,0.25)", color: "#b8bcb1", background: "#1e1b24" }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 max-w-[52ch] text-[12px] leading-6" style={{ color: "#92988a" }}>
                  The exact results of any calculator depend on the information and
                  assumptions entered.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-[14px] font-black">And FOS·AI is still evolving</p>
                  <Sparkles size={14} style={{ color: "var(--mm-purple)" }} aria-hidden />
                </div>
                <div className="mt-4 space-y-4">
                  <p className="max-w-[56ch] text-[13.5px] leading-7" style={{ color: "#b8bcb1" }}>
                    The product is being developed beyond its currently available tools.
                    Planned additions include more complete financial-goal functionality
                    and a conversational finance assistant designed to help users revisit
                    financial concepts and keep track of useful information.
                  </p>
                  <p className="max-w-[56ch] text-[13.5px] leading-7" style={{ color: "#b8bcb1" }}>
                    These are future releases, not features you should assume are already
                    available today. Your access does not change: whatever FOS·AI gains
                    from here on, you get it.
                  </p>
                  <p className="max-w-[56ch] text-[13.5px] leading-7" style={{ color: "#b8bcb1" }}>
                    Why include it now? Because financial literacy is not just about
                    hearing an idea once. It’s also about having practical ways to work
                    with your finances after the lesson ends.
                  </p>
                </div>
              </div>
            </div>

            {/* Phone showcase. Stacks on phones so every screen is readable
                without a hidden swipe; fits all four on a desktop and swipes
                on a tablet. */}
            <div className="mt-16">
              <p className="text-[14px] font-black">The screens you get</p>
              <p className="mt-2 max-w-[52ch] text-[13.5px] leading-7" style={{ color: "#a9a3bc" }}>
                Whether you use a laptop, tablet or mobile phone, the screens you see are designed for your device. Every figure
                here is sample data.
              </p>

              <div className="phone-rail mt-10 px-1">
                <PhoneFigure sub="Your financial health, cash flow and risk in one view." caption="The briefing">
                  <BriefingPhone />
                </PhoneFigure>
                <PhoneFigure sub="Log what comes in and what goes out. Takes seconds." caption="Recording a transaction">
                  <RecordSheetPhone />
                </PhoneFigure>
                <PhoneFigure sub="Numbers and plain-language reasoning on a stock you are weighing up." caption="Stock analysis">
                  <StockAnalyzerPhone />
                </PhoneFigure>
                <PhoneFigure sub="Nine calculators covering the numbers the workshop teaches." caption="Tools">
                  <ToolsPhone />
                </PhoneFigure>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Pricing */}
        <section id="pricing" className="scroll-mt-24" style={{ background: "var(--mm-light)", color: "var(--mm-light-ink)" }}>
          <div className={`${container} py-20 lg:py-[100px]`}>
            <header className="max-w-[760px]">
              <Eyebrow color="var(--mm-lime-deep)">Choose your package</Eyebrow>
              <Display>Start with the knowledge. Add the tools if you want them.</Display>
              <p className="mt-5 text-[17px] leading-8" style={{ color: "#53574e" }}>
                Both packages give you the full Money Mastery Code workshop. The
                difference is whether you also want permanent access to FOS·AI.
              </p>
            </header>

            <div className="mt-10 grid items-start gap-4 lg:grid-cols-2">
              <article
                className="flex flex-col rounded-[24px] border p-7 sm:p-8"
                style={{ background: "#f6f6f0", borderColor: "#c6cabe" }}
              >
                <h3 className="text-[21px] font-black tracking-[-0.035em]">Money Mastery Code</h3>
                <div className="mt-5 text-[clamp(38px,4.6vw,54px)] font-black leading-[1.05] tracking-[-0.03em] tabular-nums">
                  {course.displayPrice}
                </div>
                <p className="mt-3 text-[12px]" style={{ color: "#64685d" }}>
                  For people who want the workshop and its reference materials.
                </p>

                <ul className="mt-7 space-y-2.5 border-t pt-6 text-[13px]" style={{ borderColor: "#c6cabe", color: "#555a4e" }}>
                  {courseIncludes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: "var(--mm-lime-deep)" }} />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>

                <CheckoutForm
                  tier={course}
                  label="Get the workshop for ₦15,000"
                  tone="light"
                  variant={VARIANT}
                />
              </article>

              {/* The package that adds FOS·AI carries a volt-lime stroke and a
                  soft lime bloom so it reads as the fuller option at a glance,
                  without resorting to a heavier card or a louder price. */}
              <article
                className="relative flex flex-col rounded-[24px] border-2 p-7 sm:p-8"
                style={{
                  background: "#171a13",
                  color: "#f4f3eb",
                  borderColor: "var(--sales-accent)",
                  boxShadow:
                    "0 0 0 1px rgba(213,255,101,0.28), 0 26px 64px -26px rgba(213,255,101,0.42), 0 22px 50px rgba(23,26,19,0.16)",
                }}
              >
                <span
                  className="absolute right-5 top-5 rounded-full px-2.5 py-1.5 text-[10px] font-black tracking-[0.04em]"
                  style={{ background: "var(--sales-accent)", color: "#17190f" }}
                >
                  COURSE + TOOLS
                </span>
                <h3 className="text-[21px] font-black tracking-[-0.035em] pr-28">
                  Money Mastery Code + FOS·AI
                </h3>
                <div className="mt-5 text-[clamp(38px,4.6vw,54px)] font-black leading-[1.05] tracking-[-0.03em] tabular-nums">
                  {bundle.displayPrice}
                </div>
                <p className="mt-3 text-[12px]" style={{ color: "#92988a" }}>
                  For people who want the workshop plus permanent tools to help apply what
                  they learn.
                </p>

                <ul className="mt-7 space-y-2.5 border-t pt-6 text-[13px]" style={{ borderColor: "var(--mm-line)", color: "#b8bcb1" }}>
                  {bundleIncludes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: "var(--sales-accent)" }} />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>

                <CheckoutForm
                  tier={bundle}
                  label="Get the workshop + FOS·AI for ₦23,000"
                  variant={VARIANT}
                />
              </article>
            </div>

            <div className="mt-6 rounded-[16px] p-6" style={{ background: "#d8dcd0" }}>
              <p className="text-[13px] leading-7" style={{ color: "#3d4335" }}>
                <strong className="font-black">Which should you choose?</strong> If you
                want to learn the principles first, the workshop-only package is a solid
                place to begin. If you also want a digital environment for managing
                financial information, exploring calculations, and researching stocks,
                consider the workshop plus FOS·AI package.
              </p>
            </div>
            <p className="mt-5 text-[14px] leading-7 text-[#3d4335]">
              <strong className="font-black">Both packages give you the full Money
                Mastery Code workshop.</strong>{" "}
              The difference is whether you also want permanent access to FOS·AI.
            </p>
          </div>
        </section>

        <div id="mm-pricing-done" aria-hidden className="h-px w-full" />

        {/* 13. Guarantee */}
        <section id="guarantee" className="scroll-mt-24">
          <div className={`${container} py-16 lg:py-20`}>
            <div
              className="grid items-center gap-8 rounded-[26px] border p-8 sm:p-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-12"
              style={{ background: "var(--mm-panel)", borderColor: "var(--mm-line)" }}
            >
              <GuaranteeSeal />

              <div>
                <Eyebrow>The guarantee</Eyebrow>
                <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.05em]">
                  Give the workshop a fair chance.
                </h2>
                <div className="mt-5 space-y-3">
                  <p className="text-[14px] leading-8" style={{ color: muted }}>
                    I believe in the value of useful financial education, and I want you
                    to feel comfortable giving this workshop a serious try.
                  </p>
                  <p className="text-[14px] leading-8" style={{ color: muted }}>
                    Go through the lessons. Study the material. Give yourself time to
                    understand the principles and decide whether the workshop has delivered
                    useful, actionable financial knowledge.
                  </p>
                  <p className="text-[14px] leading-8" style={{ color: muted }}>
                    If you genuinely feel it has not provided the value you expected,
                    contact us within 180 days of purchase to request a refund.
                  </p>
                  <p className="text-[15px] font-black leading-8">
                    No need to turn a purchase into a prolonged argument.
                  </p>
                </div>
                <p className="mt-5 max-[58ch] text-[12.5px] leading-7" style={{ color: "#92988a" }}>
                  To request a refund, email{" "}
                  <a
                    href="mailto:refunds@betiangli.xyz?subject=Money%20Mastery%20Code%20refund%20request"
                    className="sales-focus font-bold underline decoration-1 underline-offset-[3px] transition hover:opacity-70"
                    style={{ color: "var(--sales-accent)" }}
                  >
                    refunds@betiangli.xyz
                  </a>{" "}
                  within 180 days of your purchase, telling us the email address you
                  bought with. The guarantee covers Money Mastery Code. If your order
                  included FOS·AI access, we will confirm how that portion is handled when
                  you write to us.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 14. FAQ */}
        <section id="faq" className="scroll-mt-24" style={{ background: "var(--mm-panel)" }}>
          <div className={`${container} grid gap-14 py-20 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14 lg:py-[100px]`}>
            <aside className="self-start lg:sticky lg:top-[110px]">
              <Eyebrow>FAQs</Eyebrow>
              <h2 className="mt-4 max-w-[420px] text-[clamp(34px,4vw,52px)] font-black leading-[1.02] tracking-[-0.055em]">
                Frequently asked questions
              </h2>
              <p className="mt-5 max-w-[38ch] text-[14px] leading-7" style={{ color: muted }}>
                Still deciding? Here’s what to know before you choose your package.
              </p>
              <Pill variant="ghost" href="#pricing" className="mt-7">
                Compare packages
              </Pill>
            </aside>

            <FaqList items={faqs} />
          </div>
        </section>

        {/* 15. Final CTA */}
        <section id="mm-final" style={{ background: "var(--sales-accent)", color: "#17190f" }}>
          <div className={`${container} py-20 text-center lg:py-[90px]`}>
            <Eyebrow color="#536b18">Money Mastery Code</Eyebrow>
            <h2 className="mx-auto mt-5 max-w-[850px] text-[clamp(38px,6vw,72px)] font-black leading-[0.98] tracking-[-0.07em]">
              Your income matters.
              <br />
              What you understand about money matters too.
            </h2>

            <div className="mx-auto mt-7 max-w-[650px] space-y-4 text-left">
              <p className="text-[16px] leading-8" style={{ color: "#3b432b" }}>
                You can keep collecting disconnected tips from timelines, trying to
                figure out which advice to trust and which habits to change. Or you can
                build a stronger foundation.
              </p>
              <p className="text-[16px] leading-8" style={{ color: "#3b432b" }}>
                Learn how to make money, manage what you earn, and understand the ways
                money can be put to work. Revisit the lessons when you need them. And if
                you want practical digital tools alongside the teaching, choose the
                package that includes permanent access to FOS·AI.
              </p>
              <p className="text-[16px] leading-8" style={{ color: "#3b432b" }}>
                You do not need another promise that you’ll become rich overnight. You
                need knowledge you can understand, question, and apply.
              </p>
            </div>

            <p className="mt-8 text-[15px] font-black">Start learning with Money Mastery Code.</p>

            <div className="mt-7 flex justify-center">
              <Pill variant="invert" href="#pricing">
                Get Money Mastery Code <span aria-hidden>↗</span>
              </Pill>
            </div>

            <p className="mt-5 text-[12px]" style={{ color: "#3b432b" }}>
              Workshop only: ₦15,000 | Workshop + FOS·AI: ₦23,000
            </p>
          </div>
        </section>
      </main>

      {/* 16. Footer */}
      <footer id="mm-footer" className="border-t pb-24 lg:pb-10" style={{ borderColor: "var(--mm-line)" }}>
        <div className={container}>
          <div className="flex flex-col gap-8 pt-10 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-[10px]"
                style={{ background: "var(--sales-accent-soft)", color: "var(--sales-accent)" }}
              >
                <GraduationCap size={17} />
              </span>
              <div>
                <p className="text-[14.5px] font-black tracking-tight">Money Mastery Code</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "#92988a" }}>
                  Taught by Prosper Betiang
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link href="/fos-ai" className="sales-focus text-[13.5px] transition hover:opacity-70" style={{ color: muted }}>
                About FOS·AI
              </Link>
              <Link href="/login" className="sales-focus text-[13.5px] transition hover:opacity-70" style={{ color: muted }}>
                FOS·AI sign in
              </Link>
              <Link href="/privacy" className="sales-focus text-[13.5px] transition hover:opacity-70" style={{ color: muted }}>
                Privacy
              </Link>
              <a href="#pricing" className="sales-focus text-[13.5px] font-bold transition hover:opacity-70" style={{ color: "var(--sales-accent)" }}>
                Enrol now
              </a>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <p className="max-w-[104ch] text-[11.5px] leading-6" style={{ color: "#92988a" }}>
              Money Mastery Code is an educational workshop. It does not provide a
              guarantee of financial results or investment returns and should not be
              treated as individualized financial, investment, tax, or legal advice.
              Investments involve risk, including possible loss of capital. Conduct your
              own research and consider qualified professional advice where appropriate.
            </p>
            <p className="max-w-[104ch] text-[11.5px] leading-6" style={{ color: "#92988a" }}>
              FOS·AI is a financial information and calculation tool, not a guarantee of
              accuracy or investment performance. Verify important information before
              acting on it. Features in development are subject to change, and future
              functionality is not promised for any particular date. Your access does
              not change. Interface previews on this page use sample data.
            </p>

            {/* Absolute, not Link. On the sales hostname the proxy rewrites every
                path outside /money-mastery-code/, so a relative /privacy would
                return another copy of this page instead of the policy. */}
            <p className="max-w-[104ch] text-[11.5px] leading-6" style={{ color: "#92988a" }}>
              These sales pages are a separate property from the FOS·AI app and have their
              own privacy notice.{" "}
              <a
                href={`${SITE_ORIGIN}/privacy#sales-pages`}
                className="underline underline-offset-4"
                style={{ color: "#b8bcb1" }}
              >
                Read it
              </a>
              .
            </p>
          </div>
        </div>
      </footer>

      <StickyEnrolBar />
    </div>
  );
}