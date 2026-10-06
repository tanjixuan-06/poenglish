"use client";

import { useSpeech } from "../lib/useSpeech";

/**
 * 逐句朗读：包住一行英文，点击即读。
 * 供服务端组件（EnPoemView）引用；浏览器不支持时退化为纯文本。
 */
export default function SpeakLine({
  text,
  className,
  title = "Read aloud",
}: {
  text: string;
  className?: string;
  title?: string;
}) {
  const { speak, stop, supported } = useSpeech();
  if (!supported) {
    return <p className={className}>{text}</p>;
  }
  return (
    <button
      onClick={() => {
        stop();
        speak(text);
      }}
      title={title}
      className={`${className ?? ""} block w-full text-left transition-colors hover:text-brand`}
    >
      {text}
    </button>
  );
}
