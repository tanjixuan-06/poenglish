/**
 * 时令诗签（二十四节气）
 *
 * 产品立意：诗是农业文明的时间感。每日一诗跟着节气走，
 * 「今天刚好该读这首」的巧合感，比打卡更能让人想回来。
 *
 * 说明：
 * - 节气日期用近似值（每年浮动 ±1 天，读诗不差这一天）；
 * - 节气→诗的映射不写死 slug，而是给一组「意象字」，
 *   运行时从 177 篇诗句原文里召回，按日期确定性轮换。
 */
import { POEMS, type Poem } from "../config/poems";

export type SolarTerm = {
  name: string;
  nameEn: string;
  month: number;
  day: number;
  /** 用来在诗句原文里召回的意象字（可含双字词） */
  want: string[];
  /** 一句时令小语 */
  hint: string;
  hintEn: string;
};

export const TERMS: SolarTerm[] = [
  { name: "小寒", nameEn: "Lesser Cold", month: 1, day: 5, want: ["寒", "雪", "冬", "冻"], hint: "一年最冷时，诗在炉火边。", hintEn: "The coldest days — poems sit by the stove." },
  { name: "大寒", nameEn: "Greater Cold", month: 1, day: 20, want: ["寒", "雪", "冰", "冬"], hint: "岁末大寒，静待春风。", hintEn: "Deep winter, quietly waiting for spring wind." },
  { name: "立春", nameEn: "Spring Begins", month: 2, day: 4, want: ["春", "柳", "芽"], hint: "东风解冻，春天从这里开始。", hintEn: "The east wind thaws the earth; spring starts here." },
  { name: "雨水", nameEn: "Rain Water", month: 2, day: 19, want: ["雨", "水", "润"], hint: "好雨知时节。", hintEn: "Good rain knows its season." },
  { name: "惊蛰", nameEn: "Insects Awaken", month: 3, day: 5, want: ["春", "雷", "雨", "桃"], hint: "一声春雷，万物醒来。", hintEn: "One spring thunder — everything wakes." },
  { name: "春分", nameEn: "Spring Equinox", month: 3, day: 20, want: ["春", "花", "燕"], hint: "昼夜平分，花事正好。", hintEn: "Day and night equal; flowers at their best." },
  { name: "清明", nameEn: "Pure Brightness", month: 4, day: 4, want: ["雨", "杏", "柳", "清明"], hint: "清明时节雨纷纷。", hintEn: "A drizzle falls on Qingming." },
  { name: "谷雨", nameEn: "Grain Rain", month: 4, day: 20, want: ["雨", "茶", "谷", "春"], hint: "雨生百谷，春将别矣。", hintEn: "Rain feeds the grain; spring is leaving." },
  { name: "立夏", nameEn: "Summer Begins", month: 5, day: 5, want: ["夏", "荷", "绿", "小池"], hint: "绿树阴浓夏日长。", hintEn: "Green shade deepens; summer days grow long." },
  { name: "小满", nameEn: "Grain Buds", month: 5, day: 21, want: ["麦", "绿", "夏", "蚕"], hint: "麦粒初满，将熟未熟。", hintEn: "Grain half full — almost, not yet." },
  { name: "芒种", nameEn: "Grain in Ear", month: 6, day: 5, want: ["麦", "田", "夏", "梅", "雨"], hint: "有芒之谷，可种矣。", hintEn: "Time to sow the grain." },
  { name: "夏至", nameEn: "Summer Solstice", month: 6, day: 21, want: ["夏", "荷", "蝉"], hint: "日长之至，蝉声满树。", hintEn: "The longest day; cicadas fill the trees." },
  { name: "小暑", nameEn: "Lesser Heat", month: 7, day: 7, want: ["荷", "蝉", "暑", "夏"], hint: "小暑至，荷风送香。", hintEn: "Lesser heat; lotus breeze carries scent." },
  { name: "大暑", nameEn: "Greater Heat", month: 7, day: 22, want: ["荷", "蝉", "夏"], hint: "荷塘最绿的时候。", hintEn: "The lotus pond at its greenest." },
  { name: "立秋", nameEn: "Autumn Begins", month: 8, day: 7, want: ["秋", "梧桐", "叶"], hint: "梧桐一叶落，天下尽知秋。", hintEn: "One wutong leaf falls, and all the world knows autumn." },
  { name: "处暑", nameEn: "End of Heat", month: 8, day: 23, want: ["秋", "凉", "暑"], hint: "暑气至此而止。", hintEn: "Here the heat finally stops." },
  { name: "白露", nameEn: "White Dew", month: 9, day: 7, want: ["露", "白", "月", "凉"], hint: "露从今夜白，月是故乡明。", hintEn: "Dew turns white tonight; the moon is brighter at home." },
  { name: "秋分", nameEn: "Autumn Equinox", month: 9, day: 23, want: ["月", "桂"], hint: "平分秋色一轮满。", hintEn: "Autumn split in two by a full moon." },
  { name: "寒露", nameEn: "Cold Dew", month: 10, day: 8, want: ["寒", "露", "霜", "凉", "菊"], hint: "袅袅凉风起，凄凄寒露零。", hintEn: "A cool wind rises; cold dew begins to fall." },
  { name: "霜降", nameEn: "Frost's Descent", month: 10, day: 23, want: ["霜", "秋", "叶", "寒"], hint: "月落乌啼霜满天。", hintEn: "Moon sets, crows cry, frost fills the sky." },
  { name: "立冬", nameEn: "Winter Begins", month: 11, day: 7, want: ["冬", "雪", "寒"], hint: "细雨生寒未有霜。", hintEn: "A cold drizzle, no frost yet." },
  { name: "小雪", nameEn: "Lesser Snow", month: 11, day: 22, want: ["雪", "寒", "梅"], hint: "晚来天欲雪，能饮一杯无。", hintEn: "Snow is coming — will you share a cup?" },
  { name: "大雪", nameEn: "Greater Snow", month: 12, day: 7, want: ["雪", "孤舟", "寒", "钓"], hint: "独钓寒江雪。", hintEn: "Fishing alone in the river snow." },
  { name: "冬至", nameEn: "Winter Solstice", month: 12, day: 21, want: ["冬", "雪", "夜", "梅"], hint: "冬至阳生春又来。", hintEn: "At the solstice, light returns; spring follows." },
];

/** 今天处在哪个节气（日期用近似值，±1 天不影响读诗） */
export function solarTermOf(date: Date): SolarTerm {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // 一月初尚未到小寒，默认归上一年冬至
  let cur = TERMS[TERMS.length - 1];
  for (const t of TERMS) {
    if (t.month < m || (t.month === m && t.day <= d)) cur = t;
  }
  return cur;
}

const MON_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** 节气时段范围：从本节气起始日到下一节气起始日（含跨年，如冬至 12/21–1/5） */
export function termRange(term: SolarTerm, lang: "zh" | "en" = "zh"): string {
  const i = TERMS.indexOf(term);
  const next = TERMS[(i + 1) % TERMS.length];
  if (lang === "en") {
    return `${MON_EN[term.month - 1]} ${term.day} – ${MON_EN[next.month - 1]} ${next.day}`;
  }
  return `${term.month}/${term.day}–${next.month}/${next.day}`;
}

/**
 * 节气诗签：从含节气意象字的篇目里，按日期确定性选一首。
 * 同一天永远同一首；池子为空时返回 null（调用方回退到普通每日诗）。
 */
export function termPoemOfTheDay(
  date: Date
): { poem: Poem; term: SolarTerm } | null {
  const term = solarTermOf(date);
  const matches = POEMS.filter((p) =>
    p.lines.some((l) => term.want.some((w) => l.zh.includes(w)))
  );
  if (matches.length === 0) return null;
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return { poem: matches[seed % matches.length], term };
}
