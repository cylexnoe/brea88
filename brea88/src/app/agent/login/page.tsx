'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Invalid email or password.');
      router.push('/agent/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Agent login error:', error);
      setError(error instanceof Error ? error.message : 'Unable to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.14),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-5xl">
          <button type="button" onClick={() => router.push('/')} className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/40">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative hidden overflow-hidden bg-blue-950 lg:flex">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/10" />
                <div className="relative flex w-full flex-col justify-between p-10 xl:p-12">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg"><Building2 className="h-6 w-6 text-blue-950" /></div>
                      <div><p className="text-sm font-black tracking-[0.18em]">BREA 88</p><p className="text-[10px] font-semibold tracking-[0.2em] text-blue-300">REALTY</p></div>
                    </div>
                    <div className="mt-16">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Agent / Broker Portal</p>
                      <h2 className="mt-4 text-4xl font-black leading-tight xl:text-5xl">Your clients.<br />Your service.<br />Your growth.</h2>
                      <p className="mt-6 max-w-sm text-sm leading-7 text-blue-200">Stay connected with client inquiries, viewing requests, messages, and your professional profile from one secure workspace.</p>
                    </div>
                  </div>
                  <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-blue-100"><CheckCircle2 className="h-5 w-5 text-blue-300" /> Client inquiry management</div>
                    <div className="flex items-center gap-3 text-sm text-blue-100"><CheckCircle2 className="h-5 w-5 text-blue-300" /> Professional profile tools</div>
                    <div className="flex items-center gap-3 text-sm text-blue-100"><CheckCircle2 className="h-5 w-5 text-blue-300" /> Secure account-based access</div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-8 text-slate-900 sm:px-10 sm:py-10 lg:px-12 xl:px-16 xl:py-12">
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 shadow-sm"><Building2 className="h-6 w-6 text-white" /></div>
                  <div><p className="text-sm font-black tracking-[0.18em]">BREA 88</p><p className="text-[10px] font-bold tracking-[0.2em] text-blue-900">REALTY</p></div>
                </div>

                <div className="mb-8">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900"><ShieldCheck className="h-4 w-4" /> Secure Agent / Broker Portal</div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome back</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to access your BREA 88 REALTY CRM workspace.</p>
                </div>

                {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"><div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" /><p className="leading-5">{error}</p></div>}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
                    <div className="group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10">
                      <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Mail className="h-5 w-5" /></div>
                      <input id="email" required disabled={loading} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" autoComplete="email" className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                    <div className="group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10">
                      <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Lock className="h-5 w-5" /></div>
                      <input id="password" required disabled={loading} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60" />
                      <button type="button" disabled={loading} onClick={() => setShowPassword((v) => !v)} className="mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 hover:shadow-xl hover:shadow-blue-950/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</> : <><Lock className="h-5 w-5" /> Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                  </button>
                </form>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"><ShieldCheck className="h-5 w-5 text-blue-900" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Account access is administrator-controlled</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Agent and Broker accounts are created by a BREA 88 REALTY administrator. Contact your administrator if you need an account.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400"><ShieldCheck className="h-4 w-4" /> Your account information is securely protected</div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-500">© {new Date().getFullYear()} BREA 88 REALTY • Agent / Broker Portal</p>
        </div>
      </div>
    </main>
  );
}
