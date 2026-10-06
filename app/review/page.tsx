import PageHeader from "../components/PageHeader";
import ReviewQueue from "../components/ReviewQueue";

export const metadata = {
  title: "今日复习",
  description:
    "按遗忘曲线安排的复习队列：昨天收藏的诗词重点词，今天先复习一遍再学新的。",
  alternates: { canonical: "/review" },
};

export default function ReviewPage() {
  return (
    <>
      <PageHeader
        title="今日复习"
        sub="隔日再见一遍，才记得住。收藏的词与没译顺的句子，都在这里等着。"
        enSub="Meet yesterday's words again today — spaced intervals are the only way short-term memory turns long-term."
      />
      <ReviewQueue />
    </>
  );
}
