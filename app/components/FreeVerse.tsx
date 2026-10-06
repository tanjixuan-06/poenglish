"use client";

import { useMemo, useRef, useState } from "react";
import PageHeader from "./PageHeader";
import { useLang } from "./LangProvider";
import { streamAi } from "../lib/streamai";

/**
 * 译诗：把任意一段英文，化成一首中文诗。
 *
 * 支持四种中国诗体（自由诗 / 五言 / 七言 / 小令），
 * AI 落成「题 + 诗 + 小记」三段，像一张手题的诗笺：
 * 题作朱印，诗居中凝神，小记是它与原句的私语。
 */

type StyleKey =
  | "verseStyleFree"
  | "verseStyleWuyan"
  | "verseStyleQiyan"
  | "verseStyleCi";

const STYLES: { tool: string; key: StyleKey }[] = [
  { tool: "poem-freeverse", key: "verseStyleFree" },
  { tool: "poem-verse-wuyan", key: "verseStyleWuyan" },
  { tool: "poem-verse-qiyan", key: "verseStyleQiyan" },
  { tool: "poem-verse-ci", key: "verseStyleCi" },
];

const EXAMPLES = [
  "The woods are lovely, dark and deep,",
  "We are all in the gutter, but some of us are looking at the stars.",
  "Not all those who wander are lost.",
];

interface Parsed {
  title: string;
  poem: string;
  note: string;
}

/** 把「【题】…【记】…」三段结构解析出来；AI 未写完时也能实时解析。 */
function parseVerse(raw: string): Parsed {
  const titleMatch = raw.match(/【题】\s*(.*)/);
  const noteMatch = raw.match(/【记】\s*([\s\S]*)/);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const note = noteMatch ? noteMatch[1].trim() : "";
  let poem = raw;
  if (titleMatch) poem = poem.replace(/【题】\s*.*(\n|$)/, "");
  if (noteMatch) poem = poem.replace(/【记】\s*[\s\S]*/, "");
  poem = poem.replace(/^[ \t]*[\r\n]/gm, "").replace(/\n{2,}/g, "\n").trim();
  return { title, poem, note };
}

export default function FreeVerse() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [styleIdx, setStyleIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const parsed = useMemo(() => parseVerse(output), [output]);
  const hasResult = !!parsed.poem;

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setOutput("");
    setError("");
    const r = await streamAi(
      STYLES[styleIdx].tool,
      text,
      (delta) => setOutput((o) => o + delta),
      ac.signal
    );
    setBusy(false);
    if (!r.ok && r.error !== "ABORTED") {
      setError(t("aiError"));
    } else if (r.ok && r.empty) {
      setError(t("aiEmpty"));
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError(t("dailyNoTts"));
      return;
    }
    const text = parsed.poem || output;
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const copy = async () => {
    const text = [parsed.title, parsed.poem, parsed.note]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* 部分环境无剪贴板权限，静默忽略 */
    }
  };

  return (
    <div className="space-y-9">
      <PageHeader title={t("verseTitle")} sub={t("verseSubtitle")} />

      {/* 体裁选择 */}
      <section className="flex flex-wrap items-center justify-center gap-2">
        {STYLES.map((s, i) => (
          <button
            key={s.tool}
            onClick={() => setStyleIdx(i)}
            className={
              i === styleIdx
                ? "rounded-full border border-cinnabar/60 bg-cinnabar/10 px-4 py-1.5 text-sm text-cinnabar"
                : "rounded-full border border-line bg-white px-4 py-1.5 text-sm text-inkSoft transition-colors hover:border-brand/40 hover:text-brand"
            }
          >
            {t(s.key)}
          </button>
        ))}
      </section>

      {/* 输入 */}
      <section className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("versePlaceholder")}
          rows={4}
          className="w-full resize-y rounded-sm border border-line bg-white px-4 py-3 text-[15px] leading-[1.9] text-ink placeholder:text-inkFaint focus:border-brand/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="max-w-full truncate rounded-full border border-line bg-white px-3 py-1 text-xs text-inkSoft transition-colors hover:border-brand/50 hover:text-brand"
              title={ex}
            >
              {ex.length > 34 ? `${ex.slice(0, 34)}…` : ex}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={busy ? stop : submit}
            disabled={!busy && !input.trim()}
            className={busy ? "btn-ghost" : "btn-primary"}
          >
            {busy ? t("dailyStop") : t("verseSubmit")}
          </button>
        </div>
      </section>

      {/* 诗笺 */}
      {(hasResult || busy || error) && (
        <section className="mx-auto max-w-xl rounded-sm border border-line bg-white px-6 py-8 sm:px-10">
          {parsed.title && (
            <p className="mb-4 text-center font-serif text-sm tracking-[0.3em] text-cinnabar/80">
              {parsed.title}
            </p>
          )}
          {parsed.poem ? (
            <p className="whitespace-pre-wrap text-center font-serif text-[17px] leading-[2.2] tracking-[0.04em] text-ink">
              {parsed.poem}
            </p>
          ) : busy ? (
            <p className="py-4 text-center text-sm text-inkFaint">
              {t("verseWaiting")}
            </p>
          ) : null}
          {parsed.note && (
            <p className="mx-auto mt-6 max-w-md border-l-2 border-line pl-3 text-left text-[13px] leading-[2] text-inkFaint">
              <span className="mr-1 text-cinnabar/70">
                {t("verseNoteLabel")} ·
              </span>
              {parsed.note}
            </p>
          )}
          {error && (
            <p className="mt-3 text-center text-sm text-bad">{error}</p>
          )}
        </section>
      )}

      {/* 生成后的操作 */}
      {hasResult && !busy && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={speak} className="btn-ghost px-5 py-2 text-sm">
            {t("verseListen")}
          </button>
          <button onClick={copy} className="btn-ghost px-5 py-2 text-sm">
            {t("verseCopy")}
          </button>
          <button onClick={submit} className="btn-ghost px-5 py-2 text-sm">
            {t("verseAgain")}
          </button>
        </div>
      )}

      <p className="mx-auto max-w-xl text-center text-xs leading-[1.9] text-inkFaint">
        {t("aiDisclaimer")}
      </p>
    </div>
  );
}
