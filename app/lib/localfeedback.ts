/**
 * 本地批注：不联网、不调模型，纯规则给出「像人批的」意见。
 *
 * 设计原则：
 * 1. 只说能确定的事——用词有没有带上、句子是不是完整、有没有明显硬伤；
 * 2. 不说「你译得好不好」，那是人（或老师）的事，规则判不了；
 * 3. 每条都指到具体词，而不是给一个空泛的分数。
 * 参考译法只是参考，所以批注的措辞始终是提醒，不是纠错。
 */

import { contentWords } from "./translatescore";

export type Note = { tone: "good" | "warn" | "bad"; text: string };

const ZH_STOP = new Set([
  "的", "是", "在", "和", "与", "有", "不", "了", "之", "而", "其", "乃",
  "则", "也", "者", "所", "为", "若", "如", "将", "欲", "更", "又", "已",
  "何", "皆", "俱", "自", "相", "此", "我", "君", "人", "无", "莫", "未",
  "上", "下", "中", "里", "来", "去", "看", "问", "时", "年", "日", "月",
]);

/** 从中文句子里挑出可能是意象/实词的双字片段 */
function zhChunks(zh: string): string[] {
  const clean = zh.replace(/[，。！？、；：「」《》\s,.!?;:()"']/g, "");
  const out: string[] = [];
  for (let i = 0; i + 2 <= clean.length; i++) {
    const w = clean.slice(i, i + 2);
    if ([...w].some((c) => ZH_STOP.has(c))) continue;
    out.push(w);
  }
  return Array.from(new Set(out));
}

/** 英文句子里的机械硬伤 */
function enMechanics(en: string): Note[] {
  const notes: Note[] = [];
  const s = en.trim();
  if (!s) return notes;

  if (/[\u4e00-\u9fa5]/.test(s)) {
    notes.push({ tone: "bad", text: "译文里混进了中文字符，先清干净。" });
  }
  if (/^[^A-Z]/.test(s)) {
    notes.push({ tone: "warn", text: "英文句子首字母要大写。" });
  }
  if (!/[.!?]$/.test(s)) {
    notes.push({ tone: "warn", text: "句末标点别忘了，一句一收。" });
  }
  if (/[，。、；：？！]/.test(s)) {
    notes.push({ tone: "warn", text: "用了中文标点，英译里要换成半角。" });
  }
  if (/\bvery\b/i.test(s)) {
    notes.push({
      tone: "warn",
      text: "诗译里很少用 very。想加重，换成更具体的词更见功力。",
    });
  }
  if (/\b(be|is|are|was|were)\s+\w+ing\b/i.test(s) && /\b(stand|sit|lie)\b/i.test(s)) {
    notes.push({
      tone: "warn",
      text: "写景一般用现在时，正在进行时容易把画面写「动」过了。",
    });
  }
  if (/\bthere\s+(is|are)\b/i.test(s)) {
    notes.push({
      tone: "warn",
      text: "there is/are 是中文「有」的直译，试着让真正的主语站到句首。",
    });
  }
  return notes;
}

/** 中译英：对照参考译法给批注 */
export function notesZh2En(userEn: string, refEn: string, zh: string): Note[] {
  const notes: Note[] = [];
  const ref = Array.from(new Set(contentWords(refEn)));
  const mine = new Set(contentWords(userEn));
  const miss = ref.filter((w) => !mine.has(w));
  const hit = ref.filter((w) => mine.has(w));

  const mineCount = contentWords(userEn).length;
  const ratio = mineCount / Math.max(1, ref.length);

  if (ref.length >= 3 && hit.length === ref.length) {
    notes.push({
      tone: "good",
      text: "参考译法里的实词你基本都带上了。剩下的差别在节奏和味道上——对着原句各读两遍就听出来了。",
    });
  } else if (miss.length > 0) {
    const show = miss.slice(0, 3);
    notes.push({
      tone: "warn",
      text: `参考译法用到了 ${show.map((w) => `「${w}」`).join("、")}，你的译文里没有。不必照抄，但要想清楚原句那层意思你打算放在哪儿。`,
    });
  }

  if (ratio > 1.8) {
    notes.push({
      tone: "warn",
      text: `比参考译法长了近 ${ratio.toFixed(1)} 倍。诗译贵在省，看看哪些词是解释性的、可以删掉。`,
    });
  } else if (ratio < 0.5 && ref.length >= 3) {
    notes.push({
      tone: "warn",
      text: "短了不少，可能有信息没带上。对着中文再过一遍，一物一动作都点到了吗？",
    });
  }

  notes.push(...enMechanics(userEn));

  if (zh && /[，。]/.test(zh) && !/[,\.]/.test(userEn)) {
    notes.push({
      tone: "warn",
      text: "原句是两个分句，译成一个整句时要注意连接——逗号、and 或分词结构都行，别硬接。",
    });
  }

  if (notes.length === 0) {
    notes.push({
      tone: "good",
      text: "没有明显硬伤。译诗没有标准答案，拿它和参考译法并排放着读，选你读着顺的那个。",
    });
  }
  return notes;
}

/** 回译（英译中）：贴着中文原句给批注 */
export function notesEn2Zh(userZh: string, zh: string, fit: number): Note[] {
  const notes: Note[] = [];

  if (fit >= 0.8) {
    notes.push({ tone: "good", text: "和原句贴合得很好，意思基本都回来了。" });
  } else if (fit >= 0.5) {
    notes.push({
      tone: "warn",
      text: "大意对了，细节有出入。回译的价值就在这些出入上——看看是漏了词，还是换了说法。",
    });
  } else {
    notes.push({
      tone: "warn",
      text: "和原句差得比较远。建议先不看中文，把英文逐词拆开，再一句句拼回来。",
    });
  }

  const chunks = zhChunks(zh);
  const missing = chunks.filter((w) => !userZh.includes(w));
  if (missing.length > 0 && chunks.length > 0) {
    const show = missing.slice(0, 3);
    notes.push({
      tone: "warn",
      text: `原句里的${show.map((w) => `「${w}」`).join("、")}在你译回来的中文里没见到。想想它们是丢了，还是被你换了个说法。`,
    });
  }

  if (userZh.length > zh.length * 1.8 && zh.length >= 6) {
    notes.push({
      tone: "warn",
      text: "译回来的中文比原句长不少。回译讲究贴着原句走，先求准，再求顺。",
    });
  }
  if (/[a-zA-Z]{3,}/.test(userZh)) {
    notes.push({
      tone: "warn",
      text: "里头还留着英文单词，应该是没译干净。",
    });
  }
  return notes;
}
