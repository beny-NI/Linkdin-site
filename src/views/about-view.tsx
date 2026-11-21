"use client";

import { motion } from "framer-motion";
import { Compass, Handshake, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { useAppStore } from "@/lib/store";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const pillars = [
  {
    icon: Compass,
    title: "Professional Discovery",
    description:
      "Helping companies, organizations, investors, and individuals discover professionals based on expertise, industry, achievements, and geography.",
  },
  {
    icon: Newspaper,
    title: "Editorial Media",
    description:
      "Professionally curated profiles, interviews, success stories, leadership features, and industry insights.",
  },
  {
    icon: Handshake,
    title: "Professional Networking",
    description:
      "Creating opportunities for professionals and organizations to discover each other and establish meaningful business connections.",
  },
];

const principles = [
  {
    number: "01",
    title: "Curated, not crowdsourced",
    description: "Every profile is reviewed by our editorial team before publication.",
  },
  {
    number: "02",
    title: "Global by default",
    description: "We cover professionals from every region, with no geographic bias.",
  },
  {
    number: "03",
    title: "Editorial integrity",
    description: "We tell professional stories with depth and accuracy, never sponsored rankings.",
  },
  {
    number: "04",
    title: "Privacy and dignity",
    description: "We present achievements, not metrics of popularity.",
  },
];

const stats = [
  { value: "24+", label: "Featured Professionals" },
  { value: "22", label: "Countries" },
  { value: "27", label: "Areas of Expertise" },
  { value: "12", label: "Industries" },
];

export function AboutView() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-navy-950 px-4 pb-20 pt-28 sm:px-6 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp}>
            <p className="eyebrow-light">About SkilledSphere</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Not another network. A place where the world discovers what makes
              you exceptional.
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-navy-200">
              SkilledSphere is a curated global professional discovery platform
              and editorial magazine. We introduce exceptional professionals,
              experts, researchers, entrepreneurs, and leaders across industries
              worldwide. We are not a social network: there are no likes, no
              follower counts, and no activity feeds — every profile is
              editorially curated.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand message pull-quote */}
      <section className="bg-background px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <div className="gold-hairline mx-auto w-24" aria-hidden="true" />
            <blockquote className="mt-10 font-heading text-3xl font-bold leading-snug tracking-tight text-navy-900 md:text-4xl">
              &ldquo;Discover the People Shaping What&rsquo;s Next.&rdquo;
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-background px-4 pb-20 sm:px-6 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="What we do"
            title="Three missions, one standard"
            description="SkilledSphere combines a discovery engine, an editorial magazine, and a trusted meeting point for the world's professionals."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pillars.map((pillar, i) => (
              <motion.article
                key={pillar.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/60 bg-gold-100/50 text-gold-600">
                  <pillar.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-navy-900">
                  {pillar.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial principles */}
      <section className="bg-navy-950 px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Our editorial principles"
            title="How we decide who is featured"
            description="Our editorial standards define everything that appears on SkilledSphere."
            tone="light"
          />
          <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-14">
            {principles.map((principle, i) => (
              <motion.article
                key={principle.number}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="flex gap-6"
              >
                <span
                  aria-hidden="true"
                  className="font-heading text-5xl font-extrabold leading-none text-gold-500/40"
                >
                  {principle.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-navy-200">
                    {principle.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* The numbers */}
      <section className="border-b border-border bg-background px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The numbers"
            title="A growing global sphere"
            align="center"
          />
          <dl className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="text-center"
              >
                <dd className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <motion.h2
            {...fadeUp}
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Think you belong on SkilledSphere?
          </motion.h2>
          <motion.div {...fadeUp}>
            <Button
              size="lg"
              className="bg-gold-500 font-semibold text-navy-950 hover:bg-gold-400"
              onClick={() => navigate({ name: "get-featured" })}
            >
              Get Featured
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
