import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GitBranch,
  MessageSquare,
  Radio,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Shared Team Inbox",
    description:
      "Manage every customer WhatsApp conversation in one place with agent assignment, internal notes, and real-time status.",
  },
  {
    icon: GitBranch,
    title: "Visual Sales Pipelines",
    description:
      "Track leads from first chat to closed deal using Kanban pipelines linked directly to contact conversations.",
  },
  {
    icon: Radio,
    title: "Template Broadcasts",
    description:
      "Send Meta-approved template campaigns with recipient variables, delivery tracking, and read receipts.",
  },
  {
    icon: Workflow,
    title: "Automations & Flows",
    description:
      "Build multi-step chat flows, keyword triggers, wait steps, and conditional routing without writing code.",
  },
  {
    icon: Bot,
    title: "AI Reply Assistant",
    description:
      "Draft instant context-aware replies or enable knowledge-base auto-replies using your own AI provider key.",
  },
  {
    icon: Users,
    title: "Role-Based Team Access",
    description:
      "Invite teammates with Owner, Admin, Agent, and Viewer permissions plus REST API and webhook integrations.",
  },
];

export default async function HomePage() {
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch {
    isAuthenticated = false;
  }

  return (
    <PublicShell isAuthenticated={isAuthenticated}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
        >
          <div className="h-80 w-[44rem] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-primary/20" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Meta WhatsApp Business Cloud API CRM
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-[1.12]">
              Turn WhatsApp Conversations into{" "}
              <span className="text-emerald-400">Organized Revenue</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              ChatStack WhatsApp CRM brings your shared team inbox, customer
              contacts, sales pipelines, template broadcasts, and AI-assisted
              automations into one fast workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  Open Your Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                  >
                    Sign in to CRM
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <Link
                href="/contact"
                className="inline-flex h-11 items-center px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact Support
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                AES-256-GCM Token Encryption
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                HMAC-Verified Meta Webhooks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Multi-Agent Role Controls
              </span>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    Workspace Hub
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    ChatStack WhatsApp CRM
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  Live
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    label: "Shared Inbox & Agent Routing",
                    status: "Real-time",
                  },
                  {
                    label: "Contacts, Tags & Custom Fields",
                    status: "Ready",
                  },
                  {
                    label: "Broadcasts & Approved Templates",
                    status: "Meta API",
                  },
                  {
                    label: "Visual Flows & Wait Automations",
                    status: "Scheduled",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3"
                  >
                    <span className="text-sm text-foreground">{row.label}</span>
                    <span className="text-xs font-medium text-emerald-400">
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Already have a workspace?</span>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/login"}
                  className="font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  {isAuthenticated ? "Go to Dashboard →" : "Sign in now →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything Your WhatsApp Team Needs
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Built on the official Meta WhatsApp Business Cloud API for reliable
            messaging, structured customer tracking, and automated workflows.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-emerald-500/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Trust / Contact Banner */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Need help or have questions about data & privacy?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review our Privacy Policy, Terms of Service, or reach our team at{" "}
              <span className="text-foreground">noreply@chatstack.cloud</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
