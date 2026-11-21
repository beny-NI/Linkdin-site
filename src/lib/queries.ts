"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  BootstrapDTO,
  CollectionCardDTO,
  CountryDTO,
  ExpertiseDTO,
  IndustryDTO,
  Paginated,
  ProfessionalCardDTO,
  ProfessionalDetailDTO,
  SearchResultsDTO,
  StoryCardDTO,
  StoryDetailDTO,
} from "@/lib/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useBootstrap() {
  return useQuery<BootstrapDTO>({
    queryKey: ["bootstrap"],
    queryFn: () => getJson<BootstrapDTO>("/api/bootstrap"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface ProfessionalFilters {
  q?: string;
  country?: string;
  expertise?: string;
  industry?: string;
  collection?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export function useProfessionals(filters: ProfessionalFilters, enabled = true) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "" && !(k === "page" && v === 1)) {
      params.set(k, String(v));
    }
  }
  return useQuery<Paginated<ProfessionalCardDTO>>({
    queryKey: ["professionals", filters],
    queryFn: () => getJson<Paginated<ProfessionalCardDTO>>(`/api/professionals?${params.toString()}`),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useProfessional(slug: string) {
  return useQuery<ProfessionalDetailDTO>({
    queryKey: ["professional", slug],
    queryFn: () => getJson<ProfessionalDetailDTO>(`/api/professionals/${slug}`),
    enabled: !!slug,
  });
}

export function useCountries() {
  return useQuery<CountryDTO[]>({
    queryKey: ["countries"],
    queryFn: () => getJson<CountryDTO[]>("/api/countries"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface CountryDetail {
  code: string;
  name: string;
  flag: string;
  latitude: number;
  longitude: number;
  professionals: ProfessionalCardDTO[];
}

export function useCountry(code: string | null) {
  return useQuery<CountryDetail>({
    queryKey: ["country", code],
    queryFn: () => getJson<CountryDetail>(`/api/countries/${code}`),
    enabled: !!code,
  });
}

export function useExpertiseTree() {
  return useQuery<ExpertiseDTO[]>({
    queryKey: ["expertise-tree"],
    queryFn: () => getJson<ExpertiseDTO[]>("/api/expertise"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface ExpertiseDetail {
  slug: string;
  name: string;
  description: string;
  cluster: string;
  parent: { slug: string; name: string } | null;
  children: { slug: string; name: string }[];
  professionals: ProfessionalCardDTO[];
  relatedIndustries: { slug: string; name: string; count: number }[];
  relatedStories: StoryCardDTO[];
}

export function useExpertise(slug: string) {
  return useQuery<ExpertiseDetail>({
    queryKey: ["expertise", slug],
    queryFn: () => getJson<ExpertiseDetail>(`/api/expertise/${slug}`),
    enabled: !!slug,
  });
}

export function useIndustries() {
  return useQuery<IndustryDTO[]>({
    queryKey: ["industries"],
    queryFn: () => getJson<IndustryDTO[]>("/api/industries"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface IndustryDetail {
  slug: string;
  name: string;
  description: string;
  professionals: ProfessionalCardDTO[];
  expertiseClusters: { slug: string; name: string; count: number }[];
  relatedStories: StoryCardDTO[];
}

export function useIndustry(slug: string) {
  return useQuery<IndustryDetail>({
    queryKey: ["industry", slug],
    queryFn: () => getJson<IndustryDetail>(`/api/industries/${slug}`),
    enabled: !!slug,
  });
}

export function useCollections() {
  return useQuery<CollectionCardDTO[]>({
    queryKey: ["collections"],
    queryFn: () => getJson<CollectionCardDTO[]>("/api/collections"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface CollectionDetail {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  kind: string;
  edition: string | null;
  members: ProfessionalCardDTO[];
}

export function useCollection(slug: string) {
  return useQuery<CollectionDetail>({
    queryKey: ["collection", slug],
    queryFn: () => getJson<CollectionDetail>(`/api/collections/${slug}`),
    enabled: !!slug,
  });
}

export function useStories(category?: string) {
  return useQuery<StoryCardDTO[]>({
    queryKey: ["stories", category ?? "all"],
    queryFn: () =>
      getJson<StoryCardDTO[]>(
        `/api/stories${category ? `?category=${encodeURIComponent(category)}` : ""}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStory(slug: string) {
  return useQuery<StoryDetailDTO>({
    queryKey: ["story", slug],
    queryFn: () => getJson<StoryDetailDTO>(`/api/stories/${slug}`),
    enabled: !!slug,
  });
}

export function useSearch(query: string) {
  return useQuery<SearchResultsDTO>({
    queryKey: ["search", query],
    queryFn: () => getJson<SearchResultsDTO>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
