/**
 * The original Money Mastery Code hero illustration: an orbit of concentric
 * rings around a tilted "Know your money" mindset card.
 *
 * NOT USED ON THE SALES PAGE. The storefront hero is now the debit-alert
 * stack (see hero-debit-alerts.tsx), which makes the argument faster than an
 * abstract chart does. This component is deliberately kept intact so the same
 * artwork can be picked up when the actual FOS·AI marketing site is designed,
 * where there is no checkout to push and the hero can afford to be quiet.
 *
 * Nothing here is variant-specific: it reads the same tokens the storefront
 * uses (`--sales-accent`, `--mm-line`, `--mm-purple`), so it drops onto the
 * near-black FOS·AI palette without edits. If the marketing site moves to a
 * different ground, only the inline colours below need revisiting.
 */

export function HeroMindsetCard() {
  const bars = [30, 43, 38, 62, 54, 82, 100];

  return (
    <div
      aria-label="Illustration of financial growth and planning"
      className="relative mx-auto flex min-h-[420px] w-full max-w-[460px] items-center justify-center"
    >
      <div
        aria-hidden
        className="absolute h-[330px] w-[330px] rotate-[-22deg] rounded-full sm:h-[365px] sm:w-[365px]"
        style={{ border: "1px solid rgba(213,255,101,0.25)" }}
      >
        <div
          className="absolute inset-[32px] rotate-[40deg] rounded-full"
          style={{ border: "1px solid rgba(187,163,255,0.3)" }}
        >
          <div
            className="absolute inset-[38px] rounded-full"
            style={{ border: "1px solid rgba(213,255,101,0.2)" }}
          />
        </div>
      </div>

      <div
        className="relative z-[1] w-full max-w-[300px] -rotate-[4deg] rounded-[28px] border p-6 sm:max-w-[340px]"
        style={{
          borderColor: "rgba(255,255,255,0.18)",
          background: "linear-gradient(145deg, rgba(43,49,39,0.96), rgba(24,27,23,0.95))",
          boxShadow: "0 28px 90px rgba(0,0,0,0.53)",
        }}
      >
        <div
          className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em]"
          style={{ color: "#b8bcb1" }}
        >
          <span>Your money mindset</span>
          <span
            className="grid h-[42px] w-[42px] place-items-center rounded-[14px] text-[22px] font-black"
            style={{ background: "var(--sales-accent)", color: "#11140d" }}
          >
            ↗
          </span>
        </div>
        <div className="mt-8 text-[40px] font-black leading-[1.05] tracking-[-0.06em] sm:text-[46px]">
          Know
          <br />
          your money.
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "#b8bcb1" }}>
          Make informed decisions. Build better habits.
        </p>
        <div className="mt-7 flex h-[72px] items-end gap-2">
          {bars.map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-[7px_7px_2px_2px]"
              style={{
                height: `${height}%`,
                background: "linear-gradient(180deg, var(--sales-accent), #7e9b35)",
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute right-0 top-[30px] z-[2] rotate-[6deg] rounded-[15px] px-4 py-3 text-[11px] font-black sm:top-[44px]"
        style={{
          background: "var(--mm-purple)",
          color: "#171322",
          boxShadow: "0 12px 36px rgba(0,0,0,0.33)",
        }}
      >
        MAKE · MANAGE · MULTIPLY
      </div>
      <div
        className="absolute bottom-[32px] left-0 z-[2] -rotate-[5deg] rounded-[15px] px-4 py-3 text-[11px] font-black sm:bottom-[44px]"
        style={{
          background: "var(--sales-accent)",
          color: "#11140d",
          boxShadow: "0 12px 36px rgba(0,0,0,0.33)",
        }}
      >
        Learn it. Apply it.
      </div>
    </div>
  );
}