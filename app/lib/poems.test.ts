import { describe, it, expect } from "vitest";
import { POEMS } from "../config/poems";
import type { Poem } from "../config/poems";

/**
 * 全库数据完整性终审：
 * 每篇必填字段、枚举合法性、slug 查重、中英不混串、
 * 重点词能在本诗译文中寻得（带轻量词形还原）。
 */

const STAGES: Record<string, number> = { 小学: 1, 初中: 2, 高中: 3 };
const KINDS = new Set(["诗", "词", "文言文"]);

const CJK = /[\u4e00-\u9fff\u3400-\u4dbf]/;
const LATIN = /[A-Za-z]/;

/** 关键词 → 可检索的候选串（先剥注解括号与占位符，再按 /、省略号拆分） */
function kwVariants(w: string): string[] {
  const cleaned = w
    .replace(/\(.*?\)/g, " ") // (v.) (adj./n.) 等注解
    .replace(/\bsb\.?|\bsth\.?/gi, " "); // sb. / sth. 当通配
  return cleaned
    .split(/[\/…—]/)
    .map((s) => s.replace(/(^|\s)[AB](?=\s|$)/g, " ").trim().toLowerCase())
    .filter(Boolean);
}

const IRREG_FORMS: Record<string, string[]> = {
  grind: ["ground"], weep: ["wept"], strike: ["struck"], fall: ["fell", "fallen"],
  tell: ["told"], keep: ["kept"], lose: ["lost"], give: ["gave", "given"],
  take: ["took", "taken"], go: ["went", "gone"], get: ["got"], find: ["found"],
  hide: ["hid", "hidden"], bear: ["bore", "borne"], see: ["saw", "seen"],
  run: ["ran"], come: ["came"], break: ["broke", "broken"],
  speak: ["spoke", "spoken"], win: ["won"], fly: ["flew", "flown"],
  grow: ["grew", "grown"], know: ["knew", "known"], throw: ["threw", "thrown"],
  draw: ["drew", "drawn"], teach: ["taught"], feed: ["fed"], lead: ["led"],
  sleep: ["slept"], feel: ["felt"], hold: ["held"], stand: ["stood"],
  spend: ["spent"], build: ["built"], send: ["sent"], shine: ["shone"],
  shoot: ["shot"], sit: ["sat"], lie: ["lay", "lain", "lying"], lay: ["laid"],
  wear: ["wore", "worn"], rise: ["rose", "risen"], ride: ["rode", "ridden"],
  write: ["wrote", "written"], drive: ["drove", "driven"], make: ["made"],
  say: ["said"], think: ["thought"], buy: ["bought"], bring: ["brought"],
  catch: ["caught"], hear: ["heard"], pay: ["paid"], leave: ["left"],
  meet: ["met"], mean: ["meant"], seek: ["sought"], fight: ["fought"],
  bend: ["bent"], dig: ["dug"], hang: ["hung"], swing: ["swung"],
  freeze: ["froze", "frozen"], steal: ["stole", "stolen"],
  choose: ["chose", "chosen"], forget: ["forgot", "forgotten"], light: ["lit"],
};

/** 反向表：过去式/分词 → 原形 */
const FORM_TO_BASE: Record<string, string[]> = {};
for (const [base, forms] of Object.entries(IRREG_FORMS)) {
  for (const f of forms) (FORM_TO_BASE[f] ??= []).push(base);
}

/** 极轻量词形还原候选（含不规则动词双向） */
function stems(word: string): string[] {
  const w = word.toLowerCase().replace(/[’]/g, "'");
  const out = new Set<string>([w]);
  if (w.endsWith("'s")) out.add(w.slice(0, -2));
  if (w.endsWith("ies")) out.add(w.slice(0, -3) + "y");
  if (w.endsWith("ied")) out.add(w.slice(0, -3) + "y"); // carried → carry
  if (w.endsWith("es")) out.add(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) out.add(w.slice(0, -1));
  if (w.endsWith("ed")) {
    out.add(w.slice(0, -1)); // hoped → hope
    out.add(w.slice(0, -2)); // walked → walk
  }
  if (w.endsWith("ing")) {
    out.add(w.slice(0, -3)); // doing → do
    out.add(w.slice(0, -3) + "e"); // coming → come
  }
  for (const f of IRREG_FORMS[w] ?? []) out.add(f);
  for (const b of FORM_TO_BASE[w] ?? []) out.add(b);
  // 双写辅音还原：hemmed → hemm → hem；sitting → sitt → sit
  for (const c of [...out]) {
    if (c.length >= 3 && c[c.length - 1] === c[c.length - 2] && /[a-z]/.test(c[c.length - 1])) {
      out.add(c.slice(0, -1));
    }
  }
  return [...out];
}

const STOP = new Set([
  "a", "an", "the", "of", "to", "in", "into", "on", "at", "for", "and", "or",
  "is", "are", "was", "were", "be", "been", "am", "do", "does", "did",
  "have", "has", "had", "will", "would", "can", "could", "must", "may",
  "as", "out", "up", "down", "off", "back", "away", "again", "along",
  "one", "ones", "oneself", "it", "its", "this", "that", "then", "there", "so",
]);

function textStems(text: string): Set<string> {
  const s = new Set<string>();
  for (const tok of text.toLowerCase().match(/[a-z][a-z'’-]*/g) ?? []) {
    for (const st of stems(tok)) s.add(st);
  }
  return s;
}

/** 关键词是否能在译文中寻得：短语直查，否则逐词干核对 */
function kwFound(w: string, enText: string, enStems: Set<string>): boolean {
  const lower = enText.toLowerCase();
  for (const v of kwVariants(w)) {
    if (lower.includes(v)) return true;
    const words = v.split(/\s+/).filter((t) => t && !STOP.has(t));
    if (words.length && words.every((t) => stems(t).some((s) => enStems.has(s)))) {
      return true;
    }
  }
  return false;
}

const failures: string[] = [];
function check(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}

/** 每轮跑完把失败清单落到 .tmp，便于逐条裁定 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
function dump(tag: string) {
  try {
    const dir = join(process.cwd(), ".tmp");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `audit_${tag}.json`), JSON.stringify(failures, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

describe("诗词数据库完整性", () => {
  it("总量与 slug 查重", () => {
    expect(POEMS.length).toBe(229);
    const seen = new Map<string, number>();
    for (const p of POEMS) seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1);
    expect(dup).toEqual([]);
  });

  it("每篇字段完备且合法", () => {
    failures.length = 0;
    for (const p of POEMS) {
      const id = `${p.slug}《${p.title}》`;
      for (const f of ["title", "titleEn", "author", "authorEn", "dynasty", "dynastyEn", "theme", "themeEn", "note", "noteEn"] as const) {
        check(Boolean(p[f]?.trim()), `${id} 缺 ${f}`);
      }
      check(STAGES[p.stage] !== undefined, `${id} stage 非法: ${p.stage}`);
      check(KINDS.has(p.kind), `${id} kind 非法: ${p.kind}`);
      check([1, 2, 3].includes(p.level), `${id} level 非法: ${p.level}`);
      check(/^[a-z0-9-]+$/.test(p.slug), `${id} slug 含非法字符`);
      check(p.lines.length >= 1, `${id} 无诗句`);
    }
    dump("fields");
    expect(failures).toEqual([]);
  });

  it("逐句中英不混串、无排版事故", () => {
    failures.length = 0;
    for (const p of POEMS) {
      for (const [i, l] of p.lines.entries()) {
        const id = `${p.slug} 第${i + 1}句`;
        check(Boolean(l.zh.trim()) && Boolean(l.en.trim()), `${id} 中/英有空行`);
        check(!LATIN.test(l.zh), `${id} 中文混入拉丁字母: ${l.zh}`);
        check(!CJK.test(l.en), `${id} 英文混入汉字: ${l.en}`);
        check(!/ {2}/.test(l.en), `${id} 英文有连续空格`);
        check(!/\s[，。！？；：、]/.test(l.zh), `${id} 中文标点前有空格`);
      }
      if (p.fullText) {
        check(!LATIN.test(p.fullText), `${p.slug} fullText 混入拉丁字母`);
      }
    }
    dump("mixed");
    expect(failures).toEqual([]);
  });

  it("重点词完备且能在译文中寻得", () => {
    failures.length = 0;
    for (const p of POEMS) {
      const enText = p.lines.map((l) => l.en).join(" ");
      const enStems = textStems(enText);
      const seenKw = new Set<string>();
      for (const k of p.keywords) {
        const id = `${p.slug} · ${k.w}`;
        check(Boolean(k.w.trim()) && Boolean(k.zh.trim()), `${id} 词或释义为空`);
        check(!seenKw.has(k.w.toLowerCase()), `${id} 重复收录`);
        seenKw.add(k.w.toLowerCase());
        check(kwFound(k.w, enText, enStems), `${id} 在译文中找不到`);
      }
      check(p.keywords.length >= 3, `${p.slug} 重点词少于 3 个`);
    }
    dump("keywords");
    expect(failures).toEqual([]);
  });

  it("跨学科卡字段完备", () => {
    failures.length = 0;
    for (const p of POEMS) {
      if (!p.cross) continue;
      const id = `${p.slug} cross`;
      for (const f of ["field", "fieldEn", "title", "titleEn", "body", "bodyEn"] as const) {
        check(Boolean(p.cross[f]?.trim()), `${id} 缺 ${f}`);
      }
    }
    dump("cross");
    expect(failures).toEqual([]);
  });

  it("英译排版体例抽查", () => {
    failures.length = 0;
    for (const p of POEMS) {
      for (const l of p.lines) {
        check(!/[,;] {2}/.test(l.en), `${p.slug} 标点后双空格: ${l.en.slice(0, 40)}`);
        check(!/[a-z],[a-z]/.test(l.en), `${p.slug} 逗号后缺空格: ${l.en.slice(0, 40)}`);
      }
    }
    dump("typography");
    expect(failures).toEqual([]);
  });
});

/** 导出给类型检查：确保 Poem 结构引用正确 */
export type { Poem };
