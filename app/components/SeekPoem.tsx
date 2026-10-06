"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "./PageHeader";
import { useLang } from "./LangProvider";
import { aiSettingsPayload } from "../lib/aisettings";

const EXAMPLES = [
  "The moon is beautiful tonight, and I thought of you.",
  "I am tired of the city; I want to go back to the mountains.",
  "We laugh, and the years flow away like water.",
];

interface SeekResult {
  slug: string;
  title: string;
  author: string;
  dynasty: string;
  lines: { zh: string; en: string }[];
  reason: string;
}

/**
 * 以文寻诗：写一段英文，AI 从诗词库里挑出气质最相契的一首，并说清为何相契。
 * 后端（/api/ai: poem-seek）注入候选清单并返回最相契那首的详情，故这里直接消费 JSON。
 */
export default function SeekPoem() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SeekResult | null>(null);

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "poem-seek",
          input: text,
          ...(aiSettingsPayload() || {}),
        }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || t("aiError"));
      } else if (data?.error) {
        setError(data.reason || data.error || t("aiError"));
      } else {
        setResult(data as SeekResult);
      }
    } catch {
      setError(t("aiError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-9">
      <PageHeader title={t("seekTitle")} sub={t("seekSubtitle")} />

      {/* 输入 */}
      <section className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("seekPlaceholder")}
          rows={4}
          className="w-full resize-y rounded-sm border border-line bg-white px-4 py-3 text-[15px] leading-[1.9] text-ink placeholder:text-inkFaint focus:border-brand/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="max-w-full truncate rounded-full border border-line bg-white px-3 py-1 text-xs text-inkSoft transition-colors hover:border-brand/50 hover:text-brand"
              title={ex}
            >
              {ex.length > 34 ? `${ex.slice(0, 34)}…` : ex}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={submit}
            disabled={!input.trim() || busy}
            className="btn-primary px-6 py-2.5"
          >
            {busy ? t("seekWaiting") : t("seekSubmit")}
          </button>
        </div>
      </section>

      {/* 结果 */}
      {(result || busy || error) && (
        <section className="mx-auto max-w-xl rounded-sm border border-line bg-white px-6 py-8 sm:px-10">
          {busy && !result && (
            <p className="py-4 text-center text-sm text-inkFaint">
              {t("seekWaiting")}
            </p>
          )}

          {result && (
            <>
              <p className="mb-5 text-center font-serif text-sm tracking-[0.3em] text-cinnabar/80">
                {t("seekResultLabel")}
              </p>
              <h3 className="text-center font-serif text-xl text-ink">
                《{result.title}》
                {result.author && (
                  <span className="ml-2 text-sm font-normal text-inkSoft">
                    {result.author}
                    {result.dynasty && ` · ${result.dynasty}`}
                  </span>
                )}
              </h3>

              <div className="mx-auto mt-6 max-w-md space-y-4">
                {result.lines.map((l, i) => (
                  <div key={i} className="text-center">
                    <p className="font-serif text-[17px] leading-[2.1] tracking-[0.04em] text-ink">
                      {l.zh}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.8] text-inkFaint">
                      {l.en}
                    </p>
                  </div>
                ))}
              </div>

              {result.reason && (
                <p className="mx-auto mt-7 max-w-md border-l-2 border-line pl-3 text-left text-[13px] leading-[2] text-inkFaint">
                  <span className="mr-1 text-cinnabar/70">
                    {t("seekReasonLabel")} ·
                  </span>
                  {result.reason}
                </p>
              )}

              <div className="mt-7 flex justify-center">
                <Link href="/poems" className="btn-ghost px-5 py-2 text-sm">
                  {t("seekViewPoem")}
                </Link>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 text-center text-sm text-bad">{error}</p>
          )}
        </section>
      )}

      <p className="mx-auto max-w-xl text-center text-xs leading-[1.9] text-inkFaint">
        {t("aiDisclaimer")}
      </p>
    </div>
  );
}
