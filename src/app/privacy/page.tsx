import { BackButton } from "./BackButton";

export const metadata = {
  title: "Privacy Policy — FOS·AI",
  description:
    "How FOS·AI collects, uses, and protects your personal and financial data.",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-1)",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <BackButton />

        <h1
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "1.875rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
            marginBottom: "8px",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: "36px",
          }}
        >
          Effective 13 October 2026
        </p>

        <Card>
          <Section title="1. Who we are" id="who-we-are">
            <P>
              This policy explains how Prosper Betiang (&ldquo;FOS&middot;AI,&rdquo;{" "}
              <em>we</em>, <em>us</em>, or <em>our</em>), the data controller, collects, uses,
              shares, and protects your personal information when you use FOS&middot;AI
              (the &ldquo;App&rdquo;) at fos-ai.app.
            </P>
            <P>
              FOS&middot;AI is a financial planning tool. It helps you organise and calculate with
              information you provide. It is not a bank, a broker, or a licensed financial
              adviser, and it does not connect to your bank accounts.
            </P>
            <DefinitionList
              items={[
                ["Data controller", "Prosper Betiang"],
                ["Privacy contact", "privacy@fos-ai.app"],
                ["Country of establishment", "Nigeria"],
              ]}
            />
            <Subheading>Scope</Subheading>
            <P>
              This policy covers the FOS&middot;AI app at fos-ai.app and nothing else. The
              course sales pages are a separate property at a different address, operated by
              the same person, and are described in section 15. They are kept separate
              deliberately: the App carries no advertising and no analytics, and that stays
              true of it precisely because they are not part of this policy.
            </P>
            <P>
              This policy also does not cover third-party websites we link to, including
              payment providers and market data sources, which have their own policies.
            </P>
            <Subheading>Legal basis</Subheading>
            <P>
              We process personal data on the following bases, under the Nigeria Data Protection
              Act 2023 (NDPA) and, where it applies to you, the GDPR.
            </P>
            <Table
              head={["Processing activity", "Legal basis"]}
              rows={[
                ["Creating and operating your account", "Performance of a contract"],
                ["Storing your financial profile, transactions, budgets, and goals", "Performance of a contract"],
                ["Calculating health scores, net worth, and projections", "Performance of a contract"],
                ["Processing a payment you have authorised", "Performance of a contract"],
                ["Generating AI explanations and stock analysis", "Legitimate interests"],
                ["Sending service and reminder notifications", "Legitimate interests"],
                ["Detecting fraud and abuse", "Legitimate interests"],
                ["Responding to support requests", "Legitimate interests"],
                ["Meeting legal and tax obligations", "Legal obligation"],
              ]}
            />
            <P>
              Where we rely on legitimate interests you have the right to object. See section 7.
            </P>
          </Section>

          <Section title="2. Information we collect" id="what-we-collect">
            <P>
              We collect only what we need to operate a financial planning tool. We do not
              collect information about your race, religion, health, political opinions, sexual
              orientation, or biometric identifiers. If you use biometric unlock, that
              credential is generated and stored on your device only — we never receive it.
            </P>

            <Subheading>2.1 Information you provide</Subheading>
            <Bullets
              items={[
                { label: "Account information.", text: "Email address and password. Your password is hashed by our authentication provider and is never stored or transmitted by us in readable form. Your name is collected during onboarding if you choose to provide it." },
                { label: "Financial profile.", text: "Age, country, currency, employment status, income and income frequency, monthly living expenses, debt repayments, savings, and other income." },
                { label: "Balance sheet.", text: "Total cash, investments, retirement accounts, property value, business ownership, other assets, and each category of debt (credit card, personal loan, student loan, mortgage, car loan, other)." },
                { label: "Risk assessment.", text: "Your answers to the risk questionnaire, the resulting risk score, and your risk profile." },
                { label: "Transactions.", text: "Amounts, descriptions, dates, categories, notes, and tags for every transaction you log." },
                { label: "Accounts and institutions.", text: "Account names, types, balances, currencies, and the financial institution each account belongs to. Institution names are typed by you; we have no connection to any financial institution." },
                { label: "Budgets and goals.", text: "Monthly budget amounts per category, savings goal targets and progress, retirement age target, emergency fund target, investment horizon, and planned major purchases." },
                { label: "Payments.", text: "Email address, amount, currency, and a payment reference, if you buy something from us. See section 5." },
                { label: "Feedback and waitlist.", text: "The area, type, and message you submit through the feedback form, and your email address and requested feature if you join a waitlist." },
                { label: "Preferences.", text: "Reminder schedule, timezone, currency, and notification settings." },
              ]}
            />

            <Subheading>2.2 Information we calculate</Subheading>
            <P>
              These are derived from the data above and stored so your dashboard can load: net
              worth, debt ratio, savings rate, emergency fund coverage in months, and your
              financial health score alongside your previous score.
            </P>

            <Subheading>2.3 Information collected automatically</Subheading>
            <Bullets
              items={[
                { label: "Push notification subscription.", text: "If you enable notifications we store your push service endpoint, its cryptographic keys, and your browser's user agent string." },
                { label: "In-app notifications and reminder deliveries.", text: "The reminders you have scheduled and whether each was delivered." },
              ]}
            />

            <Subheading>2.4 Information from our hosting provider</Subheading>
            <P>
              Our hosting provider, Vercel, processes technical connection data in order to
              serve the App securely. This may include your IP address, browser and device type,
              request timestamps, referring page, and error logs. We do not use it to build
              advertising profiles, and we run no third-party advertising or cross-site
              tracking on the App.
            </P>

            <Subheading>2.5 What we do not collect</Subheading>
            <Bullets
              items={[
                "No bank credentials, card numbers, or transaction histories imported from your bank. You enter figures yourself.",
                "No government identification numbers.",
                "No biometric templates. Biometric unlock uses your device's credential store and the credential never leaves your device.",
                "No advertising identifiers.",
              ]}
            />

            <Subheading>2.6 Data stored on your device only</Subheading>
            <P>
              Some data never reaches our servers. It lives in your browser&rsquo;s local storage and
              is removed when you clear browser data or uninstall the App: your app-lock PIN
              (stored only as a salted hash), your device unlock credential, your last activity
              timestamp and lock state, and dismissal flags for install and notification prompts.
            </P>
          </Section>

          <Section title="3. How we use your information" id="how-we-use-it">
            <NumberedList
              items={[
                "Create and authenticate your account and keep it secure.",
                "Display your dashboard, briefing, health score, net worth, and financial position.",
                "Calculate budgets, savings rates, projections, and goal progress.",
                "Generate plain-language explanations of your position using AI, grounded in your own data.",
                "Analyse the stocks you ask about, using market prices from third-party providers.",
                "Send the reminders and notifications you have configured, including scheduled budget reminders delivered by web push.",
                "Process payments you have authorised and provide what you purchased.",
                "Respond to your feedback and support requests.",
                "Detect fraud, abuse, and security incidents, and maintain the reliability of the service.",
                "Meet our legal and tax obligations as a business.",
              ]}
            />
            <Callout tone="info">
              We do not use your personal information for advertising. We do not sell or rent
              your data to anyone. We do not use your financial data to train general-purpose AI
              models.
            </Callout>
          </Section>

          <Section title="4. How AI features use your data" id="ai">
            <P>
              Some features use Google&rsquo;s Gemini models through the Google AI API. Here is exactly
              what that involves.
            </P>
            <Subheading>What is sent</Subheading>
            <P>
              When you request an AI explanation we send the specific context needed to answer
              your question: parts of your financial profile, your health score or net worth
              calculation, relevant goals, and current market data for the stock you asked about.
              We send only what the request requires. We do not send your full transaction
              history unless a request genuinely depends on it.
            </P>
            <Subheading>What is not sent</Subheading>
            <P>
              Your account credentials and your payment records are never included in AI
              context.
            </P>
            <Subheading>Retention</Subheading>
            <P>
              Prompts and responses are processed to generate your answer. We do not retain a
              history of your AI conversations in our database and we do not build a profile of
              you from them.
            </P>
            <Subheading>Training</Subheading>
            <P>
              We do not use your data to train AI models. Google does not use data submitted
              through the paid Gemini API to train its models.
            </P>
            <Subheading>Market data providers</Subheading>
            <P>
              Stock prices, ratios, and company information come from third-party providers
              including Finnhub, KoboTerminal, Oanor, and NGN Market. These requests transmit the
              stock symbol you searched for. They do not transmit your identity or your
              financial profile.
            </P>
            <Callout tone="warn">
              AI output is generated. It can be incomplete or wrong. It is educational, not
              advice, and it does not predict prices or guarantee returns. Deterministic
              calculations such as net worth, savings rate, and health score are computed in
              software, not by the model — the AI explains those figures rather than generating
              them.
            </Callout>
          </Section>

          <Section title="5. Payments" id="payments">
            <P>
              Payments are processed by Paystack. We never see or store your card or bank account
              number.
            </P>
            <P>
              When you pay, Paystack sends us your email address, the amount, the currency, and a
              transaction reference. We store these so we can confirm the payment and provide
              what you purchased. Paystack processes your payment details under its own privacy
              policy, and we are not responsible for their handling of your payment credentials.
            </P>
            <P>
              We retain payment records for as long as tax and accounting law requires, even
              after you close your FOS&middot;AI account.
            </P>
          </Section>

          <Section title="6. How we share your information" id="sharing">
            <P>
              We do not sell, trade, or rent your personal or financial data. We share data only
              in these circumstances.
            </P>
            <Subheading>Service providers</Subheading>
            <P>
              Each provider is bound by contract and limited to the work we ask of them.
            </P>
            <Table
              head={["Provider", "Role", "Data involved"]}
              rows={[
                ["Supabase", "Hosting, database, authentication", "Account and financial data"],
                ["Vercel", "Application hosting and delivery", "Connection and log data (2.4)"],
                ["Paystack", "Payment processing", "Payment details, then email, amount, reference"],
                ["Google (Gemini API)", "AI generation", "Context for the specific request (4)"],
                ["Finnhub, KoboTerminal, Oanor, NGN Market", "Market data", "Stock symbol searched"],
              ]}
            />
            <Subheading>Legal requirement</Subheading>
            <P>
              Where we are required by law, regulation, or valid legal process we will disclose
              data. Where permitted we will notify you beforehand unless prohibited.
            </P>
            <Subheading>Safety</Subheading>
            <P>
              To protect the rights, property, or safety of FOS&middot;AI, our users, or the
              public.
            </P>
            <Subheading>Business transfer</Subheading>
            <P>
              In a merger, acquisition, or sale of assets we will give notice before your
              information becomes subject to a different policy.
            </P>
            <Subheading>At your direction</Subheading>
            <P>When you ask us to do something with your data, such as exporting it.</P>
          </Section>

          <Section title="7. Your rights" id="your-rights">
            <Table
              head={["Right", "What it means", "How to exercise it"]}
              rows={[
                ["Access", "See the personal data we hold about you", "View it in the App, or request it by email"],
                ["Correction", "Have inaccurate data fixed", "Edit it in the App, or request it by email"],
                ["Deletion", "Have your account and data erased", "Settings, or email us"],
                ["Portability", "Receive your data in a machine-readable format", "Settings, or email us"],
                ["Restriction", "Ask us to pause or limit how we use your data", "Email privacy@fos-ai.app"],
                ["Objection", "Object to processing based on legitimate interests, including AI features", "Email privacy@fos-ai.app"],
                ["Withdraw consent", "Withdraw consent where you gave it", "Email privacy@fos-ai.app"],
                ["Complaint", "Complain to a supervisory authority", "Contact the Nigeria Data Protection Commission, or your local authority in the EEA"],
              ]}
            />
            <P>
              Deletion and data download are self-service in Settings. For anything else, or if
              you cannot access your account, email{" "}
              <Mono>privacy@fos-ai.app</Mono> with the subject line &ldquo;Data rights
              request&rdquo; and the email address on your account. We will verify your identity
              before acting, so that no one else can request your data.
            </P>
            <P>
              We respond to verified requests within 30 days. If a request is complex we will tell
              you and agree an extension. We do not charge for a reasonable request. We may
              refuse a manifestly unfounded or excessive request, and we will explain why.
            </P>
            <Subheading>Deletion</Subheading>
            <P>
              You can delete your account at any time from Settings, without emailing us. The App
              asks you to confirm with your password and the word DELETE, so that a stolen
              session alone cannot erase your records.
            </P>
            <P>
              Deletion happens immediately and cannot be undone. It removes your profile, risk
              assessment, transactions, accounts, categories, budgets, goals, reminders,
              notifications, push subscriptions, and feedback in a single operation. If any part
              of that fails, nothing is deleted.
            </P>
            <P>
              Two things survive. We keep payment and transaction records as long as tax and
              accounting law requires, and we sever their link to your account so the retained
              record no longer points at you. We also keep records needed to establish or defend
              a legal claim, and any data required to comply with a legal order.
            </P>
            <Subheading>Portability</Subheading>
            <P>
              You can download your data at any time from Settings, without emailing us. Choose
              &ldquo;Download everything&rdquo; for a single JSON file containing your profile,
              transactions, accounts, budgets, goals, settings, and feedback, or take one table
              at a time as CSV for a spreadsheet.
            </P>
            <P>
              Exports are generated on demand and are not stored by us. Once you download the
              file, it is yours and it is your responsibility.
            </P>
          </Section>

          <Section title="8. Security" id="security">
            <P>
              FOS&middot;AI contains your complete financial picture, so we take the protection
              of your data seriously.
            </P>
            <Subheading>Technical measures in place</Subheading>
            <Bullets
              items={[
                "Encryption in transit using TLS across all connections.",
                "Encryption at rest by our database and hosting providers.",
                "Row-level security policies in the database, so a query for your data returns your data and cannot return another user's.",
                "Password hashing performed by our authentication provider; we never store readable passwords.",
                "Row-level access control on every user data table.",
                "Server-side authorisation checks on every request that reads or writes your financial data.",
                "Restricted access to production systems for the operator.",
              ]}
            />
            <Subheading>Data minimisation</Subheading>
            <P>
              The AI layer sends only the context a request requires, not your entire profile.
              Biometric credentials and your app-lock PIN are never transmitted to us.
            </P>
            <Subheading>Your responsibility</Subheading>
            <P>
              Keep your password confidential, use a strong one, and enable the app lock on
              devices others can access. If you believe your account has been compromised, email{" "}
              <Mono>privacy@fos-ai.app</Mono> immediately.
            </P>
            <Callout tone="warn">
              No system is perfectly secure. If a breach affects your data we will notify you
              and the relevant supervisory authority as required by law.
            </Callout>
          </Section>

          <Section title="9. How long we keep your data" id="retention">
            <Table
              head={["Data", "Retained until"]}
              rows={[
                ["Account and authentication data", "Account deletion"],
                ["Financial profile, transactions, accounts, budgets, goals", "Account deletion"],
                ["Calculated metrics and health scores", "Account deletion"],
                ["Reminders, notifications, push subscriptions", "Account deletion"],
                ["Feedback", "12 months after submission"],
                ["Waitlist entries", "Until you reach the waitlist or ask us to remove you"],
                ["Payment and transaction records", "As long as tax and accounting law requires"],
                ["Security and error logs", "90 days"],
              ]}
            />
            <P>
              Deleting your account does not delete your payment records, which we are required
              to keep for tax and accounting purposes. Those records are unlinked from your
              deleted account. If you want them removed too, email us — though we may be
              required to retain them.
            </P>
          </Section>

          <Section title="10. International transfers" id="transfers">
            <P>
              Some of our providers process data outside Nigeria. Supabase, Vercel, Paystack, and
              Google operate infrastructure in other countries, which means your data may be
              processed in the United States, the European Economic Area, or elsewhere.
            </P>
            <P>
              Where data leaves Nigeria we rely on an appropriate transfer mechanism. Where the
              GDPR applies this includes adequacy decisions or standard contractual clauses. You
              may request information about the safeguards we use by emailing us.
            </P>
          </Section>

          <Section title="11. Children's privacy" id="children">
            <P>
              FOS&middot;AI is not intended for anyone under 18. Onboarding asks for your age,
              and we do not provide accounts to children. We do not knowingly collect personal
              information from children. If you believe a child has created an account or
              provided us with personal data, email us and we will delete it.
            </P>
          </Section>

          <Section title="12. Cookies and local storage" id="cookies">
            <P>
              FOS&middot;AI uses cookies that are strictly necessary to keep you signed in. They
              store your session and nothing else. Because the App has no advertising, no
              analytics, and no third-party marketing cookies, no consent banner is required.
            </P>
            <P>
              This is true of the App alone. The sales pages described in section 15 are a
              different property and are not covered by this section.
            </P>
            <P>
              As described in 2.6, your app-lock PIN hash, biometric credential, and interface
              preferences are stored in your browser and never transmitted to us.
            </P>
            <P>
              The App uses a service worker to cache application resources so the interface loads
              while offline. The cache holds application files, not your financial data.
            </P>
          </Section>

          <Section title="13. Changes to this policy" id="changes">
            <P>
              We may update this policy as the App changes or the law does. We will update the
              date at the top and, for changes that materially affect how we use your data,
              notify you in the App before the change takes effect. Continuing to use the App
              after a change means you accept the updated policy.
            </P>
          </Section>

          <Section title="14. Contact us" id="contact">
            <P>
              Questions about this policy, or to exercise any right in section 7:
            </P>
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-xs)",
                background: "var(--accent-soft)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)" }}>
                Prosper Betiang
              </p>
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono-family)" }}>
                <Mono>privacy@fos-ai.app</Mono>
              </p>
            </div>
            <P>
              If you are in the European Economic Area and are unsatisfied with our response, you
              may complain to your local supervisory authority.
            </P>
          </Section>

          <Section title="15. The course sales pages" id="sales-pages">
            <P>
              This section is the privacy notice for the Money Mastery Code sales pages, served
              at mmc.betiangli.xyz. Those pages are a separate property, are operated by the same
              person, and are outside sections 1 to 14 of this policy. This section is the whole
              of their notice.
            </P>

            <Subheading>What they collect</Subheading>
            <P>
              The sales pages exist to sell one course and, with it, access to the FOS&middot;AI
              app. They collect what you type into the checkout form, which is your name, your
              email address, and which of the two packages you chose. Nothing else is asked of
              you.
            </P>
            <P>
              A record is written the moment you start a checkout, so that a purchase which is
              not completed is still visible to us as an unfinished attempt. If you abandon one,
              we keep your name, email address, and the package you were looking at, and use it
              only to send you follow-up emails about that purchase.
            </P>

            <Subheading>Cookies they set</Subheading>
            <Table
              head={["Cookie", "Purpose", "Duration"]}
              rows={[
                ["mmc_variant", "Keeps you on the same version of the page between visits, so the A/B test compares like with like. First-party, never shared, never used to identify you.", "90 days"],
              ]}
            />
            <P>
              There are no advertising cookies on the sales pages at present, and no consent
              banner is shown because none is required for what they do today.
            </P>

            <Subheading>Who processes what</Subheading>
            <Table
              head={["Provider", "Role", "Data involved"]}
              rows={[
                ["Vercel", "Hosting and delivery of the page", "Connection and log data"],
                ["Paystack", "Payment processing", "Payment details, then your email address, the amount, and a transaction reference"],
                ["Supabase", "Our database", "Your name, email address, and what you bought"],
                ["Zoho Mail", "Sending your confirmation email", "Your name, email address, and order details"],
                ["Make.com", "Passing a completed purchase to that email system", "Your name, email address, and order details"],
              ]}
            />

            <Subheading>Retention</Subheading>
            <P>
              Completed purchases are kept as a sales and tax record for as long as tax and
              accounting law requires, and are deleted or anonymised on request.
            </P>
            <P>
              Unfinished checkouts are deleted after 90 days. After that they are not used and
              not contacted.
            </P>

            <Subheading>Your choices</Subheading>
            <P>
              You can ask what we hold about you, have it corrected, or have it erased by
              emailing the address in section 14. If you would rather not be contacted about an
              unfinished checkout, say so in that email and we will close it immediately and
              stop.
            </P>
          </Section>
        </Card>

        <p
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-3)",
          }}
        >
          <a href="/login" style={{ color: "var(--text-2)", textDecoration: "none" }}>
            Back to sign in
          </a>
        </p>
      </div>
    </main>
  );
}

/* ── Layout ─────────────────────────────────────────────────────── */

const body: React.CSSProperties = {
  fontSize: "0.875rem",
  lineHeight: 1.75,
  color: "var(--text-2)",
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--glass-border)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        boxShadow: "var(--shadow-card)",
        padding: "clamp(24px, 5vw, 40px)",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        ...body,
      }}
    >
      {children}
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: "24px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display-family)",
          fontSize: "1.0625rem",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "var(--text-1)",
          margin: "0 0 14px",
          paddingBottom: "10px",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </section>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--font-display-family)",
        fontSize: "0.9375rem",
        fontWeight: 600,
        color: "var(--text-1)",
        margin: "10px 0 0",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0 }}>{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "var(--font-mono-family)", color: "var(--accent)" }}>
      {children}
    </span>
  );
}

/** A bullet is either plain text or a bolded lead-in followed by explanation. */
type Bullet = string | { label: string; text: string };

function Bullets({ items }: { items: Bullet[] }) {
  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ color: "var(--text-2)" }}>
          {typeof item === "string" ? (
            item
          ) : (
            <>
              <strong style={{ color: "var(--text-1)" }}>{item.label}</strong> {item.text}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol
      style={{
        margin: 0,
        paddingLeft: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        listStyleType: "decimal",
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ color: "var(--text-2)" }}>
          {item}
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div
      style={{
        margin: "4px 0",
        overflowX: "auto",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-xs)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
        <thead>
          <tr style={{ background: "var(--accent-softer)" }}>
            {head.map((cell, i) => (
              <th
                key={i}
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  fontWeight: 600,
                  color: "var(--text-1)",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--glass-border)",
              }}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 14px",
                    verticalAlign: "top",
                    color: j === 0 ? "var(--text-1)" : "var(--text-2)",
                    fontWeight: j === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DefinitionList({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <dl
      style={{
        margin: 0,
        padding: "14px 18px",
        borderRadius: "var(--radius-xs)",
        background: "var(--accent-softer)",
        border: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {items.map(([term, value], i) => (
        <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <dt
            style={{
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-3)",
              minWidth: "160px",
            }}
          >
            {term}
          </dt>
          <dd style={{ margin: 0, color: "var(--text-1)", fontWeight: 500 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
}) {
  const bg = tone === "warn" ? "var(--amber-soft)" : "var(--accent-soft)";
  const color = tone === "warn" ? "var(--amber)" : "var(--text-2)";
  const border = tone === "warn" ? "var(--amber)" : "var(--glass-border)";
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: "var(--radius-xs)",
        background: bg,
        borderLeft: `2px solid ${border}`,
        color,
        fontSize: "0.8125rem",
      }}
    >
      {children}
    </div>
  );
}