import { describe, it, expect } from "vitest";
import { scoreTranslation, contentWords } from "./translatescore";

describe("contentWords", () => {
  it("去掉停用词且只保留长度 > 2 的实词", () => {
    expect(contentWords("The quick brown fox")).toEqual(["quick", "brown", "fox"]);
  });
});

describe("scoreTranslation", () => {
  it("完全命中：覆盖率满分 + 长度合理 → 100", () => {
    const r = scoreTranslation("The moon is bright", "The moon is bright");
    expect(r.total).toBe(2); // moon, bright（the/is 为停用词）
    expect(r.hit.length).toBe(2);
    expect(r.score).toBe(100);
  });

  it("部分命中：覆盖率折半，长度合理 → 65", () => {
    const r = scoreTranslation("moon", "The moon is bright");
    expect(r.hit).toEqual(["moon"]);
    expect(r.score).toBe(65); // 0.5*70 + 1*30
  });

  it("只填停用词：覆盖率 0、长度极短 → 0", () => {
    const r = scoreTranslation("the", "The moon is bright");
    expect(r.hit.length).toBe(0);
    expect(r.score).toBe(0);
  });

  it("评分始终落在 [0, 100]", () => {
    const r1 = scoreTranslation("x ".repeat(80), "The moon is bright");
    const r2 = scoreTranslation("", "The moon is bright");
    expect(r1.score).toBeGreaterThanOrEqual(0);
    expect(r1.score).toBeLessThanOrEqual(100);
    expect(r2.score).toBeGreaterThanOrEqual(0);
    expect(r2.score).toBeLessThanOrEqual(100);
  });
});
