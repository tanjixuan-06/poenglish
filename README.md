# 诗英 · Poenglish

> 用中国古诗词的英译学英语。给你一段英译，你猜是哪一个。

一个把「古诗词 + 英语学习 + 跨学科知识」叠在一起的小站。中英双语界面可切换，打开即玩。

---

## 四大玩法

| 模块 | 路径 | 说明 |
|------|------|------|
| ✍️ **写译练习** | `/game`（默认页签） | 主玩法，方向可切：**中译英**（给中文诗句译英文）/ **英译中回译**（给英文译回中文再对照原句）。提交后先出**本地自评**（实词命中 / 长度比 / 贴合度），再由 **AI 流式批改**，最后对照参考译法或原句。支持学段筛选（小学/初中/高中）、用词提示、跳过、本轮回顾 |
| ✏️ 默写填空 | `/game`（默写页签） | 给中文原句 + 挖掉一个实词的英译，你填回那个词。优先挖本诗的重点词，可给首字母提示，答完看完整英译 |
| 🎯 猜诗闯关 | `/game`（猜诗页签） | 给一段英文译文，四选一猜是哪首古诗词。计分、连胜、最佳成绩（本地留存），答完展开中英对照 + 重点词汇 + 跨学科卡。支持难度分级与提示 |
| 📅 每日一诗 | `/daily` | 按日期确定性选题，中英对照逐句、重点词、跨学科卡，支持浏览器朗读英文 |
| 📖 诗文库 | `/poems`、`/poems/[slug]` | 按**学段（小学/初中/高中）** / 朝代 / 主题筛选，**229 篇**全部 SSG 预渲染；详情页含原文全文、中英对照、词汇表、跨学科卡、赏读、AI 讲解 |
| 🤖 AI 讲解 | 各诗词页底部 | 复用已配置的 DeepSeek：讲语法搭配、给出另一种译法对比、按诗出一道小题，自由提问，流式输出 |
| 🔖 生词本 | `/vocab`、`/me` | 诗词页重点词旁点 ☆ 即可收藏（存在本机浏览器），支持**拼写自测**与**选择自测**，可清空 |
| 🎤 背译全诗 | `/game`（背译页签） | 看着整首中文，逐句默出英译；每句本地评分，整首完成可让 AI 总评连贯性与地道程度 |
| 🔀 一译多版 | `/game`（译法页签） | 同一句诗让 AI 给出 **直译 / 意译 / 诗性译法** 三版并说明各版取舍，你选一版并给出理由，AI 再点评你的判断 |
| 🗣 跟读打分 | 每个诗词页 | 浏览器语音识别，读一遍英译，看实词识别命中率（音频不出本机） |
| 🔁 今日复习 | `/review` | **间隔重复（SM-2 简化）**：昨天收的词今天先过一遍，三档自评决定下次出现的间隔，每天最多引入 10 个新词 |
| 📈 我的学习 | `/me` | 累计练习、学习天数、平均分、练过篇目、连续打卡、已掌握词；近 7 天柱状图、练习分布、**错句本**（低分记录可跳回原诗）、生词本、数据导出导入 |
| 🖼 今日诗卡 | `/daily` | canvas 现场生成竖版诗句卡片，可下载分享 |
| 🌿 **意象漫游** | `/imagery` | 顺着月、雪、柳、舟等意象串读同一类景物，看它们在英文里另有一个名字 |
| 🖋 **译诗** | `/verse` | 贴一段英文（台词／歌词／散文），由 AI 化成一首中文诗 |

**跨学科知识卡**是本站的特色：每首诗配一张，覆盖天文、地理、生物、化学、物理、力学、数学、生态、农学、气象、民俗。例如《静夜思》讲月光的色温与「床」的考据，《竹石》讲竹的比强度为何优于钢，《秋夕》讲牛郎织女分别对应 Altair 与 Vega。

### 写译的两层评分（重要）

| 层 | 谁算 | 怎么算 | 说明 |
|----|------|--------|------|
| 中译英自评 | `app/lib/translatescore.ts`，浏览器本地 | 参考译法的实词命中率 × 70 + 长度合理度 × 30 | **零成本、秒出**，但只是形式比对——用词不同不等于译得差 |
| 回译贴合度 | `textanalysis.ts` 的中文 bigram 余弦相似度 | 你的中文回译 vs 中文原句 | 只衡量用字贴近程度，同样只是参考 |
| AI 批改 | DeepSeek，经 `/api/ai` 流式返回 | 中译英按「评分 / 你译对了 / 可以更好 / 推荐译法 / 值得记的搭配」；回译按「贴合度 / 你抓到了 / 和原句比 / 这句英文里值得留意的一处 / 值得记的搭配」 | 真正判断通顺度与意象传达，**明确要求不因与参考译法不同扣分** |

古诗文翻译没有唯一标准答案，界面上参考译法一栏始终标注「不是唯一标准答案」。回译的价值在于暴露理解偏差：英译为了通顺会换词、补主语、调语序，译回来才知道自己有没有真读懂。

### 练习链：从认得出，到写得出

默写 → 写译 → 回译 → 背译，产出量递增，考的东西也不同：

| 环节 | 产出 | 考什么 |
|------|------|--------|
| 默写 | 一个词 | 认得出、拼得出 |
| 写译 | 一句英文 | 意象能不能换成英文 |
| 回译 | 一句中文 | 有没有真读懂那句英文 |
| 背译 | 整首诗的英文 | 能不能独立复现 |

### 学习闭环：复习是怎么安排的

语言学习产品的分水岭不在内容多少，而在**学过之后还会不会再出现**。`app/lib/srs.ts` 是 SM-2 的简化实现，只维护「词 → 复习状态」，不改动生词本的数据结构（清掉 SRS 数据，生词本仍是完整可用的降级形态）。

| 自评 | 下次间隔 | 说明 |
|------|----------|------|
| 忘了 | 明天 | 间隔归零，熟悉度下调 |
| 模糊 | 维持原间隔 | 不加长，也不倒退 |
| 记得 | 间隔 × 熟悉度系数 | 1 天 → 3 天 → 逐步拉长 |

每日新词上限 10 个（`DAILY_NEW_LIMIT`），避免一次塞太多。连续答对 2 次且间隔 ≥ 7 天算「已掌握」。

所有练习（写译 / 回译 / 默写 / 猜测 / 背译）都会写进 `app/lib/progress.ts` 的学习档案，成为 `/me` 的统计与错句本数据源。**数据全在 localStorage，清缓存会丢**，`/me` 提供导出 / 导入 JSON（合并式，重复项自动去重）。

### 增长：让 229 个静态页真的带来流量

| 做法 | 位置 | 说明 |
|------|------|------|
| JSON-LD 结构化数据 | `app/lib/jsonld.ts`，由诗词页注入 | 一页同时声明 **Article + BreadcrumbList + FAQPage**。FAQ 的三问（英文怎么说 / 有哪些重点词 / 讲的是什么）在页面上真实可见，否则属于违规标记 |
| 中英 hreflang | 两版页面的 `alternates.languages` | `/poems/[slug]` ↔ `/en/[slug]` 互指，`x-default` 指向中文版 |
| 英文长尾落地页 | `/en`（目录）+ `/en/[slug]`（229 页） | 纯英文界面，瞄准「某首诗 English translation」这类检索。英文页不复用中文组件，避免 i18n 依赖客户端 localStorage 导致 SSR 语言不一致 |
| 每日诗卡 | `app/components/ShareCard.tsx` | canvas 现场绘制 1080×1350 竖版卡片（自动折行，中文逐字、英文按词），下载即得图 |
| PWA | `app/manifest.ts` + `public/sw.js` + `PwaRegister.tsx` | 静态资源缓存优先、页面导航网络优先（断网回退首页）、`/api` 一律不缓存；可安装到桌面 |

构建产物共 **475 个静态页面**（中文 229 + 英文 229 + 首页与各项功能页）。

> 原「工具箱」（24 个通用小工具：AI 写作 / AIGC 检测 / 房贷计算等）已**整体下线**，
> 换成与学英语直接相关的生词本与默写填空——通用工具和本站定位无关，留着只会稀释主题。

---

## 目录结构

```
ai-tools-site/
├── app/
│   ├── config/
│   │   ├── poems.ts            # ★ 总索引：合并分片 + 导出 POEMS / POEM_MAP / 学段与文体标签
│   │   ├── poem-data/
│   │   │   ├── types.ts        # Poem 类型（stage 学段 / kind 文体 / fullText 文言文全文 / cross 可选）
│   │   │   ├── primary-1~4.ts  # 小学 55 篇（诗词 45 + 文言短文 10）
│   │   │   ├── junior-1~5.ts   # 初中 66 篇（诗词 46 + 文言文 20）
│   │   │   └── senior-1~3.ts   # 高中 36 篇（诗词 13 + 文言文 23）
│   │   └── prompts.ts          # AI 提示词白名单：poem-tutor / poem-translate / poem-backtranslate / poem-variants
│   ├── i18n.ts                 # 中英文案字典 + translate()
│   ├── components/
│   │   ├── LangProvider.tsx    # 语言 Context（localStorage 持久化 + 更新 html lang）
│   │   ├── SiteHeader.tsx      # 导航 + 语言切换
│   │   ├── HomeHero.tsx        # 首页
│   │   ├── PageHeader.tsx      # 通用页头标题
│   │   ├── GameTabs.tsx        # /game 页签容器（写译 / 默写 / 猜诗 / 背译 / 译法）
│   │   ├── WriteMode.tsx       # ★ 写译练习（中译英 + 英译中回译，自评 + AI 批改 + 本轮回顾）
│   │   ├── ClozeGame.tsx       # 默写填空（英译挖实词，填回，可给首字母提示）
│   │   ├── GuessGame.tsx       # 猜诗闯关（出题/计分/连胜/反馈）
│   │   ├── ReciteMode.tsx      # 背译全诗（逐句默写英译 + 本地评分 + AI 总评）
│   │   ├── VariantsMode.tsx    # 一译多版（三版译法 + 学生选择 + AI 点评）
│   │   ├── Shadowing.tsx       # 跟读打分（浏览器语音识别，本地词面比对）
│   │   ├── VocabBook.tsx       # 生词本（列表 + 拼写自测 + 选择自测）
│   │   ├── VocabAddButton.tsx  # 关键词旁的 ☆ 收藏按钮
│   │   ├── DailyPoem.tsx       # 每日一诗（含打卡与连续天数）
│   │   ├── PoemLibrary.tsx     # 诗词库（筛选）
│   │   ├── PoemDisplay.tsx     # 诗词展示块（对照/词汇/跨学科卡/赏读）
│   │   ├── PoemDetail.tsx      # 详情页（展示 + 跟读 + AI 讲解 + 上下首）
│   │   ├── GlossLine.tsx       # 英文逐词点译（hover 中文释义）
│   │   ├── SpeakLine.tsx       # 朗读英文（浏览器 TTS）
│   │   ├── ImageryIndex.tsx    # 意象入口（/imagery）
│   │   ├── ImageryRoam.tsx     # 意象漫游（按意象串读）
│   │   ├── FreeVerse.tsx       # 译诗（/verse，poem-freeverse）
│   │   ├── AiTutor.tsx         # AI 讲解（流式 SSE 解析）
│   │   ├── ReviewQueue.tsx     # 今日复习（SRS 卡片：回忆 → 对照 → 三档自评）
│   │   ├── LearnStats.tsx      # 我的学习（统计 / 柱状图 / 错句本 / 生词本 / 备份）
│   │   ├── ShareCard.tsx       # 今日诗卡（canvas 出图下载）
│   │   ├── EnPoemView.tsx      # 英文版诗词页视图（不依赖 i18n，纯英文 SSR）
│   │   ├── MdText.tsx          # 极简 markdown 渲染（**加粗**），被 WriteMode/AiTutor 复用
│   │   ├── Umami.tsx           # 可选站点分析（env 配置，未配则不加载）
│   │   └── PwaRegister.tsx     # 注册 Service Worker
│   ├── game/page.tsx
│   ├── daily/page.tsx
│   ├── poems/page.tsx
│   ├── poems/[slug]/page.tsx   # SSG：预渲染全部诗词 + 注入 JSON-LD
│   ├── en/page.tsx             # 英文目录（按学段分组）
│   ├── en/[slug]/page.tsx      # 英文版诗词页，SSG 229 页
│   ├── review/page.tsx         # 今日复习
│   ├── me/page.tsx             # 我的学习
│   ├── vocab/page.tsx
│   ├── verse/page.tsx          # 译诗（英文化中文诗）
│   ├── imagery/page.tsx        # 意象入口
│   ├── imagery/[key]/page.tsx  # 意象漫游
│   ├── privacy/page.tsx        # 隐私政策（数据本地存储、麦克风本地处理、AI 调用说明）
│   ├── manifest.ts             # PWA manifest
│   ├── lib/
│   │   ├── translatescore.ts   # 中译英自评（实词覆盖 + 长度比）+ contentWords（供默写挖词）
│   │   ├── vocab.ts            # 生词本 localStorage 读写 + 变更事件
│   │   ├── progress.ts         # 学习档案：练习记录 + 统计 + 打卡连续天数
│   │   ├── srs.ts              # 间隔重复（SM-2 简化）：复习队列与评分推进
│   │   ├── backup.ts           # 学习数据导出 / 导入（合并去重）
│   │   ├── jsonld.ts           # 诗词页结构化数据（Article / Breadcrumb / FAQ）
│   │   ├── streamai.ts         # /api/ai 的 SSE 流式读取封装
│   │   ├── textanalysis.ts     # 中文 bigram 余弦相似度（回译贴合度、查重）+ AIGC 启发式检测
│   │   ├── reviewqueue.ts      # 今日复习队列构造（enrollWeak 被 progress 调用）
│   │   └── localfeedback.ts    # 写译 / 回译的本地规则批注
│   ├── api/ai/route.ts         # AI 代理（同源校验 + 内存/Upstash 双模限流 + 限长 + poem-* 提示词白名单）
│   └── sitemap.ts              # 全部页面 + 中英两版诗文页
├── public/
│   ├── sw.js                   # Service Worker
│   ├── icon-192.png / icon-512.png
```

## 快速开始

```bash
cd ai-tools-site
npm install            # 已装过可跳过
cp .env.example .env.local   # 填 AI_API_KEY
npm run dev            # http://localhost:3000
```

> ⚠️ 本机已知坑：若 `npm run dev` 启动时报批量删除拦截（WorkBuddy 安全策略），
> 先手动删除项目里的 `.next` 目录再启动即可。

### 环境变量（`.env.local`）

```env
AI_API_KEY=sk-xxxxxxxx
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=https://你的域名

# 可选：配置后 /api/ai 启用分布式限流（Serverless 多实例下精确）；未配置则回退进程内限流
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

只有 `AI_API_KEY` 是必需的；未配置时猜诗、诗词库、每日一诗全部照常可用，仅 AI 讲解会提示未配置。

## 如何新增一篇

在 `app/config/poem-data/` 对应学段的分片文件里追加一条即可（小学 primary-*.ts、初中 junior-*.ts、高中 senior-*.ts）：

```ts
{
  slug: "xiaochi",                 // URL 用，英文小写
  title: "小池", titleEn: "The Little Pond",
  author: "杨万里", authorEn: "Yang Wanli",
  dynasty: "宋", dynastyEn: "Song",
  stage: "小学",                   // 学段：小学 / 初中 / 高中
  kind: "诗",                      // 文体：诗 / 词 / 文言文
  theme: "四季", themeEn: "Seasons",
  level: 1,                        // 1 入门 / 2 进阶 / 3 挑战（影响出题干扰项池）
  lines: [{ zh: "泉眼无声惜细流，…", en: "The spring's mouth, silent, grudges its thin stream, …" }],
  // 文言文可选：fullText 填全文（中文），lines 只放关键句英译
  keywords: [{ w: "grudge", zh: "吝惜" }],
  cross: { field: "生物", fieldEn: "Biology", title: "…", titleEn: "…", body: "…", bodyEn: "…" }, // 可选
  note: "…", noteEn: "…",
}
```

保存后：详情页、诗词库筛选（学段 / 朝代 / 主题）、sitemap、猜诗题库**全自动更新**，无需改任何其他文件。

**文言文的处理约定**：`fullText` 存全文（中文，按 `\n` 分段），`lines` 只放 2—5 个关键句的英译，用于对照学习与猜诗出题——长篇（如《出师表》《赤壁赋》）不必整篇英译。

## 设计约定

- **界面语言**：`app/i18n.ts` 字典 + `useLang().t()`。新增文案必须在 zh / en 两侧同时补，缺失时回退中文。
- **出题**：题干按难度取句（入门取首句、进阶随机、挑战取中间句），干扰项从同难度池中随机取 3 首。
- **英译版权**：所有英译均为本站点自行撰写的学习化译文，不使用现代译家的受版权保护译本；原诗均为公有领域。改动译文时请保持这一原则。

## 部署

Vercel / Cloudflare Pages 均可（Next.js 14 App Router）。上线前把 `NEXT_PUBLIC_SITE_URL` 改成真实域名，否则 sitemap 与 canonical 会指向 example.com。
