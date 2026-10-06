// 纯函数文本分析库：被实用工具组件（客户端）引用，无任何运行时依赖。

/* ================= AIGC 启发式检测 ================= */

export interface ClicheHit {
  word: string;
  count: number;
}

export interface AigcReport {
  score: number; // 0-100，越高越疑似 AI 生成
  chars: number;
  sentenceCount: number;
  burstiness: number; // 句长波动性（人写通常更高）
  ttr: number; // 字符级词汇多样性
  connectivePerSentence: number;
  clicheHits: ClicheHit[];
  humanSignals: string[];
  shortText: boolean;
}

// AI 高频套话词（写作模板味）
const CLICHES = [
  "综上所述", "总而言之", "总的来说", "值得注意的是", "众所周知",
  "在当今社会", "随着", "首先", "其次", "最后", "一方面", "另一方面",
  "不仅", "而且", "然而", "因此", "此外", "与此同时", "至关重要",
  "不可或缺", "显而易见", "极大地", "更好地", "赋能", "抓手", "闭环",
  "旨在", "致力于", "蓬勃发展", "日新月异", "尤为重要", "由此可见",
];

// 口语化 / 人味信号
const HUMAN_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /哈哈|嘿嘿|嘻嘻/g, label: "语气笑声" },
  { re: /[吧呢嘛哦呀咯喽哇]/g, label: "语气词" },
  { re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, label: "emoji" },
  { re: /emmm+|emm+|233+|666+|hhh+/gi, label: "网络用语" },
  { re: /说实话|讲真|其实吧|怎么说呢/g, label: "口语插入语" },
  { re: /!!+|！！+|\?\?+|？？+|~+/g, label: "叠用标点" },
];

export function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?；;\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countHits(text: string, word: string): number {
  let n = 0;
  let i = text.indexOf(word);
  while (i !== -1) {
    n++;
    i = text.indexOf(word, i + word.length);
  }
  return n;
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v =
    nums.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (nums.length - 1);
  return Math.sqrt(v);
}

export function analyzeAigc(text: string): AigcReport {
  const chars = text.replace(/\s/g, "").length;
  const sentences = splitSentences(text);
  const cjk = text.match(/[\u4e00-\u9fff]/g) || [];
  const uniqueChars = new Set(cjk);

  // 句长波动性（burstiness）
  const lens = sentences.map((s) => s.replace(/\s/g, "").length);
  const meanLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const burstiness = meanLen > 0 ? stdev(lens) / meanLen : 0;

  // 字符级词汇多样性
  const ttr = cjk.length > 0 ? uniqueChars.size / cjk.length : 0;

  // AI 套话词命中
  const clicheHits: ClicheHit[] = [];
  let clicheTotal = 0;
  for (const w of CLICHES) {
    const n = countHits(text, w);
    if (n > 0) {
      clicheHits.push({ word: w, count: n });
      clicheTotal += n;
    }
  }
  clicheHits.sort((a, b) => b.count - a.count);

  // 连接词密度（每句平均）
  const connectives = ["然而", "因此", "此外", "同时", "不仅", "而且", "一方面", "首先", "其次", "综上"];
  let connectiveTotal = 0;
  for (const w of connectives) connectiveTotal += countHits(text, w);
  const connectivePerSentence =
    sentences.length > 0 ? connectiveTotal / sentences.length : 0;

  // 人味信号
  const humanSignals: string[] = [];
  let humanTotal = 0;
  for (const p of HUMAN_PATTERNS) {
    const m = text.match(p.re);
    if (m && m.length > 0) {
      humanSignals.push(`${p.label}×${m.length}`);
      humanTotal += m.length;
    }
  }

  // ===== 评分（基线 30，各维度加权）=====
  let score = 30;
  if (sentences.length >= 4) {
    if (burstiness < 0.2) score += 20;
    else if (burstiness < 0.35) score += 12;
    else if (burstiness < 0.5) score += 5;
    else score -= 5;
  }
  const clicheRate = chars > 0 ? (clicheTotal / chars) * 100 : 0;
  if (clicheRate > 3) score += 25;
  else if (clicheRate > 1.5) score += 15;
  else if (clicheRate > 0.5) score += 8;
  if (connectivePerSentence > 0.4) score += 15;
  else if (connectivePerSentence > 0.2) score += 8;
  if (ttr >= 0.45 && ttr <= 0.65) score += 8;
  score -= Math.min(25, humanTotal * 8);

  score = Math.max(5, Math.min(95, Math.round(score)));

  return {
    score,
    chars,
    sentenceCount: sentences.length,
    burstiness: Number(burstiness.toFixed(2)),
    ttr: Number(ttr.toFixed(2)),
    connectivePerSentence: Number(connectivePerSentence.toFixed(2)),
    clicheHits: clicheHits.slice(0, 8),
    humanSignals,
    shortText: chars < 60,
  };
}

/* ================= 文本查重（两文本相似度） ================= */

export interface DuplicatePair {
  sentenceB: string;
  sentenceA: string;
  similarity: number;
}

export interface SimilarityReport {
  cosine: number; // 整体余弦相似度 0-1
  duplicateRate: number; // 文本 B 的重复率（被相似句覆盖的字符占比）
  pairs: DuplicatePair[];
  charsA: number;
  charsB: number;
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, "");
}

// 分词：中文相邻二字组（bigram）+ 英文/数字连续串
function tokenize(text: string): string[] {
  const normalized = normalizeForCompare(text);
  const tokens: string[] = [];
  const latin = normalized.match(/[a-z0-9]+/g) || [];
  for (const w of latin) tokens.push(w);
  const cjkOnly = normalized.replace(/[a-z0-9]+/g, " ");
  const runs = cjkOnly.split(" ").filter(Boolean);
  for (const run of runs) {
    for (let i = 0; i < run.length - 1; i++) tokens.push(run[i] + run[i + 1]);
  }
  return tokens;
}

function tokenFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

export function cosineSimilarity(a: string, b: string): number {
  const fa = tokenFreq(tokenize(a));
  const fb = tokenFreq(tokenize(b));
  if (fa.size === 0 || fb.size === 0) return 0;
  let dot = 0;
  for (const [k, v] of fa) dot += v * (fb.get(k) || 0);
  let na = 0;
  for (const v of fa.values()) na += v * v;
  let nb = 0;
  for (const v of fb.values()) nb += v * v;
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function checkDuplicate(textA: string, textB: string): SimilarityReport {
  const pairs: DuplicatePair[] = [];
  const sentsA = splitSentences(textA).filter((s) => s.length >= 6);
  const sentsB = splitSentences(textB).filter((s) => s.length >= 6);
  const setsA = sentsA.map((s) => new Set(tokenize(s)));
  const setsB = sentsB.map((s) => new Set(tokenize(s)));

  let coveredChars = 0;
  const totalCharsB =
    sentsB.reduce((acc, s) => acc + s.replace(/\s/g, "").length, 0) || 1;

  for (let i = 0; i < sentsB.length; i++) {
    let best = 0;
    let bestIdx = -1;
    for (let j = 0; j < sentsA.length; j++) {
      const sim = jaccard(setsB[i], setsA[j]);
      if (sim > best) {
        best = sim;
        bestIdx = j;
      }
    }
    if (best >= 0.45 && bestIdx >= 0) {
      pairs.push({
        sentenceB: sentsB[i],
        sentenceA: sentsA[bestIdx],
        similarity: Number(best.toFixed(2)),
      });
      coveredChars += sentsB[i].replace(/\s/g, "").length;
    }
  }

  return {
    cosine: Number(cosineSimilarity(textA, textB).toFixed(3)),
    duplicateRate: Number((coveredChars / totalCharsB).toFixed(3)),
    pairs: pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 10),
    charsA: textA.replace(/\s/g, "").length,
    charsB: textB.replace(/\s/g, "").length,
  };
}
