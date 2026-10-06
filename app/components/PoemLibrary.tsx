"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KIND_LABEL, POEMS, STAGE_LABEL, type Poem } from "../config/poems";
import { useLang } from "./LangProvider";

const STAGES: ("小学" | "初中" | "高中")[] = ["小学", "初中", "高中"];

export default function PoemLibrary() {
  const { t, lang } = useLang();
  const [dynasty, setDynasty] = useState("all");
  const [theme, setTheme] = useState("all");
  const [stage, setStage] = useState("all");

  const dynasties = useMemo(
    () => Array.from(new Set(POEMS.map((p) => p.dynasty))),
    []
  );
  const themes = useMemo(
    () => Array.from(new Set(POEMS.map((p) => p.theme))),
    []
  );

  const list = useMemo(
    () =>
      POEMS.filter(
        (p) =>
          (dynasty === "all" || p.dynasty === dynasty) &&
          (theme === "all" || p.theme === theme) &&
          (stage === "all" || p.stage === stage)
      ),
    [dynasty, theme, stage]
  );

  const Chip = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`rounded-sm px-2.5 py-1 text-[13px] leading-none transition-colors ${
        active
          ? "bg-brand text-white"
          : "border border-line text-inkSoft hover:border-brand/50 hover:text-brand"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* 筛选 */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs text-inkFaint">
            {lang === "zh" ? "学段" : "Stage"}
          </span>
          <Chip active={stage === "all"} onClick={() => setStage("all")}>
            {t("poemsAll")}
          </Chip>
          {STAGES.map((s) => (
            <Chip key={s} active={stage === s} onClick={() => setStage(s)}>
              {lang === "zh"
                ? `${STAGE_LABEL[s].zh}（${POEMS.filter((p) => p.stage === s).length}）`
                : `${STAGE_LABEL[s].en} (${POEMS.filter((p) => p.stage === s).length})`}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs text-inkFaint">
            {t("poemsFilterDynasty")}
          </span>
          <Chip active={dynasty === "all"} onClick={() => setDynasty("all")}>
            {t("poemsAll")}
          </Chip>
          {dynasties.map((d) => (
            <Chip
              key={d}
              active={dynasty === d}
              onClick={() => setDynasty(d)}
            >
              {d}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-10 shrink-0 text-xs text-inkFaint">
            {t("poemsFilterTheme")}
          </span>
          <Chip active={theme === "all"} onClick={() => setTheme("all")}>
            {t("poemsAll")}
          </Chip>
          {themes.map((th, i) => {
            const en = Array.from(new Set(POEMS.map((p) => p.themeEn)))[
              themes.indexOf(th)
            ];
            return (
              <Chip
                key={`${th}-${i}`}
                active={theme === th}
                onClick={() => setTheme(th)}
              >
                {lang === "zh" ? th : en || th}
              </Chip>
            );
          })}
        </div>
      </div>

      <p className="border-b border-line pb-2.5 text-xs text-inkFaint">
        {t("poemsCount", { n: list.length })}
      </p>

      {/* 列表：像一叠书名卡 */}
      {list.length === 0 ? (
        <p className="py-14 text-center text-[13px] text-inkFaint">
          {t("poemsEmpty")}
        </p>
      ) : (
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {list.map((p: Poem) => (
            <Link
              key={p.slug}
              href={`/poems/${p.slug}`}
              className="group border-b border-line py-4 transition-colors hover:border-brand/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-[16px] text-ink transition-colors group-hover:text-brand">
                  {lang === "zh" ? p.title : p.titleEn}
                </h2>
                <span className="shrink-0 text-[11px] text-inkFaint">
                  {lang === "zh" ? p.dynasty : p.dynastyEn}
                </span>
              </div>
              <p className="mt-1 text-xs text-inkFaint">
                {lang === "zh" ? p.author : p.authorEn}
              </p>
              <p className="mt-2 line-clamp-2 font-serif text-[13px] italic leading-[1.85] text-inkSoft">
                {p.lines[0].en}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="tag">
                  {lang === "zh"
                    ? STAGE_LABEL[p.stage]?.zh ?? p.stage
                    : STAGE_LABEL[p.stage]?.en ?? p.stage}
                </span>
                <span className="tag">
                  {lang === "zh"
                    ? KIND_LABEL[p.kind]?.zh ?? p.kind
                    : KIND_LABEL[p.kind]?.en ?? p.kind}
                </span>
                {p.cross && (
                  <span className="tag !border-cinnabar/25 !text-cinnabar/80">
                    {lang === "zh" ? p.cross.field : p.cross.fieldEn}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
