import PageHeader from "../components/PageHeader";
import LearnStats from "../components/LearnStats";
import AiSettings from "../components/AiSettings";

export const metadata = {
  title: "我的学习",
  description:
    "练习记录、掌握情况、错句本、生词本与数据备份，全部存在本机浏览器。",
  alternates: { canonical: "/me" },
};

export default function MePage() {
  return (
    <>
      <PageHeader
        title="我的学习"
        sub="练过多少、记得如何、卡在哪里，都在这一页。数据只存在这台设备上。"
        enSub="What you have practised, what you still miss. Everything stays on this device."
      />
      <LearnStats />
      <AiSettings />
    </>
  );
}
