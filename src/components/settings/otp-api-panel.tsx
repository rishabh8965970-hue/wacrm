'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface OtpLogItem {
  id: string;
  phone: string;
  purpose: string;
  code_length: number;
  attempts: number;
  max_attempts: number;
  template_name: string;
  status: 'pending' | 'verified' | 'expired' | 'failed' | 'superseded';
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

interface ApprovedTemplateItem {
  name: string;
  language: string;
  category: string;
}

export function OtpApiPanel() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<OtpLogItem[]>([]);
  const [templates, setTemplates] = useState<ApprovedTemplateItem[]>([]);
  const [hasAuthTemplate, setHasAuthTemplate] = useState(false);

  // Interactive test console state
  const [testPhone, setTestPhone] = useState('+91');
  const [testMode, setTestMode] = useState<'auto' | 'session_text' | 'template'>('auto');
  const [sendingTest, setSendingTest] = useState(false);
  const [lastOtpId, setLastOtpId] = useState<string | null>(null);
  const [testCode, setTestCode] = useState('');
  const [verifyingTest, setVerifyingTest] = useState(false);
  const [verifyBanner, setVerifyBanner] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://chatstack.cloud';

  const authTpl =
    templates.find((t) => t.category === 'AUTHENTICATION')?.name || templates[0]?.name || 'auth_otp';

  const sendCurl = `curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+919876543210",
    "purpose": "login",
    "length": 6,
    "expiry_minutes": 5,
    "template_name": "${authTpl}"
  }'`;

  const verifyCurl = `curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+919876543210",
    "otp": "123456",
    "purpose": "login"
  }'`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/otp-logs', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        logs?: OtpLogItem[];
        approvedTemplates?: ApprovedTemplateItem[];
        hasAuthTemplate?: boolean;
      };
      setLogs(data.logs ?? []);
      setTemplates(data.approvedTemplates ?? []);
      const hasAuth = Boolean(data.hasAuthTemplate);
      setHasAuthTemplate(hasAuth);
      setTestMode((prev) => (prev === 'auto' ? (hasAuth ? 'template' : 'session_text') : prev));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function copySnippet(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  async function handleSendTestOtp() {
    if (!testPhone.trim() || testPhone.trim() === '+91') {
      toast.error('Enter full phone with country code, e.g. +916262454467');
      return;
    }
    setSendingTest(true);
    setVerifyBanner(null);
    try {
      const res = await fetch('/api/account/otp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: testPhone.trim(),
          purpose: 'test',
          length: 6,
          expiry_minutes: 5,
          delivery_mode: testMode,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        otp_id?: string;
        to?: string;
        delivery_mode?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to send test OTP');
        return;
      }
      setLastOtpId(json.otp_id ?? null);
      toast.success(
        `OTP sent to ${json.to ?? testPhone} (${json.delivery_mode === 'session_text' ? '24h Session Text' : 'Template'})`,
      );
      void load();
    } finally {
      setSendingTest(false);
    }
  }

  async function handleVerifyTestOtp() {
    if (!testCode.trim()) {
      toast.error('Enter the OTP received on WhatsApp');
      return;
    }
    setVerifyingTest(true);
    try {
      const res = await fetch('/api/account/otp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: testPhone.trim(),
          otp_id: lastOtpId ?? undefined,
          purpose: 'test',
          otp: testCode.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        verified?: boolean;
        verified_at?: string;
        error?: string;
      };
      if (!res.ok || !json.verified) {
        toast.error(json.error ?? 'OTP verification failed');
        void load();
        return;
      }
      setVerifyBanner(`Verified at ${new Date(json.verified_at ?? Date.now()).toLocaleTimeString()}`);
      setTestCode('');
      toast.success('OTP verified successfully!');
      void load();
    } finally {
      setVerifyingTest(false);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            WhatsApp OTP API (Send &amp; Verify)
          </CardTitle>
          <CardDescription className="mt-1">
            Issue hashed 4/6/8-digit WhatsApp OTPs via your own connected Meta WABA. Requires an
            API key with <code className="text-xs">otp:send</code> or{' '}
            <code className="text-xs">messages:send</code> scope.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Reload
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {hasAuthTemplate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Approved Authentication template ready (<strong>{authTpl}</strong>).
            </span>
            <span className="text-[11px] opacity-80">
              India Meta Authentication rate: ~₹0.115 + GST / OTP
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
            <span className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                No <strong>APPROVED</strong> Meta <code>AUTHENTICATION</code> template synced yet.
                Create one in Meta Business &amp; click <strong>Sync from Meta</strong> in Templates
                for cold OTPs — or test instantly below via{' '}
                <strong>24h Session Text</strong> (send <code>&quot;Hi&quot;</code> to your WABA
                number first).
              </span>
            </span>
            <Link
              href="/settings?tab=templates"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Open Templates
            </Link>
          </div>
        )}

        {/* Interactive Dashboard Test Console */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Quick Test OTP (No code needed)
              </p>
              <p className="text-[11px] text-muted-foreground">
                For <strong>24h Session Text</strong>, send any WhatsApp message (like{' '}
                <code>Hi</code>) from your test number to your business number once, then click Send
                Test OTP.
              </p>
            </div>
            {verifyBanner && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-300">
                <CheckCircle2 className="size-3" />
                {verifyBanner}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="space-y-1 md:col-span-4">
              <Label className="text-[11px] text-muted-foreground">Test WhatsApp Number</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+916262454467"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label className="text-[11px] text-muted-foreground">Delivery Mode</Label>
              <Select
                value={testMode}
                onValueChange={(v) => setTestMode(v as 'auto' | 'session_text' | 'template')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session_text">24h Session Text (Instant Test)</SelectItem>
                  <SelectItem value="template">Meta Auth Template</SelectItem>
                  <SelectItem value="auto">Auto (Template else Text)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end md:col-span-2">
              <Button
                type="button"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={handleSendTestOtp}
                disabled={sendingTest}
              >
                {sendingTest ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send OTP
              </Button>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-[11px] text-muted-foreground">Enter Received OTP</Label>
              <Input
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="123456"
                maxLength={8}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-end md:col-span-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={handleVerifyTestOtp}
                disabled={verifyingTest}
              >
                {verifyingTest ? <Loader2 className="size-3.5 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                1. Send OTP — <code className="text-[11px]">POST /api/v1/otp/send</code>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => copySnippet(sendCurl, 'Send OTP cURL')}
              >
                <Copy className="size-3" />
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto rounded bg-background/80 p-2.5 font-mono text-[11px] text-muted-foreground">
              {sendCurl}
            </pre>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                2. Verify OTP — <code className="text-[11px]">POST /api/v1/otp/verify</code>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => copySnippet(verifyCurl, 'Verify OTP cURL')}
              >
                <Copy className="size-3" />
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto rounded bg-background/80 p-2.5 font-mono text-[11px] text-muted-foreground">
              {verifyCurl}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Recent OTP Verifications</p>
          {logs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-5 text-center text-xs text-muted-foreground">
              No OTPs issued yet. Use <strong>Quick Test OTP</strong> above or call{' '}
              <code>POST /api/v1/otp/send</code> to start tracking verifications.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Purpose</th>
                    <th className="px-3 py-2 font-medium">Template</th>
                    <th className="px-3 py-2 font-medium">Attempts</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-mono">{row.phone}</td>
                      <td className="px-3 py-2 capitalize">{row.purpose}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.template_name}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {row.attempts}/{row.max_attempts}
                      </td>
                      <td className="px-3 py-2 capitalize">{row.status}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
                }
