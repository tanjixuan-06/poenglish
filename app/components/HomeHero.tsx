"use client";

import Link from "next/link";
import { useLang } from "./LangProvider";

const SECTIONS = [
  { href: "/imagery", key: "navImagery", descKey: "secImageryDesc" },
  { href: "/verse", key: "verseTitle", descKey: "secVerseDesc" },
  { href: "/seek", key: "secSeekTitle", descKey: "secSeekDesc" },
  { href: "/game", key: "secGameTitle", descKey: "secGameDesc" },
  { href: "/daily", key: "secDailyTitle", descKey: "secDailyDesc" },
  { href: "/poems", key: "secPoemsTitle", descKey: "secPoemsDesc" },
  { href: "/review", key: "reviewTitle", descKey: "reviewDesc" },
  { href: "/vocab", key: "navVocab", descKey: "vocabDesc" },
  { href: "/me", key: "meTitle", descKey: "meDesc" },
];

/** 天干地支式序号，比阿拉伯数字更贴纸墨气质 */
const NOS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

export default function HomeHero() {
  const { t } = useLang();

  return (
    <div className="space-y-20 pb-6 sm:space-y-24">
      {/* 题头：像一页纸的开头，不封进卡片 */}
      <section className="pt-14 text-center sm:pt-20">
        <p className="font-serif text-[13px] tracking-[0.4em] text-cinnabar/80">
          {t("siteName")}
        </p>

        <h1 className="mx-auto mt-7 max-w-3xl font-serif text-[30px] leading-[1.5] tracking-[0.06em] text-ink sm:text-[40px]">
          {t("homeHeroTitle")}
        </h1>

        <div className="mx-auto mt-8 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-line" />
          <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
          <span className="h-px w-10 bg-line" />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-sm leading-[2.1] text-inkSoft">
          {t("homeHeroDesc")}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3.5">
          <Link href="/game" className="btn-primary px-6 py-2.5">
            {t("homeCtaPrimary")}
          </Link>
          <Link href="/daily" className="btn-ghost px-6 py-2.5">
            {t("homeCtaSecondary")}
          </Link>
        </div>
      </section>

      {/* 几处去处：像书桌上的几页纸，安静地列着 */}
      <section>
        <h2 className="h-sec mb-6">{t("homePlacesTitle")}</h2>
        <div className="grid gap-x-14 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-baseline gap-4 border-b border-line py-5 transition-colors hover:border-brand/40"
            >
              <span className="font-serif text-[13px] text-cinnabar/70">
                {NOS[i]}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-base text-ink transition-colors group-hover:text-brand">
                  {t(s.key)}
                </span>
                <span className="mt-1.5 block text-[13px] leading-[1.9] text-inkSoft">
                  {t(s.descKey)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 三条理由 */}
      <section>
        <h2 className="h-sec mb-7">{t("homeWhyTitle")}</h2>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-12">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <p className="font-serif text-[13px] text-cinnabar/70">
                {NOS[i - 1]}
              </p>
              <h3 className="mt-2.5 font-serif text-[15px] leading-relaxed text-ink">
                {t(`homeWhy${i}Title`)}
              </h3>
              <p className="mt-2.5 text-[13px] leading-[2] text-inkSoft">
                {t(`homeWhy${i}Body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 收束：一句话把调子定住 */}
      <section className="border-t border-line pt-12 text-center">
        <p className="mx-auto max-w-2xl font-serif text-[15px] leading-[2.1] text-inkSoft">
          {t("homeClosing")}
        </p>
      </section>
    </div>
  );
}
