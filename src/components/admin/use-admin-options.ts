"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";

export interface AdminOptions {
  countries: { code: string; name: string; flag: string }[];
  expertise: { id: string; name: string; cluster: string }[];
  industries: { id: string; name: string }[];
  professionals: { id: string; fullName: string; professionalTitle: string; portraitUrl: string; published: boolean; flag: string }[];
  stories: { id: string; title: string; category: string; published: boolean }[];
  collections: { id: string; title: string; kind: string; published: boolean }[];
}

export function useAdminOptions() {
  return useQuery<AdminOptions>({
    queryKey: ["admin", "options"],
    queryFn: () => adminFetch<AdminOptions>("/api/admin/options"),
    staleTime: 15_000,
  });
}
