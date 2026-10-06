/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 产出精简的 standalone 产物，供云托管（CloudBase Run / Docker）部署；
  // 本地 next dev 不受影响。
  output: "standalone",
  async headers() {
    // 内容安全策略：本站渲染用户文本与 AI 输出，加 CSP 进一步防 XSS 与数据外泄。
    // 因 layout 含内联 Service Worker 自愈脚本，script-src 需放行 'unsafe-inline'。
    // 若启用 Umami 等跨域分析脚本，请在 script-src 追加其域名（如 https://your-umami.example）。
    // 注意：开发模式下 Next 的 Fast Refresh / React Refresh 依赖 eval，必须放行 'unsafe-eval'，
    // 否则客户端脚本被浏览器拒绝执行，整站会停在 SSR 静态壳（按钮 disabled、游戏停在“出题中…”），
    // 交互全部失效。生产构建不依赖 eval，故保持严格策略。
    const isProd = process.env.NODE_ENV === "production";
    const csp = isProd
      ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
