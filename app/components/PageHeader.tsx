"use client";

import { useLang } from "./LangProvider";

/**
 * 全站统一页头
 *
 * 版式：居中 · 衬线标题 · 下方一道细线 · 副题。
 * 英文模式下只显示英文副题（enSub），不露出中文，避免双语混排。
 * 若英文模式未提供 enSub，则整行副题省略——留白比混杂好。
 */
export default function PageHeader({
  title,
  sub,
  enSub,
}: {
  title: string;
  /** 中文副题（一句话，说清这页做什么） */
  sub?: string;
  /** 英文副题，英文模式下显示 */
  enSub?: string;
}) {
  const { lang } = useLang();
  const desc = lang === "en" ? enSub : sub;

  return (
    <header className="mb-7 text-center">
      <h1 className="h-page">{title}</h1>
      <div className="mx-auto mt-3.5 flex items-center justify-center gap-2.5">
        <span className="h-px w-8 bg-line" />
        <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
        <span className="h-px w-8 bg-line" />
      </div>
      {desc ? (
        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-[1.85] text-inkSoft">
          {desc}
        </p>
      ) : null}
    </header>
  );
}
