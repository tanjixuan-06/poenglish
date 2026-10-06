"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { loadVocab, type VocabItem } from "../lib/vocab";
import {
  dueWords,
  gradeWord,
  loadSrs,
  masteredCount,
  type Grade,
} from "../lib/srs";
import { dueWeakItems, gradeWeak, type WeakState } from "../lib/reviewqueue";
import { POEM_MAP } from "../config/poems";
import type { PracticeKind } from "../lib/progress";

type QueueItem =
  | { type: "vocab"; item: VocabItem }
  | { type: "weak"; key: string; state: WeakState };

const WEAK_KIND_LABEL: Record<PracticeKind, string> = {
  write: "meKindWrite",
  backwrite: "meKindBack",
  cloze: "meKindCloze",
  guess: "meKindGuess",
  recite: "meKindRecite",
};

export default function ReviewQueue() {
  const { t, lang } = useLang();
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [overdueN, setOverdueN] = useState(0);
  const [freshN, setFreshN] = useState(0);
  const [weakN, setWeakN] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [typedOk, setTypedOk] = useState<boolean | null>(null);
  const [lastGrade, setLastGrade] = useState<Grade | null>(null);
  const [log, setLog] = useState<Grade[]>([]);

  const build = useCallback(() => {
    const vocab = loadVocab();
    const words = vocab.map((v) => v.w);
    const { overdue, fresh } = dueWords(words, new Date());
    const byWord = new Map(vocab.map((v) => [v.w.trim().toLowerCase(), v]));
    const items: QueueItem[] = [];
    for (const w of [...overdue, ...fresh]) {
      const it = byWord.get(w.trim().toLowerCase());
      if (it) items.push({ type: "vocab", item: it });
    }
    const weak = dueWeakItems(new Date());
    for (const w of weak) items.push({ type: "weak", key: w.key, state: w.state });

    setQueue(items);
    setOverdueN(overdue.length);
    setFreshN(fresh.length);
    setWeakN(weak.length);
    setMastered(masteredCount(loadSrs()));
    setIdx(0);
    setTyped("");
    setRevealed(false);
    setTypedOk(null);
    setLog([]);
    setReady(true);
  }, []);

  useEffect(() => {
    build();
  }, [build]);

  const next = () => {
    setIdx((i) => i + 1);
    setTyped("");
    setRevealed(false);
    setTypedOk(null);
  };

  const grade = (g: Grade) => {
    const cur = queue[idx];
    if (!cur) return;
    if (cur.type === "vocab") gradeWord(cur.item.w, g, new Date());
    else gradeWeak(cur.key, g, new Date());
    setLastGrade(g);
    setLog((l) => [...l, g]);
    next();
  };

  if (!ready) {
    return (
      <p className="py-12 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  /* 队列为空且没有任何已掌握词 */
  if (queue.length === 0 && mastered === 0 && weakN === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-sm border border-dashed border-line bg-white p-10 text-center">
          <p className="text-sm text-inkSoft">{t("reviewEmpty")}</p>
          <p className="mt-2 text-xs text-inkFaint">{t("reviewEmptyHint")}</p>
          <Link
            href="/poems"
            className="btn-primary mt-5 px-5 py-2.5"
          >
            {t("navPoems")}
          </Link>
        </div>
      </div>
    );
  }

  /* 今天没有到期项 */
  if (idx >= queue.length && log.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-line bg-white p-10 text-center">
        <p className="text-sm text-inkSoft">{t("reviewAllDone")}</p>
        <p className="mt-2 text-xs text-inkFaint">{t("reviewAllDoneHint")}</p>
        <Link
          href="/poems"
          className="btn-primary mt-5 px-5 py-2.5"
        >
          {t("navPoems")}
        </Link>
      </div>
    );
  }

  /* 今天全复习完了 */
  if (idx >= queue.length) {
    const good = log.filter((g) => g === 2).length;
    const mid = log.filter((g) => g === 1).length;
    const bad = log.filter((g) => g === 0).length;
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-sm border border-brand/25 bg-brand/5 p-8">
          <p className="text-sm text-inkSoft">{t("reviewDone")}</p>
          <p className="mt-3 text-5xl font-bold text-brand">{log.length}</p>
          <p className="mt-2 text-xs text-inkSoft">
            {t("reviewDoneHint", { n: log.length })}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs">
            <span className="rounded-sm bg-okWash px-3 py-1.5 text-ok">
              {t("reviewGrade2")} {good}
            </span>
            <span className="rounded-sm bg-warnWash px-3 py-1.5 text-warn">
              {t("reviewGrade1")} {mid}
            </span>
            <span className="rounded-sm bg-badWash px-3 py-1.5 text-bad">
              {t("reviewGrade0")} {bad}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/game"
            className="btn-primary px-5 py-2.5"
          >
            {t("navGame")}
          </Link>
          <Link
            href="/me"
            className="rounded-sm border border-line px-5 py-2.5 text-sm text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("navMe")}
          </Link>
        </div>
      </div>
    );
  }

  const cur = queue[idx];
  const total = queue.length;

  return (
    <div className="space-y-5">
      {/* 概览 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("reviewDue")} </span>
            <span className="font-semibold text-brand-dark">{overdueN}</span>
          </span>
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("reviewFresh")} </span>
            <span className="font-semibold text-inkSoft">{freshN}</span>
          </span>
          {weakN > 0 && (
            <span className="rounded-sm bg-paperDim px-2.5 py-1">
              <span className="text-inkFaint">{t("reviewWeak")} </span>
              <span className="font-semibold text-cinnabar">{weakN}</span>
            </span>
          )}
          <span className="rounded-sm bg-paperDim px-2.5 py-1">
            <span className="text-inkFaint">{t("reviewMastered")} </span>
            <span className="font-semibold text-inkSoft">{mastered}</span>
          </span>
        </div>
        <span className="text-xs text-inkFaint">
          {t("reviewLevel", { i: idx + 1, n: total })}
        </span>
      </div>

      {/* 进度条 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paperDim">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.round((idx / total) * 100)}%` }}
        />
      </div>

      {lastGrade !== null && (
        <p className="text-center text-xs text-inkFaint">
          {t("reviewRecorded")}
          <span className="ml-1 font-medium text-brand">
            {lastGrade === 2
              ? t("reviewGrade2")
              : lastGrade === 1
              ? t("reviewGrade1")
              : t("reviewGrade0")}
          </span>
        </p>
      )}

      {/* 卡片：生词本（先拼写，再对照，最后自评） */}
      {cur.type === "vocab" ? (
        <div className="rounded-sm border border-line bg-white p-8 text-center shadow-sm">
          <p className="text-xs text-inkFaint">{t("reviewPrompt")}</p>
          <p className="mt-4 text-2xl font-medium text-ink">{cur.item.zh}</p>
          {cur.item.from && (
            <p className="mt-2 text-xs text-inkFaint">
              {lang === "zh" ? "来自 " : "from "}
              {cur.item.from}
            </p>
          )}

          {!revealed ? (
            <>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTypedOk(
                      typed.trim().toLowerCase() ===
                        cur.item.w.trim().toLowerCase()
                    );
                    setRevealed(true);
                  }
                }}
                placeholder={t("reviewPlaceholder")}
                className="mx-auto mt-6 block w-full max-w-sm rounded-sm border border-line px-3 py-2 text-center text-sm focus:border-brand focus:outline-none"
              />
              <button
                onClick={() => {
                  setTypedOk(
                    typed.trim().toLowerCase() ===
                      cur.item.w.trim().toLowerCase()
                  );
                  setRevealed(true);
                }}
                className="btn-primary mt-3 px-5 py-2"
              >
                {t("reviewShow")}
              </button>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-sm bg-paper px-4 py-5">
                <p className="font-serif text-2xl text-ink">{cur.item.w}</p>
                {typed.trim() && (
                  <p
                    className={`mt-2 text-xs ${
                      typedOk ? "text-ok" : "text-bad"
                    }`}
                  >
                    {t("reviewYours")}：{typed}
                    {typedOk ? ` · ${t("gameCorrect")}` : ` · ${t("gameWrong")}`}
                  </p>
                )}
              </div>
              <p className="mt-5 text-xs text-inkSoft">{t("reviewGradeTitle")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <GradeButtons onGrade={grade} t={t} />
              </div>
            </>
          )}
        </div>
      ) : (
        /* 卡片：巩固句（低分写译/回译/背译，先回忆，再对照，最后自评） */
        <div className="rounded-sm border border-cinnabar/30 bg-white p-8 text-center shadow-sm">
          <p className="text-xs text-inkFaint">
            {t(WEAK_KIND_LABEL[cur.state.kind])}
            {POEM_MAP[cur.state.slug] &&
              ` · ${
                lang === "zh"
                  ? POEM_MAP[cur.state.slug].title
                  : POEM_MAP[cur.state.slug].titleEn
              }`}
          </p>
          <p className="mt-4 text-2xl font-medium text-ink">{cur.state.src}</p>
          <p className="mt-2 text-xs text-inkFaint">
            {cur.state.kind === "backwrite"
              ? t("reviewWeakAnswerZh")
              : t("reviewWeakAnswerEn")}
          </p>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="btn-primary mt-6 px-5 py-2"
            >
              {t("reviewShow")}
            </button>
          ) : (
            <>
              <div className="mt-6 rounded-sm bg-paper px-4 py-5">
                <p className="font-serif text-xl text-ink">{cur.state.ref}</p>
              </div>
              <p className="mt-5 text-xs text-inkSoft">{t("reviewGradeTitle")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <GradeButtons onGrade={grade} t={t} />
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-center text-xs text-inkFaint">{t("reviewWhy")}</p>
    </div>
  );
}

function GradeButtons({
  onGrade,
  t,
}: {
  onGrade: (g: Grade) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <>
      <button
        onClick={() => onGrade(0)}
        className="rounded-sm border border-bad/30 bg-badWash px-3 py-2.5 text-sm text-bad transition hover:border-bad/60"
      >
        {t("reviewGrade0")}
      </button>
      <button
        onClick={() => onGrade(1)}
        className="rounded-sm border border-warn/30 bg-warnWash px-3 py-2.5 text-sm text-warn transition hover:border-warn/60"
      >
        {t("reviewGrade1")}
      </button>
      <button
        onClick={() => onGrade(2)}
        className="rounded-sm border border-ok/30 bg-okWash px-3 py-2.5 text-sm text-ok transition hover:border-ok/60"
      >
        {t("reviewGrade2")}
      </button>
    </>
  );
}
