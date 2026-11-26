import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for ChatStack WhatsApp CRM (chatstack.cloud), including Meta WhatsApp Business Cloud API data handling and deletion requests.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-[#071426] via-[#091c2f] to-[#072627] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Legal &amp; Meta Compliance
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Effective date: November 26, 2026 · Platform: https://chatstack.cloud
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">1. Overview</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              ChatStack WhatsApp CRM (&ldquo;ChatStack&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;) provides customer relationship management,
              shared inbox, broadcast, and automation tools built on the
              official Meta WhatsApp Business Cloud API. This Privacy Policy
              explains what information we collect, how we use it, and how you
              can request deletion of your data.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              2. Information We Collect
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                <strong className="text-slate-900">Account Data:</strong> Your
                name, email address, authentication credentials, and workspace
                role when you create or join an account.
              </li>
              <li>
                <strong className="text-slate-900">
                  WhatsApp &amp; CRM Data:
                </strong>{" "}
                Contact names, phone numbers, message content, media
                attachments, tags, custom fields, pipeline deals, and delivery
                status events processed via your connected WhatsApp Business
                Account (WABA).
              </li>
              <li>
                <strong className="text-slate-900">
                  Technical &amp; Security Data:
                </strong>{" "}
                Webhook signatures, API access logs, and session cookies needed
                to authenticate users and protect the service.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              3. How We Use Your Information
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                Deliver, receive, and organize WhatsApp Business messages in
                your shared team inbox.
              </li>
              <li>
                Run user-configured broadcasts, automated workflows, sales
                pipelines, and optional AI reply drafts.
              </li>
              <li>
                Send transactional account emails such as email verification and
                password resets.
              </li>
              <li>
                Prevent abuse, enforce access controls, and maintain service
                reliability.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              4. Data Security &amp; Third-Party Processors
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              We do not sell personal data. WhatsApp Business API access tokens
              and optional AI provider keys stored in ChatStack are encrypted at
              rest using AES-256-GCM, and database access is gated by
              row-level security (RLS) policies. Inbound Meta webhooks are
              verified using HMAC-SHA256 signatures. Data is processed using
              Meta Platforms (WhatsApp Business Cloud API) and Supabase
              database/authentication infrastructure.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              5. Data Retention &amp; User Data Deletion
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              We retain workspace and messaging data only for as long as your
              account remains active or as needed to provide the service. You
              may delete contacts, templates, or WhatsApp configurations inside
              the CRM at any time, or request complete account and data deletion
              by emailing{" "}
              <a
                href="mailto:noreply@chatstack.cloud"
                className="font-semibold text-emerald-700 hover:underline"
              >
                noreply@chatstack.cloud
              </a>{" "}
              with your registered account email. Deletion requests are
              processed promptly.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-9 items-center rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Contact Support
              </Link>
              <Link
                href="/terms"
                className="inline-flex h-9 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Read Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
