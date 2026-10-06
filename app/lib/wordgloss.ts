import { POEMS } from "../config/poems";

/**
 * 点词识义：诗词自身的重点词（poem.keywords）为主，再以通用基础词表兜底，
 * 让任意一首诗都能点出更多常见诗意词。不接外部接口，悬停即出、离线可用。
 * 查不到的词不划线、不出提示，保持安静。
 *
 * BASE 词表只收略带诗意的实义词，不收纯语法虚词，避免满屏下划线喧宾夺主。
 */
const BASE_GLOSS: [string, string][] = [
  ["love", "爱"], ["heart", "心"], ["soul", "灵魂"], ["mind", "心／智"],
  ["light", "光"], ["dark", "暗"], ["deep", "深"], ["star", "星"], ["stars", "星"],
  ["moon", "月"], ["sun", "日"], ["night", "夜"], ["day", "日／昼"], ["sky", "天空"],
  ["wind", "风"], ["water", "水"], ["fire", "火"], ["sea", "海"], ["river", "河"],
  ["mountain", "山"], ["tree", "树"], ["flower", "花"], ["leaf", "叶"], ["snow", "雪"],
  ["rain", "雨"], ["time", "时间"], ["life", "生命"], ["death", "死"], ["dream", "梦"],
  ["silence", "静"], ["song", "歌"], ["voice", "声"], ["eye", "眼"], ["hand", "手"],
  ["tear", "泪"], ["blood", "血"], ["word", "词"], ["name", "名"], ["world", "世界"],
  ["heaven", "天／天堂"], ["beauty", "美"], ["truth", "真"], ["joy", "喜"],
  ["sorrow", "悲／愁"], ["hope", "希望"], ["fear", "惧"], ["memory", "记忆"],
  ["shadow", "影"], ["gold", "金"], ["red", "红"], ["white", "白"], ["black", "黑"],
  ["green", "绿"], ["blue", "蓝"], ["old", "老"], ["young", "年轻"], ["long", "长"],
  ["far", "远"], ["near", "近"], ["still", "静"], ["soft", "柔"], ["cold", "冷"],
  ["warm", "暖"], ["bright", "亮"], ["lonely", "孤"], ["alone", "独"],
  ["wander", "漫游"], ["sleep", "眠"], ["wake", "醒"], ["sing", "歌／唱"],
  ["weep", "泣"], ["smile", "笑"], ["kiss", "吻"], ["hold", "执／握"], ["fall", "落"],
  ["rise", "升"], ["flow", "流"], ["burn", "燃"], ["break", "碎"], ["fade", "褪"],
  ["shine", "辉"], ["glow", "微光"], ["silent", "静"], ["quiet", "静"],
  ["breath", "息"], ["spirit", "灵"], ["peace", "安宁"],
  ["pain", "痛"], ["grief", "哀"], ["rest", "憩"], ["dawn", "黎明"], ["dusk", "暮"],
  ["earth", "大地"], ["golden", "金色的"], ["silver", "银"], ["rose", "玫瑰"],
  ["bird", "鸟"], ["wave", "浪"], ["storm", "风暴"], ["stone", "石"], ["dew", "露"],
  ["mist", "雾"], ["flame", "焰"], ["bloom", "绽"], ["verse", "诗行"], ["poem", "诗"],
];

const BASE_ZH_GLOSS: [string, string][] = [
  ["月", "moon"], ["风", "wind"], ["花", "flower"], ["雪", "snow"], ["雨", "rain"],
  ["山", "mountain"], ["水", "water"], ["江", "river"], ["河", "river"], ["海", "sea"],
  ["云", "cloud"], ["星", "star"], ["霜", "frost"], ["露", "dew"], ["日", "sun"],
  ["天", "sky"], ["夜", "night"], ["春", "spring"], ["秋", "autumn"], ["夏", "summer"],
  ["冬", "winter"], ["心", "heart"], ["梦", "dream"], ["愁", "sorrow"], ["思", "longing"],
  ["泪", "tear"], ["影", "shadow"], ["舟", "boat"], ["柳", "willow"], ["松", "pine"],
  ["竹", "bamboo"], ["梅", "plum blossom"], ["雁", "wild goose"], ["鸟", "bird"],
  ["鱼", "fish"], ["酒", "wine"], ["灯", "lamp"], ["火", "fire"], ["烟", "mist"],
  ["波", "wave"], ["林", "forest"], ["归", "return"], ["别", "parting"], ["忆", "recall"],
  ["望", "gaze"], ["醉", "drunk"], ["眠", "sleep"], ["恨", "regret"], ["情", "love"],
  ["意", "meaning"], ["声", "sound"], ["香", "fragrance"],
  ["寒", "cold"], ["暖", "warm"], ["远", "far"], ["孤", "lonely"], ["独", "alone"],
  ["空", "empty"], ["静", "silent"], ["老", "old"], ["红", "red"], ["白", "white"],
  ["青", "green"], ["碧", "green"], ["长", "long"], ["短", "short"], ["明", "bright"],
  ["暗", "dark"], ["清", "clear"], ["暮", "dusk"], ["朝", "dawn"], ["夕", "dusk"],
  ["乡", "home"], ["客", "traveller"], ["景", "scene"], ["光", "light"],
  ["笑", "smile"], ["哭", "weep"], ["雷", "thunder"], ["电", "lightning"],
  ["草", "grass"], ["木", "tree"], ["石", "stone"], ["沙", "sand"], ["尘", "dust"],
];

export const GLOBAL_GLOSS = new Map<string, string>();
for (const p of POEMS) {
  for (const k of p.keywords) {
    const w = k.w.toLowerCase();
    if (w && !GLOBAL_GLOSS.has(w)) GLOBAL_GLOSS.set(w, k.zh);
  }
}
for (const [w, zh] of BASE_GLOSS) {
  if (w && !GLOBAL_GLOSS.has(w)) GLOBAL_GLOSS.set(w, zh);
}

/** 反向：中文释义 → 英文词（用于「中译英」点词识义） */
export const GLOBAL_ZH_GLOSS = new Map<string, string>();
for (const p of POEMS) {
  for (const k of p.keywords) {
    for (const piece of k.zh.split(/[；;，,、]/)) {
      const z = piece.trim();
      if (z && !GLOBAL_ZH_GLOSS.has(z)) GLOBAL_ZH_GLOSS.set(z, k.w);
    }
  }
}
for (const [z, en] of BASE_ZH_GLOSS) {
  if (z && !GLOBAL_ZH_GLOSS.has(z)) GLOBAL_ZH_GLOSS.set(z, en);
}

/** 本诗重点词优先（英文 → 中文） */
export function localGlossMap(
  keywords: ReadonlyArray<{ w: string; zh: string }>
): Map<string, string> {
  const m = new Map<string, string>();
  for (const k of keywords) m.set(k.w.toLowerCase(), k.zh);
  return m;
}

/** 本诗重点词优先（中文 → 英文） */
export function localZhGlossMap(
  keywords: ReadonlyArray<{ w: string; zh: string }>
): Map<string, string> {
  const m = new Map<string, string>();
  for (const k of keywords) {
    for (const piece of k.zh.split(/[；;，,、]/)) {
      const z = piece.trim();
      if (z) m.set(z, k.w);
    }
  }
  return m;
}

/** 极轻量的屈折还原：只处理最常见的 s/es/'s/ed/ing 结尾 */
export function lookupWord(
  raw: string,
  local?: Map<string, string>
): string | undefined {
  const w = raw.toLowerCase().replace(/[’]/g, "'");
  if (!/[a-z]/.test(w)) return undefined;

  const cands = [w];
  if (w.endsWith("'s")) cands.push(w.slice(0, -2));
  if (w.endsWith("ies")) cands.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) cands.push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) cands.push(w.slice(0, -1));
  if (w.endsWith("ed")) {
    cands.push(w.slice(0, -1)); // hoped → hope
    cands.push(w.slice(0, -2)); // walked → walk
  }
  if (w.endsWith("ing")) {
    cands.push(w.slice(0, -3)); // doing → do
    cands.push(w.slice(0, -3) + "e"); // coming → come
  }

  for (const c of cands) {
    const hit = local?.get(c) ?? GLOBAL_GLOSS.get(c);
    if (hit) return hit;
  }
  return undefined;
}
