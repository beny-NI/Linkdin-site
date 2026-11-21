"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/form-bits";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  countryCode: string;
  industry: string;
  expertise: string[];
  biography: string;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  photoUrl: string | null;
  achievements: string[];
  supportingLinks: string[];
  status: string;
  editorialNotes: string | null;
  createdAt: string;
}

interface ListResponse {
  items: Application[];
  total: number;
  totalPages: number;
}

const STATUSES = ["pending", "in-review", "approved", "declined"] as const;
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold-100 text-gold-600 ring-gold-300",
  "in-review": "bg-navy-50 text-navy-700 ring-navy-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  declined: "bg-red-50 text-red-700 ring-red-200",
};

export default function ApplicationsAdminPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["admin", "applications", filter, page],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/applications?page=${page}${filter !== "all" ? `&status=${filter}` : ""}`),
    placeholderData: keepPreviousData,
  });

  const open = data?.items.find((a) => a.id === openId) ?? null;
  const [notes, setNotes] = useState("");
  useEffect(() => setNotes(open?.editorialNotes ?? ""), [open?.id, open?.editorialNotes]);

  const patch = useMutation({
    mutationFn: (body: { status?: string; editorialNotes?: string }) =>
      adminFetch(`/api/admin/applications/${openId}`, { method: "PATCH", json: body }),
    onSuccess: () => {
      toast({ title: "Application updated" });
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast({ title: "Could not update", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Applications"
        description="People who applied through “Get featured”. Review them, then turn a good one into a profile in one click."
      />

      <div className="mb-4 inline-flex flex-wrap rounded-lg border border-border bg-card p-1 text-sm">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setFilter(s);
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1 font-medium capitalize transition-colors",
              filter === s ? "bg-navy-900 text-gold-400" : "text-muted-foreground hover:text-navy-900"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading && <Skeleton className="m-4 h-32" />}
        {data && data.items.length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">No applications in this view.</p>
        )}
        <ul className="divide-y divide-border">
          {data?.items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setOpenId(a.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">{a.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.professionalTitle} · {a.industry} · {a.countryCode}
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {new Date(a.createdAt).toLocaleDateString("en-GB")}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1",
                    STATUS_STYLE[a.status] ?? STATUS_STYLE.pending
                  )}
                >
                  {a.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.fullName}</DialogTitle>
                <DialogDescription>
                  {open.professionalTitle} · {open.industry} · {open.countryCode} ·{" "}
                  <a href={`mailto:${open.email}`} className="underline">
                    {open.email}
                  </a>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {open.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={open.photoUrl} alt="" className="h-24 w-24 rounded-xl object-cover object-top" />
                )}
                <p className="whitespace-pre-line leading-relaxed text-navy-800">{open.biography}</p>
                {open.expertise.length > 0 && <p><strong>Expertise:</strong> {open.expertise.join(", ")}</p>}
                {open.achievements.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5">
                    {open.achievements.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-3">
                  {[open.linkedinUrl, open.websiteUrl, ...open.supportingLinks].filter(Boolean).map((u) => (
                    <a key={u} href={u as string} target="_blank" rel="noreferrer noopener" className="text-gold-600 underline underline-offset-4">
                      {u}
                    </a>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-700" htmlFor="notes">
                    Editorial notes (private)
                  </label>
                  <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={patch.isPending}
                    onClick={() => patch.mutate({ editorialNotes: notes })}
                  >
                    {patch.isPending && <Loader2 className="animate-spin" aria-hidden />} Save notes
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={open.status === s ? "default" : "outline"}
                      className="capitalize"
                      disabled={patch.isPending}
                      onClick={() => patch.mutate({ status: s })}
                    >
                      {s}
                    </Button>
                  ))}
                  <Button asChild size="sm" className="ml-auto bg-gold-500 text-navy-950 hover:bg-gold-400">
                    <Link href={`/admin/professionals/new?fromApplication=${open.id}`}>
                      <UserPlus aria-hidden /> Create profile
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
