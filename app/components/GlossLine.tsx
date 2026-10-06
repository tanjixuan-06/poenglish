"use client";

import { Fragment, useState } from "react";
import { lookupWord } from "../lib/wordgloss";
import { IMAGERY_NOTES, IMAGERY_EN_NOTES } from "../lib/imagery-notes";
import { useLang } from "./LangProvider";

/**
 * 点词识义：双向。
 *
 * - dir="en"（默认）：把一行英文切成词，查得到词义的词加虚线底；
 *   桌面悬停即浮出中文释义，触屏点一下固定显示、再点收起。
 *   若命中的是常见意象词（月/柳/舟…），还会浮出一句「典故小注」。
 * - dir="zh"：把一段中文按本诗的 keywords 反向匹配，命中的中文词加虚线底，
 *   悬停/点按浮出对应英文；意象词同样带典故小注。
 *
 * 关键：词上的点击必须 stopPropagation，否则会连带触发外层整句的朗读。
 *
 * 只在「识义」模式打开（on=true）时启用；关闭时原样输出纯文本。
 */

interface ZhChunk {
  text: string;
  en: string | null;
}

/** 在中文文本里找出命中关键词的区间，按长度优先、互不重叠 */
function segmentZh(text: string, zhMap: Map<string, string>): ZhChunk[] {
  const keys = [...zhMap.keys()].sort((a, b) => b.length - a.length);
  const ranges: { start: number; end: number; en: string }[] = [];
  for (const k of keys) {
    if (!k) continue;
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(k, from);
      if (idx < 0) break;
      const end = idx + k.length;
      const overlap = ranges.some((r) => idx < r.end && end > r.start);
      if (!overlap) ranges.push({ start: idx, end, en: zhMap.get(k)! });
      from = end;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const chunks: ZhChunk[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor)
      chunks.push({ text: text.slice(cursor, r.start), en: null });
    chunks.push({ text: text.slice(r.start, r.end), en: r.en });
    cursor = r.end;
  }
  if (cursor < text.length) chunks.push({ text: text.slice(cursor), en: null });
  return chunks;
}

function Word({
  children,
  en,
  note,
  index,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  en: string;
  note?: string;
  index: number;
  open: number | null;
  setOpen: (fn: (o: number | null) => number | null) => void;
}) {
  const isOpen = open === index;
  return (
    <span
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => (o === index ? null : index));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => (o === index ? null : index));
        }
      }}
      className="group relative cursor-pointer border-b border-dotted border-brand/60 outline-none focus-visible:bg-brand/10"
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-[15rem] -translate-x-1/2 whitespace-normal rounded-sm border border-line bg-white px-2.5 py-1.5 text-left font-serif text-[13px] leading-snug text-ink shadow-sm transition-opacity duration-150 ${
          isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <span>{en}</span>
        {note && (
          <span className="mt-1 block text-[11px] leading-snug text-cinnabar/80">
            {note}
          </span>
        )}
      </span>
    </span>
  );
}

export default function GlossLine({
  text,
  on,
  dir = "en",
  local,
  zhMap,
}: {
  text: string;
  on: boolean;
  dir?: "en" | "zh";
  local?: Map<string, string>;
  zhMap?: Map<string, string>;
}) {
  const { lang } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  if (!on) return <>{text}</>;

  if (dir === "zh") {
    const chunks = segmentZh(text, zhMap ?? new Map());
    return (
      <>
        {chunks.map((c, i) =>
          c.en ? (
            <Word
              key={i}
              en={c.en}
              note={IMAGERY_NOTES[c.text]?.[lang]}
              index={i}
              open={open}
              setOpen={setOpen}
            >
              {c.text}
            </Word>
          ) : (
            <Fragment key={i}>{c.text}</Fragment>
          )
        )}
      </>
    );
  }

  // 英文方向：按词切分查中文；意象词额外带典故小注
  const parts = text.split(/([A-Za-z][A-Za-z'’-]*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const zh = /^[A-Za-z]/.test(part) ? lookupWord(part, local) : undefined;
        if (!zh) return <Fragment key={i}>{part}</Fragment>;
        const note = IMAGERY_EN_NOTES[part.toLowerCase()]?.[lang];
        return (
          <Word
            key={i}
            en={zh}
            note={note}
            index={i}
            open={open}
            setOpen={setOpen}
          >
            {part}
          </Word>
        );
      })}
    </>
  );
}
