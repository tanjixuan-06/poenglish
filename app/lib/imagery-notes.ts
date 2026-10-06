/**
 * 意象文化注脚：点词识义升级的「典故小注」数据源。
 *
 * 当点中的词命中这里的意象（如「月」「柳」「舟」），除了单词释义，
 * 还会浮出一句文化短注，把词典升成文化注脚——最贴本站的典雅温情调性。
 *
 * 注脚只维护一份（以中文意象词为 key，含中英双语），
 * 英文方向通过 IMAGERY_EN_NOTES 把英文词（含常见变体）映射到同一份注脚。
 */

type Note = { zh: string; en: string };

const N: Record<string, Note> = {
  月: {
    zh: "古诗里月常是思乡与团圆的信使，李白「举头望明月」即此。",
    en: "In old poems the moon carries home and reunion; Li Bai's 'gaze at the bright moon' is the type.",
  },
  柳: {
    zh: "柳谐音「留」，古人折柳送别，是离愁的暗码。",
    en: "Willow sounds like 'stay' — snapping a willow was how the ancients said farewell.",
  },
  舟: {
    zh: "舟或写漂泊，或写归隐；「孤舟」多是独行天地的人。",
    en: "A boat means wandering or retreat; a lone boat, a soul alone between earth and sky.",
  },
  雪: {
    zh: "雪写清冷与孤高，也悄悄喻着白发与时光。",
    en: "Snow speaks of cold purity and solitude — sometimes of white hair and passing time.",
  },
  风: {
    zh: "风是自由的信使，可送别，可传情，也可写苍凉。",
    en: "Wind is a free messenger: it sees you off, carries feeling, or breathes desolation.",
  },
  花: {
    zh: "花写盛放与易逝，落花最是惜春的叹惋。",
    en: "Flowers mean blossoming and its brevity; fallen petals mourn the passing spring.",
  },
  酒: {
    zh: "酒是浇愁与尽兴的媒介，范仲淹「浊酒一杯家万里」。",
    en: "Wine dissolves sorrow and lifts the spirit — a cup far from home.",
  },
  雁: {
    zh: "雁传书，是远人音信的代称，秋来便惹相思。",
    en: "Wild geese carry letters; their autumn flight stirs longing for the far-away.",
  },
  霜: {
    zh: "霜写秋寒与清白，也常借指月色与鬓边白发。",
    en: "Frost: autumn cold and purity; often a metaphor for moonlight or white hair.",
  },
  云: {
    zh: "云喻隐逸与漂泊，行云流水最见自在。",
    en: "Clouds suggest retreat and drift — ease itself.",
  },
  水: {
    zh: "流水喻时光与愁绪，李白「抽刀断水水更流」。",
    en: "Flowing water figures time and sorrow that no blade can cut off.",
  },
  山: {
    zh: "山是静默的依靠，也是阻隔与远方。",
    en: "Mountains are silent refuge, distance, and obstacle.",
  },
  春: {
    zh: "春多写萌发与相思，亦藏惜时之意。",
    en: "Spring: awakening and longing, and a quiet urging not to waste the hour.",
  },
  秋: {
    zh: "秋多悲，写萧瑟，也写澄明与思念。",
    en: "Autumn leans toward sorrow — and clarity, and missing someone.",
  },
  夜: {
    zh: "夜收拢白日的喧哗，最宜思念与独白。",
    en: "Night gathers the day's noise; it suits missing and solitude.",
  },
  泪: {
    zh: "泪是压不住的心事，也是深情的证据。",
    en: "Tears are feelings one cannot hold back — proof of deep feeling.",
  },
  归: {
    zh: "归是行旅诗的核心：回家，或回到本心。",
    en: "Return: homecoming, or coming back to oneself.",
  },
  思: {
    zh: "思是悠长的惦念，含蓄而深沉。",
    en: "Longing: a quiet, deep, lingering care.",
  },
  心: {
    zh: "心是情志所居，悲欢都从这里起。",
    en: "The heart: where all feeling begins.",
  },
  梦: {
    zh: "梦是醒时到不了的远方与相逢。",
    en: "Dreams: the meetings and places waking life cannot reach.",
  },
  乡: {
    zh: "故乡是走多远都牵着的根。",
    en: "Home is the root that pulls however far you roam.",
  },
};

export const IMAGERY_NOTES = N;

/** 英文方向：把英文意象词（含常见变体）映射到中文注脚 key */
export const IMAGERY_EN_NOTES: Record<string, Note> = {
  moon: N["月"],
  moonlight: N["月"],
  willow: N["柳"],
  boat: N["舟"],
  snow: N["雪"],
  wind: N["风"],
  flower: N["花"],
  wine: N["酒"],
  goose: N["雁"],
  "wild goose": N["雁"],
  frost: N["霜"],
  cloud: N["云"],
  river: N["水"],
  water: N["水"],
  mountain: N["山"],
  spring: N["春"],
  autumn: N["秋"],
  night: N["夜"],
  tear: N["泪"],
  return: N["归"],
  longing: N["思"],
  yearning: N["思"],
  heart: N["心"],
  dream: N["梦"],
  home: N["乡"],
};
