import { describe, it, expect } from "vitest";
import {
  schedule,
  emptyState,
  gradeWord,
  dueWords,
  DAILY_NEW_LIMIT,
} from "./srs";

const NOW = new Date(2026, 0, 1); // 2026-01-01

describe("schedule (SM-2 简化调度)", () => {
  it("记得：从全新状态 → 间隔 1、熟悉度 +0.1、次日到期", () => {
    const s = schedule(emptyState("2026-01-01"), 2, NOW);
    expect(s.interval).toBe(1);
    expect(s.reps).toBe(1);
    expect(s.ease).toBeCloseTo(2.6, 5);
    expect(s.due).toBe("2026-01-02");
  });

  it("模糊：间隔维持、熟悉度 -0.05", () => {
    const s = schedule(emptyState("2026-01-01"), 1, NOW);
    expect(s.interval).toBe(1);
    expect(s.reps).toBe(1);
    expect(s.ease).toBeCloseTo(2.45, 5);
    expect(s.due).toBe("2026-01-02");
  });

  it("忘了：间隔归零、连续数清零、遗忘 +1、熟悉度 -0.2", () => {
    const s = schedule(emptyState("2026-01-01"), 0, NOW);
    expect(s.interval).toBe(0);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(2.3, 5);
    expect(s.due).toBe("2026-01-02");
  });

  it("间隔为 1 时记得 → 跳到 3 天", () => {
    const st = { due: "2026-01-01", interval: 1, ease: 2.5, reps: 1, lapses: 0 };
    const s = schedule(st, 2, NOW);
    expect(s.interval).toBe(3);
    expect(s.due).toBe("2026-01-04");
  });

  it("间隔为 3 时记得 → 间隔 × 熟悉度并四舍五入", () => {
    const st = { due: "2026-01-01", interval: 3, ease: 2.5, reps: 2, lapses: 0 };
    const s = schedule(st, 2, NOW);
    expect(s.interval).toBe(Math.round(3 * 2.5)); // 8
    expect(s.due).toBe("2026-01-09");
  });

  it("熟悉度下限钳制为 1.3", () => {
    let st = emptyState("2026-01-01");
    for (let i = 0; i < 30; i++) st = schedule(st, 0, NOW);
    expect(st.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("熟悉度上限钳制为 2.8", () => {
    let st = emptyState("2026-01-01");
    for (let i = 0; i < 30; i++) st = schedule(st, 2, NOW);
    expect(st.ease).toBeLessThanOrEqual(2.8);
  });
});

describe("gradeWord", () => {
  it("返回合法状态且不抛错（Node 下无 localStorage，仅验证调度结果）", () => {
    const s = gradeWord("example", 2, NOW);
    expect(s.interval).toBe(1);
  });
});

describe("dueWords", () => {
  it("无任何历史记录时全部视为新词，并按每日上限截断", () => {
    const words = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const r = dueWords(words, NOW);
    expect(r.overdue.length).toBe(0);
    expect(r.fresh.length).toBe(DAILY_NEW_LIMIT);
    expect(r.scheduled).toBe(0);
  });
});
