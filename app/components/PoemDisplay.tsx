"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "./LangProvider";
import { useSpeech } from "../lib/useSpeech";
import { KIND_LABEL, STAGE_LABEL, type Poem } from "../config/poems";
import { localGlossMap, localZhGlossMap, GLOBAL_ZH_GLOSS } from "../lib/wordgloss";
import GlossLine from "./GlossLine";
import VocabAddButton from "./VocabAddButton";

/**
 * 诗词标准展示块
 *
 * 版式取「一卷」的样子：题在最上，诗句居中占主体，
 * 词汇与注疏排在后面，像书后的笺注。
 */
export default function PoemDisplay({
  poem,
  showCross = true,
  showNote = true,
  showLink = false,
  compact = false,
  heading = "h2",
}: {
  poem: Poem;
  showCross?: boolean;
  showNote?: boolean;
  showLink?: boolean;
  compact?: boolean;
  heading?: "h1" | "h2";
}) {
  const { t, lang } = useLang();
  const { speak, stop, speaking, supported } = useSpeech();
  // 慢读：跟读之前先听清，不追求读对
  const [slow, setSlow] = useState(false);
  const lineRate = slow ? 0.65 : 0.9;

  // 点词识义：默认开着，看得见才用得起来；记住上一次的选择
  const [gloss, setGloss] = useState(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem("verse-gloss");
      if (v !== null) setGloss(v === "1");
    } catch {
      /* 无痕模式等场景忽略 */
    }
  }, []);
  const toggleGloss = () => {
    setGloss((v) => {
      const next = !v;
      try {
        localStorage.setItem("verse-gloss", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  const glossLocal = useMemo(() => localGlossMap(poem.keywords), [poem]);
  const glossZh = useMemo(
    () => new Map([...GLOBAL_ZH_GLOSS, ...localZhGlossMap(poem.keywords)]),
    [poem]
  );

  const fullEn = poem.lines.map((l) => l.en).join(" ");
  const Title = heading === "h1" ? "h1" : "h2";

  return (
    <article className="space-y-11">
      {/* ── 题 ── */}
      <header className="text-center">
        <Title className="font-serif text-[26px] leading-snug tracking-[0.08em] text-ink sm:text-[30px]">
          {lang === "zh" ? poem.title : poem.titleEn}
        </Title>

        <p className="mt-2.5 text-[13px] tracking-wide text-inkSoft">
          {lang === "zh"
            ? `${poem.dynasty} · ${poem.author}`
            : `${poem.dynastyEn} · ${poem.authorEn}`}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="tag">
            {lang === "zh"
              ? STAGE_LABEL[poem.stage]?.zh ?? poem.stage
              : STAGE_LABEL[poem.stage]?.en ?? poem.stage}
          </span>
          <span className="tag">
            {lang === "zh"
              ? KIND_LABEL[poem.kind]?.zh ?? poem.kind
              : KIND_LABEL[poem.kind]?.en ?? poem.kind}
          </span>
          {poem.theme && (
            <span className="tag">
              {lang === "zh" ? poem.theme : poem.themeEn}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {supported && (
            <>
              <button
                onClick={() => (speaking ? stop() : speak(fullEn, lineRate))}
                className="btn-quiet"
              >
                {speaking ? t("dailyStop") : t("dailyListen")}
              </button>
              <button
                onClick={() => setSlow((v) => !v)}
                aria-pressed={slow}
                className={slow ? "btn-ghost" : "btn-quiet"}
              >
                {t("dailySlow")}
              </button>
            </>
          )}
          <button
            onClick={toggleGloss}
            aria-pressed={gloss}
            className={gloss ? "btn-ghost" : "btn-quiet"}
          >
            {t("glossToggle")}
          </button>
        </div>
        {gloss && (
          <p className="mt-2.5 text-center text-xs text-inkFaint">
            {t("glossHint")}
          </p>
        )}
      </header>

      {/* ── 文言文全文（若有） ── */}
      {poem.fullText && (
        <section className="panel">
          <p className="mb-3 text-[11px] tracking-[0.2em] text-inkFaint">
            {lang === "zh" ? "原文全文" : "Full text"}
          </p>
          <div className="space-y-2">
            {poem.fullText.split("\n").map((para, i) => (
              <p
                key={i}
                className="poem-zh !text-[16px] sm:!text-[16px]"
                style={{ textIndent: "2em" }}
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── 诗句：桌面并排，手机上下；逐句左右对齐更好读 ── */}
      <section className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        <div>
          <p className="mb-3.5 text-[11px] tracking-[0.2em] text-inkFaint">
            {t("poemOriginal")}
          </p>
          <div className="space-y-2.5">
            {poem.lines.map((l, i) => (
              <p key={i} className="poem-zh">
                <GlossLine text={l.zh} on={gloss} dir="zh" zhMap={glossZh} />
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3.5 text-[11px] tracking-[0.2em] text-inkFaint">
            {t("poemTranslation")}
          </p>
          <div className="space-y-2.5">
            {poem.lines.map((l, i) => (
            <p
              key={i}
              onClick={
                supported
                  ? () => {
                      stop();
                      speak(l.en, lineRate);
                    }
                  : undefined
              }
              title={supported ? t("dailyListen") : undefined}
              className={`poem-en${
                supported ? " cursor-pointer transition-colors hover:text-brand" : ""
              }`}
            >
              <GlossLine
                text={l.en}
                on={gloss}
                dir="en"
                local={glossLocal}
              />
            </p>
          ))}
          </div>
        </div>
      </section>

      {/* ── 重点词汇 ── */}
      <section>
        <h2 className="h-sec mb-4">{t("poemKeywords")}</h2>
        <div className="flex flex-wrap gap-2">
          {poem.keywords.map((k, i) => (
            <span
              key={i}
              className="inline-flex items-baseline gap-2 rounded-sm border border-line bg-white px-2.5 py-1.5"
            >
              <span className="font-serif text-[15px] leading-none text-ink">
                {k.w}
              </span>
              <span className="text-xs leading-none text-inkFaint">{k.zh}</span>
              <VocabAddButton w={k.w} zh={k.zh} from={poem.title} />
            </span>
          ))}
        </div>
      </section>

      {/* ── 跨学科卡 ── */}
      {showCross && poem.cross && (
        <section className="rounded-sm border border-cinnabar/20 bg-cinnabar/[0.04] p-5">
          <p className="text-[11px] tracking-[0.2em] text-cinnabar/80">
            {t("poemCross", {
              f: lang === "zh" ? poem.cross.field : poem.cross.fieldEn,
            })}
          </p>
          <h3 className="mt-2 font-serif text-base leading-relaxed text-ink">
            {lang === "zh" ? poem.cross.title : poem.cross.titleEn}
          </h3>
          {!compact && (
            <p className="mt-2.5 text-[13px] leading-[1.95] text-inkSoft">
              {lang === "zh" ? poem.cross.body : poem.cross.bodyEn}
            </p>
          )}
        </section>
      )}

      {/* ── 编者按：竖线引文，像手批 ── */}
      {showNote && (
        <section className="border-l-2 border-cinnabar/70 pl-4">
          <p className="text-[11px] tracking-[0.2em] text-cinnabar/80">
            {t("poemNote")}
          </p>
          <p className="mt-2.5 font-serif text-[15px] leading-[2] text-ink">
            {lang === "zh" ? poem.note : poem.noteEn}
          </p>
          <p className="mt-2.5 text-xs text-inkFaint">{t("poemNoteBy")}</p>
        </section>
      )}

      {showLink && (
        <div className="pt-1 text-center">
          <Link href={`/poems/${poem.slug}`} className="btn-primary">
            {t("gameViewPoem")}
          </Link>
        </div>
      )}
    </article>
  );
}
