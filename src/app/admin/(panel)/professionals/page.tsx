"use client";

import Link from "next/link";
import { FileSpreadsheet, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentList } from "@/components/admin/content-list";

interface Row {
  id: string;
  slug: string;
  fullName: string;
  professionalTitle: string;
  portraitUrl: string;
  city: string;
  country: { code: string; name: string; flag: string };
  published: boolean;
  homeFeatured: boolean;
  archived?: boolean;
}

export default function ProfessionalsAdminPage() {
  return (
    <ContentList<Row>
      entity="professionals"
      archivable
      extraActions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/professionals/review">
              <ListChecks aria-hidden /> Review drafts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/import">
              <FileSpreadsheet aria-hidden /> Import from Excel
            </Link>
          </Button>
        </>
      }
      title="Professionals"
      description="People shown in Discover, on the globe, in collections and in the homepage hero."
      noun="professional"
      newHref="/admin/professionals/new"
      newLabel="New professional"
      editHref={(r) => `/admin/professionals/${r.id}`}
      liveHref={(r) => `/professionals/${r.slug}`}
      columns={[
        {
          header: "Person",
          render: (r) => (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.portraitUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy-900">{r.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{r.professionalTitle}</p>
              </div>
            </div>
          ),
        },
        {
          header: "Location",
          className: "hidden md:table-cell",
          render: (r) => (
            <span className="text-sm text-navy-800">
              {r.city}, {r.country.name} {r.country.flag}
            </span>
          ),
        },
      ]}
    />
  );
}
