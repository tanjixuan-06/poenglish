import type { Metadata } from "next";
import ImageryIndex from "../components/ImageryIndex";

export const metadata: Metadata = {
  title: "意象 · 诗英",
  description:
    "月、雪、江、柳……古人把心事寄在这些景物里。顺着意象读古诗英译，同一轮月，英文里有另一种说法。",
  alternates: { canonical: "/imagery" },
};

export default function ImageryPage() {
  return <ImageryIndex />;
}
