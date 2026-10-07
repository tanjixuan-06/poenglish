/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 注：部署到 Cloudflare Pages 由 OpenNext 接管构建，不需要 Next 的 standalone 输出；
  // 若日后改回 CloudBase/Docker 路线，再重新开启 output: "standalone"。
  async headers() {
    // 内容安全策略：本站渲染用户文本与 AI 输出，加 CSP 进一步防 XSS 与数据外泄。
    // 因 layout 含内联 Service Worker 自愈脚本，script-src 需放行 'unsafe-inline'。
    // 若启用 Umami 等跨域分析脚本，请在 script-src 追加其域名（如 https://your-umami.example）。
    // 注意：开发模式下 Next 的 Fast Refresh / React Refresh 依赖 eval，必须放行 'unsafe-eval'，
    // 否则客户端脚本被浏览器拒绝执行，整站会停在 SSR 静态壳（按钮 disabled、游戏停在“出题中…”），
    // 交互全部失效。生产构建不依赖 eval，故保持严格策略。
    const isProd = process.env.NODE_ENV === "production";
    // 可选的统计/分析域名（如 https://umami.example）：留空则不额外放行；
    // 设置了才把它加进 script-src 与 connect-src——否则统计脚本与其上报
    // 都会被 CSP 拦掉，表现为“统计后台一直没数据”。
    const analyticsHost = (process.env.ANALYTICS_HOST || "").trim();
    const extra = analyticsHost ? ` ${analyticsHost}` : "";
    const csp = isProd
      ? `default-src 'self'; script-src 'self' 'unsafe-inline'${extra}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${extra}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`
      : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'${extra}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${extra}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
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
