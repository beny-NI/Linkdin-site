"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight, ExternalLink, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { PageHeader, StatusBadge } from "@/components/admin/form-bits";

interface BaseRow {
  id: string;
  slug: string;
  published: boolean;
  homeFeatured: boolean;
  archived?: boolean;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface Column<T> {
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface ContentListProps<T extends BaseRow> {
  entity: "professionals" | "stories" | "collections";
  title: string;
  description: string;
  noun: string; // "professional" | "story" | "collection"
  newHref: string;
  newLabel: string;
  editHref: (row: T) => string;
  liveHref: (row: T) => string;
  columns: Column<T>[];
  /** collections endpoint is not paginated */
  paginated?: boolean;
  /** show the Archive tab + archive / restore buttons (professionals, stories) */
  archivable?: boolean;
  /** extra buttons next to the "New …" button */
  extraActions?: ReactNode;
}

export function ContentList<T extends BaseRow>({
  entity,
  title,
  description,
  noun,
  newHref,
  newLabel,
  editHref,
  liveHref,
  columns,
  paginated = true,
  archivable = false,
  extraActions,
}: ContentListProps<T>) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams();
  if (debounced) params.set("q", debounced);
  if (status !== "all") params.set("status", status);
  if (paginated) params.set("page", String(page));

  useEffect(() => {
    setSelected(new Set());
    setAllMatching(false);
  }, [debounced, status, page]);

  const { data, isLoading, isError, error } = useQuery<ListResponse<T>>({
    queryKey: ["admin", entity, debounced, status, page],
    queryFn: () => adminFetch<ListResponse<T>>(`/api/admin/${entity}?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  function refreshEverything() {
    // refresh admin lists AND the public site's cached data in this browser
    void qc.invalidateQueries();
  }

  const toggle = useMutation({
    mutationFn: (row: T) =>
      adminFetch(`/api/admin/${entity}/${row.id}`, { method: "PATCH", json: { published: !row.published } }),
    onSuccess: (_d, row) => {
      toast({ title: row.published ? `Unpublished — removed from the site` : `Published — live on the site` });
      refreshEverything();
    },
    onError: (e) => toast({ title: "Could not update", description: e.message, variant: "destructive" }),
  });

  const archive = useMutation({
    mutationFn: ({ row, archived }: { row: T; archived: boolean }) =>
      adminFetch(`/api/admin/${entity}/${row.id}`, { method: "PATCH", json: { archived } }),
    onSuccess: (_d, { archived }) => {
      toast({ title: archived ? "Moved to the archive — hidden from the site" : "Restored as a draft" });
      refreshEverything();
    },
    onError: (e) => toast({ title: "Could not update", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (row: T) => adminFetch(`/api/admin/${entity}/${row.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: `Deleted` });
      refreshEverything();
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const rows = data?.items ?? [];

  const bulk = useMutation({
    mutationFn: (action: "delete" | "publish" | "unpublish" | "archive" | "restore") =>
      adminFetch<{ done: number; skipped: number }>("/api/admin/bulk", {
        method: "POST",
        json: {
          entity,
          action,
          ...(allMatching ? { all: { q: debounced, status } } : { ids: Array.from(selected) }),
        },
      }).then((r) => ({ ...r, action })),
    onSuccess: (r) => {
      toast({
        title: `${r.done} ${r.action === "delete" ? "deleted" : r.action === "publish" ? "published" : r.action === "unpublish" ? "unpublished" : r.action === "archive" ? "archived" : "restored"}`,
        description: r.skipped ? `${r.skipped} skipped (a real portrait photo is required before publishing).` : undefined,
      });
      setSelected(new Set());
      setAllMatching(false);
      refreshEverything();
    },
    onError: (e) => toast({ title: "Bulk action failed", description: e.message, variant: "destructive" }),
  });

  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleAll() {
    setAllMatching(false);
    setSelected(pageAllSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setAllMatching(false);
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const selectedCount = allMatching ? (data?.total ?? 0) : selected.size;
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        eyebrow="Publish"
        title={title}
        description={description}
        actions={
          <>
            {extraActions}
            <Button asChild size="sm" className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              <Link href={newHref}>
                <Plus aria-hidden /> {newLabel}
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="bg-card pl-9"
            aria-label="Search"
          />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {((archivable ? ["all", "published", "draft", "archived"] : ["all", "published", "draft"]) as ("all" | "published" | "draft" | "archived")[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 font-medium capitalize transition-colors ${
                status === s ? "bg-navy-900 text-gold-400" : "text-muted-foreground hover:text-navy-900"
              }`}
            >
              {s === "published" ? "Live" : s === "archived" ? "Archive" : s}
            </button>
          ))}
        </div>
        {data && <p className="text-xs text-muted-foreground sm:ml-auto">{data.total} total</p>}
      </div>

      {selectedCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gold-500/50 bg-accent px-4 py-2.5 text-sm">
          <strong className="text-navy-900">{selectedCount} selected</strong>
          {!allMatching && pageAllSelected && data && data.total > rows.length && (
            <button type="button" onClick={() => setAllMatching(true)} className="font-semibold text-gold-600 underline underline-offset-4">
              Select all {data.total} matching
            </button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {status !== "archived" && (
              <>
                <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => bulk.mutate("publish")}>
                  <Eye aria-hidden /> Publish
                </Button>
                <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => bulk.mutate("unpublish")}>
                  <EyeOff aria-hidden /> Unpublish
                </Button>
              </>
            )}
            {archivable && status !== "archived" && (
              <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => bulk.mutate("archive")}>
                <Archive aria-hidden /> Archive
              </Button>
            )}
            {archivable && status === "archived" && (
              <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => bulk.mutate("restore")}>
                <ArchiveRestore aria-hidden /> Restore
              </Button>
            )}
            <ConfirmAction
              title={`Permanently delete ${selectedCount} ${noun}${selectedCount === 1 ? "" : "s"}?`}
              description="They are removed from the site and the database for good. This cannot be undone."
              confirmLabel={`Delete ${selectedCount}`}
              onConfirm={() => bulk.mutate("delete")}
            >
              <Button size="sm" variant="outline" disabled={bulk.isPending} className="border-destructive/40 text-destructive hover:text-destructive">
                <Trash2 aria-hidden /> Delete
              </Button>
            </ConfirmAction>
            <Button size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setAllMatching(false); }}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                    className="h-4 w-4 accent-[#a98847]"
                  />
                </TableHead>
                {columns.map((c) => (
                  <TableHead key={c.header} className={c.className}>
                    {c.header}
                  </TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length + 3}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {isError && (
                <TableRow>
                  <TableCell colSpan={columns.length + 3} className="py-10 text-center text-sm text-destructive">
                    {error instanceof Error ? error.message : "Failed to load"}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 3} className="py-12 text-center text-sm text-muted-foreground">
                    Nothing here yet.{" "}
                    <Link href={newHref} className="font-semibold text-gold-600 underline underline-offset-4">
                      {newLabel}
                    </Link>
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) || allMatching ? "selected" : undefined}>
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={allMatching || selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      aria-label={`Select ${noun}`}
                      className="h-4 w-4 accent-[#a98847]"
                    />
                  </TableCell>
                  {columns.map((c, i) => (
                    <TableCell key={c.header} className={c.className}>
                      {i === 0 && row.homeFeatured ? (
                        <div className="flex items-center gap-2">
                          {c.render(row)}
                          <span title="Pinned to the homepage" className="shrink-0 text-gold-600">
                            <Star className="h-3.5 w-3.5 fill-current" aria-label="Pinned to homepage" />
                          </span>
                        </div>
                      ) : (
                        c.render(row)
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    {row.archived ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                        <Archive className="h-3 w-3" aria-hidden /> Archived
                      </span>
                    ) : (
                      <StatusBadge published={row.published} />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button asChild variant="ghost" size="icon" title="Edit">
                        <Link href={editHref(row)} aria-label={`Edit ${noun}`}>
                          <Pencil />
                        </Link>
                      </Button>
                      {row.archived ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restore from the archive (comes back as a draft)"
                          aria-label="Restore"
                          disabled={archive.isPending}
                          onClick={() => archive.mutate({ row, archived: false })}
                        >
                          <ArchiveRestore />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={row.published ? "Unpublish (hide from site)" : "Publish (show on site)"}
                            aria-label={row.published ? "Unpublish" : "Publish"}
                            disabled={toggle.isPending}
                            onClick={() => toggle.mutate(row)}
                          >
                            {row.published ? <EyeOff /> : <Eye />}
                          </Button>
                          {archivable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Move to the archive"
                              aria-label="Archive"
                              disabled={archive.isPending}
                              onClick={() => archive.mutate({ row, archived: true })}
                            >
                              <Archive />
                            </Button>
                          )}
                        </>
                      )}
                      {row.published && !row.archived && (
                        <Button asChild variant="ghost" size="icon" title="View on site">
                          <a href={liveHref(row)} target="_blank" rel="noreferrer" aria-label="View on site">
                            <ExternalLink />
                          </a>
                        </Button>
                      )}
                      <ConfirmAction
                        title={`Delete this ${noun}?`}
                        description="This permanently removes it from the site and the database. This cannot be undone."
                        onConfirm={() => remove.mutate(row)}
                      >
                        <Button variant="ghost" size="icon" title="Delete" aria-label="Delete" className="text-destructive hover:text-destructive">
                          <Trash2 />
                        </Button>
                      </ConfirmAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {paginated && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft aria-hidden /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
