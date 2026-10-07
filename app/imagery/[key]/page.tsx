import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ImageryRoam from "../../components/ImageryRoam";
import { IMAGERY, poemsOfImagery } from "../../lib/imagery";

export const dynamicParams = false;

export function generateStaticParams() {
  return IMAGERY.map((ig) => ({ key: ig.key }));
}

export function generateMetadata({
  params,
}: {
  params: { key: string };
}): Metadata {
  const ig = IMAGERY.find((x) => x.key === params.key);
  if (!ig) return { title: "意象 · 诗英" };
  return {
    title: `${ig.zh} · 意象漫游`,
    description: ig.intro,
    keywords: [ig.zh, `${ig.zh}的古诗`, `${ig.zh}英译`, "古诗英译", ig.en],
    alternates: { canonical: `/imagery/${ig.key}` },
    openGraph: {
      title: `${ig.zh} · 意象漫游`,
      description: ig.intro,
      url: `/imagery/${ig.key}`,
      type: "article",
    },
  };
}

export default function ImageryRoamPage({
  params,
}: {
  params: { key: string };
}) {
  const ig = IMAGERY.find((x) => x.key === params.key);
  if (!ig) notFound();
  return <ImageryRoam imagery={ig} stops={poemsOfImagery(ig)} />;
}
