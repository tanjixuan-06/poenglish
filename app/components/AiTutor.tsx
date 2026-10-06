"use client";

import { useRef, useState } from "react";
import type { Poem } from "../config/poems";
import { useLang } from "./LangProvider";
import MdText from "./MdText";
import { aiSettingsPayload } from "../lib/aisettings";

type Task = "grammar" | "rewrite" | "quiz";

export default function AiTutor({ poem }: { poem?: Poem }) {
  const { t, lang } = useLang();
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const context = poem
    ? `诗词：${poem.title}（${poem.dynasty}·${poem.author}）\n` +
      poem.lines.map((l) => `中文：${l.zh}\n英译：${l.en}`).join("\n") +
      "\n\n"
    : "";

  const taskText: Record<Task, string> = {
    grammar:
      lang === "zh"
        ? "请挑出这首英译里最值得学的一句，讲清楚它的句法结构和用词搭配。"
        : "Pick the single most instructive line in this translation and explain its syntax and word collocations.",
    rewrite:
      lang === "zh"
        ? "请给出这首诗另一种风格的英译（如更直译或更口语化），并说明两种译法的取舍。"
        : "Give an alternative English rendering (more literal or more colloquial) and explain the trade-offs.",
    quiz:
      lang === "zh"
        ? "请基于这首诗词的英译出一道英语小题（四个选项），并给出答案和一句解析。"
        : "Write one short English quiz question based on this translation, with four options, the answer and a one-line explanation.",
  };

  const langLine =
    lang === "zh" ? "请用中文回答。" : "Please answer in English.";

  const ask = async (text: string) => {
    const body = `${context}${text}\n${langLine}`;
    if (!body.trim()) return;
    setError("");
    setOutput("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "poem-tutor",
          input: body,
          ...(aiSettingsPayload() || {}),
        }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || t("aiError"));
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let got = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() || "";
        for (const chunk of chunks) {
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content || "";
              if (delta) {
                got = true;
                setOutput((o) => o + delta);
              }
            } catch {
              /* 忽略非 JSON 心跳行 */
            }
          }
        }
      }
      if (!got) {
        setError(t("aiEmpty"));
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") setError(t("aiError"));
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <section className="space-y-3 rounded-sm border border-line bg-white p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">
          {t("aiTitle")}
        </h2>
        <p className="mt-0.5 text-xs text-inkFaint">{t("aiDesc")}</p>
      </div>

      {poem && (
        <div className="flex flex-wrap gap-2">
          {(["grammar", "rewrite", "quiz"] as Task[]).map((k) => (
            <button
              key={k}
              disabled={loading}
              onClick={() => ask(taskText[k])}
              className="rounded-sm border border-line bg-paper px-3 py-1.5 text-xs text-inkSoft transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {k === "grammar"
                ? t("aiBtnGrammar")
                : k === "rewrite"
                ? t("aiBtnRewrite")
                : t("aiBtnQuiz")}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && !loading)
              ask(question.trim());
          }}
          placeholder={t("aiPlaceholder")}
          className="flex-1 rounded-sm border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          onClick={() => ask(question.trim())}
          disabled={loading || !question.trim()}
          className="btn-primary"
        >
          {loading ? "…" : t("aiSubmit")}
        </button>
        {loading && (
          <button
            onClick={stop}
            className="btn-ghost px-3 py-2"
          >
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
        <div
          ref={outRef}
          className="rounded-sm bg-paper p-4 text-sm leading-relaxed text-ink"
        >
          <MdText src={output} />
          {loading && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
          )}
        </div>
      )}

      {output && (
        <p className="text-xs text-inkFaint">{t("aiDisclaimer")}</p>
      )}
    </section>
  );
}
