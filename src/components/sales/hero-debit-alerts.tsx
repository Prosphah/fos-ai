/**
 * The storefront hero visual: a phone's worth of spending notifications
 * dropping in one after another, until the balance at month end answers the
 * question the rest of the page spends nine sections answering.
 *
 * Ported from the variant B challenger, where it proved the point faster than
 * an abstract chart. Everything that was mint there is volt lime here, so it
 * belongs to the storefront's single accent; only the loss red survives, and
 * only because "-₦12,500" has to read as money leaving.
 *
 * Deliberately CSS-only. The alerts are in the server HTML at their resting
 * state, so the hero is never blank while JavaScript loads, and the whole
 * entrance collapses under prefers-reduced-motion (see globals.css).
 */

type DebitAlert = {
  /** Channel line, e.g. "Debit · POS". */
  channel: string;
  /** The balance that line left behind. */
  balance: string;
  /** What left. */
  amount: string;
  /** Stagger for the drop-in, in seconds. */
  delay: string;
  /** The closing line, which fills with the accent instead. */
  end?: boolean;
};

const ALERTS: DebitAlert[] = [
  { channel: "Debit · POS", balance: "Bal ₦187,500", amount: "-₦12,500", delay: "0.1s" },
  { channel: "Debit · Transfer", balance: "Bal ₦183,500", amount: "-₦4,000", delay: "0.35s" },
  { channel: "Debit · Data", balance: "Bal ₦175,200", amount: "-₦8,300", delay: "0.6s" },
  { channel: "Debit · Transfer", balance: "Bal ₦150,200", amount: "-₦25,000", delay: "0.85s" },
  { channel: "Debit · POS", balance: "Bal ₦143,450", amount: "-₦6,750", delay: "1.1s" },
  { channel: "Month end", balance: "Where did it go?", amount: "₦3,120", delay: "1.35s", end: true },
];

export function HeroDebitAlerts() {
  return (
    <div className="mm-alerts" aria-hidden>
      {ALERTS.map((alert) => (
        <div
          key={alert.channel + alert.amount}
          className={`mm-alert${alert.end ? " is-end" : ""}`}
          style={{ ["--mm-d" as string]: alert.delay }}
        >
          <span>
            {alert.channel}
            <br />
            {alert.balance}
          </span>
          <b>{alert.amount}</b>
        </div>
      ))}
    </div>
  );
}