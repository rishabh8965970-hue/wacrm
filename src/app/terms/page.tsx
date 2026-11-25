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
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          Legal & Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: November 26, 2026 · Website: https://chatstack.cloud
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using ChatStack WhatsApp CRM
              (&ldquo;ChatStack&rdquo;, &ldquo;the Service&rdquo;) at{" "}
              <span className="text-foreground">https://chatstack.cloud</span>,
              you agree to be bound by these Terms of Service and our{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              2. WhatsApp Business Policy Compliance
            </h2>
            <p>
              You are solely responsible for ensuring that all messages,
              templates, broadcasts, and automations sent through your connected
              WhatsApp Business Account comply with Meta&apos;s WhatsApp
              Business Messaging Policy, Commerce Policy, and applicable
              anti-spam and data-protection laws. You must obtain proper opt-in
              consent from recipients before messaging them.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              3. Accounts & Security
            </h2>
            <p>
              You must keep your login credentials, API keys, and Meta access
              tokens confidential. Account owners and admins are responsible for
              team members they invite to their workspace and for managing user
              roles and permissions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              4. Prohibited Use
            </h2>
            <p>
              You may not use the Service to send unsolicited bulk spam,
              phishing links, malware, fraudulent content, or anything that
              violates applicable laws or Meta platform rules. We reserve the
              right to suspend access if abuse or policy violations occur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              5. Service Availability & Liability
            </h2>
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. Message delivery also depends on third-party
              infrastructure including Meta&apos;s WhatsApp Cloud API. To the
              maximum extent permitted by law, ChatStack is not liable for
              indirect, incidental, or consequential damages arising from
              service interruptions or third-party API restrictions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              6. Contact
            </h2>
            <p>
              Questions about these Terms can be sent via our{" "}
              <Link href="/contact" className="text-emerald-400 hover:underline">
                Contact page
              </Link>{" "}
              or by email to{" "}
              <a
                href="mailto:noreply@chatstack.cloud"
                className="text-emerald-400 hover:underline"
              >
                noreply@chatstack.cloud
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
