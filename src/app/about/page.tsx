import type { Metadata } from "next";
import { AboutView } from "@/views/about-view";

export const metadata: Metadata = {
  title: "About",
  description:
    "SkilledSphere is a curated global professional discovery platform with a premium editorial identity — not a social network.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <AboutView />;
}
