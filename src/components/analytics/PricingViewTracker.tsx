"use client";

import { useEffect } from "react";
import { Analytics } from "@/lib/analytics";

export function PricingViewTracker() {
  useEffect(() => {
    Analytics.track("pricing_viewed", {});
  }, []);
  return null;
}