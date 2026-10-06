"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";
import type { Poem } from "../config/poems";

const W = 1080;
const H = 1350;
const PAD = 96;
const MAXW = W - PAD * 2;

const BG = "#FDFBF7";
const INK = "#1F2937";
const MUTE = "#6B7280";
const BRAND = "#185FA5";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const tokens = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const tk of tokens) {
    const test = cur ? `${cur} ${tk}` : tk;
    if (ctx.measureText(test).width <= maxW) {
      cur = test;
      continue;
    }
    if (cur) lines.push(cur);
    let t = tk;
    // 超长片段（如整段中文）逐字切
    while (ctx.measureText(t).width > maxW && t.length > 1) {
      let cut = 1;
      while (
        cut < t.length &&
        ctx.measureText(t.slice(0, cut + 1)).width <= maxW
      )
        cut++;
      lines.push(t.slice(0, cut));
      t = t.slice(cut);
    }
    cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function draw(canvas: HTMLCanvasElement, poem: Poem, stamp: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // 内框
  ctx.strokeStyle = "rgba(24,95,165,0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = BRAND;
  ctx.font = "500 32px system-ui, -apple-system, 'Microsoft YaHei', sans-serif";
  ctx.fillText("诗英 · POENGLISH", W / 2, 132);

  let y = 250;
  ctx.fillStyle = INK;
  ctx.font = "600 60px 'Songti SC', 'SimSun', Georgia, serif";
  for (const line of wrap(ctx, poem.title, MAXW)) {
    ctx.fillText(line, W / 2, y);
    y += 74;
  }

  ctx.fillStyle = MUTE;
  ctx.font = "30px system-ui, -apple-system, 'Microsoft YaHei', sans-serif";
  ctx.fillText(`${poem.dynasty} · ${poem.author}`, W / 2, y + 8);
  y += 78;

  ctx.fillStyle = INK;
  ctx.font = "42px 'Songti SC', 'SimSun', Georgia, serif";
  for (const l of poem.lines.slice(0, 6)) {
    for (const line of wrap(ctx, l.zh, MAXW)) {
      ctx.fillText(line, W / 2, y);
      y += 62;
    }
  }

  y += 44;
  ctx.strokeStyle = "rgba(24,95,165,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, y);
  ctx.lineTo(W / 2 + 60, y);
  ctx.stroke();
  y += 52;

  ctx.fillStyle = "#374151";
  ctx.font = "italic 34px Georgia, 'Times New Roman', serif";
  for (const l of poem.lines.slice(0, 6)) {
    for (const line of wrap(ctx, l.en, MAXW)) {
      ctx.fillText(line, W / 2, y);
      y += 50;
    }
  }

  ctx.fillStyle = MUTE;
  ctx.font = "28px system-ui, -apple-system, 'Microsoft YaHei', sans-serif";
  ctx.fillText(stamp, W / 2, H - 150);
  ctx.font = "26px system-ui, -apple-system, sans-serif";
  ctx.fillText("读古诗，学英语 · poenglish", W / 2, H - 106);
}

export default function ShareCard({ poem }: { poem: Poem }) {
  const { t, lang } = useLang();
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 换一首诗就丢掉旧卡片，避免展示与内容不符
  useEffect(() => {
    setUrl("");
  }, [poem.slug]);

  const generate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const d = new Date();
    const stamp =
      lang === "zh"
        ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
        : d.toDateString();
    draw(canvas, poem, stamp);
    setUrl(canvas.toDataURL("image/png"));
  };

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `poenglish-${poem.slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <section className="space-y-3 rounded-sm border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          {t("shareTitle")}
        </h2>
        <button
          onClick={url ? download : generate}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          {url ? t("shareDownload") : t("shareGenerate")}
        </button>
      </div>

      <canvas ref={canvasRef} width={W} height={H} className="hidden" />

      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`${poem.title} ${poem.titleEn}`}
            className="mx-auto w-full max-w-xs rounded-sm border border-line"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-inkFaint">{t("shareHint")}</p>
            <button
              onClick={generate}
              className="text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
            >
              {t("shareAgain")}
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-inkFaint">{t("shareDesc")}</p>
      )}
    </section>
  );
}
