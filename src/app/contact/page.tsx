import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Globe, Lock, Mail } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ChatStack WhatsApp CRM support, account assistance, and data privacy requests.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          Support & Verification
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Contact ChatStack WhatsApp CRM
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Need help with your CRM workspace, Meta WhatsApp Business API setup,
          or a privacy / data-deletion request? Reach out using the details
          below.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Email Support
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              For general support, Meta verification inquiries, or account help:
            </p>
            <a
              href="mailto:noreply@chatstack.cloud"
              className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:underline"
            >
              noreply@chatstack.cloud
            </a>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Platform URL
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Official web application & workspace portal:
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:underline"
            >
              https://chatstack.cloud
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Privacy & Data Deletion
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Send data deletion requests to{" "}
              <span className="text-foreground">noreply@chatstack.cloud</span>{" "}
              from your registered email. See our{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Response Time
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Support requests are reviewed Monday through Saturday, 10:00 AM –
              7:00 PM IST.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/50 p-6">
          <span className="text-sm text-muted-foreground">
            Ready to access your CRM?
          </span>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Sign in
          </Link>
          <Link
            href="/terms"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
