"use client";

import { ContentList } from "@/components/admin/content-list";

interface Row {
  id: string;
  slug: string;
  title: string;
  kind: string;
  edition: string | null;
  coverUrl: string | null;
  memberCount: number;
  published: boolean;
  homeFeatured: boolean;
}

export default function CollectionsAdminPage() {
  return (
    <ContentList<Row>
      entity="collections"
      title="Collections"
      description="Editorial selections and rankings, e.g. “30 Under 30” or “Global AI Leaders”."
      noun="collection"
      paginated={false}
      newHref="/admin/collections/new"
      newLabel="New collection"
      editHref={(r) => `/admin/collections/${r.id}`}
      liveHref={(r) => `/collections/${r.slug}`}
      columns={[
        {
          header: "Collection",
          render: (r) => (
            <div className="flex items-center gap-3">
              {r.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-md bg-navy-100" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy-900">{r.title}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {r.kind}
                  {r.edition ? ` · ${r.edition}` : ""}
                </p>
              </div>
            </div>
          ),
        },
        {
          header: "People",
          className: "hidden md:table-cell",
          render: (r) => <span className="text-sm text-navy-800">{r.memberCount}</span>,
        },
      ]}
    />
  );
}
