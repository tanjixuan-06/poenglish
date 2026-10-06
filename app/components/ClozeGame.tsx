"use client";

import { useCallback, useEffect, useState } from "react";
import { POEMS, type Poem } from "../config/poems";
import { contentWords } from "../lib/translatescore";
import { addPractice } from "../lib/progress";
import { useLang } from "./LangProvider";

type Q = { poem: Poem; zh: string; en: string; word: string; cloze: string };

const ROUND = 10;
const BEST_KEY = "poenglish-cloze-best";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 命题：从一句英译里挖掉一个实词（≥4 字母、纯字母）。
 * 原则：1) 优先挖诗的重点词（记忆价值最高）；2) 空位落在句中段——
 * 不挖句首第一词、也不挖句尾最后一词，避免位置可预测，更像真正的完形填空；
 * 3) 同句有多个候选时随机取，避免每次都挖同一个词。
 */
function makeQuestion(poem: Poem): Q | null {
  const line = poem.lines[Math.floor(Math.random() * poem.lines.length)];
  const keySet = new Set(poem.keywords.map((k) => k.w.toLowerCase()));
  // 按句中顺序取实词候选
  const cands = contentWords(line.en).filter(
    (w) => w.length >= 4 && /^[a-z]+$/.test(w)
  );
  if (cands.length === 0) return null;

  // 候选下标：优先重点词；再排除句首(0)与句尾(末位)，让空落在句中
  const keyed = cands
    .map((w, i) => (keySet.has(w) ? i : -1))
    .filter((i) => i >= 0);
  const base = keyed.length > 0 ? keyed : cands.map((_, i) => i);
  const mid = base.filter((i) => i > 0 && i < cands.length - 1);
  const pool = mid.length > 0 ? mid : base;
  const word = cands[pool[Math.floor(Math.random() * pool.length)]];

  const cloze = line.en.replace(new RegExp(`\\b${word}\\b`, "i"), "____");
  if (cloze === line.en) return null;
  return { poem, zh: line.zh, en: line.en, word, cloze };
}

function buildQueue(stage: string): Q[] {
  const pool = stage === "all" ? POEMS : POEMS.filter((p) => p.stage === stage);
  const src = pool.length ? pool : POEMS;
  const out: Q[] = [];
  for (const poem of shuffle(src)) {
    const q = makeQuestion(poem);
    if (q) out.push(q);
    if (out.length >= ROUND) break;
  }
  return out;
}

export default function ClozeGame() {
  const { t } = useLang();
  const [stage, setStage] = useState<string>("all");
  const [queue, setQueue] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [judged, setJudged] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setQueue(buildQueue(stage));
    setIdx(0);
    setTyped("");
    setJudged(null);
    setShowHint(false);
    setScore(0);
    setStreak(0);
    setReady(true);
  }, [stage]);

  useEffect(() => {
    const b = Number(window.localStorage.getItem(BEST_KEY) || 0);
    setBest(Number.isFinite(b) ? b : 0);
  }, []);

  const q = queue[idx];
  const finished = ready && queue.length > 0 && idx >= queue.length;

  const judge = useCallback(() => {
    if (!q || judged !== null) return;
    const ok =
      typed.trim().toLowerCase().replace(/[^a-z]/g, "") ===
      q.word.toLowerCase().replace(/[^a-z]/g, "");
    setJudged(ok);
    const nextScore = score + (ok ? 10 : 0);
    setScore(nextScore);
    setStreak(ok ? streak + 1 : 0);
    addPractice({
      kind: "cloze",
      slug: q.poem.slug,
      title: q.poem.title,
      src: q.cloze,
      mine: typed.trim(),
      ref: q.en,
      score: ok ? 100 : 0,
    });
    if (nextScore > best) {
      setBest(nextScore);
      window.localStorage.setItem(BEST_KEY, String(nextScore));
    }
  }, [q, judged, typed, score, streak, best]);

  const next = useCallback(() => {
    setIdx((i) => i + 1);
    setTyped("");
    setJudged(null);
    setShowHint(false);
  }, []);

  const restart = useCallback(() => {
    setQueue(buildQueue(stage));
    setIdx(0);
    setTyped("");
    setJudged(null);
    setShowHint(false);
    setScore(0);
    setStreak(0);
  }, [stage]);

  if (!ready) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  if (queue.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("clozeEmpty")}
      </p>
    );
  }

  if (finished) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-sm border border-brand/25 bg-brand/5 p-8">
          <p className="text-sm text-inkSoft">{t("writeFinish")}</p>
          <p className="mt-3 text-5xl font-bold text-brand">{score}</p>
          <p className="mt-2 text-sm text-inkSoft">
            {t("writeBest")} {best}
          </p>
        </div>
        <button
          onClick={restart}
          className="btn-primary px-5 py-2.5"
        >
          {t("writeRestart")}
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="space-y-5">
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

      <div className="rounded-sm border border-line bg-white p-6 text-center shadow-sm">
        <p className="mb-2 text-xs font-medium text-inkFaint">
          {t("clozeSubtitle")}
        </p>
        <p className="font-serif text-lg leading-relaxed text-ink">
          {q.zh}
        </p>
        <blockquote className="mt-4 font-serif text-xl leading-relaxed text-ink">
          {q.cloze}
        </blockquote>
        <p className="mt-3 text-xs text-inkFaint">
          《{q.poem.title}》· {q.poem.dynasty}·{q.poem.author}
        </p>
      </div>

      <div className="space-y-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && typed.trim() && judged === null) judge();
          }}
          disabled={judged !== null}
          placeholder={t("clozePlaceholder")}
          className="w-full rounded-sm border border-line px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-paper"
          aria-label="fill the blank"
        />
        <div className="flex flex-wrap items-center gap-2">
          {judged === null ? (
            <>
              <button
                onClick={judge}
                disabled={!typed.trim()}
                className="btn-primary"
              >
                {t("clozeSubmit")}
              </button>
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
              >
                {t("clozeHintFirst")}
              </button>
              <button
                onClick={next}
                className="rounded-sm px-3 py-2 text-xs text-inkFaint underline underline-offset-2 hover:text-inkSoft"
              >
                {t("writeSkip")}
              </button>
            </>
          ) : (
            <button
              onClick={next}
              className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink"
            >
              {t("writeNext")}
            </button>
          )}
        </div>
        {showHint && judged === null && (
          <p className="text-xs text-brand">
            {q.word[0]}…（{q.word.length} 个字母）
          </p>
        )}
      </div>

      {judged !== null && (
        <div className="space-y-3">
          <div
            className={`flex flex-wrap items-center justify-between rounded-sm px-4 py-3 text-sm ${
              judged ? "bg-okWash text-ok" : "bg-badWash text-bad"
            }`}
          >
            <span className="font-medium">
              {judged ? t("gameCorrect") : t("gameWrong")}
            </span>
            {!judged && (
              <span className="text-xs">
                {t("gameAnswerLabel")}：{q.word}
              </span>
            )}
          </div>
          <div className="rounded-sm border border-dashed border-line bg-paper p-4">
            <p className="text-xs text-inkFaint">{t("clozeFull")}</p>
            <p className="mt-1 font-serif text-sm leading-relaxed text-ink">
              {q.en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
