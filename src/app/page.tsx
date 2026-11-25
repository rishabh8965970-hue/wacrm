import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  GitBranch,
  MessageSquare,
  Radio,
  ShieldCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { createClient } from "@/lib/supabase/server";

const AUTOMATION_CARDS = [
  {
    icon: Radio,
    title: "Bulk Broadcast (Bulk Messaging)",
    description:
      "Reach thousands of customers in one click with Meta-approved templates, personalization, and delivery tracking.",
    highlighted: false,
  },
  {
    icon: Bot,
    title: "AI Chatbots (No-Code Builder)",
    description:
      "Build intelligent automated flows and AI-powered replies to capture leads & solve FAQs 24/7.",
    highlighted: true,
  },
  {
    icon: Clock,
    title: "Auto-Response",
    description:
      "Instant automated triggers for welcome messages, keyword matches, wait steps, and away hours.",
    highlighted: false,
  },
  {
    icon: Users,
    title: "Multi-Agent Inbox",
    description:
      "Single WhatsApp number for your entire team with chat assignment, internal notes, and analytics.",
    highlighted: false,
  },
];

const SOLUTION_CARDS = [
  {
    icon: GitBranch,
    title: "Sales Pipelines (Kanban)",
    description:
      "Track leads from initial WhatsApp inquiry to closed deal with stage value analytics and contact linking.",
  },
  {
    icon: Workflow,
    title: "Scheduled Flows & Wait Steps",
    description:
      "Follow up automatically after customer replies or timed delays with built-in timeout handling.",
  },
  {
    icon: Zap,
    title: "REST API & Outbound Webhooks",
    description:
      "Connect your website, forms, or ERP via /api/v1 scoped API keys and HMAC-signed webhook events.",
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
      {/* Dark Navy Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071426] via-[#091c2f] to-[#072627] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              Supercharge Your{" "}
              <span className="text-[#22c55e]">Business</span> on{" "}
              <span className="text-[#22c55e]">WhatsApp</span>
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                100% Meta API Compliant
              </span>
              <span className="text-slate-400">&amp;</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-[#22c55e]" />
                Official Cloud API
              </span>
            </div>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              Scale customer engagement with Bulk Messaging, Intelligent AI
              Chatbots, Auto-Replies, and a Multi-Agent Team Inbox—all built on
              official WhatsApp Cloud APIs to keep your account safe.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#22c55e] px-7 text-sm font-bold text-[#04180c] shadow-lg shadow-emerald-500/25 transition-colors hover:bg-[#16a34a] hover:text-white"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[#22c55e] px-7 text-sm font-bold text-[#04180c] shadow-lg shadow-emerald-500/25 transition-colors hover:bg-[#16a34a] hover:text-white"
                  >
                    Start Free Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/10"
                  >
                    Login to Workspace
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                Instant workspace setup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                Encrypted API tokens
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                Team roles &amp; invites
              </span>
            </div>
          </div>

          {/* Right Hero Multi-Device Dashboard + WhatsApp Chat Showcase */}
          <div className="relative lg:col-span-6">
            <div className="relative mx-auto max-w-lg pb-10 pt-4 sm:pr-6">
              {/* Floating WhatsApp Chat Badge */}
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-[#0b2733]/90 px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-lg backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#22c55e] text-[#04180c]">
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
                Live Cloud API Sync · chatstack.cloud
              </div>

              {/* Desktop / Tablet Dashboard Frame */}
              <div className="rounded-2xl border-2 border-emerald-400/35 bg-white p-4 text-slate-900 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      ChatStack Dashboard
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Meta API Connected
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-12 gap-3">
                  {/* Mini Inbox List */}
                  <div className="col-span-5 space-y-2">
                    {[
                      { name: "Aarav Sharma", msg: "Order #482 confirmed" },
                      { name: "Priya Verma", msg: "Send pricing catalog" },
                      { name: "Rahul Mehta", msg: "Demo booked 4 PM" },
                    ].map((chat) => (
                      <div
                        key={chat.name}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-800">
                            {chat.name}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {chat.msg}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mini Bar + Ring Analytics */}
                  <div className="col-span-7 flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Campaign Delivery
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600">
                        96.4%
                      </span>
                    </div>

                    <div className="my-3 flex h-20 items-end justify-between gap-1.5 px-1">
                      {[42, 68, 55, 86, 72, 95, 82].map((h, idx) => (
                        <div
                          key={idx}
                          className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Mon – Sun Volume</span>
                      <span className="font-semibold text-emerald-700">
                        +38% replies
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlapping Mobile WhatsApp Preview Card */}
              <div className="mt-4 rounded-2xl border-2 border-emerald-400/50 bg-[#0b1f29] p-3 text-white shadow-2xl sm:absolute sm:-bottom-2 sm:right-0 sm:mt-0 sm:w-64">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-[#04180c]">
                      WA
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold">
                        ChatStack Bot
                      </p>
                      <p className="text-[9px] text-emerald-400">Online</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">Auto</span>
                </div>

                <div className="mt-2.5 space-y-2 text-[10px]">
                  <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white/10 px-2.5 py-1.5 text-slate-200">
                    Hi! I want details for WhatsApp CRM plans.
                  </div>
                  <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none bg-[#22c55e] px-2.5 py-1.5 font-medium text-[#04180c]">
                    Welcome! Here&apos;s our instant guide &amp; demo link.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Light Contrast Section — Matching Reference Bottom Grid */}
      <section id="features" className="bg-white py-16 text-slate-900 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Scale Your Business with Powerful Automation
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Secure, fast, and 100% policy-compliant WhatsApp CRM solutions.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AUTOMATION_CARDS.map((card) => (
              <div
                key={card.title}
                className={
                  card.highlighted
                    ? "rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-6 shadow-md shadow-emerald-500/10"
                    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                }
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions & API Section */}
      <section
        id="solutions"
        className="border-t border-slate-200 bg-slate-50 py-14 text-slate-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {SOLUTION_CARDS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#071426] p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-lg font-bold">
                Ready to run your WhatsApp CRM on chatstack.cloud?
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Sign in to your workspace, or review our Privacy Policy, Terms,
                and Contact details for Meta verification.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#22c55e] px-5 text-sm font-bold text-[#04180c] hover:bg-[#16a34a] hover:text-white"
              >
                {isAuthenticated ? "Go to Dashboard" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex h-10 items-center rounded-full border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10"
              >
                Privacy Policy
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center rounded-full border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
