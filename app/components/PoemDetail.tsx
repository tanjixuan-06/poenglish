"use client";

import Link from "next/link";
import { POEMS, type Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import PoemDisplay from "./PoemDisplay";
import AiTutor from "./AiTutor";
import Shadowing from "./Shadowing";
import PoemHeart from "./PoemHeart";

export default function PoemDetail({ poem }: { poem: Poem }) {
  const { t, lang } = useLang();
  const i = POEMS.findIndex((p) => p.slug === poem.slug);
  const prev = i > 0 ? POEMS[i - 1] : POEMS[POEMS.length - 1];
  const next = i < POEMS.length - 1 ? POEMS[i + 1] : POEMS[0];

  const name = (p: Poem) => (lang === "zh" ? p.title : p.titleEn);

  return (
    <div className="space-y-6">
      <PoemDisplay poem={poem} heading="h1" />

      <Shadowing lines={poem.lines} />

      <AiTutor poem={poem} />

      <PoemHeart poem={poem} />

      <nav className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <Link href={`/poems/${prev.slug}`} className="text-inkSoft hover:text-brand">
          ← {t("poemPrev")}：{name(prev)}
        </Link>
        <Link href="/poems" className="text-xs text-inkFaint hover:text-brand">
          {t("poemBackList")}
        </Link>
        <Link href={`/poems/${next.slug}`} className="text-inkSoft hover:text-brand">
          {t("poemNext")}：{name(next)} →
        </Link>
      </nav>
    </div>
  );
}
