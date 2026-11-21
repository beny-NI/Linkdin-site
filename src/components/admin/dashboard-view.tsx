"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  LayoutTemplate,
  Eye,
  FileClock,
  Inbox,
  Layers,
  Newspaper,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, Section } from "@/components/admin/form-bits";

interface Stats {
  content: {
    professionals: { total: number; published: number };
    stories: { total: number; published: number };
    collections: { total: number; published: number };
    countries: number;
    expertise: number;
    industries: number;
  };
  applications: Record<string, number>;
  homepage: { heroSelected: number; heroMax: number };
  traffic: {
    trackingSince: string | null;
    today: { views: number; visitors: number };
    last7: { views: number; visitors: number };
    last30: { views: number; visitors: number };
    days: { date: string; views: number; visitors: number }[];
    topPages: { path: string; count: number }[];
    topProfiles: { slug: string; name: string; count: number }[];
    topStories: { slug: string; name: string; count: number }[];
    topCollections: { slug: string; name: string; count: number }[];
    referrers: { host: string; count: number }[];
    devices: { desktop: number; mobile: number };
  };
  recent: {
    professionals: { id: string; fullName: string; professionalTitle: string; portraitUrl: string; published: boolean; createdAt: string }[];
    stories: { id: string; title: string; category: string; published: boolean; createdAt: string }[];
  };
}

const nf = new Intl.NumberFormat("en-US");

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  href?: string;
}) {
  const body = (
    <div className="group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-gold-500/60 hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-gold-600">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-extrabold text-navy-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function RankList({ title, rows, hrefBase }: { title: string; rows: { key: string; label: string; count: number }[]; hrefBase?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-navy-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                {hrefBase ? (
                  <a href={`${hrefBase}${r.key}`} target="_blank" rel="noreferrer" className="truncate font-medium text-navy-900 hover:text-gold-600">
                    {r.label}
                  </a>
                ) : (
                  <span className="truncate font-medium text-navy-900">{r.label}</span>
                )}
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{nf.format(r.count)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardView() {
  const { data, isLoading, isError, error } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch<Stats>("/api/admin/stats"),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load statistics"}
        </p>
      </>
    );
  }

  const { content, traffic, homepage, applications } = data;
  const drafts =
    content.professionals.total - content.professionals.published +
    (content.stories.total - content.stories.published) +
    (content.collections.total - content.collections.published);
  const chartData = traffic.days.map((d) => ({ ...d, label: d.date.slice(5) }));
  const totalDevices = traffic.devices.desktop + traffic.devices.mobile;
  const pending = applications.pending ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live numbers from your database and your own anonymous visitor counter."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/stories/new">
                <Plus aria-hidden /> New story
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              <Link href="/admin/professionals/new">
                <Plus aria-hidden /> New professional
              </Link>
            </Button>
          </>
        }
      />

      {/* things that need attention */}
      {pending > 0 && (
        <div className="mb-6">
          <Link
            href="/admin/applications"
            className="flex items-center gap-3 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-800 hover:bg-navy-100"
          >
            <Inbox className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong>{pending}</strong> new “Get featured” application{pending === 1 ? "" : "s"} waiting for review.
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      )}

      {/* traffic KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Views today" value={nf.format(traffic.today.views)} sub={`${nf.format(traffic.today.visitors)} visitors`} icon={Eye} />
        <Kpi label="Views · 7 days" value={nf.format(traffic.last7.views)} sub={`${nf.format(traffic.last7.visitors)} visitors (daily unique)`} icon={Eye} />
        <Kpi label="Views · 30 days" value={nf.format(traffic.last30.views)} sub={`${nf.format(traffic.last30.visitors)} visitors (daily unique)`} icon={Eye} />
        <Kpi
          label="Mobile share"
          value={totalDevices ? `${Math.round((traffic.devices.mobile / totalDevices) * 100)}%` : "—"}
          sub={totalDevices ? `${nf.format(traffic.devices.mobile)} mobile · ${nf.format(traffic.devices.desktop)} desktop` : "No visits recorded yet"}
          icon={Eye}
        />
      </div>

      {/* content KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Professionals"
          value={content.professionals.published}
          sub={`${content.professionals.total - content.professionals.published} draft · ${content.countries} countries`}
          icon={Users}
          href="/admin/professionals"
        />
        <Kpi
          label="Stories"
          value={content.stories.published}
          sub={`${content.stories.total - content.stories.published} draft`}
          icon={Newspaper}
          href="/admin/stories"
        />
        <Kpi
          label="Collections"
          value={content.collections.published}
          sub={`${content.collections.total - content.collections.published} draft`}
          icon={Layers}
          href="/admin/collections"
        />
        <Kpi
          label="Homepage hero"
          value={`${homepage.heroSelected} / ${homepage.heroMax}`}
          sub={homepage.heroSelected ? "people chosen for the top of the site" : "none chosen — newest are shown"}
          icon={LayoutTemplate}
          href="/admin/homepage"
        />
      </div>

      <Section
        className="mt-6"
        title="Visits — last 30 days"
        description={
          traffic.trackingSince
            ? `Counting since ${traffic.trackingSince}. Anonymous: no cookies, no stored IP addresses.`
            : "Counting starts as soon as the first visitor opens the public site."
        }
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c6a96b" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#c6a96b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd9cd" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5c6579" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#5c6579" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #ddd9cd", fontSize: 12 }}
                labelFormatter={(l) => `Day ${l}`}
              />
              <Area type="monotone" dataKey="views" name="Views" stroke="#a98847" strokeWidth={2} fill="url(#viewsFill)" />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#263b60" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Most visited">
          <div className="grid gap-6 sm:grid-cols-2">
            <RankList
              title="Pages"
              rows={traffic.topPages.map((p) => ({ key: p.path, label: p.path, count: p.count }))}
            />
            <RankList
              title="Profiles"
              hrefBase="/professionals/"
              rows={traffic.topProfiles.map((p) => ({ key: p.slug, label: p.name, count: p.count }))}
            />
            <RankList
              title="Stories"
              hrefBase="/magazine/"
              rows={traffic.topStories.map((p) => ({ key: p.slug, label: p.name, count: p.count }))}
            />
            <RankList
              title="Collections"
              hrefBase="/collections/"
              rows={traffic.topCollections.map((p) => ({ key: p.slug, label: p.name, count: p.count }))}
            />
          </div>
        </Section>

        <div className="space-y-6">
          <Section title="Where visitors come from">
            <RankList title="Referrers" rows={traffic.referrers.map((r) => ({ key: r.host, label: r.host, count: r.count }))} />
          </Section>

          <Section
            title="Recently added"
            action={
              drafts > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-semibold text-gold-600">
                  <FileClock className="h-3.5 w-3.5" aria-hidden /> {drafts} draft{drafts === 1 ? "" : "s"}
                </span>
              ) : undefined
            }
          >
            <ul className="space-y-3">
              {data.recent.professionals.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.portraitUrl} alt="" className="h-9 w-9 rounded-full object-cover object-top" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/professionals/${p.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-gold-600">
                      {p.fullName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{p.professionalTitle}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{p.published ? "Live" : "Draft"}</span>
                </li>
              ))}
              {data.recent.stories.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                    <Newspaper className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/stories/${s.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-gold-600">
                      {s.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{s.category}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{s.published ? "Live" : "Draft"}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
