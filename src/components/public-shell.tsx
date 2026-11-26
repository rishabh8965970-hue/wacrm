import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight } from "lucide-react";

interface PublicShellProps {
  children: ReactNode;
  isAuthenticated?: boolean;
}

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({
  children,
  isAuthenticated = false,
}: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#071426] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071426]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-8 w-8" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-wide text-white">
                CHATSTACK
              </span>
              <span className="text-[10px] font-medium tracking-wider text-emerald-400">
                WHATSAPP CRM
              </span>
            </div>
          </Link>

          <nav
            aria-label="Public navigation"
            className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#22c55e] px-5 text-sm font-semibold text-[#04180c] shadow-lg shadow-emerald-500/20 transition-colors hover:bg-[#16a34a] hover:text-white"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-full border border-white/25 bg-white/5 px-5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#22c55e] px-5 text-sm font-semibold text-[#04180c] shadow-lg shadow-emerald-500/20 transition-colors hover:bg-[#16a34a] hover:text-white"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white text-slate-900">{children}</main>

      <footer className="border-t border-white/10 bg-[#050f1d] text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-sm">
              <Link href="/" className="flex items-center gap-2.5">
                <BrandLogo className="h-7 w-7" />
                <span className="text-sm font-bold tracking-wide text-white">
                  ChatStack WhatsApp CRM
                </span>
              </Link>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                Official Meta WhatsApp Business Cloud API workspace for shared
                team inbox, bulk template broadcasts, sales pipelines, and
                AI-assisted automations.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="hover:text-white">
                Get Started Free
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} ChatStack WhatsApp CRM
              (chatstack.cloud). All rights reserved.
            </p>
            <p>Support: noreply@chatstack.cloud</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
