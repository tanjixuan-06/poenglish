"use client";

import { useState } from "react";
import ClozeGame from "./ClozeGame";
import GuessGame from "./GuessGame";
import ReciteMode from "./ReciteMode";
import VariantsMode from "./VariantsMode";
import WriteMode from "./WriteMode";
import { useLang } from "./LangProvider";

type Tab = "write" | "cloze" | "recite" | "variants" | "guess";

export default function GameTabs({ initial = "write" }: { initial?: Tab }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>(initial);

  const btn = (k: Tab) =>
    `flex-1 rounded-sm px-2 py-2 text-xs font-medium transition sm:text-sm ${
      tab === k
        ? "bg-white text-brand-dark shadow-sm"
        : "text-inkSoft hover:text-ink"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-sm bg-paperDim p-1">
        <button className={btn("write")} onClick={() => setTab("write")}>
          {t("writeTab")}
        </button>
        <button className={btn("cloze")} onClick={() => setTab("cloze")}>
          {t("clozeTab")}
        </button>
        <button className={btn("recite")} onClick={() => setTab("recite")}>
          {t("reciteTab")}
        </button>
        <button className={btn("variants")} onClick={() => setTab("variants")}>
          {t("variantsTab")}
        </button>
        <button className={btn("guess")} onClick={() => setTab("guess")}>
          {t("guessTab")}
        </button>
      </div>
      {tab === "write" ? (
        <WriteMode />
      ) : tab === "cloze" ? (
        <ClozeGame />
      ) : tab === "recite" ? (
        <ReciteMode />
      ) : tab === "variants" ? (
        <VariantsMode />
      ) : (
        <GuessGame />
      )}
    </div>
  );
}
