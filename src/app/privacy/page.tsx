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
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          Legal & Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: November 26, 2026 · Website: https://chatstack.cloud
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              1. Overview
            </h2>
            <p>
              ChatStack WhatsApp CRM (&ldquo;ChatStack&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;) provides customer relationship management,
              shared inbox, broadcast, and automation tools built on the
              official Meta WhatsApp Business Cloud API. This Privacy Policy
              explains what information we collect, how we use it, and how you
              can request deletion of your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-foreground">Account Data:</strong> Your
                name, email address, authentication credentials, and team role
                when you create or join a workspace.
              </li>
              <li>
                <strong className="text-foreground">
                  WhatsApp & CRM Data:
                </strong>{" "}
                Contact names, phone numbers, message content, media
                attachments, tags, custom fields, pipeline deals, and delivery
                status events processed via your connected WhatsApp Business
                Account (WABA).
              </li>
              <li>
                <strong className="text-foreground">
                  Technical & Security Data:
                </strong>{" "}
                Webhook signatures, API access logs, and session cookies needed
                to authenticate users and protect the service.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
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
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              4. Data Security & Third-Party Processors
            </h2>
            <p>
              We do not sell personal data. WhatsApp Business API access tokens
              and optional AI provider keys stored in ChatStack are encrypted at
              rest using AES-256-GCM, and database access is gated by
              row-level security (RLS) policies. Inbound Meta webhooks are
              verified using HMAC-SHA256 signatures. Data is processed using
              Meta Platforms (WhatsApp Business Cloud API) and Supabase
              database/authentication infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              5. Data Retention & User Data Deletion
            </h2>
            <p>
              We retain workspace and messaging data only for as long as your
              account remains active or as needed to provide the service. You
              may delete contacts, templates, or WhatsApp configurations inside
              the CRM at any time, or request complete account and data deletion
              by emailing{" "}
              <a
                href="mailto:noreply@chatstack.cloud"
                className="text-emerald-400 hover:underline"
              >
                noreply@chatstack.cloud
              </a>{" "}
              with your registered account email. Deletion requests are
              processed promptly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or your data
              rights, please reach out via our{" "}
              <Link href="/contact" className="text-emerald-400 hover:underline">
                Contact page
              </Link>{" "}
              or email{" "}
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
