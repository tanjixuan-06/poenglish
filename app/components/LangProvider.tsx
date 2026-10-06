"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { translate, type Lang } from "../i18n";

const STORAGE_KEY = "poenglish-lang";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<LangCtx>({
  lang: "zh",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  // 首屏后读取本地偏好，避免 SSR 与客户端首帧不一致导致 hydration 警告
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "zh" ? "en" : "zh"),
    [lang, setLang]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang]
  );

  return (
    <Ctx.Provider value={{ lang, setLang, toggle, t }}>{children}</Ctx.Provider>
  );
}

export function useLang() {
  return useContext(Ctx);
}
