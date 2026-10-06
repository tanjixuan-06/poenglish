import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-serif text-[13px] tracking-[0.35em] text-cinnabar/70">
        四〇四
      </p>
      <h1 className="mt-5 font-serif text-[26px] leading-snug tracking-wide text-ink">
        这里没有东西
      </h1>
      <div className="mx-auto mt-4 flex items-center justify-center gap-2.5">
        <span className="h-px w-8 bg-line" />
        <span className="h-1 w-1 rounded-full bg-cinnabar/60" />
        <span className="h-px w-8 bg-line" />
      </div>
      <p className="mx-auto mt-4 max-w-sm text-[13px] leading-[1.9] text-inkSoft">
        这个地址下没有页面。也许它从未存在，也许被收进了别处。
      </p>
      <Link href="/" className="btn-primary mt-8 px-6 py-2.5">
        回到首页
      </Link>
    </div>
  );
}
