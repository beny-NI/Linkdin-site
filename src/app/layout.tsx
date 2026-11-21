import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/site/providers";
import { RouterBridge } from "@/components/site/router-bridge";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchDialog } from "@/components/site/search-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0B1530",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "SkilledSphere",
    "professional discovery",
    "global experts",
    "industry leaders",
    "editorial magazine",
    "professionals directory",
  ],
  authors: [{ name: SITE_NAME }],
  icons: { icon: "/logo.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "A curated global professional discovery platform with a premium editorial identity. Explore exceptional professionals across the world.",
    siteName: SITE_NAME,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: `${SITE_TAGLINE}.`,
  },
};

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    description: SITE_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/discover?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <JsonLd data={siteJsonLd} />
        <Providers>
          <RouterBridge />
          <div className="flex min-h-screen flex-col">
            <Header />
            {/* each route's <main> comes from app/template.tsx */}
            {children}
            <Footer />
          </div>
          <SearchDialog />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
