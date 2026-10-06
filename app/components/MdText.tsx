"use client";

/**
 * 极简 markdown 渲染：只处理 **加粗** 与换行，避免引入依赖。
 * AI 输出里只需要这一点格式。
 */
export default function MdText({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={`whitespace-pre-wrap text-sm leading-relaxed text-ink ${className}`}
    >
      {src.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const key = `${i}-${line.slice(0, 6)}`;
        if (!line.trim())
          return <span key={key} className="block h-2" aria-hidden />;
        return (
          <span key={key} className="block">
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
                <strong key={j} className="font-semibold text-ink">
                  {p.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{p}</span>
              )
            )}
          </span>
        );
      })}
    </div>
  );
}
