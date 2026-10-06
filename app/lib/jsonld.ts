/**
 * 结构化数据（JSON-LD）
 *
 * 诗词页同时声明三种类型，让搜索引擎读懂「这是什么」：
 *   Article —— 一首诗词的中英对照条目
 *   BreadcrumbList —— 面包屑，帮助生成搜索结果的层级路径
 *   FAQPage —— 三个页面上看得见的问答，争取富摘要
 *
 * FAQ 的内容必须真的出现在页面上，否则属于违规标记。
 */

import type { Poem } from "../config/poems";

export function poemJsonLd(poem: Poem, base: string) {
  const url = `${base}/poems/${poem.slug}`;
  const enUrl = `${base}/en/${poem.slug}`;
  const firstLine = poem.lines[0];

  const faq = [
    {
      q: `《${poem.title}》用英文怎么说？`,
      a: `${poem.titleEn} — by ${poem.authorEn} (${poem.dynastyEn} dynasty). ${firstLine.en}`,
    },
    {
      q: `《${poem.title}》英译里有哪些重点词汇？`,
      a: poem.keywords
        .slice(0, 8)
        .map((k) => `${k.w}（${k.zh}）`)
        .join("；"),
    },
    {
      q: `《${poem.title}》讲的是什么？`,
      a: poem.note,
    },
  ].filter((x) => x.a && x.a.length > 2);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: `${poem.title}（${poem.titleEn}）英译与逐句对照`,
        description: `${poem.dynasty}·${poem.author}《${poem.title}》的中英对照、重点词汇与赏析。English rendering: ${poem.titleEn}.`,
        inLanguage: "zh-CN",
        author: { "@type": "Person", name: poem.author },
        about: { "@type": "Thing", name: poem.title },
        url,
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: base },
          { "@type": "ListItem", position: 2, name: "诗词库", item: `${base}/poems` },
          { "@type": "ListItem", position: 3, name: poem.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "WebPage",
        "@id": enUrl,
        url: enUrl,
        name: `${poem.titleEn} — English translation`,
        inLanguage: "en",
        isTranslationOf: { "@id": `${url}#article` },
      },
    ],
  };
}
