/**
 * 句子级间隔复习：把低分写译 / 回译 / 背译的句子也纳入 SM-2 间隔重复。
 *
 * 与 vocab 的 SRS（srs.ts）共用同一套调度数学（schedule），
 * 但存储独立（不污染生词本），数据同样只存本机 localStorage。
 * 这样「错句本」不再只是静态陈列，而是会按遗忘曲线重新出现，
 * 真正闭合「写得出 → 记不牢 → 再相遇」的学习闭环。
 */

import { dayKey, type PracticeKind, type PracticeRecord } from "./progress";
import { emptyState, schedule, type Grade, type SrsState } from "./srs";

/** 存入复习队列的句子类型（只收会产生「成句」练习的几种） */
const WEAK_KINDS: PracticeKind[] = ["write", "backwrite", "recite"];

export type WeakState = SrsState & {
  /** 篇目 slug */
  slug: string;
  /** 练习类型 */
  kind: PracticeKind;
  /** 题干（写译/背译=中文原句，回译=英文原句） */
  src: string;
  /** 参考答案（写译/背译=英文，回译=中文） */
  ref: string;
  /** 登记时间戳 */
  enrolledAt: number;
};

const KEY = "poenglish-weak-srs";
export const WEAK_CHANGE_EVENT = "poenglish-weak-srs-change";
/** 每天最多引入多少条新巩固句，避免一次塞太多 */
export const WEAK_DAILY_LIMIT = 10;

function weakKey(rec: PracticeRecord): string {
  return `${rec.slug}|${rec.kind}|${rec.src}`;
}

export function loadWeak(): Record<string, WeakState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const out: Record<string, WeakState> = {};
    for (const [k, v] of Object.entries<any>(obj)) {
      if (
        v &&
        typeof v.due === "string" &&
        typeof v.slug === "string" &&
        typeof v.src === "string" &&
        typeof v.ref === "string"
      ) {
        out[k] = {
          due: v.due,
          interval: Number(v.interval) || 0,
          ease: Number(v.ease) || 2.5,
          reps: Number(v.reps) || 0,
          lapses: Number(v.lapses) || 0,
          slug: v.slug,
          kind: v.kind,
          src: v.src,
          ref: v.ref,
          enrolledAt: Number(v.enrolledAt) || 0,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveWeak(map: Record<string, WeakState>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(WEAK_CHANGE_EVENT));
  } catch {
    /* 静默失败 */
  }
}

/** 低分练习记录登记进句子复习队列（分数 < 60 且类型合适才收） */
export function enrollWeak(rec: PracticeRecord): void {
  if (rec.score >= 60) return;
  if (!WEAK_KINDS.includes(rec.kind)) return;
  const now = new Date();
  const map = loadWeak();
  const k = weakKey(rec);
  const base: WeakState = map[k] || {
    ...emptyState(dayKey(now)),
    slug: rec.slug,
    kind: rec.kind,
    src: rec.src,
    ref: rec.ref,
    enrolledAt: Date.now(),
  };
  // 保留调度状态，同步最新参考答案
  map[k] = {
    ...base,
    slug: rec.slug,
    kind: rec.kind,
    src: rec.src,
    ref: rec.ref,
    enrolledAt: base.enrolledAt || Date.now(),
  };
  saveWeak(map);
}

/** 今天到期的巩固句（含新登记，due=今天） */
export function dueWeakItems(
  now = new Date()
): { key: string; state: WeakState }[] {
  const map = loadWeak();
  const today = dayKey(now);
  return Object.entries(map)
    .filter(([, s]) => s.due <= today)
    .slice(0, WEAK_DAILY_LIMIT)
    .map(([key, state]) => ({ key, state }));
}

/** 按三档评分推进一条巩固句的复习状态 */
export function gradeWeak(
  key: string,
  grade: Grade,
  now = new Date()
): WeakState | null {
  const map = loadWeak();
  const cur = map[key];
  if (!cur) return null;
  const next = schedule(cur, grade, now);
  map[key] = { ...cur, ...next };
  saveWeak(map);
  return map[key];
}
