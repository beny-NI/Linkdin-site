import type { Metadata } from "next";
import { ExpertiseDirectoryView } from "@/views/expertise-directory-view";

export const metadata: Metadata = {
  title: "Expertise Directory",
  description:
    "Browse every field of expertise on SkilledSphere — from AI and quantum computing to finance, design and energy — and find the leading professionals in each.",
  alternates: { canonical: "/expertise" },
};

export default function Page() {
  return <ExpertiseDirectoryView />;
}
