# Abandoned checkout recovery emails — Money Mastery Code

Copy for the two-touch recovery of a pending Paystack checkout, plus the
engine that sends it.

Production emails are composed and sent by two Make.com scenarios (webhook
URLs below), triggered by the hourly recovery sweep
(`src/app/api/cron/abandoned-checkout-recovery`, scheduled by
`supabase/migrations/20261019000001_setup_abandoned_checkout_recovery.sql`).
These files hold the approved copy the scenarios render, so edits are
reviewable in the repo instead of buried in Make.

## Files

```
email-1-resume-checkout.html   touch 1 — resume payment + bank transfer details
email-2-value-first.html       touch 2 — one course rule, then the way back in
```

## Merge fields (both emails, identical payload)

| Field | Meaning |
|---|---|
| `firstName` | buyer's first name |
| `tierName` | tier they started: "Money Mastery Code" or "Money Mastery Code + FOS·AI" |
| `tierId` | `course` or `course_fosai` — branch key for the tier-specific line in touch 2 |
| `amountDisplay` | human-readable amount, e.g. ₦23,000 |
| `resumeUrl` | buyer's storefront variant, from `getStorefrontVariantUrl()` |
| `accountName` / `bankName` / `accountNumber` | bank transfer details |
| `whatsappNumber` / `whatsappMessageEncoded` | wa.me deep link for payment verification |

The Make payload also carries `reference`, `email`, `variant` and `startedAt`
for branching and debugging.

## The two touches

**Email 1 — resume checkout (first sweep, 1 h after the checkout).** Pure
transactional recovery: what happened, ordinary reasons why, resume button,
full bank transfer details, WhatsApp verification, already-paid help. It
serves the buyer who meant to pay and hit friction.

**Email 2 — value first (48 h after email 1).** Email 1 already did the
"something broke, here's how to finish" job. Touch 2 earns a second opening
rather than repeating the nudge: one real rule from the course (pay yourself
first, three steps) teaches instead of teases, closes with the actual student
proof from `src/lib/sales-testimonials.ts`, then hands the decision back —
resume button first, transfer path second, a reply prompt for segmentation.
No discount and no invented urgency; ₦15,000 / ₦23,000 hold in both emails,
and the copy makes no claim that a cart is "saved" anywhere.

Subject and preview are value-led so the email stands up for a reader who has
already decided what a follow-up must be.

## The engine

Constant lives in the sweep route (`SECOND_TOUCH_AFTER_HOURS = 48`). Touch 2
eligibility, per row: `status = 'pending'`, `followup_step = 1` (the first
email's delivered claim), `followup_sent_at` at least 48 h old, checkout
younger than 7 days (`MAX_AGE_DAYS`). No migration was needed — the
`recovery_attempts` / `followup_step` pair existed for exactly this.

What runs before either email:

- **Paystack verification.** Both the first and second touch verify the
  buyer's newest attempts before mailing. A row whose payment actually
  succeeded gets *fulfilled* (access + purchase confirmation), never emailed —
  a lost webhook is repaired, and a paid buyer is never told they didn't pay.
- **Sibling hush on payment** (`src/lib/fulfilment.ts`). When a payment
  completes — webhook or rescue path — every *other* pending row under the
  buyer's email is closed out (step 2, no further mail). Before this, a
  buyer who paid attempt A but left attempt B pending could still be emailed
  about B; the second touch makes that impossible.
- **Claims are compare-and-swap.** Touch 1 claims on
  `recovery_started_at is null`; touch 2 claims on `followup_step = 1`. A
  failed send releases its claim (touch 2 restores the pair to the touch-1
  state rather than resetting the 48-hour clock), and rows that released stay
  eligible for the next hourly run. A paid row can never be claimed.

Invariants worth knowing when reading columns in Supabase: on a pending row,
`followup_step = 1` always implies `recovery_started_at` is set; step 2 means
the sequence is over for that row; a paid row always reads `0 / NULL`.

## Make setup (once)

1. Duplicate the existing recovery scenario. Point its Webhooks module at the
   same payload shape and connect the email-2 HTML above (HTML files in this
   folder); Zoho step identical.
2. Add the second scenario's URL (`ABANDONED_CHECKOUT_SECOND_WEBHOOK_URL`)
   and, if the Webhooks module carries a key, its key
   (`ABANDONED_CHECKOUT_SECOND_WEBHOOK_SECRET`) to Vercel, and redeploy.
   With nothing set the sweep logs a skip per second-touch candidate — the
   sequence deliberately ends at one email until the scenario exists.
3. For `tierId = course_fosai` rows, appending the FOS·AI sentence marked in
   an HTML comment inside email-2-value-first.html is the only per-tier copy.

Both scenarios must answer 2xx within 3 s (the sweep's hard post timeout);
everything after the webhook send is the scenario's own time, exactly like
the first touch.

## Running it by hand

```
-- Fire once by hand (SQL Editor), then check the response body:
select net.http_get(
    url := 'https://fos-ai.betiangli.xyz/api/cron/abandoned-checkout-recovery',
    headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'mmc_cron_secret'
        )
    ),
    timeout_milliseconds := 60000
);
```

The response now reports both queues: `buyers` and `emailsSent` (touch 1),
`secondTouchBuyers` and `followupsSent` (touch 2), plus `recoveredPayments`,
`skipped`, `failed` and `deletedAfter90Days`. A row that went through both
touches reads `followup_step = 2` and never generates mail again.

## What to measure

| Metric | Question it answers | Watch |
|---|---|---|
| Recovery rate per `followup_step` | Which touch recovers payment | Attribute by the pair |
| Click rate on `resumeUrl` | Does the value email move people | Benchmark 2–5% |
| WhatsApp confirm clicks | Share of recoveries on the transfer path | Compare against email 1 |
| Unsubscribes | Fatigue from the second touch | Keep under 0.5% |

A/B candidate for email 2, one variable at a time: subject
"Before you decide, one rule from the course" against
"A rule for this month's salary, {{firstName}}".
