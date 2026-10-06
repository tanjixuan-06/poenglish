"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { POEMS, type Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import { scoreTranslation, type SelfScore } from "../lib/translatescore";
import { addPractice } from "../lib/progress";
import { streamAi } from "../lib/streamai";
import MdText from "./MdText";

type Result = { mine: string; en: string; zh: string; self: SelfScore };

/** 背译挑短诗：2–4 句最适合整首默出来 */
function pickPoem(): Poem {
  const pool = POEMS.filter(
    (p) => p.kind !== "文言文" && p.lines.length >= 1 && p.lines.length <= 4
  );
  const src = pool.length ? pool : POEMS;
  return src[Math.floor(Math.random() * src.length)];
}

export default function ReciteMode() {
  const { t, lang } = useLang();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPoem(pickPoem());
  }, []);

  const restart = useCallback(() => {
    abortRef.current?.abort();
    setPoem(pickPoem());
    setIdx(0);
    setDraft("");
    setResults([]);
    setShowRef(false);
    setReview("");
    setErr("");
  }, []);

  const submit = useCallback(() => {
    if (!poem) return;
    const line = poem.lines[idx];
    if (!line || !draft.trim()) return;
    const self = scoreTranslation(draft.trim(), line.en);
    setResults((r) => [
      ...r,
      { mine: draft.trim(), en: line.en, zh: line.zh, self },
    ]);
    addPractice({
      kind: "recite",
      slug: poem.slug,
      title: poem.title,
      src: line.zh,
      mine: draft.trim(),
      ref: line.en,
      score: self.score,
    });
    setDraft("");
    setShowRef(false);
    setIdx((i) => i + 1);
  }, [poem, idx, draft]);

  const askReview = useCallback(async () => {
    if (!poem || loading) return;
    setLoading(true);
    setErr("");
    setReview("");
    const ac = new AbortController();
    abortRef.current = ac;
    const langLine =
      lang === "zh" ? "请用中文讲解。" : "Please reply in English.";
    const body =
      `篇目：《${poem.title}》· ${poem.dynasty}·${poem.author}\n` +
      poem.lines
        .map((l, i) => {
          const mine = results[i]?.mine;
          return `第${i + 1}句 原文：${l.zh}\n参考译文：${l.en}\n学生译文：${
            mine || "（未作答）"
          }`;
        })
        .join("\n") +
      `\n请从整体连贯性、意象传达、英文地道程度三个角度总评，并挑一处最值得改的地方给出改法。\n` +
      langLine;
    const r = await streamAi(
      "poem-translate",
      body,
      (d) => setReview((o) => o + d),
      ac.signal
    );
    setLoading(false);
    if (!r.ok && r.error !== "ABORTED") {
      setErr(r.error === "NETWORK" ? t("writeError") : r.error || t("writeError"));
    } else if (r.ok && r.empty) {
      setErr(t("writeEmpty"));
    }
  }, [poem, results, loading, lang, t]);

  if (!poem) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  const done = idx >= poem.lines.length;
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.self.score, 0) / results.length)
    : 0;

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-sm border border-brand/25 bg-brand/5 p-8 text-center">
          <p className="text-sm text-inkSoft">{t("reciteDone")}</p>
          <p className="mt-1 text-xs text-inkFaint">
            《{poem.title}》· {poem.author}
          </p>
          <p className="mt-3 text-5xl font-bold text-brand">{avg}</p>
          <p className="mt-1 text-xs text-inkSoft">{t("reciteScore")}</p>
        </div>

        <section className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="rounded-sm border border-line bg-white p-4 text-xs"
            >
              <p className="font-serif text-sm text-ink">{r.zh}</p>
              <p className="mt-2 text-inkSoft">
                <span className="text-inkFaint">{t("writeYours")}：</span>
                {r.mine}
              </p>
              <p className="mt-1 text-inkSoft">
                <span className="text-inkFaint">{t("writeRef")}：</span>
                {r.en}
              </p>
              <p className="mt-1 text-inkFaint">
                {t("writeSelfScore")} {r.self.score}
              </p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          {!review && !loading && (
            <button
              onClick={() => void askReview()}
              className="btn-primary px-5 py-2.5"
            >
              {t("reciteAiReview")}
            </button>
          )}
          <button
            onClick={restart}
            className="rounded-sm border border-line px-5 py-2.5 text-sm text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("reciteChangePoem")}
          </button>
          <Link
            href={`/poems/${poem.slug}`}
            className="rounded-sm px-4 py-2.5 text-sm text-inkFaint underline underline-offset-2 hover:text-brand"
          >
            {t("gameViewPoem")}
          </Link>
        </div>

  
        {(loading || review || err) && (
          <section className="space-y-2 rounded-sm border border-line bg-white p-5">
            <h2 className="text-sm font-semibold text-ink">
              {t("writeAiTitle")}
            </h2>
            {err && (
              <p className="rounded-sm bg-badWash px-3 py-2 text-sm text-bad">
                {err}
              </p>
            )}
            <MdText src={review} />
            {loading && (
              <span className="inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
            )}
          </section>
        )}
      </div>
    );
  }

  const line = poem.lines[idx];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-inkFaint">
          {t("reciteProgress", { n: idx + 1 })} / {poem.lines.length}
        </span>
        <span className="text-inkFaint">
          {t("reciteAvgNow")} {avg}
        </span>
      </div>

      {/* 整首中文都在眼前，逐句默英译 */}
      <div className="rounded-sm border border-line bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-medium text-inkFaint">
          {t("reciteSubtitle")}
        </p>
        <div className="space-y-2">
          {poem.lines.map((l, i) => (
            <p
              key={i}
              className={`font-serif leading-relaxed ${
                i === idx
                  ? "text-xl text-ink"
                  : i < idx
                  ? "text-base text-inkFaint"
                  : "text-base text-inkSoft"
              }`}
            >
              {l.zh}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-inkFaint">
          《{poem.lines.length > 0 ? poem.title : ""}》· {poem.dynasty}·
          {poem.author}
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={3}
          placeholder={t("recitePlaceholder")}
          className="w-full rounded-sm border border-line p-4 text-sm leading-relaxed focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="btn-primary"
          >
            {t("reciteSubmit")}
          </button>
          <button
            onClick={() => setShowRef((v) => !v)}
            className="rounded-sm border border-line px-3 py-2 text-xs text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("reciteShowRef")}
          </button>
          <button
            onClick={() => {
              setIdx((i) => i + 1);
              setDraft("");
            }}
            className="rounded-sm px-3 py-2 text-xs text-inkFaint underline underline-offset-2 hover:text-inkSoft"
          >
            {t("writeSkip")}
          </button>
          <span className="text-xs text-inkFaint">⌘/Ctrl + Enter</span>
        </div>
      </div>

      {showRef && (
        <div className="rounded-sm border border-dashed border-line bg-paper p-4">
          <p className="text-xs text-inkFaint">{t("writeRefTitle")}</p>
          <p className="mt-1 font-serif text-sm leading-relaxed text-ink">
            {line.en}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-sm border border-line bg-white p-4">
          <p className="text-xs text-inkSoft">{t("reciteLastResult")}</p>
          <p className="mt-1 text-3xl font-bold text-brand">
            {results[results.length - 1].self.score}
          </p>
          <p className="mt-1 text-[11px] text-inkFaint">
            {t("writeSelfHit", {
              a: results[results.length - 1].self.hit.length,
              b: results[results.length - 1].self.total,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
