import type { Metadata } from "next";
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
  Zap,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing & Meta Cloud API Charges",
  description:
    "ChatStack WhatsApp CRM plans, included automation & inbox services, and official Meta WhatsApp Business Cloud API per-message charges (INR).",
};

const WORKSPACE_PLANS = [
  {
    name: "Starter Workspace",
    price: "₹0",
    period: "/ month",
    badge: "Free Self-Hosted",
    description:
      "Connect your own Meta WhatsApp Cloud API credentials with 0% message markup.",
    highlighted: false,
    ctaLabel: "Get Started Free",
    ctaHref: "/signup",
    features: [
      "1 Official WhatsApp Business Number",
      "Shared Team Inbox & Contact Profiles",
      "Sales Pipelines (Kanban) & Tags",
      "Meta Template Sync & Bulk Broadcasts",
      "AES-256-GCM Encrypted Token Storage",
    ],
  },
  {
    name: "Growth & Automation",
    price: "₹999",
    period: "/ month",
    badge: "Most Popular",
    description:
      "Full automation suite for sales & support teams scaling WhatsApp engagement.",
    highlighted: true,
    ctaLabel: "Start Free Now",
    ctaHref: "/signup",
    features: [
      "Everything in Starter Workspace",
      "Visual No-Code Chatbot & Flow Builder",
      "Keyword Triggers, Wait Steps & Cron Flows",
      "Multi-Agent Team Roles (Owner/Admin/Agent/Viewer)",
      "AI Reply Assistant + Knowledge Base (BYOK)",
    ],
  },
  {
    name: "Business & API",
    price: "₹2,499",
    period: "/ month",
    badge: "API & Multi-Team",
    description:
      "Designed for growing businesses integrating websites, CRMs, and webhooks.",
    highlighted: false,
    ctaLabel: "Contact Sales",
    ctaHref: "/contact",
    features: [
      "Everything in Growth & Automation",
      "Public REST API (/api/v1) & Scoped Keys",
      "HMAC-Signed Outbound Webhooks",
      "Inbound Media Mirroring & Audit Logs",
      "Priority Onboarding & Setup Assistance",
    ],
  },
];

const META_RATES_INDIA = [
  {
    category: "Marketing",
    useCase:
      "Promotional offers, product launches, festival broadcasts, cart reminders",
    rate: "₹0.8631",
    note: "Per delivered template message",
  },
  {
    category: "Utility",
    useCase:
      "Order confirmations, shipping & delivery alerts, invoices, payment updates",
    rate: "₹0.1150",
    note: "Per delivered template message",
  },
  {
    category: "Authentication",
    useCase: "One-Time Passwords (OTPs), login verification, 2FA security codes",
    rate: "₹0.1150",
    note: "Domestic India (+91) per delivered message",
  },
  {
    category: "Authentication (International)",
    useCase: "OTPs sent from international businesses to Indian numbers",
    rate: "₹2.4971",
    note: "Where international auth rate applies",
  },
  {
    category: "Service (Customer Care)",
    useCase: "Free-form support replies inside a 24-hour user-initiated window",
    rate: "First 1,000 FREE / mo",
    note: "₹0.1150 per message after 1,000 / month / number",
  },
];

const CRM_SERVICES = [
  {
    icon: MessageSquare,
    title: "Shared Multi-Agent Inbox",
    desc: "Assign chats, track unread counts, leave internal notes, and manage voice/media attachments.",
  },
  {
    icon: Radio,
    title: "Bulk Template Broadcasts",
    desc: "Send Meta-approved templates to segmented contact lists with variable mapping and delivery stats.",
  },
  {
    icon: Workflow,
    title: "No-Code Visual Flows",
    desc: "Build interactive WhatsApp journeys with automated timeouts and reply routing.",
  },
  {
    icon: Zap,
    title: "Wait & Keyword Automations",
    desc: "Trigger instant welcome messages, delayed follow-ups, and webhook actions every 5 minutes.",
  },
  {
    icon: GitBranch,
    title: "Sales Pipelines (Kanban)",
    desc: "Track deals by stage, currency, and value directly linked to customer chats.",
  },
  {
    icon: Bot,
    title: "AI Reply Assistant",
    desc: "Connect your own OpenAI or Anthropic key for instant draft replies and FAQ knowledge-base answers.",
  },
  {
    icon: Users,
    title: "Team Access & Invites",
    desc: "Share one workspace safely using Owner, Admin, Agent, and Viewer role permissions.",
  },
  {
    icon: ShieldCheck,
    title: "REST API & Webhooks",
    desc: "Integrate websites, forms, and external apps via /api/v1 keys and HMAC-SHA256 webhooks.",
  },
];

export default async function PricingPage() {
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
      {/* Dark Navy Header Band */}
      <section className="bg-gradient-to-br from-[#071426] via-[#091c2f] to-[#072627] py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-1 text-xs font-medium text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-[#22c55e]" />
            Direct Meta Cloud API · 0% Message Markup
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            CRM Plans &amp;{" "}
            <span className="text-[#22c55e]">Official Meta Charges</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Every workspace connects directly to Meta&apos;s official WhatsApp
            Business Cloud API. Meta conversation/message fees are billed
            directly by Meta at official rates—with zero hidden markup.
          </p>
        </div>
      </section>

      {/* Platform Plans */}
      <section className="bg-white py-14 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {WORKSPACE_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlighted
                    ? "relative flex flex-col justify-between rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-7 shadow-xl shadow-emerald-500/10"
                    : "flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
                }
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                      {plan.name}
                    </h2>
                    <span
                      className={
                        plan.highlighted
                          ? "rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-semibold text-white"
                          : "rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-semibold text-slate-700"
                      }
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-500">
                      {plan.period}
                    </span>
                  </div>

                  <p className="mt-2.5 text-sm text-slate-600">
                    {plan.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={isAuthenticated ? "/dashboard" : plan.ctaHref}
                  className={
                    plan.highlighted
                      ? "mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500"
                      : "mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  }
                >
                  {isAuthenticated ? "Open Dashboard" : plan.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meta WhatsApp Business Cloud API Charges Table */}
      <section className="border-t border-slate-200 bg-slate-50 py-14 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Official Meta Billing (India +91)
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Meta WhatsApp Cloud API Per-Message Charges
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Meta charges per delivered message based on template category.
              Inbound customer messages are always{" "}
              <strong className="text-slate-900">FREE (₹0)</strong>, and
              undelivered messages are not billed.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-100/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5">Message Category</th>
                    <th className="px-6 py-3.5">When It Applies</th>
                    <th className="px-6 py-3.5">Meta Rate (INR)</th>
                    <th className="px-6 py-3.5">Billing Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {META_RATES_INDIA.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-900">
                        {row.category}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {row.useCase}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-emerald-700">
                        {row.rate}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Note: Meta rates shown are standard India (+91) reference rates
            excluding applicable 18% GST. Final rates depend on recipient
            country and Meta&apos;s official WhatsApp Business Platform pricing
            schedule.
          </p>
        </div>
      </section>

      {/* All Included CRM Services */}
      <section className="border-t border-slate-200 bg-white py-14 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              All Services Included in ChatStack WhatsApp CRM
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything your business needs to capture leads, automate replies,
              and close sales on WhatsApp.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CRM_SERVICES.map((svc) => (
              <div
                key={svc.title}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <svc.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  {svc.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {svc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
