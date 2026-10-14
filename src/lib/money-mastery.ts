export type CourseTier = "course" | "course_fosai";

export type TierConfig = {
  id: CourseTier;
  name: string;
  tagline: string;
  /** Amount in kobo. */
  amount: number;
  displayPrice: string;
  features: string[];
  featured: boolean;
  badge?: string;
  note: string;
};

export const COURSE_TIERS: TierConfig[] = [
  {
    id: "course",
    name: "Money Mastery Code",
    tagline: "The course",
    amount: 1_500_000,
    displayPrice: "\u20a615,000",
    features: [
      "All 8 recorded lectures, about 1 hour each",
      "The Money Making, Management and Multiplication codes",
      "Course slides for quick reference on every lecture",
      "The Selling Code bonus module",
      "Access to the support WhatsApp community",
      "Future updates to the course, at no extra cost",
      "Lifetime access to the course material",
    ],
    featured: false,
    note: "One payment. Yours for good.",
  },
  {
    id: "course_fosai",
    name: "Money Mastery Code + FOS\u00b7AI",
    tagline: "The complete system",
    amount: 2_300_000,
    displayPrice: "\u20a623,000",
    features: [
      "Everything in the course",
      "Permanent FOS\u00b7AI access, the financial operating system behind the principles",
      "Accounts, transactions and budgets in one workspace",
      "A financial health score built from your own numbers",
      "All 9 calculators, from compound interest to PAYE",
      "AI stock research on NGX and US markets",
      "Every FOS\u00b7AI capability released from now on, at no extra cost",
    ],
    featured: true,
    badge: "Most complete",
    note: "The course teaches it. FOS\u00b7AI is where you run it.",
  },
];

export function getTier(id: string | null | undefined): TierConfig | undefined {
  if (!id) return undefined;
  return COURSE_TIERS.find((tier) => tier.id === id);
}

export function formatNaira(amountInKobo: number): string {
  return `\u20a6${(amountInKobo / 100).toLocaleString("en-NG")}`;
}

/**
 * Where buyers are sent to watch the lectures.
 *
 * The recordings currently live on Google Drive. Set COURSE_ACCESS_URL once the
 * Drive folder is fronted by a custom domain. While it is unset the success page
 * hides its "open your lectures" button rather than linking somewhere wrong.
 */
export function getCourseAccessUrl(): string | null {
  const value = process.env.COURSE_ACCESS_URL?.trim();
  return value ? value : null;
}