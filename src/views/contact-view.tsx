"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Handshake, Mail, MapPin, Newspaper, PenLine } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ContactFormValues {
  name: string;
  email: string;
  topic: string;
  message: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const contactChannels = [
  {
    icon: PenLine,
    label: "Editorial",
    value: "editors@skilledsphere.example",
    href: "mailto:editors@skilledsphere.example",
  },
  {
    icon: Handshake,
    label: "Partnerships",
    value: "partners@skilledsphere.example",
    href: "mailto:partners@skilledsphere.example",
  },
  {
    icon: Newspaper,
    label: "Press",
    value: "press@skilledsphere.example",
    href: "mailto:press@skilledsphere.example",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function ContactView() {
  const { toast } = useToast();
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (field: keyof ContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): ContactFormErrors => {
    const next: ContactFormErrors = {};
    if (values.name.trim().length < 2) {
      next.name = "Please enter your name.";
    }
    if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!values.topic) {
      next.topic = "Please select a topic.";
    }
    if (values.message.trim().length < 10) {
      next.message = "Please write a short message (at least 10 characters).";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    // Demo submission: no email is actually sent.
    setSubmitted(true);
    setValues({ name: "", email: "", topic: "", message: "" });
    toast({
      title: "Message sent",
      description:
        "We'll be in touch within 5 business days. (Demo only — no email is actually sent.)",
    });
  };

  return (
    <div className="flex-1 bg-background">
      {/* Hero */}
      <section className="px-4 pb-12 pt-24 sm:px-6 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp}>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy-900 md:text-5xl">
              Let&rsquo;s talk.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Whether you have an editorial submission, a partnership in mind, a
              press request, or a general inquiry — we would love to hear from
              you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-20 sm:px-6 md:pb-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          {/* Left: channels */}
          <motion.div {...fadeUp} className="flex flex-col gap-4">
            {contactChannels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/60 bg-gold-100/50 text-gold-600 transition-colors group-hover:bg-gold-100">
                  <channel.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {channel.label}
                  </span>
                  <span className="mt-1 block font-medium text-navy-900">
                    {channel.value}
                  </span>
                </span>
              </a>
            ))}

            <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/60 bg-gold-100/50 text-gold-600">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <span className="block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Offices
                </span>
                <span className="mt-1 block font-medium text-navy-900">
                  Editorial HQ — London &middot; Z&uuml;rich &middot; Singapore
                </span>
              </div>
            </div>

            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
              We review every submission and respond within 5 business days.
            </p>
          </motion.div>

          {/* Right: form */}
          <motion.div {...fadeUp}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
              {submitted ? (
                <Alert className="border-gold-500/50 bg-gold-100/40">
                  <CheckCircle2 className="h-5 w-5 text-gold-600" aria-hidden="true" />
                  <AlertTitle>Message sent</AlertTitle>
                  <AlertDescription className="mt-2">
                    Thank you for reaching out — we&rsquo;ll be in touch within
                    5 business days. This is a demo form; no email is actually
                    sent.
                  </AlertDescription>
                </Alert>
              ) : null}

              <form
                onSubmit={handleSubmit}
                noValidate
                className={submitted ? "mt-8" : undefined}
                aria-label="Contact form"
              >
                <div className="grid gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        value={values.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="Your full name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                      />
                      {errors.name && (
                        <p id="contact-name-error" className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={values.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="you@example.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                      />
                      {errors.email && (
                        <p id="contact-email-error" className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-topic">Topic</Label>
                    <Select value={values.topic} onValueChange={(v) => setField("topic", v)}>
                      <SelectTrigger id="contact-topic" aria-invalid={!!errors.topic}>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editorial">Editorial</SelectItem>
                        <SelectItem value="get-featured">Get Featured</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="press">Press</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.topic && (
                      <p className="text-sm text-destructive">{errors.topic}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      value={values.message}
                      onChange={(e) => setField("message", e.target.value)}
                      placeholder="How can we help?"
                      rows={6}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="text-sm text-destructive">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Button
                      type="submit"
                      className="bg-gold-500 font-semibold text-navy-950 hover:bg-gold-400"
                    >
                      Send message
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
