import type { Metadata } from "next";
import { ContactView } from "@/views/contact-view";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the SkilledSphere editorial, partnerships and press teams.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactView />;
}
