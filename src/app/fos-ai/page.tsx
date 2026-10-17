import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Gauge,
  LineChart,
  MessageCircle,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "FOS·AI | Make better decisions with your money",
  description:
    "A personal financial operating system to understand your money, track your cash flow, model your options, and make more informed financial decisions.",
};

const availableFeatures = [
  {
    number: "01",
    icon: Wallet,
    title: "Know where your money goes",
    description:
      "Bring your income, expenses, accounts, and budgets into one clearer picture. Track spending patterns and understand what your money is actually doing.",
    tags: ["Money Manager", "Transactions", "Budgets"],
  },
  {
    number: "02",
    icon: Gauge,
    title: "See your financial picture, not just your balance",
    description:
      "Get a financial health overview, see important risk areas, and surface practical actions that can help you improve your position over time.",
    tags: ["Financial health", "Risk overview", "Action points"],
  },
  {
    number: "03",
    icon: LineChart,
    title: "Run the numbers before you make a move",
    description:
      "Explore how compounding, inflation, returns, retirement contributions, and regular investing can affect your money. Work with estimates instead of guesswork.",
    tags: ["ROI", "Compound interest", "Inflation", "DCA"],
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Research investments with more context",
    description:
      "Explore stock data and structured analysis that helps you examine an investment beyond a trending ticker or someone else's confident opinion.",
    tags: ["Stock analysis", "Market data", "Risk context"],
  },
];

const calculators = [
  { icon: CircleDollarSign, title: "ROI", detail: "Estimate potential returns" },
  { icon: Sparkles, title: "Compound interest", detail: "See compounding over time" },
  { icon: ArrowDownRight, title: "Inflation", detail: "Understand lost purchasing power" },
  { icon: Compass, title: "Retirement", detail: "Model long-term savings" },
  { icon: Target, title: "Goal planning", detail: "Calculate a savings path" },
  { icon: PieChart, title: "Dollar-cost averaging", detail: "Model regular investing" },
];

const faqs = [
  {
    q: "What exactly is FOS·AI?",
    a: "FOS·AI is a personal financial operating system. It brings together tools for understanding your financial position, tracking cash flow, modelling financial scenarios, and researching investments, so your decisions can be grounded in more than instinct or online noise.",
  },
  {
    q: "Is FOS·AI only for people who already invest?",
    a: "No. You can start by understanding your cash flow, accounts, budgets, and financial health. The calculators and investment research tools can support you as you become more confident with financial concepts.",
  },
  {
    q: "Will FOS·AI tell me what to buy?",
    a: "FOS·AI is built for education and decision support, not blind buy or sell instructions. Investment decisions still require your own judgement, research, and consideration of your circumstances and risk tolerance.",
  },
  {
    q: "Are more features coming?",
    a: "Yes. FOS·AI is being developed as a growing financial toolkit. Features such as a more personalised AI financial coach and dedicated goal-tracking experiences are part of the product's planned evolution. The page distinguishes those future capabilities from the tools available now.",
  },
  {
    q: "Does FOS·AI guarantee financial results?",
    a: "No. It cannot guarantee returns, eliminate risk, or replace a qualified financial professional. Its purpose is to help you understand your numbers and evaluate options more deliberately.",
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
      <span className="h-px w-6 bg-violet-400" /> {children}
    </p>
  );
}

function PrimaryLink({
  children,
  href = "/login",
}: {
  children: ReactNode;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-violet-300 px-6 py-3 text-sm font-semibold text-[#11101b] shadow-[0_0_36px_rgba(167,139,250,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-200"
    >
      {children}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen overflow-hidden bg-[#09090f] text-white selection:bg-violet-300 selection:text-[#11101b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,92,255,0.18),transparent_62%)]" />
      <div className="pointer-events-none absolute right-[-180px] top-[620px] h-[440px] w-[440px] rounded-full bg-violet-600/10 blur-[120px]" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="FOS AI home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-200">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em]">FOS<span className="text-violet-300">·</span>AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="#tools" className="transition hover:text-white">Tools</a>
          <a href="#roadmap" className="transition hover:text-white">What&apos;s next</a>
          <a href="#faq" className="transition hover:text-white">FAQs</a>
        </nav>
        <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:border-violet-300/60 hover:bg-white/[0.05]">
          Sign in <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3.5 py-2 text-xs font-medium text-violet-100/90">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" /></span>
            A smarter way to work with your money
          </div>
          <h1 className="max-w-2xl text-[clamp(2.9rem,6.2vw,5.65rem)] font-semibold leading-[0.99] tracking-[-0.075em]">
            Your money deserves <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-400 bg-clip-text text-transparent">better decisions.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg sm:leading-8">
            FOS·AI helps you understand your financial position, see where your money goes, test your options, and approach investing with more context. Less guesswork. More informed decisions.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryLink>Get started with FOS·AI</PrimaryLink>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white/70 transition hover:text-white">
              See what you can do <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-300" /> Built around your financial picture</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-300" /> Practical tools, not hype</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-violet-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#11111b]/95 shadow-[0_35px_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs text-white/40">YOUR FINANCIAL OVERVIEW</p>
                <p className="mt-1 text-sm font-medium text-white/90">A clearer view of your money</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-medium text-emerald-200">PERSONAL DASHBOARD</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5">
                <div className="flex items-center justify-between text-white/45"><span className="text-xs">Financial health</span><Gauge size={15} /></div>
                <div className="mt-4 flex items-end gap-2"><span className="text-3xl font-semibold tracking-tight">In view</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-400 to-emerald-300" /></div>
                <p className="mt-2 text-[10px] text-white/35">Understand strengths and risk areas</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5">
                <div className="flex items-center justify-between text-white/45"><span className="text-xs">Money management</span><Wallet size={15} /></div>
                <div className="mt-4 text-3xl font-semibold tracking-tight">In one place</div>
                <div className="mt-4 flex gap-1.5"><span className="h-1.5 flex-1 rounded-full bg-violet-300" /><span className="h-1.5 flex-1 rounded-full bg-violet-300/60" /><span className="h-1.5 flex-1 rounded-full bg-violet-300/30" /><span className="h-1.5 flex-1 rounded-full bg-white/10" /></div>
                <p className="mt-2 text-[10px] text-white/35">Accounts, transactions, budgets</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs text-white/45">Decision lab</p><p className="mt-1 text-base font-medium">What happens if you change the assumptions?</p></div>
                  <span className="rounded-xl bg-violet-300/10 p-2.5 text-violet-200"><LineChart size={18} /></span>
                </div>
                <div className="mt-5 flex h-24 items-end gap-2 border-b border-white/[0.08] px-1">
                  {[28, 34, 31, 45, 43, 54, 51, 63, 69, 65, 80, 88].map((height, i) => <div key={i} className={`flex-1 rounded-t-sm ${i > 8 ? "bg-emerald-300/80" : "bg-violet-400/55"}`} style={{ height: `${height}%` }} />)}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-white/35"><span>Illustrative projection</span><span>Estimates, not guarantees</span></div>
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Sparkles size={17} /></span>
                <div className="min-w-0"><p className="text-xs font-medium text-white/85">A better financial question</p><p className="mt-1 text-xs leading-5 text-white/45">Before asking, “Can I afford it?”, ask, “What does this decision change?”</p></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[10px] text-white/30 sm:px-6"><span>FOS·AI product preview</span><span>Illustrative interface</span></div>
          </div>
          <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#171622] p-3.5 shadow-xl sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><ShieldCheck size={18} /></span>
            <div><p className="text-xs font-medium">Think before you move</p><p className="mt-1 text-[10px] text-white/40">Clarity over financial noise</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:grid-cols-3 sm:px-8 lg:px-12">
          {[
            ["UNDERSTAND", "See your financial position more clearly"],
            ["EVALUATE", "Explore the numbers before you commit"],
            ["ACT WITH CONTEXT", "Make decisions with your goals and risks in mind"],
          ].map(([label, value]) => <div key={label} className="flex items-start gap-4 sm:border-r sm:border-white/[0.07] sm:pr-5 last:sm:border-r-0"><span className="mt-1 h-2 w-2 rounded-full bg-violet-300" /><div><p className="text-[10px] font-semibold tracking-[0.18em] text-violet-200">{label}</p><p className="mt-1.5 text-sm text-white/65">{value}</p></div></div>)}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="max-w-2xl">
          <SectionEyebrow>Why FOS·AI exists</SectionEyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">Financial decisions are too important to make on vibes.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/55">A bank balance tells you what is there. It does not tell you whether your spending is sustainable, how inflation changes the picture, or what a decision might cost you later.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7"><span className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-rose-300/10 text-rose-200"><ArrowDownRight size={20} /></span><h3 className="text-lg font-semibold">The invisible leaks</h3><p className="mt-3 text-sm leading-6 text-white/50">Small expenses, unclear budgets, and scattered accounts make it harder to know what you can actually afford.</p></article>
          <article className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7"><span className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><MessageCircle size={20} /></span><h3 className="text-lg font-semibold">The confidence trap</h3><p className="mt-3 text-sm leading-6 text-white/50">A viral thread or persuasive friend can sound convincing without helping you understand the risks, assumptions, or trade-offs.</p></article>
          <article className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7"><span className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Compass size={20} /></span><h3 className="text-lg font-semibold">The missing big picture</h3><p className="mt-3 text-sm leading-6 text-white/50">When tracking, planning, and investing are disconnected, it is difficult to see how today&apos;s choices affect tomorrow&apos;s options.</p></article>
        </div>
        <div className="mt-8 rounded-3xl border border-violet-300/15 bg-gradient-to-r from-violet-300/[0.09] to-transparent p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div className="max-w-2xl"><p className="text-lg font-medium">FOS·AI gives your financial decisions a place to start.</p><p className="mt-2 text-sm leading-6 text-white/55">Not a magic button. A more structured way to see your numbers, explore possibilities, and make your next move deliberately.</p></div>
          <div className="mt-5 shrink-0 sm:mt-0"><PrimaryLink>Explore FOS·AI</PrimaryLink></div>
        </div>
      </section>

      <section id="tools" className="relative border-y border-white/[0.07] bg-[#0d0c15] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl"><SectionEyebrow>What you can use now</SectionEyebrow><h2 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">The foundations of better money decisions, in one workspace.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-white/50">Start with what is happening now. Then use practical tools to explore what could happen next.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {availableFeatures.map((feature) => {
              const Icon = feature.icon;
              return <article key={feature.number} className="group rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-violet-300/25 hover:bg-white/[0.04] sm:p-8">
                <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.08] text-violet-200"><Icon size={21} /></span><span className="font-mono text-xs text-white/25">{feature.number}</span></div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">{feature.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/55">{feature.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">{feature.tags.map(tag => <span key={tag} className="rounded-full border border-white/[0.09] px-3 py-1.5 text-[11px] text-white/45">{tag}</span>)}</div>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-10"><SectionEyebrow>Make the numbers useful</SectionEyebrow><h2 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">Move from “I think” to “Let me calculate.”</h2><p className="mt-5 text-base leading-7 text-white/55">A financial decision becomes easier to examine when you can test the assumptions behind it. Use the calculators to build intuition, compare scenarios, and understand the trade-offs.</p><div className="mt-8"><PrimaryLink>Try the tools</PrimaryLink></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {calculators.map((tool, i) => { const Icon = tool.icon; return <div key={tool.title} className="flex min-h-32 gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-violet-300/25"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-violet-200"><Icon size={18} /></span><div><p className="font-medium">{tool.title}</p><p className="mt-1.5 text-xs leading-5 text-white/45">{tool.detail}</p><span className="mt-3 block font-mono text-[10px] text-white/25">TOOL 0{i + 1}</span></div></div>; })}
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-y border-white/[0.07] bg-white/[0.025] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl"><SectionEyebrow>Built to keep getting better</SectionEyebrow><h2 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">Your financial life changes. Your toolkit should evolve with it.</h2><p className="mt-5 text-base leading-7 text-white/55">FOS·AI is being built as a growing financial operating system, not a one-feature calculator. Start with the core tools available now, with more personalised experiences planned for future releases.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-300/[0.11] to-transparent p-7 sm:p-8"><div className="absolute right-0 top-0 p-7 text-violet-200/20"><Sparkles size={76} strokeWidth={1} /></div><span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-200"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Planned release</span><h3 className="mt-6 text-2xl font-semibold">A more personal AI financial coach</h3><p className="mt-3 max-w-md text-sm leading-6 text-white/55">A more conversational way to explore financial questions in the context of your profile, goals, and decisions. The assistant experience is being developed separately from the tools available today.</p></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#11111a] p-7 sm:p-8"><div className="absolute right-0 top-0 p-7 text-emerald-200/15"><Target size={76} strokeWidth={1} /></div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Planned release</span><h3 className="mt-6 text-2xl font-semibold">A clearer path to your goals</h3><p className="mt-3 max-w-md text-sm leading-6 text-white/55">A dedicated goal experience designed to connect what you want to achieve with timelines, savings targets, and the progress you make along the way.</p></div>
          </div>
          <p className="mt-5 text-xs leading-5 text-white/30">Roadmap items are planned capabilities, not promises of a specific release date. Current availability may evolve as the product develops.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-10 rounded-[2rem] border border-white/[0.09] bg-gradient-to-br from-[#171321] via-[#111019] to-[#0e0d14] p-7 sm:p-10 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:p-14">
          <div><SectionEyebrow>Start with clarity</SectionEyebrow><h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">You do not need to know everything about money. You need a better way to learn what matters.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/55">Build a clearer picture of your finances, explore your options, and make your next decision with more context.</p></div>
          <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-6 sm:p-8"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Zap size={20} /></span><div><p className="font-semibold">FOS·AI</p><p className="mt-1 text-xs text-white/40">Your financial operating system</p></div></div><div className="my-6 h-px bg-white/[0.08]"/><ul className="space-y-3 text-sm text-white/65"><li className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-emerald-300" /> Understand your financial health</li><li className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-emerald-300" /> Track income, spending, and budgets</li><li className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-emerald-300" /> Explore scenarios with practical calculators</li><li className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-emerald-300" /> Research investments with more context</li></ul><div className="mt-7"><PrimaryLink>Get started</PrimaryLink></div><p className="mt-4 text-[11px] leading-5 text-white/30">No promises of guaranteed returns. Just better tools for more informed decisions.</p></div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="text-center"><SectionEyebrow>Questions, answered</SectionEyebrow><h2 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Before you get started</h2></div>
        <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {faqs.map((faq) => <details key={faq.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-base font-medium text-white/85 marker:hidden [&::-webkit-details-marker]:hidden">{faq.q}<ChevronDown size={18} className="shrink-0 text-white/40 transition group-open:rotate-180" /></summary><p className="max-w-3xl pt-4 text-sm leading-7 text-white/50">{faq.a}</p></details>)}
        </div>
      </section>

      <footer className="border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">FOS<span className="text-violet-300">·</span>AI <span className="ml-1 font-normal text-white/35">Financial clarity, by design.</span></Link>
          <p className="max-w-2xl text-[11px] leading-5 text-white/30">FOS·AI is an educational and decision-support tool. It is not a bank, broker, or substitute for professional financial, tax, or investment advice. Financial calculations are estimates, investment values can fall as well as rise, and no outcome is guaranteed.</p>
          <Link href="/login" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-violet-200 transition hover:text-violet-100">Get started <ArrowRight size={15} /></Link>
        </div>
      </footer>
    </main>
  );
}
