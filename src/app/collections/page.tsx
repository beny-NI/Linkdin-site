import type { Metadata } from "next";
import { CollectionsView } from "@/views/collections-view";

export const metadata: Metadata = {
  title: "Curated Collections",
  description:
    "Editorial collections and rankings of exceptional professionals, curated by the SkilledSphere editorial team.",
  alternates: { canonical: "/collections" },
};

export default function Page() {
  return <CollectionsView />;
}
