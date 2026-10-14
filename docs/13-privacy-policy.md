# FOS·AI — Privacy Policy (DRAFT)

Status: Draft for review. Not yet implemented.
Code source of truth for this draft: `src/app/privacy/page.tsx`, `src/lib/supabase/*`, `supabase/migrations/*`, `src/app/api/**`, `src/services/*`, `src/hooks/use-app-lock.ts`.
Last verified against code: 13 October 2026.

> **Before publishing, fill in every `[BRACKETED]` placeholder.** A privacy policy with
> unfilled placeholders is worse than no policy, because it signals you have not read it.

---

## What changed from the current live policy

The version at `src/app/privacy/page.tsx` (dated 9 September 2026) is inaccurate in both
directions. This draft corrects it.

**Over-claims removed.** Section 2.2 of the live policy promises "usage data: pages visited,
features used, timestamps, and interaction patterns" and "device information: browser type,
operating system, screen resolution, and device identifiers." There is no analytics SDK,
telemetry client, or tracking script in `src`. Those statements describe a product that does
not exist and would be a false representation to every visitor. Vercel's platform does log IP
addresses and user agents at the network layer; that is disclosed honestly in §2.4 rather than
presented as a tracking system you operate.

**Under-claims added.** The live policy is silent on every data flow that actually exists:

| Omitted flow | Where it happens |
| --- | --- |
| Payment records: email, name, amount, tier, Paystack reference | `enrollments` table, `src/app/api/paystack/webhook/route.ts` |
| Push subscription endpoint, device keys, user agent | `push_subscriptions` table |
| Notifications and scheduled reminders | `notifications`, `reminder_deliveries` tables |
| Product feedback messages | `feedback` table |
| Waitlist signups | `waitlist` table |
| App-lock PIN hash, WebAuthn credential | `localStorage`, `src/hooks/use-app-lock.ts` |
| Session cookies and offline cache | `@supabase/ssr`, Serwist service worker (`src/app/sw.ts`) |
| Age, country, employment status, risk assessment answers | `financial_profiles`, `risk_assessments` tables |

**Legal framing added.** The live policy names no jurisdiction. Given Paystack, NGN, and NGX
as the primary market, the **Nigeria Data Protection Act 2023** is the governing statute and
is now cited explicitly, with the GDPR rights granted where they apply.

**Controller identified.** The live policy refers only to "FOS·AI," which is not an
enforceable data controller. §1 now names Prosper Betiang as controller with a contact address.

**Rights made deliverable.** The live policy promises data export "in a portable format" and
deletion "within 30 days" while the product has neither feature and no stated SLA. You chose
to keep the promises and build the features. §7 therefore commits to both, and
[implementation checklist](#appendix-b-implementation-checklist) tracks the work.

**Unverifiable claims removed.** "Regular security audits and monitoring" (§4) has been deleted.
Do not re-add it unless you actually run them. It is a factual assertion about your operations.

---

# Privacy Policy

**Effective date:** `[DATE OF PUBLICATION]`
**Last updated:** `[DATE OF PUBLICATION]`

---

## 1. Who we are

This policy explains how Prosper Betiang ("FOS·AI," "we," "us," or "our"), the data
controller, collects, uses, shares, and protects your personal information when you use
FOS·AI at `[DOMAIN]` (the "App")

- **Data controller:** Prosper Betiang
- **Privacy contact:** `fosai@betiangli.xyz`
- **Country of establishment:** Nigeria

FOS·AI is a financial planning tool. It helps you organise and calculate with information you
provide. It is not a bank, a broker, or a licensed financial adviser, and it does not connect
to your bank accounts.

### Scope

This policy covers the App, the Workshop, and our sales pages. It does not cover
third-party websites we link to, including payment providers and market data sources, which
have their own policies.

### Legal basis

We process personal data under the following bases:

| Processing activity | Legal basis |
| --- | --- |
| Creating and operating your account | Performance of a contract |
| Storing your financial profile, transactions, budgets, and goals | Performance of a contract |
| Calculating health scores, net worth, and projections | Performance of a contract |
| Generating AI explanations and stock analysis | Legitimate interests (improving and providing the service) |
| Performance of a contract |
| Sending service and reminder notifications | Legitimate interests (operating the service) |
| Detecting fraud and abuse | Legitimate interests (security of the platform) |
| Responding to support requests | Legitimate interests |
| Meeting legal obligations | Legal obligation |

Where we rely on legitimate interests, you have the right to object. See §7.

Under the Nigeria Data Protection Act 2023 (NDPA), your rights as a data subject include the
right to access, correct, delete, and restrict processing of your personal data, and to object
to processing. Where the GDPR applies to you — for example if you are in the European Economic
Area — you additionally have the rights described in §7 and may lodge a complaint with your
local supervisory authority.

---

## 2. Information we collect

We collect only what we need to operate a financial planning tool. We do not collect
information about your race, religion, health, political opinions, sexual orientation, or
biometric identifiers. If you use biometric unlock, that credential is generated and stored on
your device only — we never receive it.

### 2.1 Information you provide

- **Account information.** Email address and password. Your password is hashed by our
  authentication provider and is never stored or transmitted by us in readable form. Your name
  is collected during onboarding if you choose to provide it.
- **Financial profile.** Age, country, currency, employment status, income and income frequency,
  monthly living expenses, debt repayments, savings, and other income. Collected during
  onboarding and editable afterward in Settings.
- **Balance sheet.** Total cash, investments, retirement accounts, property value, business
  ownership, other assets, and each category of debt (credit card, personal loan, student loan,
  mortgage, car loan, other).
- **Risk assessment.** Your answers to the risk questionnaire, the resulting risk score, and
  your risk profile (for example Conservative, Balanced, or Growth).
- **Transactions.** Amounts, descriptions, dates, categories, notes, and tags for every
  transaction you log. Recurring transaction configuration is stored where you set one up.
- **Accounts and institutions.** Account names, types, balances, currencies, and the financial
  institution each account belongs to. Institution names are typed by you; we have no connection
  to any financial institution.
- **Budgets, goals, and savings.** Monthly budget amounts per category, savings goal targets
  and progress, retirement age target, emergency fund target, investment horizon, and planned
  major purchases.
- **Feedback and waitlist.** The area, type, and message you submit through the feedback form,
  and your email address and requested feature if you join a waitlist.
- **Preferences.** Reminder schedule, timezone, currency, and notification settings.

### 2.2 Information we calculate

These are derived from the data above and stored so your dashboard can load:

- Net worth
- Debt ratio
- Savings rate
- Emergency fund coverage in months
- Financial health score and your previous score, so we can show change over time

### 2.3 Information collected automatically

- **Push notification subscription.** If you enable notifications, we store your push service
  endpoint, its cryptographic keys, and your browser's user agent string.
- **In-app notifications and reminder deliveries.** Reminders you have scheduled and the record
  of whether each was delivered.

### 2.4 Information from our hosting and network providers

Our hosting provider, Vercel, and our application delivery network process technical
connection data in order to serve the App securely. This may include your IP address, browser
and device type, request timestamps, referring page, and error logs. We do not use this
information to build advertising profiles, and we do not run third-party advertising or
cross-site tracking on the App.

### 2.5 What we do not collect

- No bank account credentials, card numbers, or transaction histories imported from your bank.
  You enter figures yourself.
- No government identification numbers.
- No biometric templates. Biometric unlock uses your device's credential store and the
  credential never leaves your device.
- No advertising identifiers.

### 2.6 Data stored on your device only

Some data never reaches our servers. It exists in your browser's local storage and is removed
when you clear your browser data or uninstall the App:

- Your app-lock PIN, stored only as a salted hash
- Your device unlock credential, if you enable biometric unlock
- Your last activity timestamp and current lock state
- Dismissal flags for install and notification prompts

---

## 3. How we use your information

We use your information to:

1. Create and authenticate your account and keep it secure.
2. Display your dashboard, briefing, health score, net worth, and financial position.
3. Calculate budgets, savings rates, projections, and goal progress.
4. Generate plain-language explanations of your financial position using AI, grounded in your
   own data.
5. Analyse stocks and market data you ask about, using market prices from third-party providers.
6. Send the reminders and notifications you have configured, including scheduled budget
   reminders delivered by web push.
7. Respond to your feedback and support requests.
8. Detect fraud, abuse, and security incidents, and maintain the reliability of the service.
9. Meet our legal and tax obligations as a business.

We do not use your personal information for advertising. We do not sell or rent your data to
anyone. We do not use your financial data to train general-purpose AI models.

### Legal bases at a glance

| Purpose | Basis |
| --- | --- |
| Operating your account and storing your financial data | Contract |
| Generating AI explanations and analysis | Legitimate interests |
| Contract |
| Reminders and notifications | Legitimate interests |
| Fraud detection and security | Legitimate interests |
| Legal and tax compliance | Legal obligation |

---

## 4. How AI features use your data

Some features use Google's Gemini models through the Google AI API.

**What is sent.** When you request an AI explanation, we send the specific context needed to
answer your question: parts of your financial profile, your health score or net worth
calculation, relevant goals, and the current market data for the stock you asked about. We send
only what the request requires. We do not send your full transaction history unless a request
genuinely depends on it.

**What is not sent.** Your account credentials are never included in AI context.

**Retention.** Prompts and responses are processed to generate your answer. We do not retain a
history of your AI conversations in our database and we do not build a profile of you from them.
Market data from our data providers is public information and contains nothing about you.

**Training.** We do not use your data to train AI models. Google does not use data submitted
through the paid Gemini API to train its models.

**Nature of the output.** AI output is generated. It can be incomplete or wrong. It is
educational, not advice, and it does not predict prices or guarantee returns. Deterministic
calculations such as net worth, savings rate, and health score are computed in software, not by
the model, and the AI explains those figures rather than generating them.

### Market data providers

Stock prices, ratios, and company information come from third-party providers including
Finnhub, KoboTerminal, Oanor, and NGN Market. These requests transmit the stock symbol you
searched for. They do not transmit your identity or your financial profile.

---

## 5. Payments

Payments are processed by Paystack. We never see or store your card or bank account
number.

When you pay, Paystack sends us a webhook containing your email address, the amount, the
currency, and a transaction reference. We store these in our enrollment record, matched to your
email address, along with your name if you provided one at checkout, so we can confirm your
payment.

Paystack processes your payment details under its own privacy policy. We are not responsible
for their handling of your payment credentials.

We retain enrollment and payment records for as long as the law requires us to keep them for
tax and accounting purposes, even after you close your FOS·AI account.

---

## 6. How we share your information

We do not sell, trade, or rent your personal or financial data.

We share data only in these circumstances:

**Service providers**, each bound by contract and limited to the work we ask of them:

| Provider | Role | Data involved |
| --- | --- | --- |
| Supabase | Hosting, database, authentication | Account and financial data |
| Vercel | Application hosting and delivery | Connection and log data (§2.4) |
| Paystack | Payment processing | Payment details, then email, amount, reference |
| Google (Gemini API) | AI generation | Context for the specific request (§4) |
| Vercel AI SDK | AI provider abstraction | Passes to Gemini; adds no storage |
| Finnhub, KoboTerminal, Oanor, NGN Market | Market data | Stock symbol searched |

**Legal requirement.** Where we are required by law, regulation, or valid legal process, we
will disclose data. Where permitted, we will notify you before doing so unless prohibited.

**Safety.** To protect the rights, property, or safety of FOS·AI, our users, or the public.

**Business transfer.** In a merger, acquisition, or sale of assets, we will give notice before
your information becomes subject to a different policy.

**At your direction.** When you ask us to do something with your data, such as exporting it.

---

## 7. Your rights and how to exercise them

You have the following rights:

| Right | What it means | How to exercise it |
| --- | --- | --- |
| **Access** | See the personal data we hold about you | View it in the App, or request it by email |
| **Correction** | Have inaccurate data fixed | Edit it in the App, or request it by email |
| **Deletion** | Have your account and data erased | **[FEATURE PENDING — see Appendix A]** |
| **Portability** | Receive your data in a structured, machine-readable format | **[FEATURE PENDING — see Appendix A]** |
| **Rectification of processing** | Ask us to pause or limit how we use your data | Email `fosai@betiangli.xyz` |
| **Objection** | Object to processing based on legitimate interests, including AI explanation features | Email `fosai@betiangli.xyz` |
| **Withdraw consent** | Withdraw consent where you gave it | Email `fosai@betiangli.xyz` |
| **Complaint** | Complain to a supervisory authority | Contact the Nigeria Data Protection Commission, or your local authority if you are in the EEA |

To make a request, email `fosai@betiangli.xyz` with the subject line "Data rights request" and
the email address on your account. We will verify your identity before acting, so that no one
else can request your data.

**Response time.** We respond to verified requests within `[30]` days. If a request is complex
we will tell you and agree an extension.

**No fee.** We do not charge for a reasonable rights request. We may refuse a manifestly
unfounded or excessive request, and we will explain why.

**Deletion.** When your account is deleted, we remove or anonymise your personal data within
`[30]` days. Exceptions where we must retain data:

- Payment and enrollment records, retained as long as tax and accounting law requires
- Records needed to establish or defend legal claims
- Data we must retain to comply with a legal order

**Portability.** When you request a copy, we provide your profile, transactions, accounts,
budgets, goals, and settings as `[CSV / JSON]` files by email.

---

## 8. Security

FOS·AI is a tool for organising your own financial figures. We take the protection of your
data seriously.

**Technical measures in place:**

- Encryption in transit using TLS across all connections
- Encryption at rest by our database and hosting providers
- Row-level security policies in the database, so a query for your data returns your data and
  cannot return another user's
- Password hashing performed by our authentication provider; we never store readable passwords
- Row-level access control on every user data table
- Server-side authorisation checks on every request that reads or writes your financial data
- Restricted access to production systems for the operator

**Data minimisation.** The AI layer sends only the context a request requires, not your entire
profile. Biometric credentials and your app-lock PIN are never transmitted to us.

**Your responsibility.** FOS·AI contains your complete financial picture. Keep your password
confidential, use a strong one, and enable the app lock on devices others can access. If you
believe your account has been compromised, email `fosai@betiangli.xyz` immediately.

**Limits.** No system is perfectly secure. If a breach affects your data, we will notify you
and the relevant supervisory authority as required by law.

---

## 9. Data retention

| Data | Retained until |
| --- | --- |
| Account and authentication data | Account deletion |
| Financial profile, transactions, accounts, budgets, goals | Account deletion |
| Calculated metrics and health scores | Account deletion |
| Reminders, notifications, push subscriptions | Account deletion |
| Feedback | `[12]` months after submission |
| Waitlist entries | Until you reach the waitlist or ask us to remove you |
| As long as tax and accounting law requires |
| Security and error logs | `[90]` days |


---

## 10. International transfers

Some of our providers process data outside Nigeria. Supabase, Vercel, Paystack, and Google
operate infrastructure in other countries, which means your data may be processed in the
United States, the European Economic Area, or elsewhere.

Where data leaves Nigeria, we rely on an appropriate transfer mechanism. Where the GDPR applies,
this includes adequacy decisions or standard contractual clauses. You may request information
about the safeguards we use by emailing `fosai@betiangli.xyz`.

---

## 11. Children's privacy

FOS·AI is not intended for anyone under 18. Onboarding asks for your age, and we do not
provide accounts to children.

We do not knowingly collect personal information from children. If you believe a child has
created an account or provided us with personal data, email `fosai@betiangli.xyz` and we will
delete it.

---

## 12. Cookies and local storage

**Cookies.** FOS·AI uses cookies that are strictly necessary to keep you signed in. They store
your session and nothing else. Because the App has no advertising, no analytics, and no
third-party marketing cookies, no consent banner is required for them.

**Local storage.** As described in §2.6, your app-lock PIN hash, biometric credential, and
interface preferences are stored in your browser and never transmitted to us.

**Offline cache.** The App uses a service worker to cache application resources so the interface
loads while offline. The cache holds application files, not your financial data.

---

## 13. Changes to this policy

We may update this policy as the App changes or the law does. We will update the "Last updated"
date at the top and, for changes that materially affect how we use your data, notify you in the
App before the change takes effect.

Continuing to use the App after a change means you accept the updated policy.

---

## 14. Contact us

Questions about this policy, or to exercise any right in §7:

**Privacy contact**
Prosper Betiang
`fosai@betiangli.xyz`

**Data protection authority (Nigeria):**
Nigeria Data Protection Commission
`[FIND CURRENT ADDRESS AND URL BEFORE PUBLISHING]`

If you are in the European Economic Area and are unsatisfied with our response, you may complain
to your local supervisory authority.

---

## Appendix A — implementation checklist

These are obligations this policy makes. Each must be true before publication, or the
corresponding text must be removed.

| # | Obligation | Status |
| --- | --- | --- |
| 1 | In-App account deletion that erases or anonymises all user data | Not built |
| 2 | In-App data export producing CSV/JSON of profile, transactions, accounts, budgets, goals, settings | Not built |
| 3 | Documented deletion runbook covering what is hard-deleted and what is anonymised | Not built |
| 4 | A real, monitored `privacy@fos-ai.app` mailbox | Verify |
| 5 | Response SLA process for rights requests | To define |
| 6 | Backup retention and deletion propagation verified | Verify |
| 7 | Retention job for feedback, logs, and waitlist entries | Not built |
| 8 | Standard contractual clauses confirmed current with Supabase, Vercel, Paystack, Google | Verify |

## Appendix B — subprocessor inventory

Review quarterly and when any provider changes.

| Provider | Category | Data | Region | DPA in place |
| --- | --- | --- | --- | --- |
| Supabase | Hosting, database, auth | Account, financial data | `[VERIFY]` | `[VERIFY]` |
| Vercel | Hosting, CDN | Connection data, logs | `[VERIFY]` | `[VERIFY]` |
| Paystack | Payments | Payment details, email, amount, reference | Nigeria | `[VERIFY]` |
| Google (Gemini API) | AI inference | Request context (§4) | `[VERIFY]` | `[VERIFY]` |
| Finnhub | Market data | Stock symbol | United States | `[VERIFY]` |
| KoboTerminal | Market data | Stock symbol | `[VERIFY]` | `[VERIFY]` |
| Oanor | Market data | Stock symbol | `[VERIFY]` | `[VERIFY]` |
| NGN Market | Market data | Stock symbol | `[VERIFY]` | `[VERIFY]` |

## Appendix C — audit trail

Existing text removed from `src/app/privacy/page.tsx` and why:

| Removed claim | Reason |
| --- | --- |
| "Usage Data: pages visited, features used, timestamps, interaction patterns" | No analytics or telemetry exists in the codebase |
| "Device Information: ... device identifiers" | No such collection exists; Vercel network logs are now disclosed in §2.4 instead |
| "Regular security audits and monitoring" | Cannot be substantiated; removed pending evidence |
| "Row-level security policies" (live §4) | Kept — verified in `20260722000001_money_manager.sql`, `20260909000001_create_feedback.sql`, and others |
| "Secure authentication with encrypted session tokens" (live §4) | Kept — Supabase auth |
| "AI insights are not stored beyond your session" | Replaced with the more precise §4, which states what is sent and what is retained |
| "No governing law named" | NDPA 2023 and GDPR now cited in §1 |
| "FOS·AI" as sole controller | Replaced with a named controller and address |
| No mention of payments, push, feedback, waitlist, local storage, cookies | All added |