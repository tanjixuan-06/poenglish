import HomeHero from "./components/HomeHero";

export const metadata = {
  title: "诗英 · 把古诗读成英文",
  description:
    "给你一段中国古诗词的英译，猜它出自哪一首。猜诗、每日一诗、诗词库与跨学科小卡片，中英对照，打开即玩。",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeHero />;
}
