"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@/lib/analytics";

/**
 * Fires a page_view event on every route change. The initial page load
 * is covered by the GA4 script in layout.tsx; subsequent client-side
 * navigations are handled here.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    Analytics.pageView(pathname);
  }, [pathname]);

  return null;
}