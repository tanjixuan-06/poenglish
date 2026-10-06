import type { Config } from "tailwindcss";

/**
 * 配色取自纸墨：暖白纸底、墨色字、朱砂点缀，主色用青花墨蓝。
 * 刻意不用 SaaS 站点常见的冷灰 + 亮蓝渐变——那套配色和古诗文不在一个调子上。
 *
 * 语义色（ok / warn / bad）同样取自传统色，而非 Tailwind 原生的荧光绿橙红：
 *   ok  松花绿——用于「已掌握 / 答对」
 *   warn 藤黄  ——用于「模糊 / 待巩固」
 *   bad  朱砂  ——用于「忘了 / 错误」
 * 这三色与纸、墨、青花同处一个低饱和暖调区间，混排时不打架。
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** 纸底 */
        paper: "#FBF8F2",
        /** 纸底压深一档（分隔块、禁用态） */
        paperDim: "#F2EDE3",
        /** 墨色正文 */
        ink: "#2A2724",
        /** 次级说明 */
        inkSoft: "#6E6862",
        /** 更淡的提示 */
        inkFaint: "#9C958A",
        /** 暖灰分隔线 */
        line: "#E3DCD0",
        brand: {
          /** 青花墨蓝：链接、主按钮 */
          DEFAULT: "#33566E",
          dark: "#24404F",
          /** 极浅底，用于强调块的柔和背景 */
          wash: "#EEF2F5",
        },
        /** 朱砂：重点词、标记 */
        cinnabar: {
          DEFAULT: "#A5382A",
          /** 浅底 */
          wash: "#F7EDEA",
        },
        /** 语义色：记住 / 模糊 / 忘了 */
        ok: "#4C6B4F",
        okWash: "#EDF2EC",
        warn: "#8A6D2F",
        warnWash: "#F6F0E2",
        bad: "#A5382A",
        badWash: "#F7EDEA",
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          "SimSun",
          "Georgia",
          '"Times New Roman"',
          "serif",
        ],
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SFMono-Regular"',
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      letterSpacing: {
        /** 中文小标题常用的疏排 */
        wider2: "0.2em",
      },
      boxShadow: {
        /** 极轻的浮起，只在 hover 时用 */
        lift: "0 1px 2px rgba(42, 39, 36, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
