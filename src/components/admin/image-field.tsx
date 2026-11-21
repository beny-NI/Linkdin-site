"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

/** Upload an image (stored on the server as WebP) or paste an existing image URL / site path. */
export function ImageField({
  value,
  onChange,
  kind,
  aspect = "aspect-[4/5]",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  kind: "portraits" | "covers";
  aspect?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await adminFetch<{ url: string }>("/api/admin/upload", { method: "POST", body: form });
      onChange(res.url);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try another image",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative w-full max-w-[260px] overflow-hidden rounded-xl border border-dashed border-input bg-navy-50",
          aspect
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-full w-full object-cover object-top" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-navy-800"
          >
            <ImagePlus className="h-6 w-6 text-gold-600" aria-hidden />
            Click to upload
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-950/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden /> {value ? "Replace image" : "Upload image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <Trash2 aria-hidden /> Remove
          </Button>
        )}
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL / /images/… path"
        className="max-w-md text-xs"
        aria-label="Image URL"
      />
    </div>
  );
}
