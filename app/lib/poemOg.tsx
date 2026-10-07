import { ImageResponse } from "next/og";
import type { Poem } from "./config/poems";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * 诗词专属分享图。
 *
 * 设计取舍：整图只用拉丁字母（英文标题、作者、首行英译 + 站点英文名），
 * 不渲染中文字形。原因是 Cloudflare Edge 运行时的默认字体不含 CJK，
 * 强塞中文会变成豆腐块；而本站的立意正是「把古诗读成英文」，英文封面
 * 反而最贴合品牌。若日后要中文封面，需额外打包 CJK 子集字体。
 */
export function buildPoemOg(poem: Poem): ImageResponse {
  const firstEn = (poem.lines[0]?.en ?? "").slice(0, 96);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#F7F1E3",
          color: "#2A2A28",
          padding: "72px 80px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: "0.34em",
              color: "#B4452F",
              textTransform: "uppercase",
            }}
          >
            Poenglish
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: "0.14em",
              color: "#8A8170",
              textTransform: "uppercase",
            }}
          >
            A Chinese poem in English
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: "0.1em",
              color: "#8A8170",
              textTransform: "uppercase",
            }}
          >
            {poem.dynastyEn} dynasty · by {poem.authorEn}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#2A2A28",
            }}
          >
            {poem.titleEn}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 30,
            borderTop: "2px solid #E0D6BE",
            fontSize: 30,
            fontStyle: "italic",
            color: "#6B6456",
          }}
        >
          {firstEn}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
