/**
 * 间隔重复（SRS）：SM-2 的简化实现
 *
 * 只维护「单词 → 复习状态」，不改动生词本本身的数据结构，
 * 这样即使本模块清空，生词本仍是完整可用的降级形态。
 *
 * 三档评分（比五档更适合背单词）：
 *   0 忘了 → 明天必再出现
 *   1 模糊 → 间隔维持不变
 *   2 记得 → 间隔 × 熟悉度系数，逐步拉长
 */

import { dayKey } from "./progress";

export type Grade = 0 | 1 | 2;

export type SrsState = {
  /** 下次复习日期 YYYY-MM-DD */
  due: string;
  /** 当前间隔（天） */
  interval: number;
  /** 熟悉度系数，SM-2 里的 easiness */
  ease: number;
  /** 连续答对次数 */
  reps: number;
  /** 遗忘次数 */
  lapses: number;
};

const KEY = "poenglish-srs";
export const SRS_CHANGE_EVENT = "poenglish-srs-change";
/** 每天最多引入多少新词进入复习 */
export const DAILY_NEW_LIMIT = 10;

const EASE_MIN = 1.3;
const EASE_MAX = 2.8;
const EASE_START = 2.5;

export function emptyState(due: string): SrsState {
  return { due, interval: 0, ease: EASE_START, reps: 0, lapses: 0 };
}

export function loadSrs(): Record<string, SrsState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const out: Record<string, SrsState> = {};
    for (const [k, v] of Object.entries<any>(obj)) {
      if (v && typeof v.due === "string" && typeof v.interval === "number") {
        out[k] = {
          due: v.due,
          interval: Number(v.interval) || 0,
          ease: Number(v.ease) || EASE_START,
          reps: Number(v.reps) || 0,
          lapses: Number(v.lapses) || 0,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveSrs(map: Record<string, SrsState>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(SRS_CHANGE_EVENT));
  } catch {
    /* 静默失败 */
  }
}

export function clearSrs() {
  saveSrs({});
}

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** 按三档评分推进一个状态（纯函数，无 IO，便于复用与单测） */
export function schedule(
  state: SrsState,
  grade: Grade,
  now: Date
): SrsState {
  let { interval, ease, reps, lapses } = state;

  if (grade === 0) {
    interval = 0;
    reps = 0;
    lapses += 1;
    ease = Math.max(EASE_MIN, ease - 0.2);
  } else if (grade === 1) {
    interval = interval === 0 ? 1 : interval;
    reps += 1;
    ease = Math.max(EASE_MIN, ease - 0.05);
  } else {
    interval = interval === 0 ? 1 : interval === 1 ? 3 : Math.round(interval * ease);
    reps += 1;
    ease = Math.min(EASE_MAX, ease + 0.1);
  }

  return {
    due: addDays(now, interval === 0 ? 1 : interval),
    interval,
    ease,
    reps,
    lapses,
  };
}

/** 按三档评分推进一个词的状态 */
export function gradeWord(
  word: string,
  grade: Grade,
  now = new Date()
): SrsState {
  const key = word.trim().toLowerCase();
  const map = loadSrs();
  const cur = map[key] || emptyState(dayKey(now));
  const next = schedule(cur, grade, now);
  map[key] = next;
  saveSrs(map);
  return next;
}

export type DueResult = {
  /** 到期该复习的词 */
  overdue: string[];
  /** 从未排过队的新词（受每日上限约束） */
  fresh: string[];
  /** 今日已复习完成的词数（用于进度提示，按 due 在未来判断） */
  scheduled: number;
};

/**
 * 依据生词本算出今天的复习队列
 * @param words 生词本里的英文词（已去重）
 */
export function dueWords(words: string[], now = new Date()): DueResult {
  const map = loadSrs();
  const today = dayKey(now);
  const overdue: string[] = [];
  const fresh: string[] = [];
  let scheduled = 0;

  for (const w of words) {
    const key = w.trim().toLowerCase();
    if (!key) continue;
    const st = map[key];
    if (!st) {
      fresh.push(w);
    } else if (st.due <= today) {
      overdue.push(w);
    } else {
      scheduled += 1;
    }
  }

  // 到期词优先，新词按每日上限补齐，避免一次塞太多
  return {
    overdue,
    fresh: fresh.slice(0, Math.max(0, DAILY_NEW_LIMIT - overdue.length)),
    scheduled,
  };
}

/** 已「记住」的词：连续答对 2 次以上且间隔 >= 7 天 */
export function masteredCount(map: Record<string, SrsState> = loadSrs()): number {
  return Object.values(map).filter((s) => s.reps >= 2 && s.interval >= 7).length;
}
