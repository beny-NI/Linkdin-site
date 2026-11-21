import type { Metadata } from "next";
import { GetFeaturedView } from "@/views/get-featured-view";

export const metadata: Metadata = {
  title: "Get Featured",
  description:
    "Apply to be featured on SkilledSphere. Submit your profile to our editorial team for review.",
  alternates: { canonical: "/get-featured" },
};

export default function Page() {
  return <GetFeaturedView />;
}
