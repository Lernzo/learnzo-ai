/**
 * Pricing is defined here (not hardcoded in the UI) so it can later be
 * overridden at runtime from the admin_settings table without a redeploy.
 *
 * amount_inr is the amount CHARGED IN RUPEES (not paise).
 * The Razorpay adapter multiplies by 100 to get paise.
 */
export interface Plan {
  id: PlanId;
  name: string;
  price_inr: number;
  interval: "month" | "year";
  badge?: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_IDS = [
  "FREE",
  "PLUS_MONTHLY",
  "PLUS_YEARLY",
  "FAMILY_YEARLY"
] as const;

export type PlanId = typeof PLAN_IDS[number];

export const DEFAULT_PRICING = {
  currency: "INR" as const,
  plans: [
    {
      id: "FREE",
      name: "Free",
      price_inr: 0,
      interval: "month",
      tagline: "Try Learnzo before you upgrade",
      features: [
        "5 homework questions per month",
        "Step-by-step explanation and concept",
        "3 practice sets per month",
        "1 printable worksheet per month",
        "Full access to all 5 explanation modes"
      ]
    },
    {
      id: "PLUS_MONTHLY",
      name: "Learnzo Plus",
      price_inr: 99,
      interval: "month",
      tagline: "For regular homework help",
      features: [
        "400 questions per month",
        "200 practice sets per month",
        "60 printable worksheets per month",
        "Priority AI processing",
        "Everything in Free"
      ]
    },
    {
      id: "PLUS_YEARLY",
      name: "Learnzo Plus",
      price_inr: 799,
      interval: "year",
      badge: "Save 33%",
      tagline: "Best value for one student",
      highlighted: true,
      features: [
        "Everything in Plus Monthly",
        "2 months free compared to monthly",
        "Priority support"
      ]
    },
    {
      id: "FAMILY_YEARLY",
      name: "Family",
      price_inr: 1499,
      interval: "year",
      badge: "Up to 4 students",
      tagline: "For siblings",
      features: [
        "Everything in Plus Yearly",
        "Up to 4 student profiles",
        "Shared parent dashboard",
        "Priority support"
      ]
    }
  ] satisfies Plan[]
};

export function getPlan(id: string): Plan | null {
  return (DEFAULT_PRICING.plans as Plan[]).find((p) => p.id === id) ?? null;
}

/** Duration of a paid plan in days. Used for computing expires_at. */
export const PLAN_DURATIONS_DAYS: Record<string, number> = {
  PLUS_MONTHLY: 30,
  PLUS_YEARLY: 365,
  FAMILY_YEARLY: 365
};