import type { Metadata } from "next";
import { IndustriesView } from "@/views/industries-view";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Explore the industries represented on SkilledSphere and meet the professionals shaping each of them.",
  alternates: { canonical: "/industries" },
};

export default function Page() {
  return <IndustriesView />;
}
