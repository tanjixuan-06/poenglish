"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";
import { contentWords } from "../lib/translatescore";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type Line = { zh: string; en: string };

/**
 * 跟读打分：读一遍，看浏览器识别出了多少实词
 *
 * 用浏览器自带的语音识别（Chrome / Edge 可用，无需联网到本站点之外的服务由浏览器决定），
 * 只做本地词面比对，不上传任何音频到本站服务器。
 */
export default function Shadowing({ lines }: { lines: Line[] }) {
  const { t, lang } = useLang();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [err, setErr] = useState("");
  const recRef = useRef<any>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  const finish = useCallback((text: string) => {
    setTranscript(text);
    setListening(false);
  }, []);

  const start = useCallback(() => {
    setErr("");
    setTranscript("");
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setErr(t("shadowUnsupported"));
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      finish(text);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      setErr(
        e?.error === "not-allowed"
          ? t("shadowDenied")
          : t("shadowError")
      );
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [finish, t]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* 忽略：未开始就停止 */
    }
    setListening(false);
  }, []);

  // 组件卸载时停止仍在进行的识别（原生对象不会随 React 卸载而自动停）
  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (supported === null) return null;

  if (!supported) {
    return (
      <section className="rounded-sm border border-dashed border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">
          {t("shadowTitle")}
        </h2>
        <p className="mt-2 text-xs text-inkFaint">{t("shadowUnsupported")}</p>
      </section>
    );
  }

  const line = lines[Math.min(idx, lines.length - 1)];
  const target = contentWords(line.en);
  const got = new Set(contentWords(transcript));
  const hit = target.filter((w) => got.has(w));
  const miss = target.filter((w) => !got.has(w));
  const score = target.length
    ? Math.round((hit.length / target.length) * 100)
    : 0;

  return (
    <section className="space-y-3 rounded-sm border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          {t("shadowTitle")}
        </h2>
        <span className="text-[11px] text-inkFaint">{t("shadowPick")}</span>
      </div>

      {lines.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {lines.map((l, i) => (
            <button
              key={i}
              onClick={() => {
                try {
                  recRef.current?.stop();
                } catch {
                  /* ignore */
                }
                setIdx(i);
                setTranscript("");
                setErr("");
              }}
              className={`rounded-md px-2 py-1 text-[11px] transition ${
                i === idx
                  ? "bg-brand/10 text-brand"
                  : "text-inkFaint hover:text-inkSoft"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <p className="font-serif text-base leading-relaxed text-ink">
        {line.en}
      </p>
      <p className="text-xs text-inkFaint">{line.zh}</p>

      <div className="flex flex-wrap items-center gap-2">
        {!listening ? (
          <button
            onClick={start}
            className="btn-primary"
          >
            {t("shadowStart")}
          </button>
        ) : (
          <button
            onClick={stop}
            className="rounded-sm border border-line px-4 py-2 text-sm text-inkSoft"
          >
            {t("shadowStop")}
          </button>
        )}
        {transcript && (
          <button
            onClick={start}
            className="btn-quiet"
          >
            {t("shadowRetry")}
          </button>
        )}
        {listening && (
          <span className="text-xs text-brand">{t("shadowListening")}</span>
        )}
      </div>

      {err && (
        <p className="rounded-sm bg-badWash px-3 py-2 text-xs text-bad">{err}</p>
      )}

      {transcript && (
        <div className="space-y-2 rounded-sm bg-paper p-4">
          <p className="text-xs text-inkSoft">{t("shadowResult")}</p>
          <p className="text-sm text-ink">{transcript}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-brand">{score}</span>
            <span className="text-xs text-inkSoft">
              {t("shadowHit", { a: hit.length, b: target.length })}
            </span>
          </div>
          {miss.length > 0 && (
            <p className="text-[11px] text-inkFaint">
              {t("shadowMiss")}：{miss.slice(0, 6).join(" · ")}
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-inkFaint">
        {lang === "zh"
          ? "识别由浏览器本地完成，音频不经过本站服务器。"
          : "Recognition runs in your browser; no audio reaches our server."}
      </p>
    </section>
  );
}
