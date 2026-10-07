import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { LangProvider } from "./components/LangProvider";
import SiteHeader from "./components/SiteHeader";
import Umami from "./components/Umami";
import PwaRegister from "./components/PwaRegister";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#33566E",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "诗英 · 用古诗词学英语",
    template: "%s · 诗英",
  },
  description:
    "给你一段中国古诗词的英译，你猜是哪一个。猜诗闯关、每日一诗、诗词库与跨学科知识卡，中英双语，打开即玩。",
  keywords: [
    "古诗词英译",
    "英语学习",
    "猜诗",
    "每日一诗",
    "Chinese poetry in English",
    "learn English",
  ],
  openGraph: {
    title: "诗英 · 用古诗词学英语",
    description: "读古诗，学英语——猜诗闯关、每日一诗、跨学科知识卡。",
    type: "website",
    // 原先用 app/opengraph-image.png 文件约定提供，现改为静态资源引用
    //（next-on-pages 不支持文件约定的 metadata 图片路由）。
    images: ["/opengraph-image.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "诗英",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

/**
 * 开发模式自愈脚本：注销历史版本注册过的 Service Worker 并清空其缓存。
 *
 * 来由：早期 sw.js 对 /_next/static/* 采用「缓存优先」，而开发模式下
 * chunk 文件名固定、内容却随每次编译变化，浏览器会拿到已失效的 chunk 并抛出
 * 「Cannot read properties of undefined (reading 'call')」。
 * Service Worker 的拦截位于浏览器缓存之下，普通刷新与硬刷新都绕不过它，
 * 只能主动注销。生产构建的文件名带内容哈希，不存在此问题。
 */
const SW_PURGE = `(function () {
  if (!("serviceWorker" in navigator)) return;
  var KEY = "poenglish-sw-purged";
  function clearCaches() {
    if (!window.caches) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    });
  }
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) { clearCaches(); return; }
    Promise.all(regs.map(function (r) { return r.unregister(); }))
      .then(clearCaches)
      .then(function () {
        try {
          if (sessionStorage.getItem(KEY)) return;
          sessionStorage.setItem(KEY, "1");
        } catch (e) { /* 隐私模式忽略 */ }
        location.reload();
      })
      .catch(function () { /* 失败不影响正常使用 */ });
  }).catch(function () {});
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {process.env.NODE_ENV !== "production" && (
          <script dangerouslySetInnerHTML={{ __html: SW_PURGE }} />
        )}
        <Umami />
        <PwaRegister />
        <LangProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
            {children}
          </main>
          <footer className="mt-8 border-t border-line">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center">
              <p className="font-serif text-[13px] tracking-[0.3em] text-cinnabar/70">
                诗英
              </p>
              <p className="mx-auto mt-3.5 max-w-lg text-xs leading-[1.9] text-inkFaint">
                原诗均为公有领域；英文译文为本站点自行撰写，仅用于学习。
              </p>
              <p className="mt-3 text-xs text-inkFaint">
                <Link
                  href="/privacy"
                  className="underline-offset-2 hover:text-brand hover:underline"
                >
                  隐私政策 · Privacy
                </Link>
              </p>
            </div>
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
