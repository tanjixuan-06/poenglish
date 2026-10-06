"use client";

import { useEffect, useRef, useState } from "react";
import type { Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import MdText from "./MdText";
import { streamAi } from "../lib/streamai";

/**
 * 诗心对话：像和老友闲坐品茶，聊聊这首诗给你的感觉。
 * 进入页面自动来一段（heartSeed），之后可就任意话题继续追问。复用 streamAi 流式。
 */
export default function PoemHeart({ poem }: { poem: Poem }) {
  const { t, lang } = useLang();
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const firedRef = useRef(false);

  const context =
    `诗词：${poem.title}（${poem.dynasty}·${poem.author}）\n` +
    poem.lines.map((l) => `中文：${l.zh}\n英译：${l.en}`).join("\n") +
    "\n\n";
  const langLine = lang === "zh" ? "请用中文回答。" : "Please answer in English.";

  const ask = async (text: string) => {
    const body = `${context}${text}\n${langLine}`;
    if (!body.trim()) return;
    setError("");
    setOutput("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const r = await streamAi(
      "poem-heart",
      body,
      (d) => setOutput((o) => o + d),
      ac.signal
    );
    setLoading(false);
    if (!r.ok && r.error !== "ABORTED") setError(t("aiError"));
    else if (r.ok && r.empty) setError(t("aiEmpty"));
  };

  // 进入页面自动来一段诗心小语
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    ask(t("heartSeed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <section className="space-y-3 rounded-sm border border-line bg-white p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{t("heartTitle")}</h2>
        <p className="mt-0.5 text-xs text-inkFaint">{t("heartDesc")}</p>
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && !loading)
              ask(question.trim());
          }}
          placeholder={t("heartPlaceholder")}
          className="flex-1 rounded-sm border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          onClick={() => ask(question.trim() || t("heartSeed"))}
          disabled={loading || !question.trim()}
          className="btn-primary"
        >
          {loading ? "…" : t("heartOpen")}
        </button>
        {loading && (
          <button onClick={stop} className="btn-ghost px-3 py-2">
            {t("aiStop")}
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-sm bg-badWash px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      {(output || loading) && (
        <div className="rounded-sm bg-paper p-4 text-sm leading-relaxed text-ink">
          <MdText src={output} />
          {loading && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
          )}
        </div>
      )}

      {output && <p className="text-xs text-inkFaint">{t("aiDisclaimer")}</p>}
    </section>
  );
}
