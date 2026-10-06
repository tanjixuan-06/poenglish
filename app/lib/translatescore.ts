/**
 * 本地自评：把用户译文与参考译文做形式比对
 *
 * 说明：这只是机械比对（实词覆盖 + 长度合理度），
 * 不代表翻译好坏——古诗文翻译允许多种译法。
 * 本函数只做形式比对，用于给出即时反馈；要不要再请模型细讲，由读者决定，
 * 并且完全零成本、可离线。
 */

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "in", "on", "at", "to", "from",
  "with", "without", "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "my", "me", "we", "our", "you", "your", "he", "she", "it", "his",
  "her", "its", "their", "this", "that", "these", "those", "for", "as", "so",
  "not", "no", "do", "does", "did", "have", "has", "had", "will", "would",
  "can", "could", "shall", "should", "may", "might", "must", "up", "down",
  "out", "off", "over", "under", "by", "than", "then", "there", "here",
  "what", "which", "who", "whom", "when", "where", "why", "how", "all",
  "any", "some", "more", "most", "very", "too", "also", "into", "about",
  "above", "below", "between", "o", "oh", "ye", "thy", "thine", "thee",
]);

export function contentWords(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z']*/g) || []).filter(
    (w) => w.length > 2 && !STOP.has(w)
  );
}

export type SelfScore = {
  /** 参考译文实词总数 */
  total: number;
  /** 命中的实词 */
  hit: string[];
  /** 未命中的实词（仅提示用，不代表必须照抄） */
  miss: string[];
  /** 用户译文词数 / 参考译文词数 */
  ratio: number;
  /** 0-100 的自评分（形式比对） */
  score: number;
};

export function scoreTranslation(userEn: string, refEn: string): SelfScore {
  const refWords = Array.from(new Set(contentWords(refEn)));
  const userSet = new Set(contentWords(userEn));
  const hit = refWords.filter((w) => userSet.has(w));
  const miss = refWords.filter((w) => !userSet.has(w));
  const total = refWords.length || 1;
  const coverage = hit.length / total;

  const userCount = contentWords(userEn).length;
  const ratio = userCount / Math.max(1, refWords.length);
  // 长度落在 0.5–2.0 倍之间算合理，越偏离衰减越快
  const lenScore =
    ratio >= 0.5 && ratio <= 2
      ? 1
      : Math.max(0, 1 - Math.abs(Math.log(Math.max(ratio, 0.05))) / 1.5);

  const score = Math.round(coverage * 70 + lenScore * 30);
  return { total: refWords.length, hit, miss, ratio, score };
}
