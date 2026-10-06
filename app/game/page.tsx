import PageHeader from "../components/PageHeader";
import GameTabs from "../components/GameTabs";

export const metadata = {
  title: "练习 · 猜诗与写译",
  description:
    "写译：把一句中国古诗文译成英文，提交后立刻得到自评与批注，并对照参考译法。猜诗：给英译四选一猜出处。",
  alternates: { canonical: "/game" },
};

export default function GamePage() {
  return (
    <>
      <PageHeader
        title="猜诗 · 写译"
        sub="五种练法：写译、回译、默写、背译、猜诗。译完当场看到批注，再对照参考。"
        enSub="Five ways in: translate, back-translate, cloze, recite, and guess. Notes appear the moment you submit."
      />
      <GameTabs />
    </>
  );
}
