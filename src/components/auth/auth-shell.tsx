import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background px-4 py-6 sm:px-6">
      {/* Subtle ambient background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="h-72 w-[36rem] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-primary/15" />
      </div>

      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandLogo className="h-6 w-6" />
          <span className="text-xs font-semibold text-foreground">
            ChatStack WhatsApp CRM
          </span>
        </Link>
      </header>

      <div className="mx-auto my-8 flex w-full max-w-md flex-col items-center">
        {children}
      </div>

      <footer className="mx-auto flex w-full max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms of Service
        </Link>
        <Link href="/contact" className="hover:text-foreground">
          Contact
        </Link>
      </footer>
    </div>
  );
}
