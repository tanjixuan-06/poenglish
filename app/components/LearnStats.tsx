"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";
import VocabBook from "./VocabBook";
import {
  clearPractice,
  loadPractice,
  practiceStats,
  checkinStreak,
  type PracticeKind,
  type PracticeRecord,
} from "../lib/progress";
import { loadVocab } from "../lib/vocab";
import { loadSrs, masteredCount } from "../lib/srs";
import { applyBackup, downloadBackup } from "../lib/backup";

const KIND_KEY: Record<PracticeKind, string> = {
  write: "meKindWrite",
  backwrite: "meKindBack",
  cloze: "meKindCloze",
  guess: "meKindGuess",
  recite: "meKindRecite",
};

const KIND_COLOR: Record<PracticeKind, string> = {
  write: "bg-cinnabar",
  backwrite: "bg-ink",
  cloze: "bg-inkSoft",
  guess: "bg-warn",
  recite: "bg-inkFaint",
};

const ORDER: PracticeKind[] = [
  "write",
  "backwrite",
  "cloze",
  "recite",
  "guess",
];

function Card({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-sm border border-line bg-white p-4">
      <p className="text-xs text-inkSoft">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-inkFaint">{unit}</span>}
      </p>
    </div>
  );
}

export default function LearnStats() {
  const { t, lang } = useLang();
  const [ready, setReady] = useState(false);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [vocabN, setVocabN] = useState(0);
  const [showAllWeak, setShowAllWeak] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    const list = loadPractice();
    setRecords(list);
    setStreak(checkinStreak());
    setMastered(masteredCount(loadSrs()));
    setVocabN(loadVocab().length);
    setReady(true);
  };

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener("poenglish-practice-change", onChange);
    window.addEventListener("poenglish-vocab-change", onChange);
    window.addEventListener("poenglish-srs-change", onChange);
    return () => {
      window.removeEventListener("poenglish-practice-change", onChange);
      window.removeEventListener("poenglish-vocab-change", onChange);
      window.removeEventListener("poenglish-srs-change", onChange);
    };
  }, []);

  const stats = practiceStats(records);
  const maxDay = Math.max(1, ...stats.last7.map((d) => d.n));
  const weak = showAllWeak ? stats.weak : stats.weak.slice(0, 5);

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = applyBackup(String(reader.result || ""));
      if (!r.ok) {
        setMsg(t("meImportFail"));
        return;
      }
      setMsg(t("meImportOk", { n: r.addedPractice, m: r.addedVocab }));
      reload();
    };
    reader.readAsText(file);
  };

  if (!ready) {
    return (
      <p className="py-12 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* 概览 */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card label={t("meTotal")} value={stats.total} unit={t("meUnit")} />
          <Card label={t("meDays")} value={stats.days} unit={t("meUnitDay")} />
          <Card label={t("meAvg")} value={stats.avg} />
          <Card label={t("mePoems")} value={stats.poems} unit={t("meUnitPoem")} />
          <Card label={t("meStreak")} value={streak} unit={t("meUnitDay")} />
          <Card label={t("meMastered")} value={mastered} unit={t("vocabUnit")} />
        </div>
        {stats.total === 0 && (
          <div className="rounded-sm border border-dashed border-line bg-white p-6 text-center">
            <p className="text-sm text-inkSoft">{t("meNoData")}</p>
            <Link
              href="/game"
              className="btn-primary mt-4 px-5 py-2.5"
            >
              {t("meGoPractice")}
            </Link>
          </div>
        )}
      </section>

      {/* 最近 7 天 */}
      {stats.total > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{t("meLast7")}</h2>
          <div className="rounded-sm border border-line bg-white p-5">
            <div className="flex h-28 items-end gap-2">
              {stats.last7.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[11px] text-inkFaint">
                    {d.n > 0 ? d.avg : ""}
                  </span>
                  <div
                    className={`w-full rounded-t ${
                      d.n > 0 ? "bg-brand" : "bg-paperDim"
                    }`}
                    style={{
                      height: `${d.n > 0 ? Math.max(6, (d.n / maxDay) * 80) : 4}px`,
                    }}
                  />
                  <span className="text-[11px] text-inkFaint">
                    {d.day.slice(5).replace("-", "/")}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-inkFaint">{t("meLast7Note")}</p>
          </div>
        </section>
      )}

      {/* 练习分布 */}
      {stats.total > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{t("meDist")}</h2>
          <div className="space-y-2 rounded-sm border border-line bg-white p-5">
            {ORDER.map((k) => {
              const n = stats.byKind[k] || 0;
              const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-inkSoft">{t(KIND_KEY[k])}</span>
                    <span className="text-inkFaint">
                      {n} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-paperDim">
                    <div
                      className={`h-full rounded-full ${KIND_COLOR[k]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 错句本 */}
      {stats.weak.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {t("meWeak")}
              <span className="ml-1 text-xs font-normal text-inkFaint">
                {stats.weak.length}
              </span>
            </h2>
            {stats.weak.length > 5 && (
              <button
                onClick={() => setShowAllWeak((v) => !v)}
                className="text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
              >
                {showAllWeak ? t("meCollapse") : t("meExpandAll")}
              </button>
            )}
          </div>
          <p className="text-xs text-inkFaint">{t("meWeakDesc")}</p>
          <div className="space-y-2">
            {weak.map((r, i) => (
              <Link
                key={`${r.at}-${i}`}
                href={`/poems/${r.slug}`}
                className="block rounded-sm border border-line bg-white p-4 transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded-md bg-paperDim px-2 py-0.5 text-inkSoft">
                    {t(KIND_KEY[r.kind] || "meKindWrite")}
                  </span>
                  <span className="text-inkFaint">
                    {r.score} · {new Date(r.at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 font-serif text-sm text-ink">{r.src}</p>
                <p className="mt-2 text-xs text-inkSoft">
                  <span className="text-inkFaint">{t("writeYours")}：</span>
                  {r.mine}
                </p>
                <p className="mt-1 text-xs text-inkSoft">
                  <span className="text-inkFaint">{t("writeRef")}：</span>
                  {r.ref}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 生词本 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            {t("meVocab")}
            <span className="ml-1 text-xs font-normal text-inkFaint">{vocabN}</span>
          </h2>
          <Link
            href="/review"
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {t("meGoReview")}
          </Link>
        </div>
        <VocabBook />
      </section>

      {/* 数据备份 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">{t("meBackup")}</h2>
        <p className="text-xs text-inkFaint">{t("meBackupDesc")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => downloadBackup()}
            className="btn-primary"
          >
            {t("meExport")}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost"
          >
            {t("meImport")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          {records.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(t("meClearPracticeConfirm"))) {
                  clearPractice();
                  reload();
                }
              }}
              className="text-xs text-inkFaint underline underline-offset-2 hover:text-bad"
            >
              {t("meClearPractice")}
            </button>
          )}
        </div>
        {msg && (
          <p className="rounded-sm bg-brand/5 px-3 py-2 text-xs text-brand">
            {msg}
          </p>
        )}
      </section>

    </div>
  );
}
