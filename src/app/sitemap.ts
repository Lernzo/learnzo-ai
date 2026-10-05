import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnzo.online";
  const now = new Date();

  return [
    { url: `${base}/`,                lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/sales`,           lastModified: now, changeFrequency: "weekly",  priority: 0.95 },
    { url: `${base}/how-it-works`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pricing`,         lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/kids`,            lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/faq`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/responsible-ai`,  lastModified: now, changeFrequency: "yearly",  priority: 0.5 }
  ];
}