import type { MetadataRoute } from "next";
import { POEMS } from "./config/poems";
import { IMAGERY } from "./lib/imagery";

export const runtime = "edge";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, priority: 1 },
    { url: `${base}/game`, lastModified: now, priority: 0.9 },
    { url: `${base}/daily`, lastModified: now, priority: 0.9 },
    { url: `${base}/poems`, lastModified: now, priority: 0.9 },
    { url: `${base}/imagery`, lastModified: now, priority: 0.9 },
    { url: `${base}/verse`, lastModified: now, priority: 0.9 },
    { url: `${base}/review`, lastModified: now, priority: 0.8 },
    { url: `${base}/me`, lastModified: now, priority: 0.6 },
    { url: `${base}/vocab`, lastModified: now, priority: 0.5 },
    { url: `${base}/en`, lastModified: now, priority: 0.8 },
    ...IMAGERY.map((ig) => ({
      url: `${base}/imagery/${ig.key}`,
      lastModified: now,
      priority: 0.7,
    })),
    ...POEMS.map((p) => ({
      url: `${base}/poems/${p.slug}`,
      lastModified: now,
      priority: 0.7,
    })),
    ...POEMS.map((p) => ({
      url: `${base}/en/${p.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
