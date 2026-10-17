import type { Metadata } from "next";

import { CheckoutForm } from "@/components/sales/checkout-form";
import { CountUp, Reveal, RevealItem, ScrollProgress, StickyCta } from "@/components/sales/mmb-motion";
import {
  BriefingPhone,
  RecordSheetPhone,
  StockAnalyzerPhone,
  ToolsPhone,
} from "@/components/sales/phone-mockups";
import { TestimonialsMmb } from "@/components/sales/testimonials-mmb";
import { ViewContentTracker } from "@/components/sales/tiktok-events";
import { COURSE_TIERS } from "@/lib/money-mastery";

/**
 * Money Mastery Code · variant B.
 *
 * The A/B challenger to ../page.tsx. Same product, same prices, same checkout.
 * What differs is the argument: variant A is a dark, restrained editorial
 * page; this one is a paper-coloured, high-contrast walk through the same
 * evidence. The two are meant to run side by side, so treat every visual
 * decision here as a test variable rather than a preference.
 *
 * Provenance: a port of money-mastery-code-CHOICE1.html, with two deliberate
 * substitutions made during the port.
 *
 *   1. The testimonial block was placeholder copy in the mock. It now renders
 *      the real student messages and screenshots (see TestimonialsMmb).
 *   2. The mock's FOS·AI screens were hand-built divs showing invented figures
 *      (a 72 health score, an ₦11,502,000 compound-interest result). They are
 *      replaced with the real product screens from phone-mockups.tsx, so every
 *      number shown is one the product actually produces.
 *
 * Everything else is the mock, faithfully: no top nav, the mint marquee, the
 * sticky problem stack, the prose-style FOS·AI list, and the mock's own
 * floating CTA instead of variant A's sticky mobile bar.
 */

import { SITE_ORIGIN, storefrontMetadata } from "@/lib/seo";

export const metadata: Metadata = storefrontMetadata();

/* Marks this page as the challenger wherever a purchase is attributed. */
const VARIANT = "b";

/* ── Copy ─────────────────────────────────────────────────────────── */

const problems = [
  "You earn money, but by the end of the month, you're not entirely sure where it went.",
  "Debt has become a recurring part of your life, and you're tired of trying to solve it without a clear plan.",
  "You know you should budget, save, or invest, but the advice online is so contradictory that you're not sure what to trust.",
  "You've heard people talk about stocks, gold, Treasury bills, mutual funds, or ETFs, but the terminology makes investing feel more complicated than it needs to be.",
  "Perhaps you're already doing some of these things, but you want to understand the principles well enough to make decisions for yourself.",
];

const alerts = [
  { top: "Debit · POS", line: "Bal ₦187,500", amount: "-₦12,500", delay: "0.2s" },
  { top: "Debit · Transfer", line: "Bal ₦183,500", amount: "-₦4,000", delay: "0.8s" },
  { top: "Debit · Data", line: "Bal ₦175,200", amount: "-₦8,300", delay: "1.4s" },
  { top: "Debit · Transfer", line: "Bal ₦150,200", amount: "-₦25,000", delay: "2s" },
  { top: "Debit · POS", line: "Bal ₦143,450", amount: "-₦6,750", delay: "2.6s" },
  { top: "Month end", line: "Where did it go?", amount: "₦3,120", delay: "3.4s", end: true },
];

/* Exactly one cycle, repeated twice in the markup. The -50% keyframe only
   loops seamlessly when the track holds precisely two identical halves.

   The separator is U+272E HEAVY SIX POINTED BLACK STAR, written as an escape
   so it survives any re-encoding of this file. The source mock used the
   HTML entity &#10038;, which is the same codepoint. */
const STAR = "\u272E";
const marqueeCycle = ["MAKE MONEY", STAR, "MANAGE MONEY", STAR, "MULTIPLY MONEY", STAR];
const marqueeHalves = [0, 1];

const codes = [
  {
    tag: "CODE 1: MAKE MONEY",
    title: "Understand how income is created.",
    body: [
      "Learn about different types and sources of income, explore offline and online income opportunities, and examine how wealth is built through different economic activities.",
      "The goal is to broaden your understanding of earning beyond a single salary or source of income.",
    ],
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
    tag: "CODE 2: MANAGE MONEY",
    title: "Learn how to give your money direction.",
    body: [
      "Making money doesn't automatically mean keeping it. This section covers practical ways to understand your cash flow, make deliberate spending decisions, manage debt, and organize your finances.",
    ],
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
    tag: "CODE 3: MULTIPLY MONEY",
    title: "Understand how money can be put to work.",
    body: [
      "Investing is not simply sending money into an asset and hoping for the best. You need to understand what you're buying, why you might buy it, and what risks you're taking.",
      "This section introduces investment concepts and a range of investment vehicles, with practical demonstrations to help make the ideas less abstract.",
    ],
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
  },
];

const shifts = [
  {
    was: "Instead of only asking, “Which stock should I buy?”,",
    now: "you can start asking, “How do I evaluate a stock, and what would make it worth considering?”",
  },
  {
    was: "Instead of wondering where your money went,",
    now: "you can build a habit of tracking it and understanding your cash flow.",
  },
  {
    was: "Instead of treating debt as one overwhelming problem,",
    now: "you can learn to identify what you owe and approach repayment more deliberately.",
  },
  {
    was: "Instead of thinking of gold only as jewellery,",
    now: "you can understand its role as an investment asset, including the trade-offs and risks involved.",
  },
  {
    was: "Instead of believing that every person who sounds successful has sound financial advice,",
    now: "you can assess the reasoning behind what they're saying.",
  },
];

const demonstrations = [
  {
    title: "See how stock valuation works",
    body: "Explore how a stock can be evaluated instead of buying simply because it is popular or someone online recommended it.",
  },
  {
    title: "See how gold investing works",
    body: "Understand gold as an investment option and follow a practical demonstration of getting started.",
  },
  {
    title: "See how an investment app works",
    body: "Follow a demonstration of navigating the Bamboo app, so the process feels less unfamiliar.",
  },
];

const forYou = [
  "You want a clearer foundation in personal finance.",
  "You earn money but want to manage it more intentionally.",
  "You need a practical starting point for budgeting and financial tracking.",
  "You are dealing with debt and want to understand approaches to repayment.",
  "You want to understand investment options beyond social media recommendations.",
  "You are curious about stocks, gold, Treasury bills, mutual funds, or other investment vehicles.",
  "You want to learn the basics before making more informed financial decisions.",
  "You are tired of financial content that makes big promises but leaves you confused about the fundamentals.",
];

const notForYou = [
  "You expect a secret formula that will make you rich overnight.",
  "You want guaranteed investment returns.",
  "You expect someone to choose investments for you without requiring you to understand the risks.",
  "You are unwilling to examine your habits or apply what you learn.",
];

const received = [
  {
    n: "01",
    title: "The complete recorded course",
    body: "Eight recorded lectures, averaging approximately one hour each. Watch at your own pace and revisit lessons when you need to refresh your understanding.",
  },
  {
    n: "02",
    title: "Course slides for reference",
    body: "Keep the teaching material available as a quick reference while reviewing the lessons or revisiting a concept.",
  },
  {
    n: "03",
    title: "Lifetime access to the workshop",
    body: "Return to the recorded lessons and slides whenever you need to revisit the material.",
  },
  {
    n: "04",
    title: "Access to the WhatsApp support community",
    body: "Continue engaging with the financial ideas shared in the community, including thoughts and guidance I share beyond the original lessons.",
  },
  {
    n: "05",
    title: "Your choice of workshop access or workshop plus FOS·AI",
    body: "Choose the workshop on its own, or select the package that includes access to FOS·AI, a financial operating system designed to help you put some of the principles into practice.",
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
  "Course slides for reference",
  "Lifetime access to the workshop",
  "Access to the WhatsApp support community",
];

const bundleIncludes = [
  "FOS·AI access to the currently available product features",
  "Financial health overview",
  "Money management tools for income, expenses, accounts, budgets, and transactions",
  "Stock research and analysis tools",
  "Financial calculators for common planning and investment calculations",
  "Access to new FOS·AI capabilities according to the product's access and release terms",
];

const faqs = [
  {
    q: "Is Money Mastery Code suitable for beginners?",
    a: "Yes. The workshop is designed to introduce financial concepts in an accessible way. You do not need to be an experienced investor to begin.",
  },
  {
    q: "Is this a get-rich-quick workshop?",
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
    a: "You get lifetime access to the Money Mastery Code recordings and workshop slides. FOS·AI is a separate, evolving product, so its access terms are not covered by the lifetime workshop-access promise.",
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
    a: "No lifetime promise is being made for FOS·AI. It may eventually be offered on a subscription basis, and its future access terms may change. The lifetime-access promise applies to the workshop recordings and slides only.",
  },
  {
    q: "Do I get support after buying?",
    a: "You receive access to the WhatsApp support community, where financial thoughts and guidance are shared. This should not be interpreted as unlimited one-to-one financial advice unless that service is explicitly offered.",
  },
  {
    q: "Will this workshop make me rich?",
    a: "No course can responsibly guarantee that. Money Mastery Code is designed to help you understand financial principles and make more informed decisions. Your outcomes will depend on your circumstances, decisions, consistency, and other factors outside the workshop.",
  },
];

/* ── Page ─────────────────────────────────────────────────────────── */

export default function MoneyMasteryCodeVariantB() {
  const course = COURSE_TIERS.find((t) => t.id === "course") ?? COURSE_TIERS[0];
  const bundle = COURSE_TIERS.find((t) => t.featured) ?? COURSE_TIERS[1];

  return (
    <div className="mmb-root">
      <ViewContentTracker variant="b" />

      {/* Scroll reveals render their elements at opacity 0 in the server HTML
          and let JavaScript bring them in. If that script never arrives, the
          sales argument would be invisible, so pin it open as a floor. */}
      <noscript>
        <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--mmb-g)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--mmb-ink)]"
      >
        Skip to content
      </a>

      <ScrollProgress />

      <main id="main">
        {/* 1. Hero.
            Not a `.mmb-section`: it carries its own vertical rhythm from the
            source mock, so the horizontal padding has to be stated here or
            the headline sits flush against the screen edge. */}
        <header
          className="mmb-ink"
          style={{
            paddingTop: "clamp(2.5rem, 6vw, 5rem)",
            paddingBottom: "clamp(3rem, 7vw, 5rem)",
            paddingInline: "1.25rem",
          }}
        >
          <div className="mmb-wrap grid items-center gap-12 lg:grid-cols-[7fr_5fr]">
            <div>
              <span className="mmb-tag" style={{ color: "var(--mmb-g)" }}>
                FINANCIAL LITERACY. WITHOUT THE FLUFF.
              </span>
              <h1 style={{ margin: "1rem 0 1.3rem" }}>
                Making money is one skill. Knowing what to do with it is another.
              </h1>
              <p style={{ fontSize: "1.2rem" }}>
                You can work hard, earn more, and still struggle to build wealth if
                you don&rsquo;t know how money works.
              </p>
              <a className="mmb-btn" href="#packages">
                GET MONEY MASTERY CODE
              </a>
              <p className="mmb-sub" style={{ marginTop: "1.4rem" }}>
                <em>
                  Eight recorded lectures. Lifetime access to the workshop. Learn at your
                  own pace.
                </em>
              </p>
            </div>

            <div className="mmb-alerts" aria-hidden>
              {alerts.map((alert) => (
                <div
                  key={alert.top + alert.amount}
                  className={`mmb-alert${alert.end ? " is-end" : ""}`}
                  style={{ ["--mmb-d" as string]: alert.delay }}
                >
                  <span>
                    {alert.top}
                    <br />
                    {alert.line}
                  </span>
                  <b>{alert.amount}</b>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* 2. Marquee. One per page, and this is it. */}
        <div className="mmb-mq" aria-hidden>
          <div className="mmb-mq-track">
            {marqueeHalves.map((half) => (
              <span key={half}>
                {marqueeCycle.map((word, index) => (
                  <span key={`${half}-${index}`}>{word}</span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* 3. Stats */}
        <div className="mmb-stats">
          {[
            { value: <CountUp value={8} />, label: "recorded lectures" },
            { value: "~1hr", label: "average per lecture" },
            { value: <CountUp value={90} />, label: "day money-back guarantee" },
            { value: "Lifetime", label: "access to the workshop" },
          ].map((stat) => (
            <div key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* 4. The problem */}
        <section className="mmb-ink mmb-section">
          <div className="mmb-wrap-narrow">
            <Reveal as="h2">
              You don&rsquo;t have to be bad with money to be missing something
              important.
            </Reveal>

            <div className="mmb-stack">
              {problems.map((problem, index) => (
                <Reveal key={problem} className="mmb-sc">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <p>{problem}</p>
                </Reveal>
              ))}
            </div>

            <Reveal as="p">
              These are different problems. But they share a common root:{" "}
              <strong>you need a clearer understanding of how money works.</strong>
            </Reveal>
            <Reveal as="p">
              Earning money is only one part of building financial stability. What you
              do with the money you earn matters too.
            </Reveal>

            <Reveal as="p" className="mmb-pull">
              The internet has no shortage of financial advice. It has a shortage of
              people who can tell good advice from bad advice.
            </Reveal>

            <Reveal as="p">
              Someone can sound confident and still be wrong. A popular investment can
              still be unsuitable for you. An impressive return can hide a level of risk
              you don&rsquo;t understand.
            </Reveal>
            <Reveal as="p">
              You shouldn&rsquo;t have to blindly trust every person who talks about
              money online.
            </Reveal>
            <Reveal as="p">
              You need enough financial literacy to ask better questions, understand the
              trade-offs, and make decisions with your eyes open.
            </Reveal>
            <Reveal as="p">
              That&rsquo;s what <em>Money Mastery Code</em> is designed to help you
              develop.
            </Reveal>
            <Reveal as="p">
              <strong>Money Mastery Code</strong> is a practical, beginner-friendly
              workshop that teaches you how to make money, manage what you earn, and
              understand how to put money to work.
            </Reveal>
            <Reveal as="p">
              Learn the principles behind budgeting, debt repayment, financial
              tracking, gold, stocks, and other investment options. Then use what you
              learn to make more informed financial decisions.
            </Reveal>
            <Reveal as="p">
              No promises of overnight wealth. No magical investment secrets. Just
              practical financial knowledge you can keep using.
            </Reveal>
          </div>
        </section>

        {/* 5. The framework */}
        <section className="mmb-section">
          <div className="mmb-wrap">
            <Reveal as="h2">Make money. Manage money. Multiply money.</Reveal>
            <Reveal as="p">
              Money Mastery Code is built around three connected areas of financial
              literacy.
            </Reveal>

            <div className="mmb-cols three">
              {codes.map((code, index) => (
                <RevealItem key={code.tag} index={index} className="mmb-col">
                  <span className="mmb-tag">{code.tag}</span>
                  <h3>{code.title}</h3>
                  {code.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p>
                    <strong>{code.listLabel}:</strong>
                  </p>
                  <ul className="mmb-list">
                    {code.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  {code.close ? <p>{code.close}</p> : null}
                </RevealItem>
              ))}
            </div>

            <Reveal as="p" className="mmb-sub" style={{ marginTop: "2rem" }}>
              <em>
                The workshop is educational. It does not promise investment returns or
                tell every learner to buy the same assets. Investment decisions should
                reflect your own circumstances, goals, and risk tolerance.
              </em>
            </Reveal>
          </div>
        </section>

        {/* 6. The transformation */}
        <section className="mmb-mint mmb-section">
          <div className="mmb-wrap-narrow">
            <Reveal as="h2">Financial advice starts sounding different.</Reveal>
            <Reveal as="p">
              When you build financial literacy, you can begin to move from simply
              hearing advice to evaluating it.
            </Reveal>

            <div className="mt-5">
              {shifts.map((shift) => (
                <Reveal key={shift.was} className="mmb-ba">
                  <span className="mmb-was">{shift.was}</span>
                  <span className="mmb-now">{shift.now}</span>
                </Reveal>
              ))}
            </div>

            <Reveal as="p" className="mmb-pull">
              The goal is not to make you an expert overnight. It&rsquo;s to help you
              become a more informed, deliberate, and financially mature decision-maker.
            </Reveal>
            <Reveal as="p">
              With consistent application, the principles can help you build a clearer
              picture of your finances and make better-informed choices over time.
            </Reveal>
          </div>
        </section>

        {/* 7. Practical demonstrations */}
        <section className="mmb-section">
          <div className="mmb-wrap">
            <Reveal as="h2">
              Some things make more sense when you see how they work.
            </Reveal>
            <Reveal as="p">
              Money Mastery Code goes beyond explaining financial terminology. The
              workshop includes practical demonstrations that connect the concepts to real
              decisions and tools.
            </Reveal>

            <div className="mmb-cols three">
              {demonstrations.map((demo, index) => (
                <RevealItem key={demo.title} index={index} className="mmb-col">
                  <h3>{demo.title}</h3>
                  <p>{demo.body}</p>
                </RevealItem>
              ))}
            </div>

            <Reveal as="p" className="mmb-sub" style={{ marginTop: "2rem" }}>
              <em>
                These demonstrations are educational examples, not endorsements of a
                particular investment or guarantees of performance. Their purpose is to
                make the learning more concrete and help you understand the process.
              </em>
            </Reveal>
          </div>
        </section>

        {/* 8. Instructor */}
        <section className="mmb-ink mmb-inst mmb-section">
          <div className="mmb-wrap-narrow">
            <Reveal as="p" className="mmb-tag">
              MEET YOUR INSTRUCTOR
            </Reveal>
            <Reveal as="h2" style={{ marginTop: "0.5rem" }}>
              I care about what people can do with what they learn.
            </Reveal>
            <Reveal as="p">
              I&rsquo;m <strong>Prosper Betiang</strong>, and Money Mastery Code grew
              out of a lesson I experienced firsthand.
            </Reveal>
            <Reveal as="p">
              A friend and I came into money around the same period. My friend received
              a larger share than I did. But my understanding of money helped me
              preserve and grow what I had, while my friend later found himself needing
              to borrow money from me.
            </Reveal>
            <Reveal as="p" className="mmb-standout">
              That experience made something very clear to me:{" "}
              <strong>
                the amount of money you receive is not the only thing that shapes your
                financial outcome. What you understand about money matters too.
              </strong>
            </Reveal>
            <Reveal as="p">
              Since then, I&rsquo;ve taught and spoken about financial literacy in
              different settings, including the Interswitch Community, Thrive
              Financial Conference, United Evangical Church, and events I&rsquo;ve organized
              myself.
            </Reveal>
            <Reveal as="p">
              My approach is grounded in a simple belief: principles matter when you
              understand them well enough to apply them.
            </Reveal>
            <Reveal as="p">
              I&rsquo;m not interested in selling the fantasy of getting rich quickly.
              I want to break down complex ideas so that ordinary people can understand
              them, question what they hear, and make more deliberate financial
              decisions.
            </Reveal>
            <Reveal as="p">That&rsquo;s the thinking behind Money Mastery Code.</Reveal>
          </div>
        </section>

        {/* 9. Who it is for */}
        <section className="mmb-section">
          <div className="mmb-wrap">
            <div className="mmb-cols two">
              <Reveal
                className="p-7 rounded-[24px] border-2 border-[var(--mmb-ink)] bg-white"
                style={{ padding: "1.8rem" }}
              >
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                  Money Mastery Code may be for you if…
                </h2>
                <ul className="mmb-list is-check">
                  {forYou.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>

              <Reveal
                className="mmb-ink rounded-[24px] border-2 border-[var(--mmb-ink)]"
                style={{ padding: "1.8rem" }}
              >
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                  This workshop is not for you if…
                </h2>
                <ul className="mmb-list is-cross">
                  {notForYou.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>
                  Money Mastery Code teaches principles, not magic. The value you get
                  from it depends in part on what you do with the knowledge.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 10. What you receive */}
        <section className="mmb-white mmb-section">
          <div className="mmb-wrap">
            <Reveal as="h2">
              More than eight hours of lessons sitting in a folder.
            </Reveal>

            <div className="mmb-bento">
              {received.map((item, index) => (
                <RevealItem key={item.n} index={index} className="mmb-bn">
                  <i>{item.n}</i>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </RevealItem>
              ))}
            </div>
          </div>
        </section>

        {/* 11. Testimonials.
            Swap #1 versus the mock, which shipped three placeholder cards here. */}
        <section id="testimonials" className="mmb-section">
          <div className="mmb-wrap">
            <Reveal as="h2">What learners are saying</Reveal>
            <div className="mt-10">
              <TestimonialsMmb />
            </div>
          </div>
        </section>

        {/* 12. FOS·AI */}
        <section id="fosai" className="mmb-section" style={{ background: "var(--mmb-p)", color: "#fff" }}>
          <div className="mmb-wrap">
            <div className="mmb-wrap-narrow" style={{ margin: 0 }}>
              <Reveal as="h2" className="!text-white">
                Knowledge is powerful. Having tools to apply it can make it more
                practical.
              </Reveal>
              <Reveal as="p" className="!text-white/85">
                <strong className="!text-white">FOS·AI</strong> is a Financial
                Operating System designed to help you engage with your finances beyond
                the classroom.
              </Reveal>
              <Reveal as="p" className="!text-white/85">
                Money Mastery Code teaches you the principles. FOS·AI adds practical
                tools for working with financial information, exploring calculations, and
                reviewing your financial position.
              </Reveal>

              <Reveal as="h3" style={{ marginTop: "2.4rem" }}>
                What you can use in FOS·AI
              </Reveal>

              <div className="mt-4 space-y-4">
                <Reveal as="p" className="!text-white/85">
                  <strong className="!text-white">Financial health overview</strong>
                  <br />
                  Bring aspects of your financial position together in a financial
                  health profile, helping you get a clearer view of where you stand.
                </Reveal>
                <Reveal as="p" className="!text-white/85">
                  <strong className="!text-white">Money management</strong>
                  <br />
                  Work with income, expenses, accounts, budgets, and transactions in one
                  financial management environment.
                </Reveal>
                <Reveal as="p" className="!text-white/85">
                  <strong className="!text-white">Investment research</strong>
                  <br />
                  Explore stock information and analysis to support your own research.
                  This is an aid to understanding, not a substitute for independent
                  judgment or professional advice.
                </Reveal>
                <Reveal as="p" className="!text-white/85">
                  <strong className="!text-white">Financial calculators</strong>
                  <br />
                  Use tools for calculations involving:
                </Reveal>
              </div>

              <ul className="mmb-list on-dark">
                {calculators.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Reveal as="p" className="!text-white/85">
                The exact results of any calculator depend on the information and
                assumptions entered.
              </Reveal>
            </div>

            {/* Swap #2 versus the mock, whose four screens were hand-built divs
                showing invented numbers. These are the real product screens. */}
            <div className="mt-16">
              <Reveal as="h3">The screens you get</Reveal>
              <Reveal as="p" className="!text-white/85">
                Shown at phone size, because that is where you will use it. Every figure
                here is sample data.
              </Reveal>

              <div className="phone-rail mt-10 px-1">
                <figure className="mmb-shot">
                  <BriefingPhone />
                  <figcaption>Financial health overview</figcaption>
                </figure>
                <figure className="mmb-shot">
                  <RecordSheetPhone />
                  <figcaption>Accounts, budgets and transactions</figcaption>
                </figure>
                <figure className="mmb-shot">
                  <StockAnalyzerPhone />
                  <figcaption>Stock research and analysis</figcaption>
                </figure>
                <figure className="mmb-shot">
                  <ToolsPhone />
                  <figcaption>Financial calculators</figcaption>
                </figure>
              </div>
            </div>

            <div className="mmb-wrap-narrow" style={{ margin: "2.4rem 0 0" }}>
              <Reveal as="h3" className="!mt-0">
                And FOS·AI is still evolving
              </Reveal>
              <Reveal as="p" className="!text-white/85">
                The product is being developed beyond its currently available tools.
                Planned additions include more complete financial-goal functionality and
                a conversational finance assistant designed to help users revisit
                financial concepts and keep track of useful information.
              </Reveal>
              <Reveal as="p" className="!text-white/85">
                These are future releases, not features you should assume are already
                available today. Availability and access terms may change as FOS·AI
                develops.
              </Reveal>
              <Reveal as="p" className="!text-white/85">
                <strong className="!text-white">Why include it now?</strong> Because
                financial literacy is not just about hearing an idea once. It&rsquo;s
                also about having practical ways to work with your finances after the
                lesson ends.
              </Reveal>
              <Reveal as="p" className="mmb-sub !text-white/70">
                <em>
                  FOS·AI access is separate from the lifetime workshop-access promise. The
                  workshop remains available for life; FOS·AI is an evolving product and
                  may eventually be offered under its own subscription or access terms.
                </em>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 13. Packages */}
        <section id="packages" className="mmb-section">
          <div className="mmb-wrap">
            <Reveal as="h2">
              Start with the knowledge. Add the tools if you want them.
            </Reveal>

            <div className="mmb-pk">
              <Reveal className="mmb-card">
                <span className="mmb-tag">OPTION 1: MONEY MASTERY CODE</span>
                <div className="mmb-price">{course.displayPrice}</div>
                <p>For people who want the workshop and its reference materials.</p>
                <p>
                  <strong>Includes:</strong>
                </p>
                <ul className="mmb-list">
                  {courseIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <CheckoutForm
                  tier={course}
                  label="GET THE COURSE FOR ₦15,000"
                  tone="light"
                  theme="mmb"
                  variant={VARIANT}
                />
              </Reveal>

              <Reveal className="mmb-card is-featured">
                <span className="mmb-tag">OPTION 2: MONEY MASTERY CODE + FOS·AI</span>
                <div className="mmb-price">{bundle.displayPrice}</div>
                <p>For people who want the workshop plus tools to help apply what they learn.</p>
                <p>
                  <strong>Everything in the workshop package, plus:</strong>
                </p>
                <ul className="mmb-list">
                  {bundleIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <CheckoutForm
                  tier={bundle}
                  label="GET THE COURSE + FOS·AI FOR ₦23,000"
                  theme="mmb"
                  variant={VARIANT}
                />
              </Reveal>
            </div>

            <Reveal as="h3" className="!mt-10">
              Which should you choose?
            </Reveal>
            <Reveal as="p">
              If you want to learn the principles first, the workshop-only package is a
              solid place to begin.
            </Reveal>
            <Reveal as="p">
              If you also want a digital environment for managing financial information,
              exploring calculations, and researching stocks, consider the workshop plus
              FOS·AI package.
            </Reveal>
            <Reveal as="p">
              <strong>Both packages give you the full Money Mastery Code workshop.</strong>{" "}
              The difference is whether you also want access to FOS·AI.
            </Reveal>
          </div>
        </section>

        {/* 14. Guarantee */}
        <section className="mmb-ink mmb-section">
          <div className="mmb-wrap-narrow">
            <div className="mmb-guar">
              <Reveal as="h2">Give the workshop a fair chance.</Reveal>
              <Reveal as="p">
                I believe in the value of useful financial education, and I want you to
                feel comfortable giving this workshop a serious try.
              </Reveal>
              <Reveal as="h3">90-day money-back guarantee</Reveal>
              <Reveal as="p">
                Go through the lessons. Study the material. Give yourself time to
                understand the principles and decide whether the workshop has delivered
                useful, actionable financial knowledge.
              </Reveal>
              <Reveal as="p">
                If you genuinely feel it has not provided the value you expected,
                contact us within 90 days of purchase to request a refund.
              </Reveal>
              <Reveal as="p">
                <strong>No need to turn a purchase into a prolonged argument.</strong>
              </Reveal>
              <Reveal as="p" className="mmb-sub">
                <em>
                  To keep the guarantee clear and fair, the final checkout terms should
                  specify how to request a refund, the deadline, and any reasonable
                  conditions that apply. This guarantee applies to the workshop purchase.
                  FOS·AI access and any related refund treatment should be stated
                  separately in the final terms.
                </em>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 15. FAQ */}
        <section className="mmb-section">
          <div className="mmb-wrap-narrow">
            <Reveal as="h2">Frequently asked questions</Reveal>
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 16. Final CTA */}
        <section className="mmb-mint mmb-section">
          <div className="mmb-wrap-narrow">
            <Reveal as="h2" style={{ maxWidth: "15ch" }}>
              Your income matters. What you understand about money matters too.
            </Reveal>
            <Reveal as="p">
              You can keep collecting disconnected tips from timelines, trying to figure
              out which advice to trust and which habits to change.
            </Reveal>
            <Reveal as="p">Or you can build a stronger foundation.</Reveal>
            <Reveal as="p">
              Learn how to make money, manage what you earn, and understand the ways
              money can be put to work. Revisit the lessons when you need them. And if
              you want practical digital tools alongside the teaching, choose the
              package that includes FOS·AI.
            </Reveal>
            <Reveal as="p">
              You do not need another promise that you&rsquo;ll become rich overnight.
            </Reveal>
            <Reveal as="p">
              You need knowledge you can understand, question, and apply.
            </Reveal>
            <Reveal as="p" className="mmb-pull">
              Start learning with Money Mastery Code.
            </Reveal>
            <Reveal>
              <a className="mmb-btn" href="#packages">
                GET MONEY MASTERY CODE
              </a>
            </Reveal>
            <Reveal as="p" className="mmb-sub" style={{ marginTop: "1.2rem" }}>
              Course only: ₦15,000 | Course + FOS·AI: ₦23,000
            </Reveal>
          </div>
        </section>
      </main>

      <footer>
        <p>
          Money Mastery Code is an educational workshop. It does not provide a guarantee
          of financial results or investment returns and should not be treated as
          individualized financial, investment, tax, or legal advice. Investments
          involve risk, including possible loss of capital. Conduct your own research
          and consider qualified professional advice where appropriate.
        </p>
        <p>
          FOS·AI is a financial information and calculation tool, not a guarantee of
          accuracy or investment performance. Verify important information before acting
          on it. Features in development are subject to change, and future functionality
          or availability is not guaranteed.
        </p>
        <p className="flex flex-wrap items-center gap-5">
          {/* Absolute, not Link. On the sales hostname the proxy rewrites every
              path that is not under /money-mastery-code/, so a relative
              /privacy would hand the visitor another copy of this page instead
              of the policy. That applies to every destination on the app host. */}
          <a href={`${SITE_ORIGIN}/fos-ai`} className="underline-offset-4 hover:underline">
            About FOS·AI
          </a>
          <a href={`${SITE_ORIGIN}/login`} className="underline-offset-4 hover:underline">
            FOS·AI sign in
          </a>
          <a href={`${SITE_ORIGIN}/privacy`} className="underline-offset-4 hover:underline">
            Privacy
          </a>
        </p>
      </footer>

      <StickyCta href="#packages" label="GET MONEY MASTERY CODE" />
    </div>
  );
}