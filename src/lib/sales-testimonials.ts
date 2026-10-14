/**
 * Proof for the Money Mastery Code storefront.
 *
 * Verbatim WhatsApp messages from students, lightly trimmed for length.
 * The screenshots are the proof. Get these people's permission before publishing.
 *
 * Lives in lib rather than in the component because the storefront now has
 * two visual variants rendering the same proof, and they must never drift.
 */

export type SalesTestimonial = {
  image: string;
  alt: string;
  quote: string;
  name: string;
  context: string;
};

export const SALES_TESTIMONIALS: SalesTestimonial[] = [
  {
    image: "/IMG_20260218_232721.jpg",
    alt: "WhatsApp message about starting to invest with 100,000 naira in Treasury bills",
    quote: "I thought I needed to start with like 1mil. I started with 100k in T-bills and kept growing it.",
    name: "Started at ₦100k",
    context: "Broke the million-naira barrier",
  },
  {
    image: "/IMG_20260218_233658.jpg",
    alt: "WhatsApp message calling the pay yourself first rule a game changer",
    quote: "The 'pay yourself first' rule was a real game changer. It's serving as the seed for my investments.",
    name: "August",
    context: "Rule 101 turned into an investment",
  },
  {
    image: "/IMG-20260429-WA0016.jpg",
    alt: "WhatsApp screenshot of a Cowrywise growth portfolio showing a 28,189.84 naira gain",
    quote: "In January I made almost 30k. Some NG stocks are doing quite well.",
    name: "Victor Lawrence",
    context: "Cowrywise mutual funds, ₦28,189.84 gain",
  },
  {
    image: "/IMG_20260218_234158.jpg",
    alt: "WhatsApp message about splitting a job into several income streams",
    quote: "I've split my main job into several other branches that are serving as supplementary income streams.",
    name: "Built new streams",
    context: "One job became several",
  },
  {
    image: "/IMG_20260218_085530.jpg",
    alt: "WhatsApp message thanking Prosper after enrolling in Money Mastery Code",
    quote: "Funny how I enrolled through Kisha and you turned out to be the tutor.",
    name: "Maryam",
    context: "Came for a free webinar, stayed for the course",
  },
];