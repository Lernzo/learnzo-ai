export type PlanId = "FREE" | "PLUS_MONTHLY";

export interface Plan {
  id: PlanId;
  name: string;
  price_inr: number;
  original_price_inr?: number;
  interval: "month";
  badge?: string;
  bestFor: string;
  headline: string;
  subtitle: string;
  features: string[];
  ctaText: string;
  footnote: string;
  limitedTimeOffer?: boolean;
  highlighted?: boolean;
}

export const PLAN_IDS: readonly PlanId[] = ["FREE", "PLUS_MONTHLY"] as const;

export const DEFAULT_PRICING = {
  currency: "INR" as const,
  plans: [
    {
      id: "FREE",
      name: "Free",
      price_inr: 0,
      interval: "month",
      bestFor: "Try before you pay",
      headline: "Start Free",
      subtitle: "See how Learnzo works before upgrading.",
      ctaText: "Start Free",
      features: [
        "10 homework questions every month",
        "Understand every step, not just the answer",
        "Photo upload and typed questions",
        "3 explanation modes",
        "5 practice sets every month",
        "1 printable worksheet every month",
        "Maths, Science and English",
        "No credit card required"
      ],
      footnote: "No credit card required."
    },
    {
      id: "PLUS_MONTHLY",
      name: "Plus",
      price_inr: 99,
      original_price_inr: 499,
      interval: "month",
      badge: "Get Unlimited Homework @99 only",
      bestFor: "For everyday homework help",
      headline: "Plus",
      subtitle: "Unlimited homework help for the whole month.",
      ctaText: "Get Unlimited Homework @99",
      highlighted: true,
      limitedTimeOffer: true,
      features: [
        "Unlimited homework questions every month",
        "Upload homework photos and PDFs",
        "Unlimited explanation modes",
        "\"I Still Don't Understand\" - a completely fresh explanation",
        "Unlimited practice sets every month",
        "Unlimited printable worksheets every month",
        "Unlimited questions & answers history",
        "Priority AI - faster answers",
        "Maths, Science, English and Computer Science",
        "Class and board selection",
        "No ads",
        "Everything in Free"
      ],
      footnote: "Rs. 99 for one month. No auto-renewal."
    }
  ] satisfies Plan[]
};

export function getPlan(id: string): Plan | null {
  return (DEFAULT_PRICING.plans as Plan[]).find((p) => p.id === id) ?? null;
}

export const PLAN_DURATIONS_DAYS: Record<string, number> = {
  PLUS_MONTHLY: 30
};