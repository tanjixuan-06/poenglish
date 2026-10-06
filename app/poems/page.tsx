import PageHeader from "../components/PageHeader";
import PoemLibrary from "../components/PoemLibrary";

export const metadata = {
  title: "诗词库",
  description:
    "中国古诗词英译库，按朝代与主题浏览。每首配中英对照、重点词汇表与跨学科知识卡（天文、地理、生物、化学、物理）。",
  alternates: { canonical: "/poems" },
};

export default function PoemsPage() {
  return (
    <>
      <PageHeader
        title="诗词库"
        sub="按朝代、主题与学段翻检。每首都有中英对照、词汇小注与一张跨学科卡片。"
        enSub="Browse by dynasty, theme or school stage — each poem with a full rendering, glossary and one cross-subject card."
      />
      <PoemLibrary />
    </>
  );
}
