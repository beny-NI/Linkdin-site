"use client";

/**
 * GlobeCanvas.tsx — the import surface for the interactive globe.
 *
 * - Loads the real three.js globe client-side only (next/dynamic, ssr:false).
 * - Detects WebGL support and renders a graceful styled fallback when the
 *   browser cannot create a WebGL context.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { GlobeProps, GlobeMarker, GlobeControl } from "./Globe";

export type { GlobeProps, GlobeMarker, GlobeControl };

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

function GlobeLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden>
      <div
        className="h-44 w-44 animate-pulse rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 38%, #172747 0%, #0B1530 72%)",
          boxShadow:
            "0 0 80px rgba(23, 39, 71, 0.9), inset 0 0 45px rgba(6, 13, 33, 0.95)",
        }}
      />
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function GlobeFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div
        className="flex aspect-square w-full max-w-sm items-center justify-center rounded-full px-10 text-center"
        style={{
          background: "radial-gradient(circle at 50% 38%, #172747 0%, #0B1530 75%)",
          border: "1px solid rgba(198, 169, 107, 0.45)",
          boxShadow:
            "0 0 90px rgba(11, 21, 48, 0.95), inset 0 0 60px rgba(6, 13, 33, 0.95)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#C6A96B" }}>
          Interactive globe unavailable — use the country list below
        </p>
      </div>
    </div>
  );
}

export default function GlobeCanvas(props: GlobeProps) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    // Defer the check until after mount/paint (avoids synchronous setState in
    // the effect body).
    const raf = requestAnimationFrame(() => setWebgl(hasWebGL()));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (webgl === false) {
    return <GlobeFallback />;
  }
  return <Globe {...props} />;
}