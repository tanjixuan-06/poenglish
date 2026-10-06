import type { Metadata } from "next";
import SeekPoem from "../components/SeekPoem";

export const metadata: Metadata = {
  title: "以文寻诗 · 诗英",
  description:
    "写一段英文，看它与哪首中国古诗词最相契。以文寻诗，意气相投。",
  alternates: { canonical: "/seek" },
};

export default function SeekPage() {
  return <SeekPoem />;
}
