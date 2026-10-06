/**
 * 学习档案：练习记录持久化
 *
 * 数据只存在本机浏览器（localStorage），不上服务器。
 * 记录来源：写译 / 回译 / 默写 / 猜诗 / 背译 每一次提交。
 * 它同时是「学习统计」与「错句本」的数据源。
 */

import { enrollWeak } from "./reviewqueue";

export type PracticeKind = "write" | "backwrite" | "cloze" | "guess" | "recite";

export type PracticeRecord = {
  /** 练习类型 */
  kind: PracticeKind;
  /** 篇目 slug */
  slug: string;
  /** 篇目标题（直接存字符串，避免为显示再拉全量诗词） */
  title: string;
  /** 题干（写译=中文原句，回译=英文原句，默写=带空句子） */
  src: string;
  /** 我的答案 */
  mine: string;
  /** 参考译法 */
  ref: string;
  /** 0-100 */
  score: number;
  /** 时间戳 */
  at: number;
};

const KEY = "poenglish-practice";
export const PRACTICE_CHANGE_EVENT = "poenglish-practice-change";
const MAX_ITEMS = 600;

/** 本地日期键 YYYY-MM-DD */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function isRecord(x: any): x is PracticeRecord {
  return (
    x &&
    typeof x.slug === "string" &&
    typeof x.mine === "string" &&
    typeof x.score === "number" &&
    typeof x.at === "number"
  );
}

export function loadPractice(): PracticeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(isRecord).sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export function savePractice(list: PracticeRecord[]) {
  try {
    const trimmed = [...list].sort((a, b) => b.at - a.at).slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(PRACTICE_CHANGE_EVENT));
  } catch {
    /* 隐私模式或空间不足时静默失败 */
  }
}

export function addPractice(rec: Omit<PracticeRecord, "at">) {
  const list = loadPractice();
  list.unshift({ ...rec, at: Date.now() });
  savePractice(list);
  // 低分写译 / 回译 / 背译句子登记进间隔复习队列，闭合学习闭环
  enrollWeak({ ...rec, at: Date.now() });
}

export function clearPractice() {
  savePractice([]);
}

export type Stats = {
  total: number;
  /** 有练习记录的天数 */
  days: number;
  /** 平均分（0-100） */
  avg: number;
  /** 涉及篇目数 */
  poems: number;
  byKind: Record<PracticeKind, number>;
  /** 最近 7 天（含今天），按时间正序 */
  last7: { day: string; n: number; avg: number }[];
  /** 得分低于阈值的记录，按时间倒序 */
  weak: PracticeRecord[];
};

const WEAK_THRESHOLD = 60;

export function practiceStats(list: PracticeRecord[], now = new Date()): Stats {
  const byKind: Record<PracticeKind, number> = {
    write: 0,
    backwrite: 0,
    cloze: 0,
    guess: 0,
    recite: 0,
  };
  let sum = 0;
  const daySet = new Set<string>();
  const poemSet = new Set<string>();
  const buckets = new Map<string, { n: number; sum: number }>();

  for (const r of list) {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    sum += r.score;
    const d = dayKey(new Date(r.at));
    daySet.add(d);
    poemSet.add(r.slug);
    const b = buckets.get(d) || { n: 0, sum: 0 };
    b.n += 1;
    b.sum += r.score;
    buckets.set(d, b);
  }

  const last7: { day: string; n: number; avg: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const b = buckets.get(k);
    last7.push({
      day: k,
      n: b ? b.n : 0,
      avg: b && b.n ? Math.round(b.sum / b.n) : 0,
    });
  }

  return {
    total: list.length,
    days: daySet.size,
    avg: list.length ? Math.round(sum / list.length) : 0,
    poems: poemSet.size,
    byKind,
    last7,
    weak: list.filter((r) => r.score < WEAK_THRESHOLD).slice(0, 30),
  };
}

/** 连续打卡天数（复用每日一诗的存储） */
export function checkinStreak(now = new Date()): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("poenglish-checkin");
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return 0;
    const dates = new Set<string>(list.filter((x) => typeof x === "string"));
    let n = 0;
    const cur = new Date(now);
    // 今天没打卡不算断，从昨天开始往前数
    if (!dates.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
    while (dates.has(dayKey(cur))) {
      n++;
      cur.setDate(cur.getDate() - 1);
    }
    return n;
  } catch {
    return 0;
  }
}
