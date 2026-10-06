"use client";

import { useEffect } from "react";

/**
 * 注册 Service Worker
 *
 * 只在生产构建 + localhost/https 下注册（Service Worker 的安全限制）；
 * 注册失败不影响正常使用，静默忽略即可。
 *
 * 开发模式**不注册**：dev 下 chunk 文件名固定而内容随编译变化，
 * SW 的「缓存优先」会让浏览器拿到失效 chunk，报
 * 「Cannot read properties of undefined (reading 'call')」。
 * 生产构建的文件名带内容哈希，缓存优先是安全的。
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const secure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!secure) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
