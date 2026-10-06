/**
 * 生词本：localStorage 持久化
 *
 * 数据只存在本机浏览器，不上服务器。
 * 词条来源：诗词页重点词汇旁的收藏按钮 / AI 批改里手动添加。
 */

export type VocabItem = {
  /** 英文词或短语 */
  w: string;
  /** 中文释义 */
  zh: string;
  /** 来源（诗题等，直接存字符串，避免为显示再拉全量诗词数据） */
  from?: string;
  at: number;
};

const KEY = "poenglish-vocab";
export const VOCAB_CHANGE_EVENT = "poenglish-vocab-change";
const MAX_ITEMS = 300;

export function loadVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (x: any) => x && typeof x.w === "string" && typeof x.zh === "string"
    );
  } catch {
    return [];
  }
}

function persist(list: VocabItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(VOCAB_CHANGE_EVENT));
  } catch {
    /* 隐私模式或空间不足时静默失败 */
  }
}

export function saveVocab(list: VocabItem[]) {
  persist(list.slice(0, MAX_ITEMS));
}

export function hasVocab(w: string): boolean {
  const lower = w.trim().toLowerCase();
  return loadVocab().some((x) => x.w.trim().toLowerCase() === lower);
}

/** 返回 false 表示已存在（未重复添加） */
export function addVocab(item: Omit<VocabItem, "at">): boolean {
  const w = item.w.trim();
  if (!w) return false;
  if (hasVocab(w)) return false;
  const list = loadVocab();
  list.unshift({ ...item, w, at: Date.now() });
  saveVocab(list);
  return true;
}

export function removeVocab(w: string) {
  saveVocab(loadVocab().filter((x) => x.w !== w));
}
