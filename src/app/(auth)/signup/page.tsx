"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import {
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
  UsersRound,
} from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("SignupPage");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    const next = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8 text-slate-900">
        <div className="mx-auto flex w-full max-w-md items-center justify-between text-xs text-slate-600">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <BrandLogo className="h-7 w-7" />
            <span>ChatStack WhatsApp CRM</span>
          </Link>
          <Link href="/login" className="font-semibold text-emerald-700">
            Login
          </Link>
        </div>

        <div className="mx-auto my-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {t("checkEmailTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t.rich("checkEmailDesc", {
              email,
              strong: (chunks) => (
                <span className="font-semibold text-slate-900">{chunks}</span>
              ),
            })}
          </p>
          <Link
            href={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            {t("backToSignIn")}
          </Link>
        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-[38rem] rounded-full bg-emerald-300/20 blur-3xl"
      />

      {/* Light Top Navbar matching Reference 2 */}
      <header className="relative z-10 border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-8 w-8" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-wide text-slate-900">
                CHATSTACK
              </span>
              <span className="text-[10px] font-medium text-emerald-600">
                Automate • Engage • Grow
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="hover:text-emerald-700">
              Home
            </Link>
            <Link href="/#features" className="hover:text-emerald-700">
              Services
            </Link>
            <Link href="/pricing" className="hover:text-emerald-700">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-emerald-700">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-emerald-700">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="hidden h-9 items-center gap-1 rounded-full bg-[#16a34a] px-4 text-sm font-semibold text-white sm:inline-flex"
            >
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12">
        {/* Left Value Prop + 3D Bot Mascot */}
        <div className="hidden lg:col-span-6 lg:block">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 xl:text-5xl">
            Create Your <span className="text-[#16a34a]">Account</span>
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
            Join ChatStack WhatsApp CRM and start growing your business with
            WhatsApp.
          </p>

          <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
            {[
              "Automate Messages & Save Time",
              "Use AI Chatbot & Auto Reply",
              "Manage Multiple Agents",
              "Get Better Customer Engagement",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16a34a]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-end gap-4">
            <img
              src="/images/bot-mascot.png"
              alt="ChatStack WhatsApp CRM robot mascot"
              className="h-60 w-auto drop-shadow-[0_18px_30px_rgba(16,185,129,0.22)]"
            />
            <div className="mb-16 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-bold text-emerald-700 shadow-md">
              Let&apos;s Grow Together!
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="mx-auto w-full max-w-md lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-2xl shadow-emerald-950/10 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                {inviteToken ? (
                  <UsersRound className="h-6 w-6" />
                ) : (
                  <UserPlus className="h-6 w-6" />
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {inviteToken ? t("titleJoin") : t("title")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {inviteToken
                  ? t("descJoin")
                  : "Fill in the details below to get started"}
              </p>
            </div>

            <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-3.5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  aria-label={t("fullNameLabel")}
                  placeholder={t("fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  aria-label={t("emailLabel")}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  aria-label={t("passwordLabel")}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
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

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  aria-label={t("confirmPasswordLabel")}
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <label className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? t("creating") : t("submit")}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              {t("haveAccount")}{" "}
              <Link
                href={
                  inviteToken
                    ? `/login?invite=${encodeURIComponent(inviteToken)}`
                    : "/login"
                }
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
