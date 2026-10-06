"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { addVocab, hasVocab, removeVocab, VOCAB_CHANGE_EVENT } from "../lib/vocab";

/** 关键词旁的收藏按钮：点一下收进生词本，再点一下移出 */
export default function VocabAddButton({
  w,
  zh,
  from,
}: {
  w: string;
  zh: string;
  from?: string;
}) {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(hasVocab(w));
    sync();
    window.addEventListener(VOCAB_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VOCAB_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [w]);

  return (
    <button
      onClick={() => {
        if (saved) removeVocab(w);
        else addVocab({ w, zh, from });
      }}
      aria-label={saved ? t("vocabAdded") : t("vocabAdd")}
      title={saved ? t("vocabAdded") : t("vocabAdd")}
      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] transition ${
        saved
          ? "border-warn/50 bg-warnWash text-warn"
          : "border-line text-inkFaint hover:border-brand hover:text-brand"
      }`}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}
