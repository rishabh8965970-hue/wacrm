"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 px-4 py-6 text-slate-900">
      <header className="mx-auto flex w-full max-w-md items-center justify-between text-xs font-medium text-slate-600">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <BrandLogo className="h-7 w-7" />
          <span className="font-bold">ChatStack WhatsApp CRM</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-emerald-700">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-emerald-700">
            Pricing
          </Link>
        </div>
      </header>

      <div className="mx-auto my-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-emerald-950/5">
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {t("checkEmailTitle")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t.rich("checkEmailDesc", {
                email,
                strong: (chunks) => (
                  <span className="font-semibold text-slate-900">{chunks}</span>
                ),
              })}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              {t("backToSignIn")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <BrandLogo className="mb-3 h-12 w-12" />
              <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
              <p className="mt-1 text-xs text-slate-500">{t("desc")}</p>
            </div>

            <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4">
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
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 disabled:opacity-60"
              >
                {loading ? t("sending") : t("sendLink")}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToSignIn")}
            </Link>
          </>
        )}
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
  );
}
