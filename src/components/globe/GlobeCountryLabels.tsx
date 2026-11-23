"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COUNTRY_FEATURES, latLonToVector3 } from "@/lib/geo";

/**
 * Small, regular-weight country names on the globe (every country).
 * Render it INSIDE the rotating globe group, e.g. right after the boundary lines:
 *     <GlobeCountryLabels />
 * Labels on the far side of the globe fade out, so only the visible hemisphere shows text.
 */
const LABEL_RADIUS = 1.012; // just above the land
const LABEL_HEIGHT = 0.026; // world units — small (globe radius is 1)
const MAX_OPACITY = 0.85;
const FONT = "400 30px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function makeLabel(text: string): { texture: THREE.CanvasTexture; aspect: number } {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = FONT;
  const w = Math.ceil(probe.measureText(text).width) + 20;
  const h = 46;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  // thin cream halo keeps the dark text readable on both land and ocean
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(237, 227, 204, 0.9)";
  ctx.strokeText(text, w / 2, h / 2 + 1);
  ctx.fillStyle = "#1B2A4A";
  ctx.fillText(text, w / 2, h / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: w / h };
}

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function GlobeCountryLabels() {
  const group = useMemo(() => {
    const g = new THREE.Group();
    for (const f of COUNTRY_FEATURES) {
      const { texture, aspect } = makeLabel(f.name);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...latLonToVector3(f.centroid[1], f.centroid[0], LABEL_RADIUS));
      sprite.scale.set(LABEL_HEIGHT * aspect, LABEL_HEIGHT, 1);
      sprite.renderOrder = 6;
      g.add(sprite);
    }
    return g;
  }, []);

  useEffect(
    () => () => {
      group.children.forEach((child) => {
        const m = (child as THREE.Sprite).material;
        m.map?.dispose();
        m.dispose();
      });
    },
    [group]
  );

  const world = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    camDir.copy(state.camera.position).normalize();
    for (const child of group.children) {
      const sprite = child as THREE.Sprite;
      sprite.getWorldPosition(world).normalize();
      const facing = world.dot(camDir); // 1 = centre of the visible side, 0 = horizon
      const opacity = smooth(0.18, 0.5, facing) * MAX_OPACITY;
      sprite.material.opacity = opacity;
      sprite.visible = opacity > 0.01;
    }
  });

  return <primitive object={group} />;
}
