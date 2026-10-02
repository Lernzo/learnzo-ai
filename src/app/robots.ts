import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnzo.online";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/parent",
          "/history",
          "/auth/",
          "/solve"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}