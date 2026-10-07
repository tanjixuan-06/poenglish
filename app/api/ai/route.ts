import { NextRequest, NextResponse } from "next/server";
import { PROMPTS } from "../../config/prompts";
import { POEMS } from "../../config/poems";
import { contentWords } from "../../lib/translatescore";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMIT = 20; // 单窗口最大请求数
const WINDOW_MS = 60_000;
const MAX_INPUT_CHARS = 5000;
const MAX_TOKENS = 2000;
// Serverless 平台（Vercel 等）把整次函数调用（含流式传输）封顶在 60s，
// 所以上游等待必须明显低于 60s：否则慢响应会被平台直接掐断、返回不可处理的错误，
// 前端就表现为“点了没反应 / 功能用不了”，而不是收到一条可提示的超时信息。
// 非流式工具（寻诗 / 诗化记忆句）另设更短阈值，留出解析与返回的余量。
const UPSTREAM_TIMEOUT_MS = 30_000;
const UPSTREAM_TIMEOUT_NONSTREAM_MS = 25_000;
export const maxDuration = 60;

// 分布式限流（可选）：配置 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 后启用；
// 未配置时回退到进程内内存限流（仅单实例精确，Serverless 多实例下不精确）。
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const limiter =
  upstashUrl && upstashToken
    ? new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RATE_LIMIT, "1 m"),
        analytics: false,
      })
    : null;

// 内存兜底
const hits = new Map<string, { count: number; reset: number }>();

function cleanupExpired(now: number) {
  for (const [key, rec] of hits) {
    if (now > rec.reset) hits.delete(key);
  }
}

async function rateLimited(ip: string): Promise<boolean> {
  if (limiter) {
    const { success } = await limiter.limit(ip);
    return !success;
  }
  const now = Date.now();
  if (hits.size > 500) cleanupExpired(now);
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (rec.count >= RATE_LIMIT) return true;
  rec.count += 1;
  return false;
}

// 以文寻诗：用本地关键词重叠把候选从 229 首缩到最相关的 ~n 首，
// 加快模型应答、降低 token 成本；重叠太少则退回全量，避免误判。
function topSeekCandidates(input: string, n: number) {
  const q = new Set(contentWords(input));
  if (q.size === 0) return POEMS;
  const scored = POEMS.map((p) => {
    const words = new Set(contentWords(p.lines.map((l) => l.en).join(" ")));
    let overlap = 0;
    for (const w of q) if (words.has(w)) overlap++;
    return { p, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  const top = scored.filter((s) => s.overlap > 0).slice(0, n).map((s) => s.p);
  return top.length >= 3 ? top : POEMS;
}

/**
 * 校验用户自带的 AI 凭据（BYOK）。
 * 只允许 https 接口地址，避免密钥经明文传输；对长度设上限，挡掉异常输入。
 * 注意：密钥仅用于本次请求转发，绝不写入日志、绝不落盘。
 */
function sanitizeByok(
  key: unknown,
  base: unknown,
  model: unknown
): { apiKey: string; baseUrl?: string; model?: string } | null {
  if (typeof key !== "string") return null;
  const apiKey = key.trim();
  if (!apiKey || apiKey.length > 200) return null;

  let baseUrl: string | undefined;
  if (typeof base === "string" && base.trim()) {
    const b = base.trim();
    if (b.length > 300) return null;
    try {
      if (new URL(b).protocol !== "https:") return null;
    } catch {
      return null;
    }
    baseUrl = b;
  }

  let m: string | undefined;
  if (typeof model === "string" && model.trim()) {
    if (model.trim().length > 100) return null;
    m = model.trim();
  }

  return { apiKey, baseUrl, model: m };
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await rateLimited(ip)) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const {
    tool,
    input,
    apiKey: byokKey,
    baseUrl: byokBase,
    model: byokModel,
  } = await req.json().catch(() => ({} as any));
  // 只接受已登记的提示词（见 config/prompts.ts 的 PROMPTS 注册表）
  const prompt = PROMPTS[tool as string];
  if (!prompt || typeof input !== "string" || !input.trim()) {
    return NextResponse.json({ error: "无效的工具或输入" }, { status: 400 });
  }
  if (input.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `输入过长（最多 ${MAX_INPUT_CHARS} 字）` },
      { status: 400 }
    );
  }

  // 用户自带密钥优先：填了就用用户自己的额度，没填则回退站点自带服务。
  const byok = sanitizeByok(byokKey, byokBase, byokModel);
  const apiKey = byok?.apiKey || process.env.AI_API_KEY;
  const baseUrl = (
    byok?.baseUrl ||
    process.env.AI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = byok?.model || process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 AI_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const isSeek = tool === "poem-seek";
    const isMnemonic = tool === "poem-mnemonic";
    let system = prompt;

    // 以文寻诗：把候选古诗词清单（含 slug 与英文译文）注入 system，
    // 让模型只从中挑一首，避免凭空编造。
    if (isSeek) {
      const pool = topSeekCandidates(input, 40);
      const catalog = pool.map((p) => {
        const en = p.lines.map((l) => l.en).join(" / ");
        return `- slug: ${p.slug} | 《${p.title}》${
          p.author ? `（${p.author}）` : ""
        }：${en}`;
      }).join("\n");
      system =
        prompt +
        "\n\n候选古诗词清单（slug 是唯一标识，请从其中只选一首）：\n" +
        catalog;
    }

    // 用 AbortController 手动实现超时，兼容 Cloudflare Workers / Node 等运行时
    // （AbortSignal.timeout 在部分边缘运行时不一定可用）。
    const ctrl = new AbortController();
    const timer = setTimeout(
      () => ctrl.abort(),
      isSeek || isMnemonic
        ? UPSTREAM_TIMEOUT_NONSTREAM_MS
        : UPSTREAM_TIMEOUT_MS
    );
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input },
        ],
        temperature: isSeek || isMnemonic ? 0.5 : 0.7,
        max_tokens: isSeek || isMnemonic ? 400 : MAX_TOKENS,
        stream: !(isSeek || isMnemonic),
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `AI 服务错误：${upstream.status}` },
        { status: 502 }
      );
    }

    // 以文寻诗：非流式，直接返回最相契那首的详情 + 理由
    if (isSeek) {
      const data = await upstream.json().catch(() => null);
      const content = data?.choices?.[0]?.message?.content || "";
      const m = content.match(/\{[\s\S]*\}/);
      let parsed: { slug?: string; reason?: string } = {};
      try {
        parsed = m ? JSON.parse(m[0]) : {};
      } catch {
        parsed = {};
      }
      const poem = POEMS.find((p) => p.slug === parsed.slug);
      if (!poem) {
        return NextResponse.json(
          { error: "未找到匹配的诗", reason: parsed.reason || "" },
          { status: 200 }
        );
      }
      return NextResponse.json({
        slug: poem.slug,
        title: poem.title,
        author: poem.author || "",
        dynasty: poem.dynasty || "",
        lines: poem.lines || [],
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
      });
    }

    // 生词诗化记忆句：非流式，直接透传 AI 返回的 JSON（verse / hint）
    if (isMnemonic) {
      const data = await upstream.json().catch(() => null);
      const content = data?.choices?.[0]?.message?.content || "";
      const m = content.match(/\{[\s\S]*\}/);
      let parsed: Record<string, unknown> = {};
      try {
        parsed = m ? JSON.parse(m[0]) : {};
      } catch {
        parsed = {};
      }
      return NextResponse.json(parsed);
    }

    // 其余工具：直接透传上游 SSE 流，由前端逐字渲染；错误仍走 JSON（非 200）
    if (!upstream.body) {
      return NextResponse.json(
        { error: `AI 服务错误` },
        { status: 502 }
      );
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "调用 AI 超时或失败，请重试" },
      { status: 502 }
    );
  }
}
