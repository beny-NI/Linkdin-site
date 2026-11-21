"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CountryDTO {
  code: string;
  name: string;
  flag: string;
  latitude: number;
  longitude: number;
  professionalCount: number;
}

interface IndustryDTO {
  slug: string;
  name: string;
  description: string | null;
  professionalCount: number;
}

const URL_PATTERN = /^https?:\/\/[^\s.]+\.\S+$/i;

const optionalUrlField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || URL_PATTERN.test(v), {
      message: `Please enter a valid ${label} URL (including http:// or https://).`,
    });

const applicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your full name.")
    .max(120, "Name is too long."),
  professionalTitle: z
    .string()
    .min(2, "Please enter your professional title.")
    .max(160, "Title is too long."),
  email: z.string().email("Please enter a valid email address."),
  countryCode: z
    .string()
    .refine((v) => v.length === 2, { message: "Please select your country." }),
  industry: z
    .string()
    .refine((v) => v.length >= 2, { message: "Please select your industry." }),
  expertise: z
    .array(z.string().min(1).max(80))
    .max(12, "You can add up to 12 areas of expertise."),
  biography: z
    .string()
    .min(40, "Please write at least 40 characters.")
    .max(6000, "Biography is too long (max. 6000 characters)."),
  linkedinUrl: optionalUrlField("LinkedIn"),
  websiteUrl: optionalUrlField("website"),
  photoUrl: optionalUrlField("photo"),
  achievements: z
    .array(z.string().min(1).max(300))
    .max(10, "You can add up to 10 achievements."),
  supportingLinks: z
    .array(z.string().url("Supporting links must be valid URLs."))
    .max(8, "You can add up to 8 supporting links."),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

/* -------------------------------------------------------------------------- */
/* Chips input                                                                */
/* -------------------------------------------------------------------------- */

interface ChipsInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  placeholder: string;
  ariaLabel: string;
  urlOnly?: boolean;
}

function ChipsInput({
  id,
  value,
  onChange,
  max,
  placeholder,
  ariaLabel,
  urlOnly = false,
}: ChipsInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addDraft = () => {
    const trimmed = draft.trim().replace(/,+$/, "");
    if (!trimmed) return;
    if (urlOnly && !URL_PATTERN.test(trimmed)) {
      setError("Please enter a valid URL (including http:// or https://).");
      return;
    }
    if (value.length >= max) {
      setError(`You can add up to ${max} items.`);
      return;
    }
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
        {value.map((chip, index) => (
          <span
            key={chip}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-gold-500/50 bg-gold-100/60 py-1 pl-3 pr-1.5 text-xs font-medium text-navy-900"
          >
            <span className="truncate">{chip}</span>
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-100 hover:text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
          disabled={value.length >= max}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label={ariaLabel}
          className="min-w-[10rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <span className="text-xs text-muted-foreground">
            Press Enter or comma to add
          </span>
        )}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {value.length} / {max}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

const steps = [
  {
    icon: Plus,
    title: "Submit your profile",
    description: "Share your expertise, achievements, and story with us.",
  },
  {
    icon: Search,
    title: "Editorial review",
    description: "Our editorial team reviews and verifies every submission.",
  },
  {
    icon: ClipboardCheck,
    title: "Curated publication",
    description: "Approved profiles are curated and published by our editors.",
  },
];

export function GetFeaturedView() {
  const { toast } = useToast();
  const navigate = useAppStore((s) => s.navigate);

  const [countries, setCountries] = useState<CountryDTO[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [industries, setIndustries] = useState<IndustryDTO[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      professionalTitle: "",
      email: "",
      countryCode: "",
      industry: "",
      expertise: [],
      biography: "",
      linkedinUrl: "",
      websiteUrl: "",
      photoUrl: "",
      achievements: [],
      supportingLinks: [],
    },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/countries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load countries");
        return res.json() as Promise<CountryDTO[]>;
      })
      .then((data) => {
        if (!cancelled) setCountries(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Could not load countries",
            description: "Please refresh the page and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/industries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load industries");
        return res.json() as Promise<IndustryDTO[]>;
      })
      .then((data) => {
        if (!cancelled) setIndustries(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Could not load industries",
            description: "Please refresh the page and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIndustriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const setFieldError = (field: string, message: string) => {
    if (field in applicationSchema.shape) {
      form.setError(field as FieldPath<ApplicationFormValues>, { message });
    }
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          linkedinUrl: values.linkedinUrl ?? "",
          websiteUrl: values.websiteUrl ?? "",
          photoUrl: values.photoUrl ?? "",
        }),
      });

      if (res.status === 201) {
        const data = (await res.json()) as { id?: string };
        setSuccess(data.id ?? null);
        toast({
          title: "Application received",
          description:
            "Our editorial team will review your submission. (Demo — no live review notifications are sent.)",
        });
        return;
      }

      if (res.status === 422) {
        const data = (await res.json()) as {
          details?: Record<string, string[]>;
        };
        toast({
          variant: "destructive",
          title: "Please check the highlighted fields.",
          description: "Some entries need your attention before we can continue.",
        });
        if (data.details) {
          for (const [field, messages] of Object.entries(data.details)) {
            if (messages && messages.length > 0) {
              setFieldError(field, messages[0]);
            }
          }
        }
        return;
      }

      throw new Error(`Unexpected response status: ${res.status}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong. Please try again.",
        description: "Your application was not submitted.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-navy-950 px-4 pb-16 pt-24 sm:px-6 md:pb-20 md:pt-32">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp}>
            <p className="eyebrow-light">Get Featured</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Introduce yourself to the world.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-navy-200">
              Every submission enters our administrative review workflow. The
              editorial team approves and curates every profile before it is
              published — submitting does not automatically publish a public
              profile.
            </p>
          </motion.div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-navy-800 bg-navy-900/60 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/50 bg-navy-950 text-gold-400">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                    Step {i + 1}
                  </span>
                </div>
                <h2 className="mt-4 font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-navy-200">
                  {step.description}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Form / success */}
      <section className="bg-background px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          {success !== null ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm md:p-12"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/60 bg-gold-100/60 text-gold-600">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="mt-8 text-3xl font-bold tracking-tight text-navy-900">
                Application received
              </h2>
              <div className="gold-hairline mx-auto mt-6 w-24" aria-hidden="true" />
              <p className="mx-auto mt-6 max-w-md leading-relaxed text-muted-foreground">
                Thank you for introducing yourself. Our editorial team will
                review your submission as part of the curation workflow — if
                your profile is selected, we will reach out before anything is
                published.
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                This is a demonstration environment, so no confirmation email
                will be sent.
              </p>
              <Button
                size="lg"
                className="mt-8 bg-gold-500 font-semibold text-navy-950 hover:bg-gold-400"
                onClick={() => navigate({ name: "home" })}
              >
                Return home
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </motion.div>
          ) : (
            <motion.div {...fadeUp}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid gap-6"
                    aria-label="Get featured application form"
                    noValidate
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Amara Okafor"
                                autoComplete="name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="professionalTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Aerospace Systems Engineer"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger disabled={countriesLoading}>
                                  {countriesLoading ? (
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                      />
                                      Loading countries&hellip;
                                    </span>
                                  ) : (
                                    <SelectValue placeholder="Select your country" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-72">
                                {countries.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <span className="flex items-center gap-2">
                                      <span aria-hidden="true">{country.flag}</span>
                                      {country.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Industry</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger disabled={industriesLoading}>
                                  {industriesLoading ? (
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                      />
                                      Loading industries&hellip;
                                    </span>
                                  ) : (
                                    <SelectValue placeholder="Select your industry" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-72">
                                {industries.map((industry) => (
                                  <SelectItem key={industry.slug} value={industry.name}>
                                    {industry.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="expertise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Areas of expertise</FormLabel>
                          <FormControl>
                            <ChipsInput
                              id="expertise-input"
                              value={field.value}
                              onChange={field.onChange}
                              max={12}
                              placeholder="e.g. Machine Learning, Renewable Energy"
                              ariaLabel="Add an area of expertise"
                            />
                          </FormControl>
                          <FormDescription>
                            Add up to 12 areas of expertise, one by one.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional biography</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={7}
                              placeholder="Tell us about your career, achievements, and what makes your work exceptional"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Tell us about your career, achievements, and what
                            makes your work exceptional (min. 40 characters).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              LinkedIn URL{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://linkedin.com/in/…"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Personal website{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://yourdomain.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="photoUrl"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>
                              Profile photo URL{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://example.com/portrait.jpg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Link to a high-resolution professional portrait.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="achievements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Selected achievements{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <ChipsInput
                              id="achievements-input"
                              value={field.value}
                              onChange={field.onChange}
                              max={10}
                              placeholder="e.g. Led the design of an award-winning satellite"
                              ariaLabel="Add an achievement"
                            />
                          </FormControl>
                          <FormDescription>
                            Your most notable achievements, one by one.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supportingLinks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Supporting links{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <ChipsInput
                              id="supporting-links-input"
                              value={field.value}
                              onChange={field.onChange}
                              max={8}
                              placeholder="https://example.com/press-coverage"
                              ariaLabel="Add a supporting link"
                              urlOnly
                            />
                          </FormControl>
                          <FormDescription>
                            Links that support your story — publications, press
                            coverage, talks, portfolios.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe2 className="h-4 w-4 text-gold-600" aria-hidden="true" />
                        Reviewed by our editorial team worldwide.
                      </p>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitting}
                        className={cn(
                          "bg-gold-500 font-semibold text-navy-950 hover:bg-gold-400",
                          submitting && "cursor-not-allowed opacity-80"
                        )}
                      >
                        {submitting ? (
                          <>
                            <Loader2
                              className="mr-2 h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            Submitting…
                          </>
                        ) : (
                          "Submit application"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
