export type PlanId = "FREE" | "PLUS_MONTHLY";

export interface Plan {
  id: PlanId;
  name: string;
  price_inr: number;
  interval: "month";
  badge?: string;
  bestFor: string;
  headline: string;
  subtitle: string;
  features: string[];
  ctaText: string;
  footnote: string;
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
        "Type a question or upload a photo",
        "Step-by-step explanations",
        "3 explanation modes",
        "3 practice sets every month",
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
      interval: "month",
      badge: "UPGRADE",
      bestFor: "For everyday homework help",
      headline: "Plus",
      subtitle: "Everything a school student needs, every month.",
      ctaText: "Buy Now",
      highlighted: true,
      features: [
        "120 homework questions every month",
        "Upload photos and PDFs",
        "All 5 explanation modes",
        "\"I Still Don't Understand\" - fresh explanations",
        "Follow-up questions on any answer",
        "30 practice sets every month",
        "10 printable worksheets every month",
        "Full question history",
        "Maths, Science, English and Computer Science",
        "Class and board selection",
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