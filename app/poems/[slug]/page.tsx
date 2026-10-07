import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PoemDetail from "../../components/PoemDetail";
import { POEMS, POEM_MAP } from "../../config/poems";
import { poemJsonLd } from "../../lib/jsonld";

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
  if (!poem) return { title: "诗词库" };
  const desc = `${poem.title} · ${poem.dynasty}·${poem.author}（${poem.stage}${poem.kind}）。中英对照、重点词汇${poem.cross ? `、${poem.cross.field}知识卡` : ""}。${poem.lines[0].en}`;
  return {
    title: `${poem.title}（${poem.author}）英译`,
    description: desc,
    keywords: [
      poem.title,
      `${poem.title}英文翻译`,
      `${poem.title}英译`,
      poem.titleEn,
      `${poem.titleEn} English translation`,
      poem.author,
      `${poem.author}的诗`,
      "古诗词英译",
      "学英语",
    ],
    alternates: {
      canonical: `/poems/${poem.slug}`,
      languages: {
        "zh-CN": `/poems/${poem.slug}`,
        en: `/en/${poem.slug}`,
        "x-default": `/poems/${poem.slug}`,
      },
    },
    openGraph: {
      title: `${poem.title}（${poem.titleEn}）`,
      description: desc,
      url: `/poems/${poem.slug}`,
      type: "article",
    },
  };
}

export default function PoemPage({ params }: { params: { slug: string } }) {
  const poem = POEM_MAP[params.slug];
  if (!poem) notFound();
  const jsonLd = poemJsonLd(poem, siteUrl);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PoemDetail poem={poem} />
    </>
  );
}
