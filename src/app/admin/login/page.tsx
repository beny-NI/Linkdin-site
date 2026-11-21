"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Login failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="globe-vignette flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/header.logo.svg" alt="SkilledSphere" width={56} height={56} priority className="h-14 w-14 object-contain" />
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white">
            Skilled<span className="text-gold-400">Sphere</span>
          </h1>
          <p className="eyebrow-light mt-2">Control panel</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-navy-700 bg-navy-900/80 p-7 shadow-2xl shadow-navy-950/60 backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-navy-100">
            <Lock className="h-4 w-4 text-gold-400" aria-hidden /> Sign in to continue
          </div>

          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-200">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 mt-1.5 border-navy-600 bg-navy-950 text-white placeholder:text-navy-400"
          />

          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-200">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 border-navy-600 bg-navy-950 text-white placeholder:text-navy-400"
          />

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="mt-6 w-full bg-gold-500 font-semibold text-navy-950 hover:bg-gold-400"
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Sign in
          </Button>
        </form>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-navy-300 transition-colors hover:text-gold-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the website
        </Link>
      </div>
    </div>
  );
}
