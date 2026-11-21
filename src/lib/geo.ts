/**
 * geo.ts — pure geographic data module (no React, no THREE).
 *
 * Loads world country boundaries (Natural Earth 110m via world-atlas TopoJSON),
 * converts them to per-country polygon rings, and provides helpers used by the
 * 3D globe component.
 *
 * All heavy computation happens once at module level (import-time memoisation).
 * Coordinates are in DEGREES: polygons are [lon, lat] pairs, centroids are
 * [lon, lat].
 */

import { feature } from "topojson-client";
import topology from "world-atlas/countries-110m.json";
import countriesData from "world-countries";
import type * as GeoJSON from "geojson";

const DEG = Math.PI / 180;

/** One country: ISO-3166 alpha-2 code, display name, exterior polygon rings
 *  (each polygon is an array of [lon, lat] points) and the centroid [lon, lat]
 *  of its largest polygon. */
export type CountryFeature = {
  code: string;
  name: string;
  polygons: number[][][];
  centroid: [number, number];
};

/** Minimal country info used for globe markers and fallback UI. */
export type CountryInfo = {
  code: string;
  name: string;
  flag: string;
  lat: number;
  lon: number;
};

type RawCountry = {
  cca2: string;
  ccn3: string;
  name: { common: string };
  flag: string;
  latlng: [number, number];
};

const worldCountries = countriesData as unknown as RawCountry[];

/* ------------------------------------------------------------------ */
/* ccn3 (numeric ISO) -> cca2 (alpha-2) mapping from world-countries    */
/* ------------------------------------------------------------------ */

const CCN3_TO_CCA2 = new Map<string, string>();
for (const c of worldCountries) {
  if (c.ccn3) CCN3_TO_CCA2.set(c.ccn3, c.cca2);
}

/* ------------------------------------------------------------------ */
/* TopoJSON -> per-country features                                    */
/* ------------------------------------------------------------------ */

function buildCountryFeatures(): CountryFeature[] {
  // `topology` is untyped (see src/types/world-atlas.d.ts); topojson-client
  // converts it to a GeoJSON FeatureCollection at import time (once).
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as unknown as GeoJSON.FeatureCollection<GeoJSON.GeometryObject>;

  const out: CountryFeature[] = [];

  for (const f of collection.features) {
    const numericId = f.id == null ? undefined : String(f.id);
    const code = numericId != null ? CCN3_TO_CCA2.get(numericId) : undefined;
    if (!code) continue; // e.g. entries without a ccn3 match (Kosovo, N. Cyprus) — skipped by design

    const name = (f.properties && (f.properties as { name?: string }).name) || code;
    const geometry = f.geometry;
    if (!geometry) continue;

    const polygons: number[][][] = [];
    if (geometry.type === "Polygon") {
      const ring = geometry.coordinates[0];
      if (ring && ring.length > 2) polygons.push(ring.map((p) => [p[0], p[1]]));
    } else if (geometry.type === "MultiPolygon") {
      for (const poly of geometry.coordinates) {
        const ring = poly[0];
        if (ring && ring.length > 2) polygons.push(ring.map((p) => [p[0], p[1]]));
      }
    }
    if (polygons.length === 0) continue;

    // Centroid: average of the points of the largest exterior ring.
    let largest = polygons[0];
    for (const poly of polygons) if (poly.length > largest.length) largest = poly;

    // If the ring crosses the antimeridian, unwrap it first so that the
    // longitude average is not dragged towards 0 (e.g. Fiji, Russia). Rings
    // that still jump after unwrapping (polar wrap, e.g. Antarctica) are
    // averaged as-is.
    let crossesSeam = false;
    for (let i = 0; i < largest.length; i++) {
      if (Math.abs(largest[i][0] - largest[(i + 1) % largest.length][0]) > 180) {
        crossesSeam = true;
        break;
      }
    }
    let unwrapped: number[][] | null = null;
    if (crossesSeam) {
      const shifted = largest.map((p) => [p[0] < 0 ? p[0] + 360 : p[0], p[1]]);
      let stillJumps = false;
      for (let i = 0; i < shifted.length; i++) {
        if (Math.abs(shifted[i][0] - shifted[(i + 1) % shifted.length][0]) > 180) {
          stillJumps = true;
          break;
        }
      }
      if (!stillJumps) unwrapped = shifted;
    }
    let sx = 0;
    let sy = 0;
    for (const p of unwrapped ?? largest) {
      sx += p[0];
      sy += p[1];
    }
    let meanLon = sx / largest.length;
    if (meanLon > 180) meanLon -= 360;
    else if (meanLon < -180) meanLon += 360;
    const centroid: [number, number] = [meanLon, sy / largest.length];

    out.push({ code, name, polygons, centroid });
  }

  return out;
}

/** One entry per country present in the 110m atlas AND resolvable to an
 *  ISO alpha-2 code via world-countries. */
export const COUNTRY_FEATURES: CountryFeature[] = buildCountryFeatures();

/* ------------------------------------------------------------------ */
/* Point-in-country lookup (ray casting, holes ignored at 110m fidelity) */
/* ------------------------------------------------------------------ */

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Returns the country feature containing the given point (in degrees),
 *  or null when the point is over ocean / an unmapped region. */
export function pointInCountry(lon: number, lat: number): CountryFeature | null {
  for (const country of COUNTRY_FEATURES) {
    for (const ring of country.polygons) {
      if (pointInRing(lon, lat, ring)) return country;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Country info list (world-countries) for markers and fallback UI      */
/* ------------------------------------------------------------------ */

export const ALL_COUNTRY_INFO: CountryInfo[] = worldCountries.map((c) => ({
  code: c.cca2,
  name: c.name.common,
  flag: c.flag,
  lat: c.latlng[0],
  lon: c.latlng[1],
}));

/* ------------------------------------------------------------------ */
/* Sphere mapping                                                      */
/* ------------------------------------------------------------------ */

/**
 * Equirectangular lat/lon (degrees) -> point on a sphere of the given radius.
 * Matches THREE.SphereGeometry's default UV seam, so land drawn from lat/lon
 * lines up with a sphere textured the standard way.
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
): [number, number, number] {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const c = Math.cos(phi);
  return [
    -radius * c * Math.cos(lambda),
    radius * Math.sin(phi),
    radius * c * Math.sin(lambda),
  ];
}

/** Inverse of latLonToVector3 (point may be any scale — it is normalised). */
export function vector3ToLatLon(
  x: number,
  y: number,
  z: number,
): [number, number] {
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  const ny = y / len;
  const lat = Math.asin(ny > 1 ? 1 : ny < -1 ? -1 : ny) / DEG;
  // x = -cos(lat)cos(lon), z = cos(lat)sin(lon)  =>  lon = atan2(z, -x)
  const lon = Math.atan2(z, -x) / DEG;
  return [lat, lon];
}
