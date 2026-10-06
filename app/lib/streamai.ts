/** 统一封装 /api/ai 的 SSE 流式读取（供客户端组件复用） */


import { aiSettingsPayload } from "./aisettings";

export type StreamResult = { ok: boolean; error?: string; empty?: boolean };

export async function streamAi(
  tool: string,
  input: string,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal
): Promise<StreamResult> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, input, ...(aiSettingsPayload() || {}) }),
      signal,
    });
  } catch (e: unknown) {
    if ((e as Error)?.name === "AbortError")
      return { ok: false, error: "ABORTED" };
    return { ok: false, error: "NETWORK" };
  }

  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({} as any));
    return { ok: false, error: j?.error || `HTTP_${res.status}` };
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let got = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content || "";
          if (delta) {
            got = true;
            onDelta(delta);
          }
        } catch {
          /* 忽略心跳与非 JSON 行 */
        }
      }
    }
  }
  return { ok: true, empty: !got };
}
