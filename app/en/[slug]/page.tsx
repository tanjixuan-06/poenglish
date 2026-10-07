import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EnPoemView from "../../components/EnPoemView";
import { POEMS, POEM_MAP } from "../../config/poems";

export const runtime = "edge";

export const dynamicParams = false;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export function generateStaticParams() {
  return POEMS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const poem = POEM_MAP[params.slug];
  if (!poem) return { title: "Chinese poetry in English" };
  const desc = `${poem.titleEn} — ${poem.dynastyEn} dynasty, by ${poem.authorEn}. Full English rendering of the Chinese poem ${poem.title}, with line-by-line Chinese, key words and a reading note.`;
  return {
    title: `${poem.titleEn} — English translation of ${poem.title}`,
    description: desc,
    keywords: [
      poem.titleEn,
      `${poem.title} English translation`,
      `${poem.titleEn} Chinese poem`,
      poem.authorEn,
      `${poem.authorEn} poem in English`,
      "Chinese poetry in English",
      "learn English with Chinese poems",
    ],
    alternates: {
      canonical: `/en/${poem.slug}`,
      languages: {
        "zh-CN": `/poems/${poem.slug}`,
        en: `/en/${poem.slug}`,
        "x-default": `/poems/${poem.slug}`,
      },
    },
    openGraph: {
      title: `${poem.titleEn} — ${poem.title}`,
      description: desc,
      url: `/en/${poem.slug}`,
      type: "article",
    },
  };
}

export default function EnPoemPage({ params }: { params: { slug: string } }) {
  const poem = POEM_MAP[params.slug];
  if (!poem) notFound();
  return <EnPoemView poem={poem} />;
}
