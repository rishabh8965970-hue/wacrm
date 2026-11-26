"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import {
  Bot,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  LogIn,
  Mail,
  MessageSquare,
  ShieldCheck,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("LoginPage");
  const linkError = searchParams.get("error");
  const linkErrorMessage =
    linkError === "link_expired"
      ? t("linkExpired")
      : linkError === "link_invalid"
        ? t("linkInvalid")
        : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const destination = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    window.location.href = destination;
  };

  return (
    <div className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-12">
      {/* Left Dark Emerald Brand & Mascot Showcase */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#06281f] via-[#071726] to-[#05101d] p-10 text-white lg:col-span-6 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10" />
            <div>
              <p className="text-lg font-extrabold tracking-wide text-white">
                CHATSTACK
              </p>
              <p className="text-[11px] font-medium text-emerald-400">
                Automate • Engage • Grow
              </p>
            </div>
          </Link>
          <span className="text-xs italic text-emerald-300/90">
            Smarter WhatsApp for Your Business
          </span>
        </div>

        <div className="relative z-10 my-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl">
            Welcome <span className="text-[#22c55e]">Back!</span>
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">
            Login to your account and take your WhatsApp business to the next
            level.
          </p>

          <div className="mt-6 space-y-3.5 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                <Zap className="h-4 w-4" />
              </span>
              <span>Automate Messages &amp; Save Time</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                <GitBranch className="h-4 w-4" />
              </span>
              <span>Grow Your Business with Smart Tools</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>Secure &amp; Reliable Meta Cloud API Platform</span>
            </div>
          </div>
        </div>

        {/* Bottom Mascot + Mini Feature Phone Preview */}
        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="flex items-end gap-2">
            <img
              src="/images/bot-mascot.png"
              alt="ChatStack WhatsApp CRM assistant"
              className="h-44 w-auto drop-shadow-[0_14px_28px_rgba(16,185,129,0.28)]"
            />
            <div className="mb-24 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-lg">
              Let&apos;s Grow Together!
            </div>
          </div>

          <div className="hidden w-52 rounded-2xl border-2 border-emerald-400/40 bg-[#08241d]/90 p-3 shadow-2xl xl:block">
            <div className="mb-2.5 flex justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22c55e] text-[#04180c]">
                <MessageSquare className="h-4 w-4" />
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-800">
              {[
                { icon: Users, label: "Bulk Messaging" },
                { icon: Bot, label: "AI Chat Bot" },
                { icon: Zap, label: "Auto Reply" },
                { icon: ShieldCheck, label: "Agent Support" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5"
                >
                  <item.icon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Light Auth Panel */}
      <div className="flex flex-col justify-between bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 px-4 py-6 sm:px-8 lg:col-span-6">
        <header className="mx-auto flex w-full max-w-md items-center justify-between text-xs font-medium text-slate-600">
          <Link href="/" className="flex items-center gap-2 text-slate-900 lg:hidden">
            <BrandLogo className="h-7 w-7" />
            <span className="font-bold">ChatStack</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="hover:text-emerald-700">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-emerald-700">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-emerald-700">
              Contact
            </Link>
          </div>
        </header>

        <div className="mx-auto my-8 w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-9">
          <div className="flex flex-col items-center text-center">
            {inviteToken ? (
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <UsersRound className="h-6 w-6" />
              </div>
            ) : (
              <BrandLogo className="mb-3 h-12 w-12" />
            )}
            <p className="text-lg font-extrabold tracking-wide text-slate-900">
              <span className="text-emerald-600">CHAT</span>STACK
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {inviteToken ? t("titleAccept") : "Login to Continue"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {inviteToken ? t("descAccept") : t("descWelcome")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            {linkErrorMessage && !error && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {linkErrorMessage}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                {t("emailLabel")}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {t("passwordLabel")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {t("noAccount")}{" "}
            <Link
              href={
                inviteToken
                  ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                  : "/signup"
              }
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              {t("createAccount")}
            </Link>
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Your data is safe with us · Official Meta Cloud API</span>
          </div>
        </div>

        <footer className="mx-auto flex w-full max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-slate-800">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-slate-800">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-800">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-slate-800">
            Contact
          </Link>
        </footer>
      </div>
    </div>
  );
}
