"use client";

import Link from "next/link";
import PageHeader from "./PageHeader";
import { useLang } from "./LangProvider";
import type { Imagery, ImageryStop } from "../lib/imagery";

/**
 * 意象漫游：一条竖线串起的路径。
 * 每站只给一句——含意象的那句原文与英译，不解释，
 * 让「同一个景物，另一种说法」自己浮出来。
 */
export default function ImageryRoam({
  imagery,
  stops,
}: {
  imagery: Imagery;
  stops: ImageryStop[];
}) {
  const { t, lang } = useLang();
  const zh = lang === "zh";

  return (
    <div className="space-y-11">
      <PageHeader
        title={zh ? imagery.zh : imagery.en}
        sub={zh ? imagery.intro : imagery.introEn}
      />

      {stops.length === 0 ? (
        <p className="py-10 text-center text-sm text-inkFaint">
          {t("poemsEmpty")}
        </p>
      ) : (
        <ol className="relative space-y-9 border-l border-line pl-6">
          {stops.map((s, i) => (
            <li key={`${s.slug}-${i}`} className="relative">
              <span className="absolute -left-[26.5px] top-[13px] h-1.5 w-1.5 rounded-full bg-cinnabar/60" />
              <p className="poem-zh !text-[17px]">{s.zh}</p>
              <p className="poem-en mt-1.5">{s.en}</p>
              <Link
                href={`/poems/${s.slug}`}
                className="mt-2 inline-block text-[13px] text-inkSoft transition-colors hover:text-brand"
              >
                {zh
                  ? `《${s.title}》 ${s.dynasty} · ${s.author}`
                  : `${s.titleEn} · ${s.authorEn}, ${s.dynastyEn}`}
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="border-t border-line pt-8 text-center">
        <Link href="/imagery" className="btn-ghost">
          {t("imageryBack")}
        </Link>
      </div>
    </div>
  );
}
