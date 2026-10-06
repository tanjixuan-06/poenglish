"use client";

import Link from "next/link";
import PageHeader from "./PageHeader";
import { useLang } from "./LangProvider";
import { IMAGERY, poemsOfImagery } from "../lib/imagery";

/**
 * 意象园林：十二枚意象签。
 * 不做卡片矩阵，沿用「六个去处」的细线列表版式——
 * 像一页目录，安静地列着，让孩子自己挑一条小路。
 */
export default function ImageryIndex() {
  const { t, lang } = useLang();
  const zh = lang === "zh";

  return (
    <div className="space-y-8">
      <PageHeader title={t("navImagery")} sub={t("imageryIntro")} />

      <div className="grid gap-x-10 sm:grid-cols-2">
        {IMAGERY.map((ig) => {
          const n = poemsOfImagery(ig).length;
          return (
            <Link
              key={ig.key}
              href={`/imagery/${ig.key}`}
              className="group flex items-center gap-4 border-b border-line py-4 transition-colors hover:border-brand/40"
            >
              <span className="w-16 shrink-0 font-serif text-[26px] tracking-[0.1em] text-ink transition-colors group-hover:text-cinnabar">
                {zh ? ig.zh : ig.en}
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-[1.85] text-inkSoft">
                {zh ? ig.intro : ig.introEn}
              </span>
              <span className="shrink-0 text-xs text-inkFaint">{n}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
