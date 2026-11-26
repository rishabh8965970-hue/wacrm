import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Globe, Lock, Mail } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ChatStack WhatsApp CRM support, account assistance, and data privacy requests.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-[#071426] via-[#091c2f] to-[#072627] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Support &amp; Verification
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Contact ChatStack WhatsApp CRM
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Need help with your CRM workspace, Meta WhatsApp Business API setup,
            pricing, or a data-deletion request? Reach out below.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Email Support
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                For general support, Meta verification inquiries, or account
                assistance:
              </p>
              <a
                href="mailto:noreply@chatstack.cloud"
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                noreply@chatstack.cloud
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Platform Portal
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Official web application &amp; customer workspace URL:
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                https://chatstack.cloud
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Privacy &amp; Data Deletion
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Email{" "}
                <span className="font-medium text-slate-900">
                  noreply@chatstack.cloud
                </span>{" "}
                from your registered email. Read our{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Support Hours
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Monday through Saturday, 10:00 AM – 7:00 PM IST.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#071426] p-6 text-white">
            <div>
              <h3 className="text-base font-bold">
                Ready to open your WhatsApp CRM workspace?
              </h3>
              <p className="mt-0.5 text-xs text-slate-300">
                Sign in, create a free account, or view Meta Cloud API pricing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#22c55e] px-5 text-sm font-bold text-[#04180c] hover:bg-[#16a34a] hover:text-white"
              >
                Login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-10 items-center rounded-full border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
