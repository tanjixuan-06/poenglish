"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "./LangProvider";
import { loadVocab, removeVocab, saveVocab, type VocabItem } from "../lib/vocab";
import Mnemonic from "./Mnemonic";

type Mode = "list" | "spell" | "choice";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabBook() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<VocabItem[]>([]);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("list");

  useEffect(() => {
    setItems(loadVocab());
    setReady(true);
  }, []);

  // 自测队列
  const [quizIdx, setQuizIdx] = useState(0);
  const [quiz, setQuiz] = useState<VocabItem[]>([]);
  const [typed, setTyped] = useState("");
  const [judged, setJudged] = useState<null | boolean>(null);
  const [pickedZh, setPickedZh] = useState<string | null>(null);

  const startQuiz = (m: Mode) => {
    const q = shuffle(items).slice(0, Math.min(10, items.length));
    setQuiz(q);
    setQuizIdx(0);
    setTyped("");
    setJudged(null);
    setPickedZh(null);
    setMode(m);
  };

  const current = quiz[quizIdx];
  const options = useMemo(() => {
    if (!current) return [];
    const others = shuffle(items.filter((x) => x.w !== current.w))
      .slice(0, 3)
      .map((x) => x.zh);
    return shuffle([current.zh, ...others]);
  }, [current, items]);

  const nextQuiz = () => {
    setTyped("");
    setJudged(null);
    setPickedZh(null);
    setQuizIdx((i) => i + 1);
  };

  if (!ready) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-line bg-white p-10 text-center">
        <p className="text-sm text-inkSoft">{t("vocabEmpty")}</p>
        <p className="mt-2 text-xs text-inkFaint">{t("vocabEmptyHint")}</p>
      </div>
    );
  }

  /* ---------- 拼写自测 ---------- */
  if (mode === "spell") {
    if (quizIdx >= quiz.length) {
      return (
        <div className="space-y-4 text-center">
          <div className="rounded-sm border border-brand/25 bg-brand/5 p-8">
            <p className="text-sm text-inkSoft">{t("vocabQuizDone")}</p>
            <p className="mt-2 text-3xl font-bold text-brand">
              {quiz.length} {t("vocabUnit")}
            </p>
          </div>
          <button
            onClick={() => setMode("list")}
            className="btn-primary px-5 py-2.5"
          >
            {t("vocabBackList")}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="rounded-sm border border-line bg-white p-6 text-center">
          <p className="text-xs text-inkFaint">
            {t("writeProgress", { n: quizIdx + 1 })} / {quiz.length}
          </p>
          <p className="mt-3 text-xl font-medium text-ink">
            {current.zh}
          </p>
          {current.from && (
            <p className="mt-1 text-xs text-inkFaint">{current.from}</p>
          )}
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim() && judged === null) {
                setJudged(
                  typed.trim().toLowerCase() === current.w.trim().toLowerCase()
                );
              }
            }}
            disabled={judged !== null}
            placeholder={t("vocabSpellPlaceholder")}
            className="mx-auto mt-4 block w-full max-w-sm rounded-sm border border-line px-3 py-2 text-center text-sm focus:border-brand focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {judged === null ? (
              <>
                <button
                  onClick={() =>
                    setJudged(
                      typed.trim().toLowerCase() ===
                        current.w.trim().toLowerCase()
                    )
                  }
                  disabled={!typed.trim()}
                  className="btn-primary"
                >
                  {t("vocabCheck")}
                </button>
                <button
                  onClick={() => {
                    setTyped(current.w);
                    setJudged(false);
                  }}
                  className="rounded-sm border border-line px-3 py-2 text-xs text-inkSoft"
                >
                  {t("vocabGiveUp")}
                </button>
              </>
            ) : (
              <button
                onClick={nextQuiz}
                className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white"
              >
                {t("writeNext")}
              </button>
            )}
          </div>
          {judged !== null && (
            <p
              className={`mt-3 text-sm ${
                judged ? "text-ok" : "text-bad"
              }`}
            >
              {judged ? t("gameCorrect") : `${t("gameWrong")}：${current.w}`}
            </p>
          )}
        </div>
        <button
          onClick={() => setMode("list")}
          className="text-xs text-inkFaint underline underline-offset-2"
        >
          {t("vocabBackList")}
        </button>
      </div>
    );
  }

  /* ---------- 选择自测 ---------- */
  if (mode === "choice") {
    if (quizIdx >= quiz.length) {
      return (
        <div className="space-y-4 text-center">
          <div className="rounded-sm border border-brand/25 bg-brand/5 p-8">
            <p className="text-sm text-inkSoft">{t("vocabQuizDone")}</p>
            <p className="mt-2 text-3xl font-bold text-brand">
              {quiz.length} {t("vocabUnit")}
            </p>
          </div>
          <button
            onClick={() => setMode("list")}
            className="btn-primary px-5 py-2.5"
          >
            {t("vocabBackList")}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="rounded-sm border border-line bg-white p-6 text-center">
          <p className="text-xs text-inkFaint">
            {t("writeProgress", { n: quizIdx + 1 })} / {quiz.length}
          </p>
          <p className="mt-3 font-serif text-2xl text-ink">{current.w}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((zh, i) => {
              const isAnswer = zh === current.zh;
              const isPicked = zh === pickedZh;
              let cls =
                "rounded-sm border px-4 py-3 text-sm transition hover:border-brand ";
              if (pickedZh === null) cls += "border-line bg-white text-ink";
              else if (isAnswer) cls += "border-ok bg-okWash text-ok";
              else if (isPicked) cls += "border-bad/60 bg-badWash text-bad";
              else cls += "border-line bg-white text-inkFaint";
              return (
                <button
                  key={`${zh}-${i}`}
                  onClick={() => setPickedZh(zh)}
                  disabled={pickedZh !== null}
                  className={cls}
                >
                  {zh}
                </button>
              );
            })}
          </div>
          {pickedZh !== null && (
            <button
              onClick={nextQuiz}
              className="mt-4 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              {t("writeNext")}
            </button>
          )}
        </div>
        <button
          onClick={() => setMode("list")}
          className="text-xs text-inkFaint underline underline-offset-2"
        >
          {t("vocabBackList")}
        </button>
      </div>
    );
  }

  /* ---------- 列表 ---------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-inkSoft">
          {t("vocabCount", { n: items.length })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => startQuiz("spell")}
            className="rounded-sm border border-line px-3 py-1.5 text-xs text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("vocabSpellMode")}
          </button>
          <button
            onClick={() => startQuiz("choice")}
            className="rounded-sm border border-line px-3 py-1.5 text-xs text-inkSoft transition hover:border-brand hover:text-brand"
          >
            {t("vocabChoiceMode")}
          </button>
          <button
            onClick={() => {
              if (window.confirm(t("vocabClearConfirm"))) {
                saveVocab([]);
                setItems([]);
              }
            }}
            className="btn-quiet hover:!text-bad"
          >
            {t("vocabClear")}
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((v) => (
          <div
            key={v.w}
            className="flex items-start justify-between gap-2 rounded-sm border border-line bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{v.w}</p>
              <p className="mt-0.5 text-xs text-inkSoft">{v.zh}</p>
              {v.from && (
                <p className="mt-1 text-[11px] text-inkFaint">
                  {lang === "zh" ? "来自：" : "from: "}
                  {v.from}
                </p>
              )}
              <Mnemonic w={v.w} zh={v.zh} />
            </div>
            <button
              onClick={() => {
                removeVocab(v.w);
                setItems((l) => l.filter((x) => x.w !== v.w));
              }}
              aria-label={t("vocabRemove")}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-inkFaint transition hover:text-bad"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
