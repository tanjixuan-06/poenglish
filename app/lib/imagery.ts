/**
 * 意象漫游
 *
 * 产品立意：诗词库不该只是筛选器，还可以是一条条小路——
 * 顺着「月」读下去，会发现古人写月亮从来不是写月亮。
 *
 * 数据来源：不改动 177 篇的原文数据，而是在运行时用意象字
 * 匹配诗句原文（l.zh）自动归篇。诗句是文言原文，一字一景，
 * 字面匹配的召回足够准，也永远不会和数据脱节。
 */
import { POEMS, type Poem } from "../config/poems";

export type Imagery = {
  /** URL 路径 key */
  key: string;
  /** 意象名（中文，一个字或一个词，像一枚签） */
  zh: string;
  en: string;
  /** 用于匹配诗句的意象字（可含双字词） */
  chars: string[];
  /** 引子：一句留白的话 */
  intro: string;
  introEn: string;
};

/** 一站：一首诗里含该意象的那一句 */
export type ImageryStop = {
  slug: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  dynasty: string;
  dynastyEn: string;
  /** 含意象的原句 */
  zh: string;
  /** 对应英译 */
  en: string;
};

export const IMAGERY: Imagery[] = [
  {
    key: "moon",
    zh: "月",
    en: "The Moon",
    chars: ["月"],
    intro: "古人抬头看见的那一轮，英文里叫 moon。可李白唤它的时候，用的是故乡。",
    introEn:
      "The same moon rose over Li Bai. In English it is called the moon — but what he saw was home.",
  },
  {
    key: "river",
    zh: "江水",
    en: "The River",
    chars: ["江", "河", "水", "海", "溪", "湖", "泉", "瀑"],
    intro: "水是最不肯停留的东西，却最常被写进诗里。",
    introEn: "Water never stays, and that is why poets keep it.",
  },
  {
    key: "mountain",
    zh: "山",
    en: "The Mountain",
    chars: ["山", "峰", "岭", "岳", "崖"],
    intro: "山不说话，诗句替它开口。",
    introEn: "Mountains do not speak; poems speak for them.",
  },
  {
    key: "snow",
    zh: "雪",
    en: "The Snow",
    chars: ["雪"],
    intro: "雪落下来的时候，世界忽然学会了安静。",
    introEn: "When snow falls, the world remembers how to be quiet.",
  },
  {
    key: "wind",
    zh: "风",
    en: "The Wind",
    chars: ["风"],
    intro: "风看不见，但它经过的地方都认得它。",
    introEn: "You cannot see the wind — only the places it has been.",
  },
  {
    key: "rain",
    zh: "雨",
    en: "The Rain",
    chars: ["雨"],
    intro: "雨落在诗里，就不停了。",
    introEn: "Once rain falls into a poem, it never stops.",
  },
  {
    key: "flower",
    zh: "花",
    en: "The Flower",
    chars: ["花"],
    intro: "花开只有几天，诗人偏要为它停下笔。",
    introEn: "A flower blooms for days; a poet stops the pen for it.",
  },
  {
    key: "willow",
    zh: "柳",
    en: "The Willow",
    chars: ["柳"],
    intro: "古人折柳送别。柳枝留下的，是走不了的人。",
    introEn:
      "The ancients broke willow twigs at partings — what stayed behind were the ones who could not leave.",
  },
  {
    key: "boat",
    zh: "舟",
    en: "The Boat",
    chars: ["舟", "船", "帆", "棹"],
    intro: "一叶舟，装得下行李，也装得下一整个远行的心事。",
    introEn: "A small boat carries luggage — and every thought of leaving.",
  },
  {
    key: "wine",
    zh: "酒",
    en: "The Wine",
    chars: ["酒", "樽", "杯", "醉", "酌", "酹"],
    intro: "诗人喝酒，一半给愁，一半给月。",
    introEn: "Poets pour half the wine for sorrow, half for the moon.",
  },
  {
    key: "goose",
    zh: "雁",
    en: "Wild Geese",
    chars: ["雁", "鸿"],
    intro: "雁是会飞的家书。",
    introEn: "Wild geese are letters that fly home.",
  },
  {
    key: "night",
    zh: "夜",
    en: "The Night",
    chars: ["夜", "宵"],
    intro: "夜是古人的书房。",
    introEn: "Night was the study of the ancients.",
  },
];

/** 一首诗是否含某意象 */
export function poemHasImagery(poem: Poem, ig: Imagery): boolean {
  return poem.lines.some((l) => ig.chars.some((c) => l.zh.includes(c)));
}

/** 某意象下的漫游路径：每首诗取含意象的第一句作为一站 */
export function poemsOfImagery(ig: Imagery): ImageryStop[] {
  const stops: ImageryStop[] = [];
  for (const p of POEMS) {
    const line = p.lines.find((l) => ig.chars.some((c) => l.zh.includes(c)));
    if (!line) continue;
    stops.push({
      slug: p.slug,
      title: p.title,
      titleEn: p.titleEn,
      author: p.author,
      authorEn: p.authorEn,
      dynasty: p.dynasty,
      dynastyEn: p.dynastyEn,
      zh: line.zh,
      en: line.en,
    });
  }
  return stops;
}
