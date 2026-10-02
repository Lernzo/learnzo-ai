/**
 * Learnzo Analytics
 *
 * Fires events to any analytics providers that are configured via env vars.
 * If nothing is configured, every call is a no-op. This means the rest of
 * the app can call Analytics.track() freely without worrying about whether
 * GA4 / Meta Pixel are set up yet.
 *
 * Enabling providers:
 *   GA4:        set NEXT_PUBLIC_GA_ID        (e.g. G-XXXXXXXXXX)
 *   Meta Pixel: set NEXT_PUBLIC_META_PIXEL_ID (e.g. 1234567890)
 *
 * Both scripts are loaded in src/app/layout.tsx from the same env vars.
 */

export type AnalyticsEvent =
  | "page_view"
  | "view_content"
  | "cta_click"
  | "upload_started"
  | "upload_completed"
  | "question_recognized"
  | "ai_response_generated"
  | "explain_mode_used"
  | "practice_generated"
  | "pdf_generated"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "sign_out"
  | "free_usage_consumed"
  | "limit_reached"
  | "pricing_viewed"
  | "checkout_started"
  | "payment_successful"
  | "payment_failed"
  | "subscription_cancelled"
  | "feedback_submitted";

type Props = Record<string, unknown>;

interface GtagWindow extends Window {
  gtag?: (command: string, eventName: string, params?: Props) => void;
  fbq?: (...args: unknown[]) => void;
}

// Meta standard events that map to our custom names. Meta only understands
// its own event names, so we translate ours where a match exists.
const META_MAP: Partial<Record<AnalyticsEvent, string>> = {
  page_view: "PageView",
  view_content: "ViewContent",
  signup_completed: "CompleteRegistration",
  checkout_started: "InitiateCheckout",
  payment_successful: "Purchase",
  signup_started: "Lead"
};

export const Analytics = {
  /** Fire a custom event to every configured provider. */
  track(event: AnalyticsEvent, props: Props = {}) {
    if (typeof window === "undefined") return;
    const w = window as GtagWindow;

    // GA4
    if (typeof w.gtag === "function") {
      w.gtag("event", event, props);
    }

    // Meta Pixel â€” use standard name if we have one, else trackCustom.
    if (typeof w.fbq === "function") {
      const metaName = META_MAP[event];
      if (metaName) {
        w.fbq("track", metaName, props);
      } else {
        w.fbq("trackCustom", event, props);
      }
    }

    // Developer console log in non-production for easier debugging.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  },

  /** Fired by the layout on each route change. */
  pageView(path: string) {
    Analytics.track("page_view", { page_path: path });
  }
};

export type { Props as AnalyticsProps };