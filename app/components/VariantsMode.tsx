"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POEMS, type Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import { streamAi } from "../lib/streamai";
import MdText from "./MdText";

type Item = { poem: Poem; zh: string; en: string };
type Pick = "A" | "B" | "C" | null;

/** 挑一句适合做译法对比的句子：优先中等长度 */
function pickItem(): Item {
  const pool = POEMS.filter((p) => p.kind !== "文言文" && p.lines.length > 0);
  const src = pool.length ? pool : POEMS;
  const poem = src[Math.floor(Math.random() * src.length)];
  const line =
    poem.lines.find((l) => l.zh.length >= 8 && l.zh.length <= 24) ||
    poem.lines[Math.floor(Math.random() * poem.lines.length)];
  return { poem, zh: line.zh, en: line.en };
}

export default function VariantsMode() {
  const { t, lang } = useLang();
  const [item, setItem] = useState<Item | null>(null);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState<Pick>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading2, setLoading2] = useState(false);
  const [err2, setErr2] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // 题目在客户端生成，避免服务端 / 客户端随机不一致
  useEffect(() => {
    setItem(pickItem());
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setItem(pickItem());
    setOut("");
    setErr("");
    setPicked(null);
    setReason("");
    setComment("");
    setErr2("");
  }, []);

  const generate = useCallback(async () => {
    if (!item || loading) return;
    setLoading(true);
    setErr("");
    setOut("");
    setPicked(null);
    setComment("");
    const ac = new AbortController();
    abortRef.current = ac;

    const langLine =
      lang === "zh" ? "请用中文讲解。" : "Please reply in English.";
    const body =
      `原句（中文）：${item.zh}\n` +
      `出处：《${item.poem.title}》· ${item.poem.dynasty}·${item.poem.author}\n` +
      `请给出 A 直译、B 意译、C 诗性译法 三种英文译法，每种后面用一句话说明它保住了什么、牺牲了什么。\n` +
      langLine;

    const r = await streamAi(
      "poem-variants",
      body,
      (d) => setOut((o) => o + d),
      ac.signal
    );
    setLoading(false);
    if (!r.ok && r.error !== "ABORTED") {
      setErr(r.error === "NETWORK" ? t("writeError") : r.error || t("writeError"));
    } else if (r.ok && r.empty) {
      setErr(t("writeEmpty"));
    }
  }, [item, loading, lang, t]);

  const submitPick = useCallback(
    async (p: Exclude<Pick, null>) => {
      if (!item || !out || loading2) return;
      setPicked(p);
      setLoading2(true);
      setErr2("");
      setComment("");
      const ac = new AbortController();
      abortRef.current = ac;

      const langLine =
        lang === "zh" ? "请用中文讲解。" : "Please reply in English.";
      const body =
        `原句（中文）：${item.zh}\n` +
        `你刚才给出的三种译法：\n${out}\n` +
        `学生选择了 ${p} 版` +
        (reason.trim() ? `，理由是：${reason.trim()}` : "，没有给出理由") +
        `\n请点评这个选择。\n` +
        langLine;

      const r = await streamAi(
        "poem-variants",
        body,
        (d) => setComment((o) => o + d),
        ac.signal
      );
      setLoading2(false);
      if (!r.ok && r.error !== "ABORTED") {
        setErr2(
          r.error === "NETWORK" ? t("writeError") : r.error || t("writeError")
        );
      } else if (r.ok && r.empty) {
        setErr2(t("writeEmpty"));
      }
    },
    [item, out, reason, loading2, lang, t]
  );

  if (!item) {
    return (
      <p className="py-10 text-center text-sm text-inkFaint">
        {t("gameLoading")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-line bg-white p-6 text-center shadow-sm">
        <p className="mb-3 text-xs font-medium text-inkFaint">
          {t("variantsSubtitle")}
        </p>
        <blockquote className="font-serif text-2xl leading-relaxed tracking-wide text-ink">
          {item.zh}
        </blockquote>
        <p className="mt-3 text-xs text-inkFaint">
          《{item.poem.title}》· {item.poem.dynasty}·{item.poem.author}
        </p>
        <button
          onClick={reset}
          className="mt-3 text-xs text-inkFaint underline underline-offset-2 hover:text-brand"
        >
          {t("variantsChangeLine")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!out && !loading && (
          <button
            onClick={() => void generate()}
            className="btn-primary"
          >
            {t("variantsGenerate")}
          </button>
        )}
        {loading && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="rounded-sm border border-line px-3 py-2 text-xs text-inkSoft"
          >
            {t("writeStop")}
          </button>
        )}
      </div>

      {err && (
        <p className="rounded-sm bg-badWash px-3 py-2 text-sm text-bad">{err}</p>
      )}


      {(loading || out) && (
        <section className="space-y-3 rounded-sm border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">
            {t("variantsTitle")}
          </h2>
          <MdText src={out} />
          {loading && (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
          )}
        </section>
      )}

      {out && !loading && (
        <section className="space-y-3 rounded-sm border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">
            {t("variantsPickTitle")}
          </h2>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("variantsReasonPlaceholder")}
            className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {(["A", "B", "C"] as const).map((p) => (
              <button
                key={p}
                onClick={() => void submitPick(p)}
                disabled={loading2 || picked !== null}
                className={`rounded-sm border px-4 py-3 text-sm font-medium transition disabled:opacity-50 ${
                  picked === p
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-line bg-white text-ink hover:border-brand"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-inkFaint">{t("variantsTip")}</p>
        </section>
      )}

      {(loading2 || comment || err2) && (
        <section className="space-y-2 rounded-sm border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">
            {t("variantsComment")}
          </h2>
          {err2 && (
            <p className="rounded-sm bg-badWash px-3 py-2 text-sm text-bad">
              {err2}
            </p>
          )}
          <MdText src={comment} />
          {loading2 && (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
          )}
        </section>
      )}
    </div>
  );
}
