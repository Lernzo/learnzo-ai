import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Learnzo - Homework Help That Helps You Understand",
    template: "%s - Learnzo"
  },
  description:
    "Upload a homework question, understand the solution step by step, and practise until the concept clicks. For CBSE, ICSE and State board students.",
  robots: { index: true, follow: true },
  icons: { icon: "/learnzo-logo.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <PageViewTracker />
        {children}

        {ga && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga}', { send_page_view: true });
              `}
            </Script>
          </>
        )}

        {pixel && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${pixel}'); fbq('track','PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}