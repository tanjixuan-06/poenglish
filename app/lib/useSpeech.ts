"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 浏览器语音合成（朗读英文译文） */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  // 首帧恒为 false：服务端与客户端首次渲染必须一致，否则水合失败
  // （服务端没有 window，若在渲染期间直接判断，两端 HTML 会对不上）
  const [supported, setSupported] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, [clearTimer]);

  const pickVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    // 优先：英语女声 / en-US / 任意英语
    return (
      en.find((v) => v.name.includes("Google") && v.name.includes("US")) ||
      en.find((v) => v.lang.toLowerCase() === "en-us") ||
      en[0] ||
      null
    );
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!supported || !text.trim()) return;
      clearTimer();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const v = pickVoice(voices);
      if (v) u.voice = v;
      u.onend = () => {
        setSpeaking(false);
        clearTimer();
      };
      u.onerror = () => {
        setSpeaking(false);
        clearTimer();
      };
      utterRef.current = u;
      setSpeaking(true);
      window.speechSynthesis.speak(u);
      // 兜底：某些浏览器在超短文本 / 语音尚未就绪时会不触发 onend，
      // 导致按钮永远显示「停止」。用超时强制复位，避免状态卡死。
      const est = Math.min(Math.max(text.length * 70, 1500), 30000) + 500;
      timerRef.current = setTimeout(() => {
        setSpeaking(false);
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* 忽略 */
        }
      }, est);
    },
    [supported, pickVoice, clearTimer]
  );

  // 语音列表异步加载，提前唤醒一次；卸载时清理定时器并取消朗读
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
    return () => {
      clearTimer();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported, clearTimer]);

  return { speak, stop, speaking, supported };
}
