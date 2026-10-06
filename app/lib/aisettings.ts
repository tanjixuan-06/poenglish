/**
 * 用户自带的 AI 配置（BYOK, bring your own key）
 *
 * 语义：留空则用本站自带的 AI 服务；填了就走用户自己的额度，
 * 同时不受本站限流影响（本站只做转发，不保存、不记录密钥）。
 *
 * 存储：仅存于本浏览器的 localStorage，换设备需重新填写。
 */

export type AiSettings = {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
};

const KEY = "poenglish-ai-settings";

export const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
export const DEFAULT_MODEL = "deepseek-chat";

export const EMPTY_AI_SETTINGS: AiSettings = {
  enabled: false,
  apiKey: "",
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
};

export function loadAiSettings(): AiSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_AI_SETTINGS };
    const p = JSON.parse(raw) as Partial<AiSettings>;
    const baseUrl =
      typeof p?.baseUrl === "string" && p.baseUrl.trim()
        ? p.baseUrl.trim()
        : DEFAULT_BASE_URL;
    const model =
      typeof p?.model === "string" && p.model.trim()
        ? p.model.trim()
        : DEFAULT_MODEL;
    return {
      enabled: !!p?.enabled,
      apiKey: typeof p?.apiKey === "string" ? p.apiKey.trim() : "",
      baseUrl,
      model,
    };
  } catch {
    return { ...EMPTY_AI_SETTINGS };
  }
}

export function saveAiSettings(s: AiSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 隐私模式下静默失败 */
  }
}

export function clearAiSettings(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 隐私模式下静默失败 */
  }
}

/**
 * 随请求带上给 /api/ai 的凭据；未开启或未填密钥时返回 null，
 * 此时服务端回退到站点自带的 AI 服务。
 */
export function aiSettingsPayload():
  | { apiKey: string; baseUrl: string; model: string }
  | null {
  const s = loadAiSettings();
  if (!s.enabled || !s.apiKey) return null;
  return { apiKey: s.apiKey, baseUrl: s.baseUrl, model: s.model };
}
