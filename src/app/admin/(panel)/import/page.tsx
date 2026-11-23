"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { COLUMNS } from "@/lib/import-columns";
import { PageHeader, Section } from "@/components/admin/form-bits";
import { cn } from "@/lib/utils";

interface PreviewRow {
  row: number;
  name: string;
  title: string;
  country: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
  duplicate: boolean;
  data: Record<string, unknown> | null;
}

export default function ImportAdminPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [include, setInclude] = useState<Set<number>>(new Set());
  const [fileName, setFileName] = useState("");

  const preview = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return adminFetch<{ rows: PreviewRow[] }>("/api/admin/import/preview", { method: "POST", body: form });
    },
    onSuccess: (res) => {
      setRows(res.rows);
      // everything valid is ticked, except possible duplicates
      setInclude(new Set(res.rows.filter((r) => r.ok && !r.duplicate).map((r) => r.row)));
    },
    onError: (e) => {
      setRows(null);
      toast({ title: "Could not read the file", description: e.message, variant: "destructive" });
    },
  });

  const commit = useMutation({
    mutationFn: () =>
      adminFetch<{ created: number; failed: { index: number; error: string }[] }>("/api/admin/import/commit", {
        method: "POST",
        json: { rows: (rows ?? []).filter((r) => include.has(r.row) && r.data).map((r) => r.data) },
      }),
    onSuccess: (res) => {
      toast({
        title: `${res.created} draft${res.created === 1 ? "" : "s"} created`,
        description: res.failed.length ? `${res.failed.length} could not be saved.` : "Nothing is public yet — review them one by one.",
      });
      void qc.invalidateQueries();
      if (res.created > 0) router.push("/admin/professionals/review");
    },
    onError: (e) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const validCount = rows?.filter((r) => r.ok).length ?? 0;
  const errorCount = rows ? rows.length - validCount : 0;

  function toggle(row: number) {
    setInclude((cur) => {
      const next = new Set(cur);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Professionals"
        title="Import from Excel"
        description="Upload many people at once. Every row becomes a draft — nothing is public until you approve it."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/professionals/review">Review drafts</Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <Section title="Step 1 · Download the template" description="Fill the sheet “People” — one person per row. Keep the header row unchanged.">
          <Button asChild variant="outline">
            <a href="/api/admin/import/template">
              <Download aria-hidden /> Download template (.xlsx)
            </a>
          </Button>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-navy-700">
                <tr>
                  <th className="px-3 py-2">Column</th>
                  <th className="px-3 py-2">Required</th>
                  <th className="px-3 py-2">What to enter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COLUMNS.map((c) => (
                  <tr key={c.key}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-navy-900">{c.key}</td>
                    <td className="px-3 py-2">{c.required ? <span className="font-bold text-gold-600">YES</span> : "—"}</td>
                    <td className="px-3 py-2 text-navy-800">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Step 2 · Upload your file" description="We check every row first — nothing is saved until you confirm.">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFileName(f.name);
                preview.mutate(f);
              }
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={preview.isPending} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            {preview.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />} Choose Excel file
          </Button>
          {fileName && (
            <p className="flex items-center gap-2 text-sm text-navy-800">
              <FileSpreadsheet className="h-4 w-4 text-gold-600" aria-hidden /> {fileName}
            </p>
          )}
        </Section>

        {rows && (
          <Section
            title={`Step 3 · Check the result (${rows.length} rows)`}
            description={`${validCount} ready · ${errorCount} with errors. Tick the people you want to create as drafts.`}
          >
            <ul className="divide-y divide-border rounded-xl border border-border">
              {rows.map((r) => (
                <li key={r.row} className={cn("flex gap-3 px-4 py-3", !r.ok && "bg-red-50/60")}>
                  <input
                    type="checkbox"
                    disabled={!r.ok}
                    checked={include.has(r.row)}
                    onChange={() => toggle(r.row)}
                    aria-label={`Include row ${r.row}`}
                    className="mt-1 h-4 w-4 accent-[#a98847]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy-900">
                      {r.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <XCircle className="h-4 w-4 text-destructive" aria-hidden />}
                      {r.name || <em className="font-normal text-muted-foreground">no name</em>}
                      <span className="text-xs font-normal text-muted-foreground">
                        row {r.row} · {r.title} · {r.country}
                      </span>
                    </p>
                    {r.errors.map((e) => (
                      <p key={e} className="mt-1 text-xs text-destructive">
                        ✕ {e}
                      </p>
                    ))}
                    {r.warnings.map((w) => (
                      <p key={w} className="mt-1 flex items-start gap-1 text-xs text-gold-600">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {w}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{include.size} selected</p>
              <Button onClick={() => commit.mutate()} disabled={include.size === 0 || commit.isPending} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
                {commit.isPending && <Loader2 className="animate-spin" aria-hidden />} Create {include.size} draft{include.size === 1 ? "" : "s"}
              </Button>
            </div>
          </Section>
        )}
      </div>
    </>
  );
}
