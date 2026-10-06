import type { Metadata } from "next";
import Link from "next/link";
import { POEMS, type Poem } from "../config/poems";

const GROUPS: { stage: string; label: string; hint: string }[] = [
  { stage: "小学", label: "Primary school", hint: "Short, clear, easy to memorise" },
  { stage: "初中", label: "Junior high", hint: "Longer lines, richer imagery" },
  { stage: "高中", label: "Senior high", hint: "Classical prose and hard lines" },
];

export const metadata: Metadata = {
  title: "Chinese Poems in English — full list",
  description:
    "English renderings of the Chinese classical poems taught in primary, junior and senior high school. Line-by-line Chinese, key words and reading notes.",
  alternates: {
    canonical: "/en",
    languages: { "zh-CN": "/poems", en: "/en", "x-default": "/poems" },
  },
  openGraph: {
    title: "Chinese Poems in English",
    description:
      "Every poem in the Poenglish library, rendered into modern English.",
    url: "/en",
    type: "website",
  },
};

function Row({ p }: { p: Poem }) {
  return (
    <Link
      href={`/en/${p.slug}`}
      className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 transition-colors last:border-b-0 hover:bg-paper"
    >
      <span className="min-w-0">
        <span className="font-serif text-[15px] text-ink">{p.titleEn}</span>
        <span className="ml-2.5 text-[13px] text-inkFaint">{p.title}</span>
      </span>
      <span className="shrink-0 text-xs text-inkFaint">
        {p.authorEn} · {p.dynastyEn}
      </span>
    </Link>
  );
}

export default function EnIndexPage() {
  return (
    <div className="space-y-11">
      <header className="pt-4 text-center">
        <p className="text-[11px] tracking-[0.3em] text-cinnabar/70">
          POENGLISH
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl font-serif text-[28px] leading-snug tracking-wide text-ink sm:text-[34px]">
          Chinese Poems in English
        </h1>
        <div className="mx-auto mt-4 flex items-center justify-center gap-2.5">
          <span className="h-px w-8 bg-line" />
          <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
          <span className="h-px w-8 bg-line" />
        </div>
        <p className="mx-auto mt-4 max-w-xl text-[13px] leading-[1.95] text-inkSoft">
          {POEMS.length} poems and classical prose pieces from the Chinese school
          curriculum, each rendered into modern English with the original Chinese
          line by line, key vocabulary and a reading note.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/game" className="btn-primary px-6 py-2.5">
            Learn English with these poems
          </Link>
          <Link href="/poems" className="btn-ghost px-6 py-2.5">
            中文版
          </Link>
        </div>
      </header>

      {GROUPS.map((g) => {
        const list = POEMS.filter((p) => p.stage === g.stage);
        if (list.length === 0) return null;
        return (
          <section key={g.stage}>
            <div className="mb-3.5 flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <h2 className="h-sec !border-0 !pl-0">{g.label}</h2>
              <span className="shrink-0 text-xs text-inkFaint">
                {list.length} · {g.hint}
              </span>
            </div>
            <div>
              {list.map((p) => (
                <Row key={p.slug} p={p} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
