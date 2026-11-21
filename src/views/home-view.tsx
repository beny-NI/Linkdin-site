"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  FlaskConical,
  Landmark,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Palette,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/site/section-heading";
import { ProfessionalCard } from "@/components/site/professional-card";
import { formatDate } from "@/components/site/story-card";
import type { StoryCardDTO } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useBootstrap, useCountry } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import GlobeCanvas, { type GlobeControl } from "@/components/globe";
import type { CountryDTO } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tunables for the hero (change these numbers to fine-tune)          */
/* ------------------------------------------------------------------ */

/** Desktop only: how many px the globe starts BELOW the screen centre so it
 *  sits on the same horizontal line as the card (the fixed header covers the
 *  top 64px, so the visible centre is ~32px lower). It eases to 0 on scroll. */
const DESKTOP_GLOBE_START_Y_PX = 36;
/** Desktop, "page two": nudge from the exact middle of the sticky screen.
 *  +32px = the middle of the area UNDER the 64px fixed header. The scrollbar's
 *  half-width is added to X automatically. Tweak these two if you want it elsewhere. */
const DESKTOP_GLOBE_CENTER_Y_PX = 32;
const DESKTOP_GLOBE_CENTER_X_PX = 0;
/** Desktop: starting size of the globe (it used to be 0.62). */
const DESKTOP_GLOBE_START_SCALE = 0.84;
/** Desktop: size once the globe is centred ("page two") and at the very end.
 *  Smaller than before (was 1.16) so the glow around the globe is visible. */
const DESKTOP_GLOBE_CENTER_SCALE = 0.86;
const DESKTOP_GLOBE_END_SCALE = 0.8;
/** Hero carousel: milliseconds each card stays before the next one comes. */
const HERO_AUTOPLAY_MS = 5000;
/** Mobile: globe starts this far below the screen centre (44vh => only the
 *  upper half peeks out of the bottom edge, behind the card). */
const MOBILE_GLOBE_START_Y = 0.44; // fraction of the screen height
/** Mobile: where it ends up when centred (slightly low, under the headline). */
const MOBILE_GLOBE_CENTER_Y = 0.06;
/** Mobile: size at the start (half visible), when centred, and at the end.
 *  The globe box is 100vw wide, so these keep the whole sphere + glow on screen. */
const MOBILE_GLOBE_START_SCALE = 0.98;
const MOBILE_GLOBE_CENTER_SCALE = 0.88;
const MOBILE_GLOBE_END_SCALE = 0.78;
/** Auto-snap: after the user scrolls this much (0..1 of the globe section),
 *  the page glides by itself to the spot where the globe is centred. */
const SNAP_THRESHOLD = 0.08;
const SNAP_TARGET = 0.5;
/** How far (in vh) the section below slides up over the globe section so no
 *  empty dark gap is left after the globe. */
const NEXT_SECTION_PULL_UP_VH = 40;

/* ------------------------------------------------------------------ */
/*  Hero cards (carousel data)                                         */
/* ------------------------------------------------------------------ */

interface HeroCardData {
  slug: string;
  fullName: string;
  professionalTitle: string;
  summary: string;
  portraitUrl: string;
  city: string;
  country: { name: string; flag: string };
  expertise: { slug: string; name: string }[];
  achievements: string[];
  label: string;
  date: string | null;
}

function formatHeroDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** One hero card. `isFirst` only decides h1 vs h2 (SEO: one h1 per page). */
function HeroCardBody({ card, isFirst }: { card: HeroCardData | null; isFirst: boolean }) {
  const navigate = useAppStore((s) => s.navigate);
  const Heading = isFirst ? "h1" : "h2";

  return (
    <div className="h-full overflow-hidden rounded-3xl border border-gold-500/40 bg-navy-950/85 shadow-2xl shadow-navy-950/80 backdrop-blur-md lg:min-h-[440px] 2xl:min-h-[550px]">
      <div className="flex h-full flex-row">
        {/* Portrait */}
        <div className="relative w-[40%] shrink-0 self-stretch overflow-hidden sm:w-[42%] lg:w-[40%]">
          {card ? (
            <Image
              src={card.portraitUrl}
              alt={`Portrait of ${card.fullName}`}
              fill
              priority={isFirst}
              sizes="(max-width: 640px) 40vw, 480px"
              className="object-cover object-[50%_12%] max-sm:brightness-105 sm:object-top"
              draggable={false}
            />
          ) : (
            <Skeleton className="h-full w-full rounded-none bg-navy-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy-950/10 sm:to-navy-950/60" />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:gap-3 sm:p-6 lg:gap-4 lg:p-8 2xl:gap-5 2xl:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-navy-900 sm:px-3 sm:text-[10px] sm:tracking-[0.18em] 2xl:px-4 2xl:py-1.5 2xl:text-xs">
              {card?.label ?? "Person of the Day"}
            </span>
            {card?.date && (
              <span className="hidden text-[11px] font-medium uppercase tracking-wider text-navy-200 sm:inline 2xl:text-sm">
                {formatHeroDate(card.date)}
              </span>
            )}
          </div>
          <div>
            <Heading className="font-heading text-lg font-extrabold leading-tight text-white sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-[2.8rem]">
              {card?.fullName ?? <Skeleton className="h-8 w-52 bg-navy-800" />}
            </Heading>
            <p className="mt-1 text-xs font-medium text-gold-300 sm:text-sm md:text-base lg:text-lg 2xl:text-[1.4rem]">
              {card?.professionalTitle}
            </p>
          </div>
          <p className="line-clamp-3 text-xs leading-relaxed text-navy-100/90 sm:text-sm lg:line-clamp-4 lg:text-base 2xl:text-xl">
            {card?.summary}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {card?.expertise.slice(0, 3).map((e) => (
              <span
                key={e.slug}
                className="rounded-full border border-gold-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-gold-300 2xl:px-3.5 2xl:py-1 2xl:text-sm"
              >
                {e.name}
              </span>
            ))}
          </div>
          {card?.achievements.length ? (
            <ul className="hidden space-y-1.5 border-t border-navy-700/60 pt-3 sm:block">
              {card.achievements.slice(0, 3).map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed text-navy-200 2xl:gap-2.5 2xl:text-[15px]"
                >
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 2xl:h-[18px] 2xl:w-[18px]" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 sm:pt-3">
            {card && (
              <Button
                size="sm"
                className="bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400 2xl:h-11 2xl:px-6 2xl:text-base"
                onClick={() => navigate({ name: "profile", slug: card.slug })}
              >
                View Profile
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            )}
            <button
              type="button"
              onClick={() => navigate({ name: "discover" })}
              className="text-xs font-semibold text-navy-100 underline-offset-4 transition-colors hover:text-gold-300 hover:underline 2xl:text-sm"
            >
              Explore all professionals
            </button>
          </div>
          {card && (
            <p className="flex items-center gap-1.5 text-xs text-navy-300 2xl:text-[15px]">
              <MapPin className="h-3.5 w-3.5 text-gold-400 2xl:h-[18px] 2xl:w-[18px]" aria-hidden />
              {card.city}, {card.country.name} {card.country.flag}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero carousel: stacked cards, swipe / drag / arrows / wheel        */
/*  The previous card slides back BEHIND the next one.                 */
/* ------------------------------------------------------------------ */

function HeroCarousel({ cards }: { cards: HeroCardData[] }) {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0); // bumps whenever the 5s timer must restart
  const [paused, setPaused] = useState(false);
  const [atTop, setAtTop] = useState(true); // autoplay only while the hero is on screen
  const wrapRef = useRef<HTMLDivElement>(null);
  const count = cards.length;

  const go = useCallback(
    (dir: number) => {
      setActive((a) => (a + dir + count) % count);
      setCycle((c) => c + 1);
    },
    [count]
  );
  const goTo = useCallback((i: number) => {
    setActive(i);
    setCycle((c) => c + 1);
  }, []);

  // autoplay is paused once the page is scrolled past the first screen
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < window.innerHeight * 0.35);
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
    };
  }, []);

  const running = count > 1 && !paused && atTop && !reducedMotion;

  // every HERO_AUTOPLAY_MS the next card comes forward (loops back to the first)
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % count), HERO_AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [running, active, cycle, count]);

  // Horizontal trackpad / mouse-wheel scrolling (vertical wheel still scrolls the page)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 18) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lock < 450) return;
      lock = now;
      go(e.deltaX > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go]);

  // How the stack is laid out (px between stacked cards, cards visible per side)
  const step = isMobile ? 26 : 40;
  const maxVisible = isMobile ? 1 : 2;

  if (count === 0) {
    return <HeroCardBody card={null} isFirst />;
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured professionals"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      className="outline-none"
    >
      <div ref={wrapRef} className="grid" style={{ perspective: 1400 }}>
        {cards.map((card, i) => {
          // circular offset: the cards form a loop, so the one that was
          // furthest left slips behind the others and comes back on the right
          let o = (i - active + count) % count;
          if (o > count / 2) o -= count;
          const abs = Math.abs(o);
          const front = o === 0;
          const visible = abs <= maxVisible;

          return (
            <motion.div
              key={card.slug}
              className="relative [grid-area:1/1]"
              style={{
                zIndex: count - abs,
                touchAction: "pan-y",
                pointerEvents: visible ? undefined : "none",
              }}
              initial={false}
              animate={{
                x: o * step, // same size for every card: they only slide behind each other
                opacity: visible ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
              drag={front ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.28}
              onDragStart={() => setPaused(true)}
              onDragEnd={(_, info) => {
                setPaused(false);
                if (info.offset.x < -70 || info.velocity.x < -450) go(1);
                else if (info.offset.x > 70 || info.velocity.x > 450) go(-1);
              }}
              aria-hidden={!front}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              {/* the content is inert while the card is behind the front one */}
              <div inert={!front} className={cn(!front && "pointer-events-none select-none")}>
                <HeroCardBody card={card} isFirst={i === 0} />
              </div>
              {/* click a card that peeks out from behind to bring it forward */}
              {!front && visible && (
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className="absolute inset-0 z-10 cursor-pointer rounded-3xl"
                  aria-label={`Show ${card.fullName}`}
                  tabIndex={-1}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 sm:mt-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous professional"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-navy-950/70 text-gold-300 backdrop-blur transition-all hover:bg-gold-500 hover:text-navy-900"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          {/* one line per card; the active line fills up over the 5 seconds */}
          <div className="flex items-center gap-1.5 sm:gap-2" role="tablist" aria-label="Choose professional">
            {cards.map((c, i) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show ${c.fullName}`}
                onClick={() => goTo(i)}
                className="group flex h-6 items-center"
              >
                <span
                  className={cn(
                    "relative block h-1 w-6 overflow-hidden rounded-full transition-colors sm:w-10",
                    i === active ? "bg-navy-500/50" : "bg-navy-400/40 group-hover:bg-gold-400/60"
                  )}
                >
                  {i === active && (
                    <motion.span
                      key={`${active}-${cycle}-${running}`}
                      className="absolute inset-0 origin-left rounded-full bg-gold-400"
                      initial={{ scaleX: running ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: running ? HERO_AUTOPLAY_MS / 1000 : 0, ease: "linear" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next professional"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-navy-950/70 text-gold-300 backdrop-blur transition-all hover:bg-gold-500 hover:text-navy-900"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Globe experience: featured cards + interactive globe + ticker      */
/* ------------------------------------------------------------------ */

function GlobeExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const globeControl = useRef<GlobeControl | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Auto-snap: scroll a little (≈2 wheel clicks) and the page glides on its own
  // to the position where the globe is centred and easy to touch.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastY = window.scrollY;
    let dir = 0;
    let lastInput = 0;
    let snapTarget: number | null = null;

    const onInput = () => {
      lastInput = performance.now();
      if (snapTarget !== null) {
        // the user grabbed the scroll again: stop our own animation
        snapTarget = null;
        window.scrollTo({ top: window.scrollY, behavior: "auto" });
      }
    };

    const settle = () => {
      if (snapTarget !== null) {
        if (Math.abs(window.scrollY - snapTarget) < 8) snapTarget = null;
        return;
      }
      if (performance.now() - lastInput > 2500) return; // not a user scroll
      const top = section.getBoundingClientRect().top + window.scrollY;
      const len = section.offsetHeight - window.innerHeight;
      if (len <= 0) return;
      const p = (window.scrollY - top) / len;
      if (p <= 0.03 || p >= SNAP_TARGET) return;
      let target: number;
      if (dir >= 0) target = p > SNAP_THRESHOLD ? SNAP_TARGET : 0;
      else target = p < SNAP_TARGET - 0.08 ? 0 : SNAP_TARGET;
      snapTarget = top + target * len;
      window.scrollTo({ top: snapTarget, behavior: "smooth" });
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = Math.sign(y - lastY);
      lastY = y;
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, []);

  // An open country card disappears as soon as the page is scrolled
  useEffect(() => {
    if (!selectedCode) return;
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 24) setSelectedCode(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [selectedCode]);

  // Cards: prominent -> scale down & fade away
  const cardOpacity = useTransform(scrollYProgress, [0, 0.24], [1, 0]);
  const cardScale = useTransform(scrollYProgress, [0, 0.26], [1, 0.86]);
  const cardY = useTransform(scrollYProgress, [0, 0.26], [0, -60]);
  const cardPointerEvents = useTransform(scrollYProgress, (v): "auto" | "none" =>
    v < 0.2 ? "auto" : "none"
  );

  // Globe — desktop: behind-left (a bit lower) -> centred & dominant
  const globeScaleDesktop = useTransform(
    scrollYProgress,
    [0, 0.5, 0.74, 1],
    [DESKTOP_GLOBE_START_SCALE, DESKTOP_GLOBE_CENTER_SCALE, DESKTOP_GLOBE_CENTER_SCALE, DESKTOP_GLOBE_END_SCALE]
  );
  const globeXDesktop = useTransform(scrollYProgress, (v) => {
    const t = Math.min(1, Math.max(0, v / 0.5)); // 0 = hero, 1 = centred
    const scrollbarHalf =
      typeof window === "undefined"
        ? 0
        : (window.innerWidth - document.documentElement.clientWidth) / 2;
    return `calc(${-16 * (1 - t)}% + ${(scrollbarHalf + DESKTOP_GLOBE_CENTER_X_PX) * t}px)`;
  });
  const globeYDesktop = useTransform(scrollYProgress, (v) => {
    const t = Math.min(1, Math.max(0, v / 0.5));
    return `${DESKTOP_GLOBE_START_Y_PX * (1 - t) + DESKTOP_GLOBE_CENTER_Y_PX * t}px`;
  });
  // Globe — mobile: lower half hidden behind the bottom edge -> centred, whole globe visible
  const viewScaleMobile = useTransform(
    scrollYProgress,
    [0, 0.5, 0.74, 1],
    [MOBILE_GLOBE_START_SCALE, MOBILE_GLOBE_CENTER_SCALE, MOBILE_GLOBE_CENTER_SCALE, MOBILE_GLOBE_END_SCALE]
  );
  const viewYMobile = useTransform(scrollYProgress, [0, 0.5], [MOBILE_GLOBE_START_Y, MOBILE_GLOBE_CENTER_Y]);
  // read by the globe every frame (no React re-render while scrolling)
  const globeView = useRef({ scale: 1, y: 0 });
  useEffect(() => {
    const apply = () => {
      globeView.current = isMobile
        ? { scale: viewScaleMobile.get(), y: viewYMobile.get() }
        : { scale: 1, y: 0 };
    };
    apply();
    const u1 = viewScaleMobile.on("change", apply);
    const u2 = viewYMobile.on("change", apply);
    return () => {
      u1();
      u2();
    };
  }, [isMobile, viewScaleMobile, viewYMobile]);
  // The globe is not faded to nothing any more: the next section slides up over it,
  // so there is never an empty dark gap.
  const globeOpacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0.92, 1, 1, 0.5]);

  // Ticker (country list): arrives TOGETHER with the globe at the snap position
  // (progress 0.5), so no extra scrolling is needed to reach it.
  const tickerOpacity = useTransform(scrollYProgress, [0.3, 0.44, 0.7, 0.79], [0, 1, 1, 0]);
  const tickerY = useTransform(scrollYProgress, [0.3, 0.44], [26, 0]);
  const tickerPointerEvents = useTransform(scrollYProgress, (v): "auto" | "none" =>
    v > 0.38 && v < 0.78 ? "auto" : "none"
  );

  // Headline prompt above globe once cards are gone
  const promptOpacity = useTransform(scrollYProgress, [0.28, 0.42, 0.7, 0.79], [0, 1, 1, 0]);

  const { data } = useBootstrap();
  const featured = data?.featured ?? null;
  const countries = data?.countries ?? [];

  const markers = useMemo(
    () =>
      countries.map((c) => ({
        code: c.code,
        name: c.name,
        flag: c.flag,
        lat: c.latitude,
        lon: c.longitude,
        count: c.professionalCount,
      })),
    [countries]
  );

  // Today's featured professional first, then the upcoming ones
  const heroCards = useMemo<HeroCardData[]>(() => {
    if (!featured) return [];
    const p = featured.professional;
    const first: HeroCardData = {
      slug: p.slug,
      fullName: p.fullName,
      professionalTitle: p.professionalTitle,
      summary: p.summary,
      portraitUrl: p.portraitUrl,
      city: p.city,
      country: p.country,
      expertise: p.expertise,
      achievements: p.achievements ?? [],
      label: featured.label,
      date: featured.date,
    };
    const rest: HeroCardData[] = featured.upcoming
      .filter((u) => u.professional.slug !== p.slug)
      .map((u) => ({
        slug: u.professional.slug,
        fullName: u.professional.fullName,
        professionalTitle: u.professional.professionalTitle,
        summary: u.professional.summary,
        portraitUrl: u.professional.portraitUrl,
        city: u.professional.city,
        country: u.professional.country,
        expertise: u.professional.expertise,
        achievements: [],
        label: u.professional.featuredLabel ?? "Featured Professional",
        date: u.date,
      }));
    return [first, ...rest];
  }, [featured]);

  return (
    <section
      ref={sectionRef}
      className="globe-vignette relative h-[320vh]"
      aria-label="Featured professionals and interactive globe"
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        {/* Globe layer (touchable from the very start) */}
        <motion.div
          style={{
            // phone: the canvas always stays full-screen (no CSS scale/shift, which would
            // leave dark borders when zoomed); size + position are set inside the scene
            scale: isMobile ? 1 : globeScaleDesktop,
            x: isMobile ? 0 : globeXDesktop,
            y: isMobile ? 0 : globeYDesktop,
            opacity: globeOpacity,
          }}
          className="absolute inset-0 z-0 flex items-center justify-center"
        >
          {/* mobile: a square box so the whole sphere (and its glow) fits the width;
              desktop: the original big box */}
          <div className="h-svh w-screen max-w-none md:h-[110vh] md:w-[110vw]">
            {markers.length > 0 ? (
              <GlobeCanvas
                markers={markers}
                selectedCode={selectedCode}
                onSelectCountry={(code) => setSelectedCode(code)}
                // spinning the globe closes the open country card
                onInteract={() => setSelectedCode(null)}
                interactive
                controlRef={globeControl}
                viewRef={globeView}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div
                  className="h-72 w-72 animate-pulse rounded-full"
                  style={{
                    background: "radial-gradient(circle at 50% 38%, #172747 0%, #0B1530 72%)",
                    boxShadow: "0 0 90px rgba(23,39,71,.9)",
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Globe-dominant headline prompt */}
        <motion.div
          style={{ opacity: promptOpacity }}
          className="pointer-events-none absolute top-20 z-10 px-4 text-center sm:top-24"
        >
          <p className="eyebrow-light">Global Discovery</p>
          <h2 className="mt-2 font-heading text-xl font-bold text-white sm:text-2xl md:text-4xl">
            Explore professionals across{" "}
            <span className="text-gold-400">{countries.length} countries</span>
          </h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-navy-200">
            <ChevronDown className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span className="sm:hidden">Drag the globe, tap a country</span>
            <span className="hidden sm:inline">
              Drag the globe and select a country to discover its professionals
            </span>
          </p>
        </motion.div>

        {/* Featured professionals carousel */}
        <motion.article
          style={{ opacity: cardOpacity, scale: cardScale, y: cardY, pointerEvents: cardPointerEvents }}
          className="absolute z-20 mx-4 w-[calc(100%-2rem)] max-w-[560px] md:mx-0 md:w-[46%] md:max-w-[560px] lg:inset-y-0 lg:right-[6%] lg:my-auto lg:h-fit lg:w-[62%] lg:max-w-[880px] 2xl:max-w-[1100px]"
          aria-label="Featured professionals"
        >
          <HeroCarousel cards={heroCards} />
        </motion.article>

        {/* Zoom buttons (pinch with two fingers / Ctrl + wheel also work) */}
        <motion.div
          style={{ opacity: tickerOpacity, pointerEvents: tickerPointerEvents }}
          className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 sm:left-6"
        >
          <button
            type="button"
            onClick={() => globeControl.current?.zoomBy(1.4)}
            aria-label="Zoom in on the globe"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/50 bg-navy-950/80 text-gold-300 shadow-lg backdrop-blur transition-colors hover:bg-gold-500 hover:text-navy-900"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => globeControl.current?.zoomBy(1 / 1.4)}
            aria-label="Zoom out of the globe"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/50 bg-navy-950/80 text-gold-300 shadow-lg backdrop-blur transition-colors hover:bg-gold-500 hover:text-navy-900"
          >
            <Minus className="h-5 w-5" aria-hidden />
          </button>
        </motion.div>

        {/* Country discovery panel */}
        <CountryPanel code={selectedCode} onClose={() => setSelectedCode(null)} />

        {/* Country ticker */}
        <motion.div
          style={{ opacity: tickerOpacity, y: tickerY, pointerEvents: tickerPointerEvents }}
          className="absolute inset-x-0 bottom-6 z-20"
        >
          <CountryTicker
            countries={countries}
            activeCode={selectedCode}
            onSelect={(code) => setSelectedCode(code === selectedCode ? null : code)}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Country ticker                                                     */
/* ------------------------------------------------------------------ */

function CountryTicker({
  countries,
  activeCode,
  onSelect,
}: {
  countries: CountryDTO[];
  activeCode: string | null;
  onSelect: (code: string) => void;
}) {
  const withPros = countries.filter((c) => c.professionalCount > 0);
  const sorted = [...withPros].sort((a, b) => b.professionalCount - a.professionalCount);
  // marquee needs duplicated content
  const items = [...sorted, ...sorted];

  return (
    <div className="mx-auto max-w-6xl px-4" role="group" aria-label="Country navigation">
      <div className="rounded-2xl border border-navy-700/70 bg-navy-950/80 py-3 shadow-lg shadow-navy-950/60 backdrop-blur-md">
        <div className="flex overflow-hidden" aria-hidden={false}>
          <div className="ticker-track flex w-max items-center gap-2 pl-4">
            {items.map((c, i) => {
              const active = c.code === activeCode;
              return (
                <button
                  key={`${c.code}-${i}`}
                  type="button"
                  aria-label={`Show professionals from ${c.name}`}
                  onClick={() => onSelect(c.code)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    active
                      ? "border-gold-500 bg-gold-500 text-navy-900"
                      : "border-navy-600/80 text-navy-200 hover:border-gold-500/60 hover:text-gold-300"
                  )}
                >
                  <span aria-hidden>{c.flag}</span>{" "}
                  <span className="ml-1">{c.name}</span>
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                      active ? "bg-navy-900/15 text-navy-900" : "bg-navy-800/80 text-gold-400"
                    )}
                  >
                    {c.professionalCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-1.5 hidden text-center text-[10px] uppercase tracking-[0.25em] text-navy-300 sm:block">
          Click a country to rotate the globe and open its professionals
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Country discovery panel (floating right / bottom sheet on mobile)  */
/* ------------------------------------------------------------------ */

function CountryPanel({ code, onClose }: { code: string | null; onClose: () => void }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: country, isLoading } = useCountry(code);

  return (
    <>
      {/* Desktop floating panel */}
      <motion.aside
        initial={false}
        animate={{ opacity: code ? 1 : 0, x: code ? 0 : 40 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={cn(
          "absolute right-4 top-1/2 z-30 hidden w-[380px] -translate-y-1/2 lg:block lg:w-[460px] 2xl:w-[540px]",
          !code && "pointer-events-none"
        )}
        aria-label="Country discovery panel"
      >
        <div className="max-h-[74vh] overflow-hidden rounded-2xl border border-navy-600/80 bg-navy-950/92 lg:max-h-[82vh] shadow-2xl shadow-navy-950/80 backdrop-blur-xl">
          <PanelContent
            code={code}
            country={country ?? null}
            isLoading={isLoading && !!code}
            onClose={onClose}
            onAll={(c) => navigate({ name: "discover", country: c })}
          />
        </div>
      </motion.aside>

      {/* Mobile bottom sheet */}
      <motion.div
        initial={false}
        animate={{ y: code ? 0 : "110%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 lg:hidden",
          !code && "pointer-events-none"
        )}
      >
        <div className="mx-3 mb-3 max-h-[64vh] overflow-hidden rounded-2xl border border-navy-600/80 bg-navy-950/97 shadow-2xl backdrop-blur-xl">
          <PanelContent
            code={code}
            country={country ?? null}
            isLoading={isLoading && !!code}
            onClose={onClose}
            onAll={(c) => navigate({ name: "discover", country: c })}
          />
        </div>
      </motion.div>
    </>
  );
}

function PanelContent({
  code,
  country,
  isLoading,
  onClose,
  onAll,
}: {
  code: string | null;
  country: { code: string; name: string; flag: string; professionals: { slug: string; fullName: string; professionalTitle: string; portraitUrl: string; expertise: { name: string }[] }[] } | null;
  isLoading: boolean;
  onClose: () => void;
  onAll: (code: string) => void;
}) {
  if (!code) return null;

  return (
    <div className="flex max-h-[74vh] flex-col lg:max-h-[82vh]">
      <div className="flex items-start justify-between gap-3 border-b border-navy-700/70 p-4 lg:p-5">
        <div>
          {isLoading || !country ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 bg-navy-800" />
              <Skeleton className="h-4 w-24 bg-navy-800" />
            </div>
          ) : (
            <>
              <h3 className="font-heading text-lg font-bold text-white lg:text-2xl">
                <span aria-hidden className="mr-2">
                  {country.flag}
                </span>
                {country.name}
              </h3>
              <p className="mt-0.5 text-xs text-navy-200 lg:text-sm">
                {country.professionals.length}{" "}
                {country.professionals.length === 1 ? "professional" : "professionals"} listed
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-navy-600 text-navy-200 transition-colors hover:border-gold-500/60 hover:text-gold-400"
          aria-label="Close country panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="scrollbar-elegant min-h-0 flex-1 space-y-2 overflow-y-auto p-3 lg:space-y-3 lg:p-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-navy-800/80" />
          ))}
        {!isLoading && country && country.professionals.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Compass className="mx-auto h-8 w-8 text-gold-500/70" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-white">Coming soon</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-200">
              No professionals from {country.name} have been featured yet. Check back as our
              editorial team expands coverage.
            </p>
          </div>
        )}
        {!isLoading &&
          country &&
          country.professionals.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => {
                onClose();
                useAppStore.getState().navigate({ name: "profile", slug: p.slug });
              }}
              className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left lg:gap-4 lg:p-3 transition-colors hover:border-navy-600 hover:bg-navy-800/50"
            >
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-navy-800 lg:h-24 lg:w-20">
                <Image
                  src={p.portraitUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1023px) 56px, 96px"
                  className="object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white group-hover:text-gold-300 lg:text-lg">
                  {p.fullName}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-navy-200 lg:text-sm">
                  {p.professionalTitle}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.expertise.slice(0, 2).map((e) => (
                    <span
                      key={e.name}
                      className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-semibold text-gold-300 lg:px-2.5 lg:text-xs"
                    >
                      {e.name}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-navy-400 transition-colors group-hover:text-gold-400 lg:h-5 lg:w-5"
                aria-hidden
              />
            </button>
          ))}
      </div>

      {!isLoading && country && (
        <div className="border-t border-navy-700/70 p-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full border-gold-500/50 bg-transparent text-gold-300 hover:bg-gold-500/10 hover:text-gold-400 lg:h-11 lg:text-base"
            onClick={() => onAll(country.code)}
          >
            View all professionals in {country.name}
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats band                                                         */
/* ------------------------------------------------------------------ */

function StatsBand() {
  const { data } = useBootstrap();
  const stats = [
    { value: data?.stats.professionals ?? "—", label: "Featured professionals" },
    { value: data?.stats.countries ?? "—", label: "Countries represented" },
    { value: data?.stats.expertise ?? "—", label: "Areas of expertise" },
    { value: data?.stats.stories ?? "—", label: "Editorial stories" },
  ];
  return (
    <section className="border-b border-border bg-warmwhite" aria-label="Platform statistics">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-heading text-3xl font-extrabold text-navy-900 md:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Expertise discovery                                                */
/* ------------------------------------------------------------------ */

const CLUSTER_META: Record<string, { icon: typeof Cpu; blurb: string }> = {
  Technology: { icon: Cpu, blurb: "AI, data, security, and the systems powering the digital world." },
  Business: { icon: TrendingUp, blurb: "Founders, strategists, and leaders building organizations of consequence." },
  "Science & Research": { icon: FlaskConical, blurb: "Researchers and innovators expanding the frontier of knowledge." },
  Creative: { icon: Palette, blurb: "Designers and architects crafting how we live, work, and experience." },
  Finance: { icon: Landmark, blurb: "Investors and economists stewarding capital and markets." },
};

function ExpertiseSection() {
  const navigate = useAppStore((s) => s.navigate);
  const { data } = useBootstrap();
  const tree = data?.expertiseTree ?? [];

  const clusterMap = useMemo(() => {
    const map = new Map<string, typeof tree>();
    for (const e of tree) {
      if (e.children.length === 0 && e.professionalCount === 0) continue;
      const list = map.get(e.cluster) ?? [];
      list.push(e);
      map.set(e.cluster, list);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }, [tree]);

  return (
    <section className="bg-background py-14 sm:py-20 md:py-28" aria-label="Expertise discovery">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Expertise Discovery"
          title="Explore mastery across five domains"
          description="From artificial intelligence to architecture — navigate a curated hierarchy of expertise and meet the professionals defining each field."
          action={
            <Button
              variant="outline"
              className="border-navy-700 text-navy-800 hover:bg-navy-50"
              onClick={() => navigate({ name: "expertise-directory" })}
            >
              Browse full directory
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          }
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {clusterMap.map((cluster) => {
            const meta = CLUSTER_META[cluster.name] ?? CLUSTER_META.Technology;
            const Icon = meta.icon;
            return (
              <div
                key={cluster.name}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/5 md:p-7"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 bg-gold-100/60">
                    <Icon className="h-5 w-5 text-gold-600" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-navy-900">{cluster.name}</h3>
                    <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {cluster.items.map((e) => (
                    <button
                      key={e.slug}
                      type="button"
                      onClick={() => navigate({ name: "expertise", slug: e.slug })}
                      className="group/pill flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-semibold text-navy-800 transition-all duration-200 hover:border-gold-500 hover:bg-navy-900 hover:text-gold-300"
                    >
                      {e.name}
                      <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-bold text-navy-700 group-hover/pill:bg-navy-800 group-hover/pill:text-gold-400">
                        {e.professionalCount}
                      </span>
                    </button>
                  ))}
                </div>
                {cluster.items.some((c) => c.children.length > 0) && (
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Includes sub-specialties:{" "}
                    {cluster.items
                      .flatMap((c) => c.children.map((s) => s.name))
                      .slice(0, 5)
                      .join(" · ")}
                    …
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Industry discovery                                                 */
/* ------------------------------------------------------------------ */

function IndustrySection() {
  const navigate = useAppStore((s) => s.navigate);
  const { data } = useBootstrap();
  const industries = data?.industries ?? [];

  return (
    <section className="bg-navy-950 py-14 sm:py-20 md:py-28" aria-label="Industry discovery">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          tone="light"
          eyebrow="Industry Discovery"
          title="Twelve industries. One global standard."
          description="Explore exceptional professionals by the sectors they transform."
          action={
            <Button
              variant="outline"
              className="border-navy-500 bg-navy-800 text-white hover:border-white hover:bg-white hover:text-black dark:bg-navy-800 dark:hover:bg-white"
              onClick={() => navigate({ name: "industry-directory" })}
            >
              All industries
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          }
        />
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <button
              key={ind.slug}
              type="button"
              onClick={() => navigate({ name: "industry", slug: ind.slug })}
              className="group flex items-center justify-between gap-4 rounded-xl border border-navy-700/70 bg-navy-900/60 px-5 py-4 text-left transition-all duration-300 hover:border-gold-500/60 hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-gold-500"
              style={{ transitionDelay: `${i * 12}ms` }}
            >
              <div className="min-w-0">
                <h3 className="font-heading text-base font-bold text-white group-hover:text-gold-300">
                  {ind.name}
                </h3>
                <p className="mt-0.5 text-xs text-navy-300">
                  {ind.professionalCount}{" "}
                  {ind.professionalCount === 1 ? "professional" : "professionals"}
                </p>
              </div>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-navy-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-400"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Collections preview                                                */
/* ------------------------------------------------------------------ */

function CollectionsSection() {
  const navigate = useAppStore((s) => s.navigate);
  const { data } = useBootstrap();
  const collections = data?.collections.slice(0, 3) ?? [];

  return (
    <section className="bg-background py-14 sm:py-20 md:py-28" aria-label="Curated collections">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Curated Collections"
          title="Exceptional people, thoughtfully grouped"
          description="Editorial selections and rankings — from 30 Under 30 to Global AI Leaders — curated by our editorial team."
          action={
            <Button
              variant="outline"
              className="border-navy-700 text-navy-800 hover:bg-navy-50"
              onClick={() => navigate({ name: "collections" })}
            >
              View all collections
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          }
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {collections.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => navigate({ name: "collection", slug: c.slug })}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy-900">
                {c.coverUrl && (
                  <Image
                    src={c.coverUrl}
                    alt={`Cover for ${c.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-900">
                    {c.kind === "ranking" ? "Ranking" : "Editorial"}
                  </span>
                  <span className="text-xs font-semibold text-white/90">
                    {c.memberCount} members
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading text-lg font-bold leading-snug text-navy-900 group-hover:text-navy-700">
                  {c.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {c.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2.5">
                    {c.members.slice(0, 5).map((m) => (
                      <span
                        key={m.slug}
                        className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-card bg-navy-800"
                      >
                        <Image
                          src={m.portraitUrl}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover object-top"
                        />
                      </span>
                    ))}
                  </div>
                  {c.members.length > 5 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      +{c.members.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Magazine preview                                                   */
/* ------------------------------------------------------------------ */

function StorySquareCard({ story: st }: { story: StoryCardDTO }) {
  const navigate = useAppStore((x) => x.navigate);
  return (
    <button
      type="button"
      onClick={() => navigate({ name: "story", slug: st.slug })}
      className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-navy-900 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10"
    >
      {st.coverUrl && (
        <Image
          src={st.coverUrl}
          alt={`Cover image for ${st.title}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-navy-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400 backdrop-blur-sm">
        {st.category}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex flex-col p-5 sm:p-6">
        <h3 className="line-clamp-3 font-heading text-lg font-bold leading-snug text-white sm:text-xl">
          {st.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-100/90">{st.subtitle}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-navy-200">
          <span>{formatDate(st.publicationDate)}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {st.readingMinutes} min
            <ArrowUpRight
              className="h-3.5 w-3.5 text-gold-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </button>
  );
}

function MagazineSection() {
  const navigate = useAppStore((s) => s.navigate);
  const { data } = useBootstrap();
  const stories = data?.stories ?? [];

  if (stories.length === 0) return null;

  return (
    <section className="bg-warmwhite py-14 sm:py-20 md:py-28" aria-label="Stories and magazine">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Stories & Magazine"
          title="The people behind the work"
          description="Interviews, leadership features, and industry insights — every story connected to the professionals behind them."
          action={
            <Button
              variant="outline"
              className="border-navy-700 text-navy-800 hover:bg-navy-50"
              onClick={() => navigate({ name: "magazine" })}
            >
              Visit the Magazine
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          }
        />
        {/* equal square cards; with fewer stories the remaining cells simply stay empty */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.slice(0, 3).map((st) => (
            <StorySquareCard key={st.slug} story={st} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA band                                                           */
/* ------------------------------------------------------------------ */

function CtaSection() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <section className="relative overflow-hidden bg-navy-950 py-14 sm:py-20 md:py-28" aria-label="Get featured call to action">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(38,59,96,0.5) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(198,169,107,0.12) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="eyebrow-light">Get Featured</p>
        <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-5xl">
          The world is looking for what makes you{" "}
          <span className="text-gold-400">exceptional</span>.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-navy-200 md:text-lg">
          SkilledSphere is not another place to post about yourself. It is a place where the
          world discovers you — through editorially curated profiles and stories.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400 sm:w-auto"
            onClick={() => navigate({ name: "get-featured" })}
          >
            <Sparkles className="mr-2 h-4 w-4" aria-hidden />
            Apply to Get Featured
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-navy-500 bg-navy-800 text-white hover:border-white hover:bg-white hover:text-black dark:bg-navy-800 dark:hover:bg-white sm:w-auto"
            onClick={() => navigate({ name: "discover" })}
          >
            <Compass className="mr-2 h-4 w-4" aria-hidden />
            Discover Professionals
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Home view                                                          */
/* ------------------------------------------------------------------ */

export function HomeView() {
  const { isLoading } = useBootstrap();
  return (
    <div className="flex-1">
      <GlobeExperience />
      {/* Everything below the globe is inside ONE layer that slides up over the
          globe section (otherwise the sticky globe paints on top of the sections
          that follow the stats band and leaves a hole). */}
      <div
        className="relative z-10 overflow-hidden rounded-t-3xl bg-warmwhite shadow-[0_-24px_60px_rgba(6,13,33,0.55)]"
        style={{ marginTop: `-${NEXT_SECTION_PULL_UP_VH}vh` }}
      >
        <StatsBand />
        <ExpertiseSection />
        <IndustrySection />
        <CollectionsSection />
        <MagazineSection />
        <CtaSection />
      </div>
      {isLoading && (
        <div className="flex items-center justify-center gap-2 bg-navy-950 py-4 text-navy-200" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-gold-400" aria-hidden />
          <span className="text-xs uppercase tracking-[0.2em]">Loading SkilledSphere…</span>
        </div>
      )}
    </div>
  );
}