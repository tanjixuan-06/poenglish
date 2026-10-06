"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  EMPTY_AI_SETTINGS,
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
  type AiSettings,
} from "../lib/aisettings";
import { useLang } from "./LangProvider";

/**
 * 自带密钥（BYOK）设置：留空则用本站自带的 AI 服务，
 * 填了就走用户自己的额度。密钥只存本浏览器。
 */
export default function AiSettings() {
  const { t } = useLang();
  const [s, setS] = useState<AiSettings>(EMPTY_AI_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(loadAiSettings());
  }, []);

  const patch = (p: Partial<AiSettings>) => {
    setSaved(false);
    setS((v) => ({ ...v, ...p }));
  };

  const save = () => {
    saveAiSettings(s);
    setSaved(true);
  };

  const clear = () => {
    clearAiSettings();
    setS({ ...EMPTY_AI_SETTINGS });
    setSaved(false);
  };

  const inputCls =
    "mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] text-ink outline-none focus:border-brand";

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="h-sec mb-2.5">{t("aiByokTitle")}</h2>
      <p className="mb-5 max-w-2xl text-[13px] leading-[2] text-inkSoft">
        {t("aiByokDesc")}
      </p>

      <label className="flex items-center gap-2.5 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        {t("aiByokEnable")}
      </label>

      {s.enabled && (
        <div className="mt-4 max-w-xl space-y-3.5">
          <div>
            <div className="text-[12px] text-inkSoft">{t("aiByokKey")}</div>
            <input
              type="password"
              value={s.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              className={inputCls}
            />
          </div>
          <div>
            <div className="text-[12px] text-inkSoft">{t("aiByokBase")}</div>
            <input
              type="text"
              value={s.baseUrl}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              placeholder={DEFAULT_BASE_URL}
              spellCheck={false}
              className={inputCls}
            />
          </div>
          <div>
            <div className="text-[12px] text-inkSoft">{t("aiByokModel")}</div>
            <input
              type="text"
              value={s.model}
              onChange={(e) => patch({ model: e.target.value })}
              placeholder={DEFAULT_MODEL}
              spellCheck={false}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={save} className="btn-primary px-4 py-2 text-[13px]">
          {t("aiByokSave")}
        </button>
        <button onClick={clear} className="btn-ghost px-4 py-2 text-[13px]">
          {t("aiByokClear")}
        </button>
        {saved && (
          <span className="text-[12px] text-cinnabar/90">
            {t("aiByokSaved")}
          </span>
        )}
      </div>

      <p className="mt-4 max-w-2xl text-[12px] leading-[1.9] text-inkFaint">
        {t("aiByokNote")}
      </p>
    </section>
  );
}
