import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024; // the largest valid payload is far below this
const HOURLY_LIMIT_PER_IP = 5;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  professionalTitle: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  countryCode: z.string().length(2),
  industry: z.string().min(2).max(80),
  expertise: z.array(z.string().min(1).max(80)).max(12),
  biography: z.string().trim().min(40).max(6000),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
  achievements: z.array(z.string().min(1).max(300)).max(10),
  supportingLinks: z.array(z.string().url()).max(8),
  // Honeypot: the form renders this field hidden. Humans leave it empty, bots fill it.
  company_website: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // 1) rate limit per IP
  const rl = rateLimit(`applications:${clientIp(req)}`, HOURLY_LIMIT_PER_IP, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  // 2) body size guard
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // 3) honeypot tripped -> pretend success, store nothing (don't teach bots anything)
  if (data.company_website) {
    return NextResponse.json({ success: true, id: "ok", status: "pending" }, { status: 201 });
  }

  // verify the country exists in our registry
  const country = await db.country.findUnique({ where: { code: data.countryCode.toUpperCase() } });
  if (!country) {
    return NextResponse.json({ error: "Unknown country code" }, { status: 422 });
  }

  // 4) no duplicate spam from the same email within 24h
  const duplicate = await db.featuredApplication.findFirst({
    where: { email: data.email, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "An application with this email was already received in the last 24 hours." },
      { status: 409 }
    );
  }

  const application = await db.featuredApplication.create({
    data: {
      fullName: data.fullName,
      professionalTitle: data.professionalTitle,
      email: data.email,
      countryCode: country.code,
      industry: data.industry,
      expertise: JSON.stringify(data.expertise),
      biography: data.biography,
      linkedinUrl: data.linkedinUrl || null,
      websiteUrl: data.websiteUrl || null,
      photoUrl: data.photoUrl || null,
      achievements: JSON.stringify(data.achievements),
      supportingLinks: JSON.stringify(data.supportingLinks),
      status: "pending",
    },
  });

  return NextResponse.json(
    { success: true, id: application.id, status: application.status },
    { status: 201 }
  );
}
