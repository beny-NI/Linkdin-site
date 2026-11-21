"use client";

import { ContentList } from "@/components/admin/content-list";

interface Row {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  coverUrl: string | null;
  publicationDate: string;
  published: boolean;
  homeFeatured: boolean;
  archived?: boolean;
}

export default function StoriesAdminPage() {
  return (
    <ContentList<Row>
      entity="stories"
      archivable
      title="Magazine stories"
      description="Interviews, leadership features and industry insights published in the magazine."
      noun="story"
      newHref="/admin/stories/new"
      newLabel="New story"
      editHref={(r) => `/admin/stories/${r.id}`}
      liveHref={(r) => `/magazine/${r.slug}`}
      columns={[
        {
          header: "Story",
          render: (r) => (
            <div className="flex items-center gap-3">
              {r.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-md bg-navy-100" />
              )}
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-navy-900">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.author}</p>
              </div>
            </div>
          ),
        },
        {
          header: "Category",
          className: "hidden md:table-cell",
          render: (r) => <span className="text-sm text-navy-800">{r.category}</span>,
        },
        {
          header: "Date",
          className: "hidden lg:table-cell",
          render: (r) => <span className="text-sm text-navy-800">{r.publicationDate.slice(0, 10)}</span>,
        },
      ]}
    />
  );
}
