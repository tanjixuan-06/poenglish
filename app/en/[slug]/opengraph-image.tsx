import { ImageResponse } from "next/og";
import { POEM_MAP, POEMS } from "../../config/poems";
import { buildPoemOg, OG_SIZE } from "../../lib/poemOg";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Chinese poetry in English · Poenglish";

export function generateStaticParams() {
  return POEMS.map((p) => ({ slug: p.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const poem = POEM_MAP[params.slug];
  if (!poem) return new ImageResponse(<div />, OG_SIZE);
  return buildPoemOg(poem);
}
