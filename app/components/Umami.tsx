"use client";

import Script from "next/script";

export default function Umami() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const id = process.env.NEXT_PUBLIC_UMAMI_ID;
  if (!src || !id) return null;
  return <Script src={src} data-website-id={id} strategy="afterInteractive" />;
}
