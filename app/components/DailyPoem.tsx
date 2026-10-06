"use client";

import { useCallback, useEffect, useState } from "react";
import { poemOfTheDay, type Poem } from "../config/poems";
import { termPoemOfTheDay, termRange, type SolarTerm } from "../lib/solarterms";
import { useLang } from "./LangProvider";
import PoemDisplay from "./PoemDisplay";
import ShareCard from "./ShareCard";

const CHECK_KEY = "poenglish-checkin";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function loadDates(): string[] {
  try {
    const raw = window.localStorage.getItem(CHECK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** 从今天往回数连续打卡天数 */
function calcStreak(dates: Set<string>, from: Date): number {
  let n = 0;
  const cur = new Date(from);
  while (dates.has(dayKey(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export default function DailyPoem() {
  const { t, lang } = useLang();
  // 日期依赖客户端时区，放到挂载后再算，避免 SSR 与首帧不一致
  const [poem, setPoem] = useState<Poem | null>(null);
  const [term, setTerm] = useState<SolarTerm | null>(null);
  const [today, setToday] = useState("");
  const [checked, setChecked] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const d = new Date();
    // 时令优先：节气池里有诗就按节气读，否则回退普通每日诗
    const r = termPoemOfTheDay(d);
    setPoem(r ? r.poem : poemOfTheDay(d));
    setTerm(r ? r.term : null);
    setToday(
      lang === "zh"
        ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
        : d.toDateString()
    );
    const dates = loadDates();
    const key = dayKey(d);
    setChecked(dates.includes(key));
    setStreak(calcStreak(new Set(dates), d));
  }, [lang]);

  const checkin = useCallback(() => {
    const d = new Date();
    const key = dayKey(d);
    const dates = loadDates();
    if (dates.includes(key)) return;
    const next = [...dates, key].slice(-400);
    try {
      window.localStorage.setItem(CHECK_KEY, JSON.stringify(next));
    } catch {
      /* 隐私模式下静默失败 */
    }
    setChecked(true);
    setStreak(calcStreak(new Set(next), d));
  }, []);

  if (!poem) {
    return (
      <p className="py-12 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  return (
    <div className="space-y-9">
      <header className="text-center">
        <h1 className="h-page">{t("dailyTitle")}</h1>
        <div className="mx-auto mt-3.5 flex items-center justify-center gap-2.5">
          <span className="h-px w-8 bg-line" />
          <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
          <span className="h-px w-8 bg-line" />
        </div>
        <p className="mt-3 text-[13px] tracking-wide text-inkSoft">
          {t("dailyDate", { v: today })}
        </p>
        {term && (
          <p className="mt-3 inline-block border border-cinnabar/30 px-3 py-1 text-[13px] tracking-wide text-cinnabar/90">
            {t("dailyTerm", { v: lang === "zh" ? term.name : term.nameEn })}
            <span className="mx-1.5 text-cinnabar/40">·</span>
            <span>
              {lang === "zh"
                ? `（${termRange(term, "zh")}）`
                : `(${termRange(term, "en")})`}
            </span>
            <span className="mx-1.5 text-cinnabar/40">·</span>
            {lang === "zh" ? term.hint : term.hintEn}
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={checkin}
          disabled={checked}
          className={checked ? "btn-ghost" : "btn-primary"}
        >
          {checked ? t("dailyChecked") : t("dailyCheckin")}
        </button>
        {streak > 0 && (
          <span className="text-[13px] text-inkSoft">
            {t("dailyStreak", { n: streak })}
          </span>
        )}
      </div>

      <PoemDisplay poem={poem} heading="h1" />

      <ShareCard poem={poem} />
    </div>
  );
}
