"use client";

import { useState } from "react";
import { ChevronDown, Linkedin, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";

export type AutofillFields = Record<string, unknown>;

/** "Auto-fill from LinkedIn" box at the top of the New professional form. Only EMPTY fields get filled. */
export function LinkedInImport({ onResult }: { onResult: (fields: AutofillFields) => number }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  async function run() {
    setBusy(true);
    setNotes([]);
    try {
      const res = await adminFetch<{ fields: AutofillFields; notes: string[] }>("/api/admin/autofill", {
        method: "POST",
        json: { url: url.trim() || undefined, text: text.trim() || undefined },
      });
      const filled = onResult(res.fields);
      setNotes(res.notes);
      toast({
        title: filled ? `Filled ${filled} field${filled === 1 ? "" : "s"}` : "Nothing new to fill",
        description: "Please review everything before publishing. The photo is not imported — upload one below.",
      });
    } catch (e) {
      setShowText(true);
      toast({ title: "Auto-fill failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gold-500/50 bg-accent/60 p-5">
      <div className="flex items-center gap-2 font-heading text-base font-bold text-navy-900">
        <Linkedin className="h-4 w-4 text-gold-600" aria-hidden /> Auto-fill from LinkedIn
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Paste the profile link and press Auto-fill — empty fields are filled in, anything you already typed stays untouched.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/in/…" className="bg-card" aria-label="LinkedIn profile link" />
        <Button type="button" onClick={run} disabled={busy || (!url.trim() && !text.trim())} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} Auto-fill
        </Button>
      </div>

      <button type="button" onClick={() => setShowText((v) => !v)} className="mt-3 flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600">
        <ChevronDown className={`h-4 w-4 transition-transform ${showText ? "rotate-180" : ""}`} aria-hidden />
        Better results: paste the profile text
      </button>
      {showText && (
        <div className="mt-2 space-y-2">
          <Textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="LinkedIn often blocks automatic reading. Open the profile → More → “Save to PDF” → open the PDF, select all, copy and paste here."
            className="bg-card text-sm"
            aria-label="Pasted LinkedIn profile text"
          />
          <p className="text-[11px] text-muted-foreground">
            The text is sent to the Anthropic API to be structured. Only use profiles of people who agreed to be featured.
          </p>
        </div>
      )}
      {notes.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-navy-700">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
