"use client";

import { useState } from "react";
import { useLang } from "./LangProvider";
import { aiSettingsPayload } from "../lib/aisettings";

interface Mnem {
  verse: string;
  hint: string;
}

/**
 * 生词→诗化记忆句：把生词本里的一个英文生词交给 AI，写成一句含它的小诗，
 * 再附一句中文「记忆小引」。把 vocab 与「诗」缝合，实用又契合主题。
 */
export default function Mnemonic({ w, zh }: { w: string; zh: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Mnem | null>(null);

  const run = async () => {
    if (busy) return;
    if (data) {
      setOpen((o) => !o);
      return;
    }
    setBusy(true);
    setError("");
    setOpen(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "poem-mnemonic",
          input: `${w}\n${zh}`,
          ...(aiSettingsPayload() || {}),
        }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || j?.error) {
        setError(j?.error || j?.reason || t("aiError"));
      } else if (!j?.verse) {
        setError(t("mnemonicEmpty"));
      } else {
        setData({ verse: j.verse, hint: j.hint || "" });
      }
    } catch {
      setError(t("aiError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-sm border border-line px-2 py-0.5 text-[11px] text-inkFaint transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {busy ? t("mnemonicWaiting") : t("mnemonicBtn")}
      </button>

      {open && (data || busy || error) && (
        <div className="mt-2 rounded-sm border border-cinnabar/20 bg-cinnabar/[0.04] p-3">
          {busy && !data && (
            <p className="text-xs text-inkFaint">{t("mnemonicWaiting")}</p>
          )}
          {data && (
            <>
              <p className="font-serif text-[15px] leading-[1.9] text-ink">
                {data.verse}
              </p>
              {data.hint && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-inkSoft">
                  <span className="text-cinnabar/70">
                    {t("mnemonicHintLabel")} ·
                  </span>
                  {data.hint}
                </p>
              )}
              <button
                onClick={run}
                disabled={busy}
                className="mt-2 text-[11px] text-inkFaint underline underline-offset-2"
              >
                {t("mnemonicAgain")}
              </button>
            </>
          )}
          {error && <p className="text-xs text-bad">{error}</p>}
        </div>
      )}
    </div>
  );
}
