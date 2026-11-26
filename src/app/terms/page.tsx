import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for using ChatStack WhatsApp CRM at chatstack.cloud.",
};

export default function TermsPage() {
  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-[#071426] via-[#091c2f] to-[#072627] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Legal &amp; Compliance
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Effective date: November 26, 2026 · Platform: https://chatstack.cloud
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              By accessing or using ChatStack WhatsApp CRM
              (&ldquo;ChatStack&rdquo;, &ldquo;the Service&rdquo;) at{" "}
              <span className="font-medium text-slate-900">
                https://chatstack.cloud
              </span>
              , you agree to be bound by these Terms of Service and our{" "}
              <Link
                href="/privacy"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              2. WhatsApp Business Policy Compliance
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You are solely responsible for ensuring that all messages,
              templates, broadcasts, and automations sent through your connected
              WhatsApp Business Account comply with Meta&apos;s WhatsApp
              Business Messaging Policy, Commerce Policy, and applicable
              anti-spam and data-protection laws. You must obtain proper opt-in
              consent from recipients before messaging them.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              3. Accounts &amp; Security
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You must keep your login credentials, API keys, and Meta access
              tokens confidential. Account owners and admins are responsible for
              team members they invite to their workspace and for managing user
              roles and permissions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              4. Prohibited Use
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You may not use the Service to send unsolicited bulk spam,
              phishing links, malware, fraudulent content, or anything that
              violates applicable laws or Meta platform rules. We reserve the
              right to suspend access if abuse or policy violations occur.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              5. Service Availability &amp; Meta Billing
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Message delivery and WhatsApp Cloud API charges are governed by
              Meta Platforms. See our{" "}
              <Link
                href="/pricing"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Pricing &amp; Meta Charges
              </Link>{" "}
              page for details. To the maximum extent permitted by law,
              ChatStack is not liable for indirect, incidental, or consequential
              damages arising from third-party API restrictions or outages.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">6. Contact</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Questions about these Terms can be sent via our{" "}
              <Link
                href="/contact"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Contact page
              </Link>{" "}
              or by email to{" "}
              <a
                href="mailto:noreply@chatstack.cloud"
                className="font-semibold text-emerald-700 hover:underline"
              >
                noreply@chatstack.cloud
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
