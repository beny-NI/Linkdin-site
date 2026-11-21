import type { Metadata } from "next";
import { MagazineView } from "@/views/magazine-view";

export const metadata: Metadata = {
  title: "Magazine",
  description:
    "Interviews, leadership features and success stories from the people shaping what's next.",
  alternates: { canonical: "/magazine" },
};

export default function Page() {
  return <MagazineView />;
}
