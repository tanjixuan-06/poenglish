"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POEMS, type Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import { scoreTranslation, type SelfScore } from "../lib/translatescore";
import { cosineSimilarity } from "../lib/textanalysis";
import { streamAi } from "../lib/streamai";
import { addPractice } from "../lib/progress";
import { notesZh2En, notesEn2Zh, type Note } from "../lib/localfeedback";
import MdText from "./MdText";

type Dir = "zh2en" | "en2zh";
type Item = { poem: Poem; zh: string; en: string };
type Rec = { dir: Dir; zh: string; en: string; mine: string; score: number };

const ROUND = 10;
const BEST_KEY = "poenglish-write-best";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(stage: string): Item[] {
  const pool = stage === "all" ? POEMS : POEMS.filter((p) => p.stage === stage);
  const src = pool.length ? pool : POEMS;
  const picked = shuffle(src).slice(0, Math.min(ROUND, src.length));
  return picked.map((poem) => {
    const line = poem.lines[Math.floor(Math.random() * poem.lines.length)];
    return { poem, zh: line.zh, en: line.en };
  });
}

export default function WriteMode() {
  const { t, lang } = useLang();
  const [dir, setDir] = useState<Dir>("zh2en");
  const [stage, setStage] = useState<string>("all");
  const [queue, setQueue] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [self, setSelf] = useState<SelfScore | null>(null);
  const [fit, setFit] = useState<number | null>(null);
  const [aiOut, setAiOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showRef, setShowRef] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [history, setHistory] = useState<Rec[]>([]);
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // 题目在客户端生成，避免服务端 / 客户端随机不一致
  useEffect(() => {
    setQueue(buildQueue(stage));
    setIdx(0);
    resetAnswer();
    setScore(0);
    setStreak(0);
    setHistory([]);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    const b = Number(window.localStorage.getItem(BEST_KEY) || 0);
    setBest(Number.isFinite(b) ? b : 0);
  }, []);

  const resetAnswer = () => {
    setDraft("");
    setSubmitted(false);
    setSelf(null);
    setFit(null);
    setAiOut("");
    setErr("");
    setShowRef(false);
    setShowTip(false);
    setNotes([]);
  };

  const item = queue[idx];
  const finished = ready && queue.length > 0 && idx >= queue.length;

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!item || !text || submitted) return;

    const s = dir === "zh2en" ? scoreTranslation(text, item.en) : null;
    const f = dir === "en2zh" ? cosineSimilarity(text, item.zh) : null;
    const value = s ? s.score : Math.round((f ?? 0) * 100);
    setSelf(s);
    setFit(f);
    setSubmitted(true);

    const gain = Math.round(value / 10);
    const nextScore = score + gain;
    setScore(nextScore);
    setStreak(value >= 60 ? streak + 1 : 0);
    if (nextScore > best) {
      setBest(nextScore);
      window.localStorage.setItem(BEST_KEY, String(nextScore));
    }
    setHistory((h) => [
      ...h,
      { dir, zh: item.zh, en: item.en, mine: text, score: value },
    ]);
    // 写进学习档案，供「我的学习」统计与错句本使用
    addPractice({
      kind: dir === "zh2en" ? "write" : "backwrite",
      slug: item.poem.slug,
      title: item.poem.title,
      src: dir === "zh2en" ? item.zh : item.en,
      mine: text,
      ref: dir === "zh2en" ? item.en : item.zh,
      score: value,
    });

    setErr("");
    setAiOut("");
    // 本地批注：不联网、不等模型，提交即得
    setNotes(
      dir === "zh2en"
        ? notesZh2En(text, item.en, item.zh)
        : notesEn2Zh(text, item.zh, f ?? 0)
    );
  }, [item, draft, submitted, dir, score, streak, best]);

  /** 细讲是可选的：只有读者主动要，才去调模型 */
  const askAi = useCallback(async () => {
    const text = draft.trim();
    if (!item || !text || loading) return;
    setErr("");
    setAiOut("");
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const meta = `出处：《${item.poem.title}》· ${item.poem.dynasty}·${item.poem.author}\n`;
    const langLine =
      lang === "zh" ? "请用中文讲解。" : "Please reply in English.";
    const body =
      dir === "zh2en"
        ? `原句（中文）：${item.zh}\n${meta}` +
          `参考译文（仅供参考，不是唯一标准答案）：${item.en}\n` +
          `我的译文：${text}\n${langLine}`
        : `英文原文：${item.en}\n${meta}` +
          `中文原句（对照用）：${item.zh}\n` +
          `学生的回译：${text}\n${langLine}`;

    const r = await streamAi(
      dir === "zh2en" ? "poem-translate" : "poem-backtranslate",
      body,
      (d) => setAiOut((o) => o + d),
      ac.signal
    );
    setLoading(false);
    if (!r.ok && r.error !== "ABORTED") {
      setErr(
        r.error === "NETWORK" ? t("writeError") : r.error || t("writeError")
      );
    } else if (r.ok && r.empty) {
      setErr(t("writeEmpty"));
    }
  }, [item, draft, dir, loading, lang, t]);

  const advance = useCallback(() => {
    abortRef.current?.abort();
    setIdx((i) => i + 1);
    resetAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback(() => {
    setQueue(buildQueue(stage));
    setIdx(0);
    resetAnswer();
    setScore(0);
    setStreak(0);
    setHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (!ready) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  if (finished) {
    return (
      <div className="space-y-5">
        <div className="rounded-sm border border-brand/25 bg-brand/5 p-8 text-center">
          <p className="text-sm text-inkSoft">
            {t("writeFinish")} · {t("writeProgress", { n: queue.length })}
          </p>
          <p className="mt-3 text-5xl font-bold text-brand">{score}</p>
          <p className="mt-2 text-sm text-inkSoft">
            {t("writeBest")} {best}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={restart}
              className="btn-primary px-5 py-2.5"
            >
              {t("writeRestart")}
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-ink">
              {t("writeHistory")}
            </h2>
            {history.map((h, i) => (
              <div
                key={i}
                className="rounded-sm border border-line bg-white p-4 text-xs"
              >
                <p className="text-[11px] text-inkFaint">
                  {h.dir === "zh2en" ? t("writeDirZh2En") : t("writeDirEn2Zh")}
                </p>
                <p className="mt-1 font-serif text-sm text-ink">
                  {h.dir === "zh2en" ? h.zh : h.en}
                </p>
                <p className="mt-2 text-inkSoft">
                  <span className="text-inkFaint">{t("writeYours")}：</span>
                  {h.mine}
                </p>
                <p className="mt-1 text-inkSoft">
                  <span className="text-inkFaint">{t("writeRef")}：</span>
                  {h.dir === "zh2en" ? h.en : h.zh}
                </p>
                <p className="mt-1 text-inkFaint">
                  {h.dir === "zh2en" ? t("writeSelfScore") : t("writeFitScore")}{" "}
                  {h.score}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  if (!item) return null;

  const back = dir === "en2zh";
  const tipWords = item.poem.keywords.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* 计分条 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3 text-sm">
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("writeScore")} </span>
            <span className="font-semibold text-brand-dark">{score}</span>
          </span>
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("writeStreak")} </span>
            <span className="font-semibold text-brand-dark">{streak}</span>
          </span>
          <span className="hidden rounded-sm bg-paperDim px-2.5 py-1 sm:inline">
            <span className="text-inkFaint">{t("writeBest")} </span>
            <span className="font-semibold text-inkSoft">{best}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="rounded-sm border border-line px-2 py-1 text-xs text-inkSoft"
            aria-label="stage"
          >
            <option value="all">{t("writeStageAll")}</option>
            <option value="小学">{t("writeStage1")}</option>
            <option value="初中">{t("writeStage2")}</option>
            <option value="高中">{t("writeStage3")}</option>
          </select>
          <span className="text-xs text-inkFaint">
            {t("writeProgress", { n: idx + 1 })} / {queue.length}
          </span>
        </div>
      </div>

      {/* 方向切换 */}
      <div className="flex gap-1 rounded-sm bg-paperDim p-1">
        <button
          onClick={() => {
            setDir("zh2en");
            resetAnswer();
          }}
          className={`flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition ${
            !back ? "bg-white text-brand-dark shadow-sm" : "text-inkSoft"
          }`}
        >
          {t("writeDirZh2En")}
        </button>
        <button
          onClick={() => {
            setDir("en2zh");
            resetAnswer();
          }}
          className={`flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition ${
            back ? "bg-white text-brand-dark shadow-sm" : "text-inkSoft"
          }`}
        >
          {t("writeDirEn2Zh")}
        </button>
      </div>

      {/* 题干 */}
      <div className="rounded-sm border border-line bg-white p-6 text-center shadow-sm">
        <p className="mb-3 text-xs font-medium text-inkFaint">
          {back ? t("writeBackSubtitle") : t("writeSubtitle")}
        </p>
        <blockquote
          className={`font-serif text-2xl leading-relaxed text-ink ${
            back ? "" : "tracking-wide"
          }`}
        >
          {back ? item.en : item.zh}
        </blockquote>
        <p className="mt-3 text-xs text-inkFaint">
          《{item.poem.title}》· {item.poem.dynasty}·{item.poem.author} ·{" "}
          {item.poem.stage}
          {item.poem.kind}
        </p>

        <div className="mt-3">
          {showTip ? (
            <p className="text-xs text-brand">
              {back ? t("writeBackTipWords") : t("writeTipWords")}：
              {back
                ? tipWords.map((k) => k.zh).join("、")
                : tipWords.map((k) => `${k.w}（${k.zh}）`).join("、")}
            </p>
          ) : (
            <button
              onClick={() => setShowTip(true)}
              className="text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
            >
              {t("writeTip")}
            </button>
          )}
        </div>
      </div>

      {/* 作答 */}
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !submitted) {
              void submit();
            }
          }}
          disabled={submitted}
          rows={4}
          placeholder={
            back ? t("writeBackPlaceholder") : t("writePlaceholder")
          }
          className="w-full rounded-sm border border-line p-4 text-sm leading-relaxed focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-paper"
          aria-label="your translation"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!submitted ? (
            <>
              <button
                onClick={() => void submit()}
                disabled={!draft.trim()}
                className="btn-primary"
              >
                {t("writeSubmit")}
              </button>
              <button
                onClick={() => setShowRef(true)}
                className="rounded-sm border border-line px-3 py-2 text-xs text-inkSoft transition hover:border-brand hover:text-brand"
              >
                {t("writeShowRef")}
              </button>
              <button
                onClick={advance}
                className="rounded-sm px-3 py-2 text-xs text-inkFaint underline underline-offset-2 hover:text-inkSoft"
              >
                {t("writeSkip")}
              </button>
              <span className="text-xs text-inkFaint">⌘/Ctrl + Enter</span>
            </>
          ) : (
            <button
              onClick={advance}
              className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink"
            >
              {t("writeNext")}
            </button>
          )}
          {loading && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded-sm border border-line px-3 py-2 text-xs text-inkSoft"
            >
              {t("writeStop")}
            </button>
          )}
        </div>
      </div>

      {/* 对照（提交前后都可看） */}
      {showRef && (
        <div className="rounded-sm border border-dashed border-line bg-paper p-4">
          <p className="text-xs text-inkFaint">
            {back ? t("writeBackRefTitle") : t("writeRefTitle")}
          </p>
          <p className="mt-1 font-serif text-sm leading-relaxed text-ink">
            {back ? item.zh : item.en}
          </p>
        </div>
      )}

      {/* 即时自评 */}
      {self && !back && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-sm border border-line bg-white p-4">
            <p className="text-xs text-inkSoft">{t("writeSelfScore")}</p>
            <p className="mt-1 text-3xl font-bold text-brand">{self.score}</p>
            <p className="mt-1 text-[11px] text-inkFaint">
              {t("writeDisclaimer")}
            </p>
          </div>
          <div className="rounded-sm border border-line bg-white p-4">
            <p className="text-xs text-inkSoft">
              {t("writeSelfHit", { a: self.hit.length, b: self.total })}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-inkSoft">
              {self.hit.length > 0 ? self.hit.join(" · ") : "—"}
            </p>
          </div>
          <div className="rounded-sm border border-line bg-white p-4">
            <p className="text-xs text-inkSoft">
              {t("writeSelfLen", { v: self.ratio.toFixed(2) })}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-inkSoft">
              {t("writeSelfLenNote")}
            </p>
          </div>
        </div>
      )}

      {fit !== null && back && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-sm border border-line bg-white p-4">
            <p className="text-xs text-inkSoft">{t("writeFitScore")}</p>
            <p className="mt-1 text-3xl font-bold text-brand">
              {Math.round(fit * 100)}
            </p>
            <p className="mt-1 text-[11px] text-inkFaint">
              {t("writeFitNote")}
            </p>
          </div>
          <div className="rounded-sm border border-line bg-white p-4">
            <p className="text-xs text-inkSoft">{t("writeBackWhy")}</p>
            <p className="mt-2 text-xs leading-relaxed text-inkSoft">
              {t("writeBackWhyBody")}
            </p>
          </div>
        </div>
      )}

      {/* 批注：本地规则，提交即得，不联网 */}
      {notes.length > 0 && (
        <section className="rounded-sm border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">
            {t("writeNotesTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {notes.map((n, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-ink"
              >
                <span
                  className={
                    n.tone === "good"
                      ? "text-ok"
                      : n.tone === "bad"
                        ? "text-bad"
                        : "text-warn"
                  }
                >
                  {n.tone === "good" ? "✓" : n.tone === "bad" ? "!" : "·"}
                </span>
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-inkFaint">
            {t("writeNotesLocal")}
          </p>
        </section>
      )}


      {/* 细讲是可选的一步，读者要才走 */}
      {submitted && !aiOut && !loading && !err && (
        <button
          onClick={() => void askAi()}
          className="self-start rounded-sm border border-line px-4 py-2 text-sm text-inkSoft transition hover:border-brand hover:text-brand"
        >
          {t("writeAskAi")}
        </button>
      )}

      {/* 细讲 */}
      {(loading || aiOut || err) && (
        <section className="space-y-2 rounded-sm border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">
            {t("writeAiTitle")}
          </h2>
          {err && (
            <p className="rounded-sm bg-badWash px-3 py-2 text-sm text-bad">
              {err}
            </p>
          )}
          {(loading || aiOut) && (
            <div className="text-sm leading-relaxed text-ink">
              <MdText src={aiOut} />
              {loading && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
