/**
 * 诗英 Service Worker
 *
 * 策略：
 *   静态资源（_next/static、图片）→ 缓存优先，命中即用
 *   页面导航 → 网络优先，断网时回退首页缓存
 *   /api 一律不缓存（AI 批改结果不应复用）
 *
 * 注意：本文件自身必须直连网络，绝不能被自己缓存，
 * 否则 SW 更新无法下发（旧版一旦出问题就无法自愈）。
 * 另：开发模式下前端不会注册本 SW —— dev 的 chunk 文件名固定
 * 而内容多变，缓存优先会导致浏览器加载失效 chunk。
 */

const CACHE = "poenglish-v2";
const PRECACHE = ["/", "/game", "/daily", "/poems", "/review", "/me", "/vocab"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // SW 自身与 manifest：直连网络，不缓存（保证更新能下发）
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") {
    return;
  }

  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
              return res;
            })
            .catch(() => hit)
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || Response.error()))
    );
  }
});
