"use client";

/**
 * Globe.tsx — cinematic interactive 3D globe (three.js / react-three-fiber).
 *
 * Design notes:
 *  - The camera is fixed on the +Z axis; ALL orientation lives on a single
 *    rotating group (`globeRef`). Idle drift, drag and focus animations are
 *    therefore just quaternion updates of that one group.
 *  - Country boundaries are rendered as ONE merged LineSegments; the selected
 *    country gets its own gold outline + a translucent gold patch
 *    triangulated onto the sphere surface.
 *  - No wheel listeners (the globe lives in a scrollable page); zoom is
 *    prop-driven (`zoom`, 0..1). Single-pointer drag rotates, tap/click picks.
 *  - Transparent canvas (alpha) — the page background shows through.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import {
  COUNTRY_FEATURES,
  latLonToVector3,
  pointInCountry,
  vector3ToLatLon,
  type CountryFeature,
} from "@/lib/geo";

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface GlobeMarker {
  code: string;
  name: string;
  flag: string;
  lat: number;
  lon: number;
  count: number;
}

/** Imperative handle for the zoom buttons that live outside the canvas. */
export interface GlobeControl {
  /** Multiply the current zoom (e.g. 1.35 = zoom in, 1/1.35 = zoom out). */
  zoomBy: (factor: number) => void;
  reset: () => void;
}

export interface GlobeProps {
  /** Countries with listed professionals (only count > 0 renders a marker). */
  markers?: GlobeMarker[];
  /** ISO alpha-2 of the selected country (null/undefined = none). */
  selectedCode?: string | null;
  /** Called when the user clicks/taps a country on the globe. */
  onSelectCountry?: (code: string) => void;
  /** Called once per drag as soon as the user actually starts rotating the
   *  globe (moved more than a click's worth of pixels). Used by the page to
   *  close the country card so the globe can be spun freely. */
  onInteract?: () => void;
  /** Slow idle rotation (paused while a country is selected). Default true. */
  autoRotate?: boolean;
  /** Enable drag + click picking. Default true. (Zoom is always prop-driven.) */
  interactive?: boolean;
  /** 0..1 — when provided, blends the globe orientation towards the selected
   *  country by this amount (takes precedence over the focus animation). */
  focusProgress?: number;
  /** 0..1 camera dolly — 0 = far (r*4.5), 1 = close (r*2.2). No wheel/pinch
   *  listeners are attached; the parent controls this via UI. */
  zoom?: number;
  /** The globe fills this ref with a {@link GlobeControl} so the page can add +/- buttons. */
  controlRef?: { current: GlobeControl | null };
  /** Phone layout: the page writes the globe's size (`scale`, 1 = default) and its
   *  vertical position (`y`, fraction of the canvas height, + = down) here while
   *  scrolling. The canvas stays full-screen, so zooming never shows dark borders. */
  viewRef?: { current: { scale: number; y: number } };
  /** Class applied to the wrapper div (the parent must give it a size). */
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const GLOBE_RADIUS = 1;
const R_BOUNDARY = 1.004;
const R_FILL = 1.01;
const R_SELECTED = 1.014;
const R_MARKER = 1.02;
const R_PULSE = 1.035;
const HALO_RADIUS = 1.13;

const DEFAULT_CAMERA_DIST = 3.25;
const ZOOM_FAR = 4.5; // zoom = 0
const ZOOM_NEAR = 2.2; // zoom = 1
/** User zoom (pinch / ctrl+wheel / buttons): 1 = default view, higher = closer. */
const USER_ZOOM_MIN = 1;
const USER_ZOOM_MAX = 2.4;

const SPIN_DECAY = 2.4; // 1/s — higher = stops sooner (≈1.5 s glide)
const SPIN_MAX = 9; // rad/s cap
const IDLE_SPEED = 0.045; // rad/s — calm cinematic drift (full turn ≈ 2.3 min)
const DRAG_SPEED = 0.005; // rad per dragged pixel
const MAX_TILT = Math.PI - 0.5; // how far the globe may tip over
const CLICK_MOVE_PX = 6;
const CLICK_MOVE_PX_TOUCH = 14; // fingers wobble more than a mouse
const CLICK_MS = 500;
const CLICK_MS_TOUCH = 750;

const GOLD = "#C6A96B";
/** Selected-country highlight (deeper gold so it reads on the cream land). */
const SELECTED_COLOR = "#A98847";
/** Land colour — the cream of the site theme. Change this hex to try others. */
const LAND_COLOR = "#EDE3CC";
/** Country borders drawn over the land. */
const BOUNDARY_COLOR = "#B3A173";
const BOUNDARY_OPACITY = 0.75;
/** Width of the land texture (height = width / 2). Lower on phones. */
const LAND_TEXTURE_WIDTH = 3072;
const LAND_TEXTURE_WIDTH_MOBILE = 2048;

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

const FEATURE_BY_CODE = new Map<string, CountryFeature>(
  COUNTRY_FEATURES.map((f) => [f.code, f]),
);

/* ------------------------------------------------------------------ */
/* Geometry builders (pure, run inside useMemo)                         */
/* ------------------------------------------------------------------ */

/** Merges every exterior ring of the given features into line segments. */
function buildLineGeometry(
  features: CountryFeature[],
  radius: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  for (const feature of features) {
    for (const ring of feature.polygons) {
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % n]; // close the ring
        const va = latLonToVector3(a[1], a[0], radius);
        const vb = latLonToVector3(b[1], b[0], radius);
        pts.push(va[0], va[1], va[2], vb[0], vb[1], vb[2]);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
  return geometry;
}

/** True when consecutive vertices jump more than 180° in longitude — i.e. the
 *  ring crosses the antimeridian in its current frame. */
function hasSeamJump(pts: number[][]): boolean {
  for (let i = 0; i < pts.length; i++) {
    if (Math.abs(pts[i][0] - pts[(i + 1) % pts.length][0]) > 180) return true;
  }
  return false;
}

/**
 * Triangulates a country's rings (in lon/lat space, then mapped onto the
 * sphere), subdividing large triangles so the patch hugs the sphere.
 */
function buildFillGeometry(feature: CountryFeature): THREE.BufferGeometry | null {
  const positions: number[] = [];

  const pushPoint = (p: number[]) => {
    const v = latLonToVector3(p[1], p[0], R_FILL);
    positions.push(v[0], v[1], v[2]);
  };

  const emit = (a: number[], b: number[], c: number[], depth: number) => {
    const span = Math.max(
      Math.max(a[0], b[0], c[0]) - Math.min(a[0], b[0], c[0]),
      Math.max(a[1], b[1], c[1]) - Math.min(a[1], b[1], c[1]),
    );
    if (span <= 8 || depth >= 6) {
      pushPoint(a);
      pushPoint(b);
      pushPoint(c);
      return;
    }
    const ab: number[] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const bc: number[] = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    const ca: number[] = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
    emit(a, ab, ca, depth + 1);
    emit(ab, b, bc, depth + 1);
    emit(ca, bc, c, depth + 1);
    emit(ab, bc, ca, depth + 1);
  };

  for (const ring of feature.polygons) {
    if (ring.length < 3) continue;

    // Unwrap rings that cross the antimeridian: negative lons get +360 so the
    // ring becomes contiguous in the plane (Russia, Fiji, USA, …). If the
    // shifted ring still contains a >180° jump, the ring wraps a pole
    // (Antarctica) and is left in its original frame instead.
    let planar = ring;
    if (hasSeamJump(ring)) {
      const shifted = ring.map((p) => [p[0] < 0 ? p[0] + 360 : p[0], p[1]]);
      if (!hasSeamJump(shifted)) planar = shifted;
    }

    // THREE.Vector2 is required — triangulateShape calls .equals() on the points
    const contour = planar.map((p) => new THREE.Vector2(p[0], p[1]));
    // (triangulateShape may drop a duplicated closing point from `contour`)
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const face of faces) {
      emit(
        [contour[face[0]].x, contour[face[0]].y],
        [contour[face[1]].x, contour[face[1]].y],
        [contour[face[2]].x, contour[face[2]].y],
        0,
      );
    }
  }

  if (positions.length === 0) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

/** Draws every country as white on black in an equirectangular canvas
 *  (lon -180..180 left→right, lat 90..-90 top→bottom). The ocean shader uses
 *  it as a land mask so the continents are filled with the cream colour. */
function createLandTexture(width: number): THREE.CanvasTexture {
  const w = width;
  const h = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2; // closes hairline gaps between neighbouring countries
  ctx.lineJoin = "round";

  const X = (lon: number) => ((lon + 180) / 360) * w;
  const Y = (lat: number) => ((90 - lat) / 180) * h;

  const draw = (pts: number[][], dx: number) => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = X(p[0] + dx);
      const y = Y(p[1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  for (const feature of COUNTRY_FEATURES) {
    for (const ring of feature.polygons) {
      if (ring.length < 3) continue;
      if (!hasSeamJump(ring)) {
        draw(ring, 0);
        continue;
      }
      // crosses the antimeridian: unwrap, then draw twice so both edges are covered
      const shifted = ring.map((p) => [p[0] < 0 ? p[0] + 360 : p[0], p[1]]);
      if (!hasSeamJump(shifted)) {
        draw(shifted, 0);
        draw(shifted, -360);
        continue;
      }
      // ring wraps a pole (Antarctica): start after the biggest jump and
      // close the shape along the pole
      let at = 0;
      let best = 0;
      for (let i = 0; i < ring.length; i++) {
        const d = Math.abs(ring[i][0] - ring[(i + 1) % ring.length][0]);
        if (d > best) {
          best = d;
          at = i;
        }
      }
      const rotated = [...ring.slice(at + 1), ...ring.slice(0, at + 1)];
      const pole = rotated.reduce((a, p) => a + p[1], 0) / rotated.length < 0 ? -90 : 90;
      draw(
        [
          ...rotated,
          [rotated[rotated.length - 1][0], pole],
          [rotated[0][0], pole],
        ],
        0,
      );
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Marker texture: soft halo + solid dot with a thin dark rim. It is white so
 *  every marker can tint it with its own yellow (material.color); the dark rim
 *  stays dark, which keeps the dot readable on the cream land. */
function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const c = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  // halo
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, "rgba(255,255,255,0.75)");
  halo.addColorStop(0.35, "rgba(255,255,255,0.35)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // dark rim
  ctx.beginPath();
  ctx.arc(c, c, size * 0.19, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(70,42,0,0.95)";
  ctx.fill();
  // bright core (tinted yellow by the material)
  ctx.beginPath();
  ctx.arc(c, c, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A spectrum of yellows, from lemon to deep amber. */
const MARKER_YELLOWS = [
  "#FFF176",
  "#FFEB3B",
  "#FFE14D",
  "#FFD60A",
  "#FFCA28",
  "#FFC107",
  "#FFB300",
  "#FFA726",
];

/** Small deterministic hash -> 0..1, so each country gets its own (stable) random values. */
function hash01(text: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967295;
}

/* ------------------------------------------------------------------ */
/* Shaders                                                              */
/* ------------------------------------------------------------------ */

const OCEAN_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vWorld;
  varying vec3 vObj;
  void main() {
    vN = normalize(normalMatrix * normal);
    vObj = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const OCEAN_FRAG = /* glsl */ `
  uniform sampler2D uLand;
  uniform vec3 uLandColor;
  varying vec3 vN;
  varying vec3 vWorld;
  varying vec3 vObj;
  void main() {
    // lat/lon of this fragment (matches latLonToVector3 in lib/geo.ts)
    vec3 p = normalize(vObj);
    float lon = atan(p.z, -p.x);
    float lat = asin(clamp(p.y, -1.0, 1.0));
    vec2 uv = vec2(lon / 6.28318530718 + 0.5, lat / 3.14159265359 + 0.5);
    float land = texture2D(uLand, uv).r;

    // gold fresnel rim at glancing angles (view space: +Z is towards the camera)
    float fres = pow(1.0 - clamp(vN.z, 0.0, 1.0), 3.0);
    float pole = smoothstep(-1.0, 1.0, normalize(vWorld).y);
    vec3 deep = vec3(0.043, 0.082, 0.188); // #0B1530
    vec3 mid  = vec3(0.090, 0.153, 0.278); // #172747
    vec3 ocean = mix(deep, mid, 0.30 + 0.70 * pole);

    // cream land with a touch of shading towards the edge of the globe
    vec3 ground = uLandColor * (0.80 + 0.20 * clamp(vN.z, 0.0, 1.0));
    vec3 col = mix(ocean, ground, land);
    col += vec3(0.776, 0.663, 0.420) * fres * 0.20; // #C6A96B rim
    gl_FragColor = vec4(col, 1.0);
  }
`;

const HALO_VERT = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Soft champagne-gold atmosphere that fades to zero at its outer edge
// (no hard rim), brightest just outside the globe silhouette.
const HALO_FRAG = /* glsl */ `
  varying vec3 vN;
  void main() {
    float x = clamp(vN.z, 0.0, 1.0);
    float glow = 8.0 * pow(x, 3.0) * pow(1.0 - x, 3.0);
    gl_FragColor = vec4(vec3(0.776, 0.663, 0.420) * 0.55, glow);
  }
`;

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

type SceneProps = Omit<GlobeProps, "className"> & { reducedMotion: boolean };

function GlobeScene(props: SceneProps) {
  const { gl, camera } = useThree();
  const reducedMotion = props.reducedMotion;

  /* ---------- memoised three.js resources ---------- */

  const boundaryGeometry = useMemo(
    () => buildLineGeometry(COUNTRY_FEATURES, R_BOUNDARY),
    [],
  );

  const glowTexture = useMemo(() => createGlowTexture(), []);

  const land = useMemo(() => {
    const narrow = typeof window !== "undefined" && window.innerWidth < 768;
    const texture = createLandTexture(narrow ? LAND_TEXTURE_WIDTH_MOBILE : LAND_TEXTURE_WIDTH);
    const [r, g, b] = hexToRgb01(LAND_COLOR);
    return {
      texture,
      uniforms: {
        uLand: { value: texture },
        uLandColor: { value: new THREE.Vector3(r, g, b) },
      },
    };
  }, []);

  const markerData = useMemo(() => {
    return (props.markers ?? [])
      .filter((m) => m.count > 0)
      .map((m) => {
        const t = Math.min(1, Math.max(0, m.count) / 100); // clamp at 100
        const size = 0.12 + 0.07 * t;
        const color = new THREE.Color(
          MARKER_YELLOWS[Math.floor(hash01(m.code, 1) * MARKER_YELLOWS.length) % MARKER_YELLOWS.length],
        );
        const material = new THREE.SpriteMaterial({
          map: glowTexture,
          color,
          transparent: true,
          depthWrite: false,
        });
        return {
          code: m.code,
          position: new THREE.Vector3(...latLonToVector3(m.lat, m.lon, R_MARKER)),
          size,
          material,
          // each marker twinkles on its own: two sines with random speed + phase
          a: 0.6 + hash01(m.code, 2) * 1.6,
          b: 1.3 + hash01(m.code, 3) * 2.1,
          pa: hash01(m.code, 4) * Math.PI * 2,
          pb: hash01(m.code, 5) * Math.PI * 2,
        };
      });
  }, [props.markers, glowTexture]);

  const selectedFeature: CountryFeature | null =
    (props.selectedCode && FEATURE_BY_CODE.get(props.selectedCode)) || null;

  /** Quaternion that rotates the selected country's centroid to face +Z. */
  const focusQuat = useMemo(() => {
    if (!selectedFeature) return null;
    const v = latLonToVector3(
      selectedFeature.centroid[1],
      selectedFeature.centroid[0],
      GLOBE_RADIUS,
    );
    const from = new THREE.Vector3(v[0], v[1], v[2]).normalize();
    return new THREE.Quaternion().setFromUnitVectors(from, new THREE.Vector3(0, 0, 1));
  }, [selectedFeature]);

  const selectedGeometry = useMemo(() => {
    if (!selectedFeature) return null;
    return {
      lines: buildLineGeometry([selectedFeature], R_SELECTED),
      fill: buildFillGeometry(selectedFeature),
    };
  }, [selectedFeature]);

  /** Anchor for the pulsing ring: the selected marker, else the centroid. */
  const pulse = useMemo(() => {
    if (!props.selectedCode) return null;
    const marker = (props.markers ?? []).find((m) => m.code === props.selectedCode);
    let lat: number;
    let lon: number;
    if (marker) {
      lat = marker.lat;
      lon = marker.lon;
    } else if (selectedFeature) {
      lon = selectedFeature.centroid[0];
      lat = selectedFeature.centroid[1];
    } else {
      return null;
    }
    const position = new THREE.Vector3(...latLonToVector3(lat, lon, R_PULSE));
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      position.clone().normalize(),
    );
    return { position, quaternion };
  }, [props.selectedCode, props.markers, selectedFeature]);

  /* ---------- refs ---------- */

  const globeRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);

  /** The "free" (user-controlled / idle) orientation of the globe. */
  const freeQuat = useRef(new THREE.Quaternion());
  /** user zoom: target (set by gestures/buttons) and the smoothed value in use */
  const zoomTarget = useRef(1);
  /** spin speed (rad/s) left over after a drag: the globe keeps gliding and slows down */
  const spin = useRef({ wx: 0, wy: 0, lastMoveT: 0 });
  const viewState = useRef({ y: 0, w: 0, h: 0 });
  const zoomCur = useRef(1);
  const pinch = useRef({ active: false, startDist: 0, startZoom: 1, suppressClick: false });
  const blendQuat = useRef(new THREE.Quaternion()); // scratch for focusProgress

  const drag = useRef({
    active: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    startT: 0,
    notified: false,
  });

  const scratch = useRef({
    q1: new THREE.Quaternion(),
    q2: new THREE.Quaternion(),
    q3: new THREE.Quaternion(),
    v1: new THREE.Vector3(),
    v2: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    hit: new THREE.Vector3(),
    local: new THREE.Vector3(),
  });

  /** Latest values for the DOM event handlers. */
  const latest = useRef({
    interactive: props.interactive ?? true,
    onSelectCountry: props.onSelectCountry,
    onInteract: props.onInteract,
  });
  useEffect(() => {
    latest.current = {
      interactive: props.interactive ?? true,
      onSelectCountry: props.onSelectCountry,
      onInteract: props.onInteract,
    };
  });

  /* ---------- zoom handle for the +/- buttons ---------- */

  const controlRef = props.controlRef;
  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      zoomBy: (factor: number) => {
        zoomTarget.current = THREE.MathUtils.clamp(
          zoomTarget.current * factor,
          USER_ZOOM_MIN,
          USER_ZOOM_MAX,
        );
      },
      reset: () => {
        zoomTarget.current = 1;
      },
    };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef]);

  /* ---------- disposal (separate effects per resource lifetime) ---------- */

  useEffect(
    () => () => {
      boundaryGeometry.dispose();
    },
    [boundaryGeometry],
  );

  useEffect(
    () => () => {
      glowTexture.dispose();
    },
    [glowTexture],
  );

  useEffect(
    () => () => {
      markerData.forEach((m) => m.material.dispose());
    },
    [markerData],
  );

  useEffect(
    () => () => {
      land.texture.dispose();
    },
    [land],
  );

  useEffect(
    () => () => {
      selectedGeometry?.lines.dispose();
      selectedGeometry?.fill?.dispose();
    },
    [selectedGeometry],
  );

  /* ---------- native pointer handling on the canvas ---------- */

  useEffect(() => {
    const canvas = gl.domElement;
    // Let vertical swipes scroll the page; horizontal drags rotate the globe.
    // Imperative DOM handling of the R3F canvas is intentional here.
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "grab";

    const onPointerDown = (e: PointerEvent) => {
      if (!latest.current.interactive) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (drag.current.active) return; // the 2nd finger is handled by the pinch listeners below
      pinch.current.suppressClick = false;
      spin.current = { wx: 0, wy: 0, lastMoveT: 0 };
      drag.current = {
        active: true,
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        startT: performance.now(),
        notified: false,
      };
      if (canvas.hasPointerCapture(e.pointerId) === false) {
        canvas.setPointerCapture(e.pointerId);
      }
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active || e.pointerId !== d.pointerId) return;

      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      if (pinch.current.active) return; // two fingers = zoom, not rotate

      // remember how fast the finger/mouse is moving so the globe can keep gliding
      const nowT = performance.now();
      const dtMove = Math.max(0.006, (nowT - (spin.current.lastMoveT || nowT - 16)) / 1000);
      spin.current.lastMoveT = nowT;
      const k = DRAG_SPEED / zoomCur.current;
      const cap = (v: number) => THREE.MathUtils.clamp(v, -SPIN_MAX, SPIN_MAX);
      spin.current.wy = cap(spin.current.wy * 0.55 + ((dx * k) / dtMove) * 0.45);
      spin.current.wx = cap(spin.current.wx * 0.55 + ((dy * k) / dtMove) * 0.45);

      // The user is really spinning the globe (not just tapping): tell the
      // page once so it can close the open country card.
      if (
        !d.notified &&
        Math.hypot(e.clientX - d.startX, e.clientY - d.startY) >=
          (e.pointerType === "mouse" ? CLICK_MOVE_PX : CLICK_MOVE_PX_TOUCH)
      ) {
        d.notified = true;
        latest.current.onInteract?.();
      }

      const q = freeQuat.current;
      const s = scratch.current;

      // horizontal — spin around the world Y axis
      s.q1.setFromAxisAngle(AXIS_Y, (dx * DRAG_SPEED) / zoomCur.current);
      q.premultiply(s.q1);

      // vertical — tip around the camera-right axis (world X), tilt-clamped
      const angle = (dy * DRAG_SPEED) / zoomCur.current;
      if (angle !== 0) {
        s.q2.setFromAxisAngle(AXIS_X, angle);
        q.premultiply(s.q2);
        s.v1.set(0, 1, 0).applyQuaternion(q);
        const tilt = Math.acos(THREE.MathUtils.clamp(s.v1.y, -1, 1));
        if (tilt > MAX_TILT) {
          s.q2.invert();
          q.premultiply(s.q2); // revert this increment at the pole limit
        }
      }
    };

    const finishDrag = (e: PointerEvent, allowClick: boolean) => {
      const d = drag.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      d.active = false;
      // held still before letting go -> no glide
      if (performance.now() - spin.current.lastMoveT > 90) {
        spin.current.wx = 0;
        spin.current.wy = 0;
      }
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (!allowClick) return;
      if (!latest.current.interactive) return;
      if (pinch.current.suppressClick) return;

      // click = tiny movement, short duration
      const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      const elapsed = performance.now() - d.startT;
      const touch = e.pointerType !== "mouse";
      if (
        moved >= (touch ? CLICK_MOVE_PX_TOUCH : CLICK_MOVE_PX) ||
        elapsed >= (touch ? CLICK_MS_TOUCH : CLICK_MS)
      )
        return;

      // mathematical ray/sphere pick against the unit sphere at the origin
      const rect = canvas.getBoundingClientRect();
      const s = scratch.current;
      s.v2.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      );
      s.raycaster.setFromCamera(s.v2, camera);
      const ray = s.raycaster.ray;
      const b = ray.origin.dot(ray.direction);
      const c = ray.origin.lengthSq() - GLOBE_RADIUS * GLOBE_RADIUS;
      const disc = b * b - c;
      if (disc < 0) return; // missed the globe (ocean corner of the canvas)
      const t = -b - Math.sqrt(disc);
      if (t < 0) return;
      s.hit.copy(ray.direction).multiplyScalar(t).add(ray.origin);

      // world -> globe local using the *displayed* orientation
      const g = globeRef.current;
      if (!g) return;
      s.q3.copy(g.quaternion).invert();
      s.local.copy(s.hit).applyQuaternion(s.q3);

      const [lat, lon] = vector3ToLatLon(s.local.x, s.local.y, s.local.z);
      const country = pointInCountry(lon, lat);
      if (country) latest.current.onSelectCountry?.(country.code);
    };

    const onPointerUp = (e: PointerEvent) => finishDrag(e, true);
    const onPointerCancel = (e: PointerEvent) => finishDrag(e, false);

    // --- pinch to zoom (two fingers) ---
    const fingerDist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (!latest.current.interactive || e.touches.length !== 2) return;
      pinch.current = {
        active: true,
        startDist: Math.max(1, fingerDist(e.touches)),
        startZoom: zoomTarget.current,
        suppressClick: true,
      };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch.current.active || e.touches.length < 2) return;
      if (e.cancelable) e.preventDefault(); // keep the page from scrolling while pinching
      const k = fingerDist(e.touches) / pinch.current.startDist;
      zoomTarget.current = THREE.MathUtils.clamp(
        pinch.current.startZoom * k,
        USER_ZOOM_MIN,
        USER_ZOOM_MAX,
      );
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.current.active = false;
    };
    // --- trackpad pinch / Ctrl + mouse wheel (plain wheel still scrolls the page) ---
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || !latest.current.interactive) return;
      e.preventDefault();
      const dy = THREE.MathUtils.clamp(e.deltaY, -40, 40);
      zoomTarget.current = THREE.MathUtils.clamp(
        zoomTarget.current * Math.exp(-dy * 0.012),
        USER_ZOOM_MIN,
        USER_ZOOM_MAX,
      );
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.style.cursor = "";
      canvas.style.touchAction = "";
    };
  }, [gl, camera]);

  /* ---------- per-frame update ---------- */

  useFrame((state, delta) => {
    const g = globeRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const s = scratch.current;
    const d = drag.current;

    // 1) idle drift — paused while dragging or while a country is selected
    const autoRotate = props.autoRotate ?? true;
    const selected = props.selectedCode ?? null;
    if (autoRotate && !selected && !reducedMotion && !d.active) {
      s.q1.setFromAxisAngle(AXIS_Y, IDLE_SPEED * dt);
      freeQuat.current.premultiply(s.q1);
    }

    // 1b) inertia: after a drag the globe keeps turning and eases to a stop
    const sp = spin.current;
    if (!d.active && (Math.abs(sp.wx) > 0.003 || Math.abs(sp.wy) > 0.003)) {
      if (selected) {
        sp.wx = 0;
        sp.wy = 0;
      } else {
        const qf = freeQuat.current;
        if (sp.wy !== 0) {
          s.q1.setFromAxisAngle(AXIS_Y, sp.wy * dt);
          qf.premultiply(s.q1);
        }
        if (sp.wx !== 0) {
          s.q2.setFromAxisAngle(AXIS_X, sp.wx * dt);
          qf.premultiply(s.q2);
          s.v1.set(0, 1, 0).applyQuaternion(qf);
          if (Math.acos(THREE.MathUtils.clamp(s.v1.y, -1, 1)) > MAX_TILT) {
            s.q2.invert();
            qf.premultiply(s.q2);
            sp.wx = 0;
          }
        }
        const decay = Math.exp(-SPIN_DECAY * dt);
        sp.wx *= decay;
        sp.wy *= decay;
      }
    } else if (!d.active) {
      sp.wx = 0;
      sp.wy = 0;
    }

    // 2) focus behaviour
    const fpRaw = props.focusProgress;
    const fp =
      typeof fpRaw === "number" && Number.isFinite(fpRaw)
        ? THREE.MathUtils.clamp(fpRaw, 0, 1)
        : null;
    if (focusQuat) {
      if (fp !== null) {
        // scroll-choreography override: exact blend free → target
        blendQuat.current.copy(freeQuat.current).slerp(focusQuat, fp);
        g.quaternion.copy(blendQuat.current);
      } else {
        // calm slerp towards the selected country (paused while dragging)
        if (!d.active) {
          freeQuat.current.slerp(focusQuat, 1 - Math.exp(-3.5 * dt));
        }
        g.quaternion.copy(freeQuat.current);
      }
    } else {
      g.quaternion.copy(freeQuat.current);
    }

    // 3) prop-driven camera dolly
    const zoomRaw = props.zoom;
    const zoom =
      typeof zoomRaw === "number" && Number.isFinite(zoomRaw)
        ? THREE.MathUtils.clamp(zoomRaw, 0, 1)
        : null;
    // smooth the user's zoom, then dolly the camera
    zoomCur.current += (zoomTarget.current - zoomCur.current) * (1 - Math.exp(-9 * dt));
    const baseDist =
      zoom === null ? DEFAULT_CAMERA_DIST : THREE.MathUtils.lerp(ZOOM_FAR, ZOOM_NEAR, zoom);
    // On a tall (phone) canvas the sphere is limited by the WIDTH: pull the camera
    // back so the whole globe still fits, no matter how tall the canvas is.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const view = props.viewRef?.current;
    const viewScale = view?.scale ?? 1;
    const targetDist = (baseDist * Math.max(1, 1 / aspect)) / (zoomCur.current * viewScale);

    // vertical "lens shift": moves the globe up/down on the screen without moving the canvas
    const shiftY = view?.y ?? 0;
    const vs = viewState.current;
    if (
      Math.abs(shiftY - vs.y) > 0.0004 ||
      state.size.width !== vs.w ||
      state.size.height !== vs.h
    ) {
      const cam = camera as THREE.PerspectiveCamera;
      if (Math.abs(shiftY) < 0.0004) {
        cam.clearViewOffset();
      } else {
        cam.setViewOffset(
          state.size.width,
          state.size.height,
          0,
          -shiftY * state.size.height,
          state.size.width,
          state.size.height,
        );
      }
      vs.y = shiftY;
      vs.w = state.size.width;
      vs.h = state.size.height;
    }
    // Smooth camera dolly — mutating the R3F camera per frame is the canonical
    // three.js pattern (the camera is an external system, not React state).
    camera.position.z += (targetDist - camera.position.z) * (1 - Math.exp(-5 * dt));

    // 3b) random twinkle of the people markers (brightness only — never fully off)
    const tt = state.clock.elapsedTime;
    for (let i = 0; i < markerData.length; i++) {
      const m = markerData[i];
      const sp = spriteRefs.current[i];
      if (reducedMotion) {
        m.material.opacity = 1;
        continue;
      }
      const v = 0.5 + 0.5 * (0.6 * Math.sin(tt * m.a + m.pa) + 0.4 * Math.sin(tt * m.b + m.pb));
      m.material.opacity = 0.4 + 0.6 * v;
      if (sp) {
        const k = 0.9 + 0.2 * v;
        sp.scale.set(m.size * k, m.size * k, 1);
      }
    }

    // 4) pulsing ring over the selection
    if (pulseRef.current && pulseMatRef.current) {
      if (reducedMotion) {
        pulseRef.current.scale.setScalar(1);
        pulseMatRef.current.opacity = 0.55;
      } else {
        const wave = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.4);
        pulseRef.current.scale.setScalar(0.9 + 0.55 * wave);
        pulseMatRef.current.opacity = 0.3 + 0.45 * wave;
      }
    }
  });

  /* ---------- render ---------- */

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 2.5, 5]} intensity={0.55} />

      {/* soft gold atmosphere halo (outside the rotating group) */}
      <mesh renderOrder={2}>
        <sphereGeometry args={[HALO_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={HALO_VERT}
          fragmentShader={HALO_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={globeRef}>
        {/* deep navy ocean with a subtle gold fresnel rim */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
          <shaderMaterial
            vertexShader={OCEAN_VERT}
            fragmentShader={OCEAN_FRAG}
            uniforms={land.uniforms}
          />
        </mesh>

        {/* all country boundaries — one merged LineSegments */}
        <lineSegments geometry={boundaryGeometry} renderOrder={1}>
          <lineBasicMaterial
            color={BOUNDARY_COLOR}
            transparent
            opacity={BOUNDARY_OPACITY}
            depthWrite={false}
          />
        </lineSegments>

        {/* selected country: gold outline + translucent gold patch */}
        {selectedGeometry && (
          <group>
            {selectedGeometry.fill && (
              <mesh geometry={selectedGeometry.fill} renderOrder={2}>
                <meshBasicMaterial
                  color={SELECTED_COLOR}
                  transparent
                  opacity={0.7}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            <lineSegments geometry={selectedGeometry.lines} renderOrder={3}>
              <lineBasicMaterial color={SELECTED_COLOR} transparent opacity={1} depthWrite={false} />
            </lineSegments>
          </group>
        )}

        {/* yellow markers (billboarded sprites, each twinkling on its own) */}
        {markerData.map((m, i) => (
          <sprite
            key={m.code}
            ref={(el) => {
              spriteRefs.current[i] = el;
            }}
            material={m.material}
            position={m.position}
            scale={[m.size, m.size, 1]}
          />
        ))}

        {/* thin pulsing gold ring over the selected country */}
        {pulse && (
          <mesh
            ref={pulseRef}
            position={pulse.position}
            quaternion={pulse.quaternion}
            renderOrder={4}
          >
            <ringGeometry args={[0.055, 0.09, 48]} />
            <meshBasicMaterial
              ref={pulseMatRef}
              color={GOLD}
              transparent
              opacity={0.55}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function Globe(props: GlobeProps) {
  const { className, ...rest } = props;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={cn("relative h-full w-full", className)}>
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, DEFAULT_CAMERA_DIST], fov: 40, near: 0.1, far: 60 }}
      >
        <GlobeScene {...rest} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}