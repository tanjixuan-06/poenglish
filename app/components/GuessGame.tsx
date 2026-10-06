"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { POEMS, type Poem } from "../config/poems";
import { addPractice } from "../lib/progress";
import { useLang } from "./LangProvider";
import PoemDisplay from "./PoemDisplay";

type Question = {
  poem: Poem;
  line: string;
  options: Poem[];
};

const ROUND = 10;
const BEST_KEY = "poenglish-best";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 按难度挑一句英译作为题干 */
function pickLine(p: Poem, level: number): string {
  if (level === 1) return p.lines[0].en;
  if (level === 2) return p.lines[Math.floor(Math.random() * p.lines.length)].en;
  const mid = p.lines.length > 2 ? p.lines.slice(1, -1) : p.lines;
  return mid[Math.floor(Math.random() * mid.length)].en;
}

function buildQueue(level: number): Question[] {
  const pool = level === 0 ? POEMS : POEMS.filter((p) => p.level === level);
  const src = pool.length >= 4 ? pool : POEMS;
  const picked = shuffle(src).slice(0, Math.min(ROUND, src.length));
  return picked.map((poem) => {
    const others = shuffle(src.filter((p) => p.slug !== poem.slug)).slice(0, 3);
    return {
      poem,
      line: pickLine(poem, level === 0 ? 2 : level),
      options: shuffle([poem, ...others]),
    };
  });
}

export default function GuessGame() {
  const { t, lang } = useLang();
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [ready, setReady] = useState(false);

  // 题目在客户端生成，避免服务端/客户端随机不一致
  useEffect(() => {
    setQueue(buildQueue(level));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setShowHint(false);
    setReady(true);
  }, [level]);

  useEffect(() => {
    const b = Number(window.localStorage.getItem(BEST_KEY) || 0);
    setBest(Number.isFinite(b) ? b : 0);
  }, []);

  const question = queue[idx];
  const finished = ready && queue.length > 0 && idx >= queue.length;

  const onPick = useCallback(
    (slug: string) => {
      if (picked || !question) return;
      setPicked(slug);
      const correct = slug === question.poem.slug;
      addPractice({
        kind: "guess",
        slug: question.poem.slug,
        title: question.poem.title,
        src: question.line,
        mine: question.options.find((o) => o.slug === slug)?.title || slug,
        ref: question.poem.title,
        score: correct ? 100 : 0,
      });
      if (correct) {
        const gain = 10 + Math.min(streak, 5) * 2;
        const nextStreak = streak + 1;
        const nextScore = score + gain;
        setScore(nextScore);
        setStreak(nextStreak);
        if (nextScore > best) {
          setBest(nextScore);
          window.localStorage.setItem(BEST_KEY, String(nextScore));
        }
      } else {
        setStreak(0);
      }
    },
    [picked, question, streak, score, best]
  );

  const next = useCallback(() => {
    setPicked(null);
    setShowHint(false);
    setIdx((i) => i + 1);
  }, []);

  const restart = useCallback(() => {
    setQueue(buildQueue(level));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setShowHint(false);
  }, [level]);

  const label = useMemo(
    () => (p: Poem) =>
      lang === "zh" ? `${p.title} · ${p.author}` : `${p.titleEn} · ${p.authorEn}`,
    [lang]
  );

  if (!ready) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  if (finished) {
    const pct = Math.round((score / (queue.length * 20)) * 100);
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-sm border border-brand/25 bg-brand/5 p-8">
          <p className="text-sm text-inkSoft">
            {t("gameProgress", { n: queue.length })} · {t("secGameTitle")}
          </p>
          <p className="mt-3 text-5xl font-bold text-brand">{score}</p>
          <p className="mt-2 text-sm text-inkSoft">
            {t("gameBest")} {best} ·{" "}
            {Math.min(pct, 100)}%{" "}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={restart}
            className="btn-primary px-5 py-2.5"
          >
            {t("gameRestart")}
          </button>
          <Link
            href="/poems"
            className="rounded-sm border border-line px-5 py-2.5 text-sm text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("navPoems")}
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const answered = picked !== null;
  const isRight = picked === question.poem.slug;
  const hintText = [
    t("gameTipDynasty", {
      v: lang === "zh" ? question.poem.dynasty : question.poem.dynastyEn,
    }),
    t("gameTipAuthor", {
      v: lang === "zh" ? question.poem.author : question.poem.authorEn,
    }),
  ].join(" · ");

  return (
    <div className="space-y-5">
      {/* 计分条 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3 text-sm">
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("gameScore")} </span>
            <span className="font-semibold text-brand-dark">{score}</span>
          </span>
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("gameStreak")} </span>
            <span className="font-semibold text-brand-dark">{streak}</span>
          </span>
          <span className="hidden rounded-sm bg-paperDim px-2.5 py-1 sm:inline">
            <span className="text-inkFaint">{t("gameBest")} </span>
            <span className="font-semibold text-inkSoft">{best}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}
            className="rounded-sm border border-line px-2 py-1 text-xs text-inkSoft"
            aria-label="difficulty"
          >
            <option value={0}>{t("levelAll")}</option>
            <option value={1}>{t("level1")}</option>
            <option value={2}>{t("level2")}</option>
            <option value={3}>{t("level3")}</option>
          </select>
          <span className="text-xs text-inkFaint">
            {t("gameProgress", { n: idx + 1 })} / {queue.length}
          </span>
        </div>
      </div>

      {/* 题干 */}
      <div className="rounded-sm border border-line bg-white p-6 text-center shadow-sm">
        <p className="mb-3 text-xs font-medium text-inkFaint">
          {t("gameSubtitle")}
        </p>
        <blockquote className="font-serif text-xl leading-relaxed text-ink">
          {question.line}
        </blockquote>
        <div className="mt-4">
          {showHint ? (
            <p className="text-xs text-brand">{hintText}</p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
            >
              {t("gameShowTip")}
            </button>
          )}
        </div>
      </div>

      {/* 选项 */}
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((p) => {
          const isAnswer = p.slug === question.poem.slug;
          const isPicked = p.slug === picked;
          let cls =
            "rounded-sm border px-4 py-3 text-left text-sm transition hover:border-brand ";
          if (!answered) {
            cls += "border-line bg-white text-ink";
          } else if (isAnswer) {
            cls += "border-ok bg-okWash text-ok";
          } else if (isPicked) {
            cls += "border-bad/60 bg-badWash text-bad";
          } else {
            cls += "border-line bg-white text-inkFaint";
          }
          return (
            <button
              key={p.slug}
              onClick={() => onPick(p.slug)}
              disabled={answered}
              className={cls}
            >
              {label(p)}
            </button>
          );
        })}
      </div>

      {/* 反馈 */}
      {answered && (
        <div className="space-y-4">
          <div
            className={`flex items-center justify-between rounded-sm px-4 py-3 text-sm ${
              isRight
                ? "bg-okWash text-ok"
                : "bg-badWash text-bad"
            }`}
          >
            <span className="font-medium">
              {isRight ? t("gameCorrect") : t("gameWrong")}
            </span>
            {!isRight && (
              <span className="text-xs">
                {t("gameAnswerLabel")}：{label(question.poem)}
              </span>
            )}
            <button
              onClick={next}
              className="rounded-sm bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink"
            >
              {t("gameNext")}
            </button>
          </div>

          <PoemDisplay poem={question.poem} showLink compact />
        </div>
      )}
    </div>
  );
}
