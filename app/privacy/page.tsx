"use client";

import Link from "next/link";
import { useLang } from "../components/LangProvider";
import PageHeader from "../components/PageHeader";

export default function PrivacyPage() {
  const { lang } = useLang();
  const zh = lang !== "en";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={zh ? "隐私政策" : "Privacy Policy"}
        sub="我们如何处理你的数据"
        enSub="How we handle your data"
      />

      <div className="space-y-6 text-sm leading-[1.9] text-inkSoft">
        <section>
          <h2 className="mb-1.5 font-serif text-base text-ink">
            {zh ? "数据存储" : "Data storage"}
          </h2>
          <p>
            {zh
              ? "本站的学习记录、生词本、打卡与练习历史均只保存在你自己的浏览器本地存储（localStorage）中，不会上传到任何服务器，也不会被用于任何其他用途。你可以在「我的学习」中导出或清空这些数据。"
              : "Your study records, vocabulary, check-ins and practice history are stored only in your own browser's local storage (localStorage). They are never uploaded to any server or used for any other purpose. You can export or wipe this data from “My Learning”."}
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-serif text-base text-ink">
            {zh ? "麦克风与语音" : "Microphone & speech"}
          </h2>
          <p>
            {zh
              ? "「跟读打分」功能使用浏览器内置的语音识别（Web Speech API），音频在本地设备处理，不会录制或上传。你需要主动点击麦克风并授权后才会启用。"
              : "The “Shadowing” feature uses the browser’s built-in speech recognition (Web Speech API). Audio is processed on your device and is never recorded or uploaded. It activates only after you tap the mic and grant permission."}
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-serif text-base text-ink">
            {zh ? "AI 调用" : "AI calls"}
          </h2>
          <p>
            {zh
              ? "当你使用 AI 讲解、写译批改、回译点评、译诗等功能时，你输入的内容会发送到本站后端，再转发给大模型生成回答。我们不会长期保存这些输入与回答，也不会将其用于训练。请避免在输入中包含个人隐私信息。"
              : "When you use AI tutor, translation grading, back-translation feedback or verse translation, your input is sent to our backend and then forwarded to a language model. We do not retain these inputs or replies long-term, nor use them for training. Avoid entering personal information."}
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-serif text-base text-ink">
            {zh ? "分析与追踪" : "Analytics & tracking"}
          </h2>
          <p>
            {zh
              ? "本站不含广告与第三方追踪脚本。若运营者自行启用了 Umami 自建分析，它仅统计匿名访问量，不收集可用于识别个人的信息。"
              : "This site contains no ads or third-party tracking scripts. If the operator has enabled self-hosted Umami analytics, it only counts anonymous page views and collects no personally identifiable information."}
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-serif text-base text-ink">
            {zh ? "内容版权" : "Content"}
          </h2>
          <p>
            {zh
              ? "原诗均属公有领域；英文译文由本站点自行撰写，仅供学习使用。"
              : "Original poems are in the public domain; English translations are written by this site and intended for study only."}
          </p>
        </section>

        <p className="pt-1 text-inkFaint">
          <Link
            href="/"
            className="text-brand underline-offset-2 hover:underline"
          >
            {zh ? "返回首页" : "Back to home"}
          </Link>
        </p>
      </div>
    </div>
  );
}
