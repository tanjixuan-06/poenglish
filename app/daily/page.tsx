import DailyPoem from "../components/DailyPoem";

export const metadata = {
  title: "每日一诗",
  description:
    "每天一首中国古诗词，中英对照逐句展示，重点词汇高亮，支持英文朗读。读完就算打卡。",
  alternates: { canonical: "/daily" },
};

export default function DailyPage() {
  return <DailyPoem />;
}
