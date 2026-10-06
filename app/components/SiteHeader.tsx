"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";

export default function SiteHeader() {
  const { t, lang, toggle } = useLang();
  const pathname = usePathname();

  const links = [
    { href: "/imagery", key: "navImagery" },
    { href: "/game", key: "navGame" },
    { href: "/daily", key: "navDaily" },
    { href: "/poems", key: "navPoems" },
    { href: "/verse", key: "navVerse" },
    { href: "/seek", key: "navSeek" },
    { href: "/review", key: "navReview" },
    { href: "/me", key: "navMe" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-serif text-[17px] font-bold tracking-[0.12em] text-ink">
            {t("siteName")}
          </span>
          <span className="hidden text-[13px] text-inkFaint sm:inline">
            {t("tagline")}
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-sm px-2.5 py-1.5 transition-colors ${
                  active
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-inkSoft hover:bg-paperDim hover:text-brand"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
          <button
            onClick={toggle}
            aria-label="switch language"
            className="ml-1.5 rounded-sm border border-line px-2.5 py-1 text-xs font-medium tracking-wide text-inkSoft transition-colors hover:border-brand hover:text-brand"
          >
            {t("langSwitch")}
          </button>
        </nav>
      </div>
    </header>
  );
}
