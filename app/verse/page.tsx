import type { Metadata } from "next";
import FreeVerse from "../components/FreeVerse";

export const metadata: Metadata = {
  title: "译诗 · 诗英",
  description:
    "把任意一段英文——台词、歌词、散文——化成一首中文诗，可选自由诗、五言、七言或小令，并附创作小记。英文与诗，互相照亮。",
  alternates: { canonical: "/verse" },
};

export default function VersePage() {
  return <FreeVerse />;
}
