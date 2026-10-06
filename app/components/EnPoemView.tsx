import Link from "next/link";
import type { Poem } from "../config/poems";
import SpeakLine from "./SpeakLine";

/**
 * 英文版诗词页视图
 *
 * 独立组件而不复用中文页，是为了让整页语言统一为英文
 * （i18n 依赖客户端 localStorage，服务端渲染时拿不到用户选择）。
 * 这一页同时是英文搜索的长尾落地页。
 *
 * 版式与中文页一一对应：题 → 诗句 → 词汇 → 跨学科 → 编者按。
 */
export default function EnPoemView({ poem }: { poem: Poem }) {
  return (
    <article className="space-y-11">
      {/* ── 题 ── */}
      <header className="text-center">
        <h1 className="font-serif text-[26px] leading-snug tracking-[0.04em] text-ink sm:text-[30px]">
          {poem.titleEn}
        </h1>
        <p className="mt-2.5 text-[13px] tracking-wide text-inkSoft">
          {poem.title} · {poem.dynastyEn} dynasty · {poem.authorEn}
          {poem.author !== poem.authorEn ? ` (${poem.author})` : ""}
        </p>
        <div className="mx-auto mt-3.5 flex items-center justify-center gap-2.5">
          <span className="h-px w-8 bg-line" />
          <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
          <span className="h-px w-8 bg-line" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="tag">
            {poem.stage === "小学"
              ? "Primary school"
              : poem.stage === "初中"
              ? "Junior high"
              : "Senior high"}
          </span>
          <span className="tag">
            {poem.kind === "诗"
              ? "Poem"
              : poem.kind === "词"
              ? "Ci lyric"
              : "Classical prose"}
          </span>
          <span className="tag">{poem.themeEn}</span>
        </div>
      </header>

      {/* ── 英译为主：逐句中英对照 ── */}
      <section>
        <p className="mb-3.5 text-[11px] tracking-[0.2em] text-inkFaint">
          The rendering, line by line
        </p>
        <div className="space-y-5">
          {poem.lines.map((l, i) => (
            <div key={i}>
              <SpeakLine
                text={l.en}
                className="poem-en !text-[16px] !leading-[1.85] text-ink sm:!text-[17px]"
              />
              <p className="mt-1.5 font-serif text-[15px] leading-[1.9] text-inkFaint">
                {l.zh}
              </p>
            </div>
          ))}
        </div>
      </section>

      {poem.fullText && (
        <section className="panel">
          <p className="mb-3 text-[11px] tracking-[0.2em] text-inkFaint">
            Full Chinese text
          </p>
          <div className="space-y-2">
            {poem.fullText.split("\n").map((para, i) => (
              <p
                key={i}
                className="font-serif text-[15px] leading-[1.95] text-ink"
                style={{ textIndent: "2em" }}
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── 词汇 ── */}
      <section>
        <h2 className="h-sec mb-4">Key words</h2>
        <dl className="grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
          {poem.keywords.map((k) => (
            <div
              key={k.w}
              className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5"
            >
              <dt className="font-serif text-[15px] text-ink">{k.w}</dt>
              <dd className="text-[13px] text-inkSoft">{k.zh}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 跨学科卡 ── */}
      {poem.cross && (
        <section className="rounded-sm border border-cinnabar/20 bg-cinnabar/[0.04] p-5">
          <p className="text-[11px] tracking-[0.2em] text-cinnabar/80">
            {poem.cross.fieldEn}
          </p>
          <h2 className="mt-2 font-serif text-base leading-relaxed text-ink">
            {poem.cross.titleEn}
          </h2>
          <p className="mt-2.5 text-[13px] leading-[1.95] text-inkSoft">
            {poem.cross.bodyEn}
          </p>
        </section>
      )}

      {/* ── 编者按 ── */}
      <section className="border-l-2 border-cinnabar/70 pl-4">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar/80">
          Editor&rsquo;s note
        </p>
        <p className="mt-2.5 font-serif text-[15px] leading-[2] text-ink">
          {poem.noteEn}
        </p>
        <p className="mt-2.5 text-xs text-inkFaint">— The editor</p>
      </section>

      <nav className="flex flex-wrap items-center justify-center gap-3 border-t border-line pt-8 text-sm">
        <Link href={`/poems/${poem.slug}`} className="btn-primary">
          Practise this poem
        </Link>
        <Link href="/en" className="btn-ghost">
          All poems in English
        </Link>
      </nav>
    </article>
  );
}
