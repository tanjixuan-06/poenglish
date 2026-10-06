import { describe, it, expect } from "vitest";
import {
  splitSentences,
  analyzeAigc,
  cosineSimilarity,
  checkDuplicate,
} from "./textanalysis";

describe("splitSentences", () => {
  it("按中英文句末标点切分并去空（英文句点 . 不作分隔）", () => {
    expect(splitSentences("你好。世界！Hello? Bye")).toEqual([
      "你好",
      "世界",
      "Hello",
      "Bye",
    ]);
  });
});

describe("analyzeAigc", () => {
  it("评分始终落在 [5, 95]", () => {
    const plain = analyzeAigc("猫在晒太阳。狗在睡觉。鸟在唱歌。鱼在游泳。");
    const cliche = analyzeAigc(
      "随着时代的发展，值得注意的是，综上所述，因此，此外，众所周知，首先其次最后，在当今社会，显而易见，极大地，更好地，赋能，抓手，闭环，旨在，致力于，蓬勃发展，日新月异，尤为重要，由此可见。"
    );
    expect(plain.score).toBeGreaterThanOrEqual(5);
    expect(plain.score).toBeLessThanOrEqual(95);
    expect(cliche.score).toBeGreaterThanOrEqual(5);
    expect(cliche.score).toBeLessThanOrEqual(95);
  });

  it("套话越多评分越高", () => {
    const plain = analyzeAigc("猫在晒太阳。狗在睡觉。鸟在唱歌。鱼在游泳。");
    const cliche = analyzeAigc(
      "随着时代的发展，值得注意的是，综上所述，因此，此外，众所周知，首先其次最后，在当今社会，显而易见，极大地，更好地，赋能，抓手，闭环，旨在，致力于，蓬勃发展，日新月异，尤为重要，由此可见。"
    );
    expect(cliche.score).toBeGreaterThan(plain.score);
  });
});

describe("cosineSimilarity", () => {
  it("相同文本相似度为 1", () => {
    expect(cosineSimilarity("hello world", "hello world")).toBe(1);
  });

  it("无交集文本相似度为 0", () => {
    expect(cosineSimilarity("abcdef", "ghijkl")).toBe(0);
  });

  it("结果始终落在 [0, 1]", () => {
    const s = cosineSimilarity("今天天气真好", "天气真好今天");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe("checkDuplicate", () => {
  it("两段相同长文本重复率高", () => {
    const a = "这是一段用于检测重复率的示例文本，长度足够触发分词与比较逻辑。";
    const r = checkDuplicate(a, a);
    expect(r.duplicateRate).toBeGreaterThan(0.9);
  });

  it("两段无交集文本重复率为 0", () => {
    const r = checkDuplicate("一只橘色的猫", "一条蓝色的鱼");
    expect(r.duplicateRate).toBe(0);
  });
});
