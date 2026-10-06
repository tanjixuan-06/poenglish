/**
 * 古诗文数据类型定义
 *
 * 覆盖小学 → 初中 → 高中必修篇目，含古诗词与文言文。
 * 英译说明：所有英译均为本站点自行撰写的学习化译文，
 * 避免引用现代译家受版权保护的译本；原文均为公有领域。
 */

export type PoemLine = { zh: string; en: string };

export type CrossCard = {
  /** 学科标签（中文） */
  field: string;
  fieldEn: string;
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
};

/** 学段 */
export type Stage = "小学" | "初中" | "高中";

/** 文体：诗（古体/近体）、词（含曲）、文言文（含散文、赋、语录体） */
export type Kind = "诗" | "词" | "文言文";

export type Poem = {
  slug: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  dynasty: string;
  dynastyEn: string;
  /** 学段：小学 / 初中 / 高中 */
  stage: Stage;
  /** 文体：诗 / 词 / 文言文 */
  kind: Kind;
  /** 主题标签，用于筛选与出题干扰项 */
  theme: string;
  themeEn: string;
  /** 难度：1 入门 / 2 进阶 / 3 挑战（供猜诗等按难度筛选；可跨学段浮动，如初中寓言可设 1） */
  level: 1 | 2 | 3;
  /** 逐句中英对照；文言文为关键段落或名句 */
  lines: PoemLine[];
  /** 文言文全文（中文），诗词可省略 */
  fullText?: string;
  /** 英译重点词汇 → 中文释义 */
  keywords: { w: string; zh: string }[];
  /** 跨学科知识卡（可选：部分篇目暂缺） */
  cross?: CrossCard;
  /** 一句话赏析（中英） */
  note: string;
  noteEn: string;
};
