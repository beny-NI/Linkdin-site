import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-navy-950 px-6 pb-24 pt-40 text-center">
      <div className="max-w-md">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-gold-400">404</p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold text-white">This page doesn’t exist</h1>
        <p className="mt-4 text-navy-200">
          The profile, story or page you’re looking for may have been moved or unpublished.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-gold-400"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
