import PageHeader from "../components/PageHeader";
import VocabBook from "../components/VocabBook";

export const metadata = {
  title: "生词本",
  description:
    "收藏古诗词英译里的重点词汇，存在本机浏览器，支持拼写自测与选择自测。",
  alternates: { canonical: "/vocab" },
};

export default function VocabPage() {
  return (
    <>
      <PageHeader
        title="生词本"
        sub="从诗里拾下的词，攒在这里。可以拼写自测，也可以选义自测。"
        enSub="Words picked out of the poems. Spell them, or test yourself by meaning."
      />
      <VocabBook />
    </>
  );
}
