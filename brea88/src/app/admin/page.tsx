'use client';

import React, { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authRequired = searchParams.get('auth') === 'required';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || 'Invalid username or password.');
        return;
      }

      router.replace('/admin/dashboard');
      router.refresh();
    } catch (submitError) {
      console.error('Admin login error:', submitError);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030b1c] text-slate-900">
      {/* Premium background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-indigo-700/20 blur-[130px]" />
        <div className="absolute -bottom-48 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-950/60 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.16),transparent_42%)]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      {/* Main */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="w-full max-w-6xl">
          {/* Brand header */}
          <div className="mb-6 flex items-center justify-between px-1 sm:px-2">

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Secure Portal
            </div>
          </div>

          {/* Login card */}
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              {/* Left premium panel */}
              <section className="relative hidden overflow-hidden bg-[#071936] lg:block">
                {/* Decorative circles */}
                <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/[0.07]" />
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-blue-400/[0.08]" />
                <div className="absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />

                <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />

                {/* Gold accent */}
                <div className="absolute left-10 top-28 h-px w-20 bg-gradient-to-r from-[#c9a96e] to-transparent" />

                <div className="relative flex min-h-[700px] flex-col justify-between p-10 xl:p-14">
                  <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/20">
                        <img
                          src="/img/LOGO.png"
                          alt="BREA 88 Realty"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-black tracking-[0.2em] text-white">
                          BREA 88
                        </p>
                        <p className="text-[10px] font-bold tracking-[0.22em] text-blue-300">
                          REALTY ADMIN
                        </p>
                      </div>
                    </div>

                    {/* Heading */}
                    <div className="mt-24">
                      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Administrator Portal
                      </div>

                      <h1 className="max-w-md text-4xl font-black leading-[1.08] tracking-tight text-white xl:text-5xl">
                        Manage with
                        <span className="block text-blue-400">
                          confidence.
                        </span>
                      </h1>

                      <p className="mt-6 max-w-md text-sm leading-7 text-blue-100/65">
                        Your central workspace for managing property listings,
                        Agents, Brokers, accounts, and the BREA 88 REALTY
                        platform.
                      </p>
                    </div>

                    {/* Features */}
                    <div className="mt-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <CheckCircle2 className="h-4 w-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-100/80">
                          Secure administrator access
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <CheckCircle2 className="h-4 w-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-100/80">
                          Manage Agents and Brokers
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <CheckCircle2 className="h-4 w-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-100/80">
                          Manage property listings
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom branding */}
                  <div>
                    <div className="mb-6 h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/70">
                          BREA 88 REALTY OPC
                        </p>
                        <p className="mt-1 text-xs text-blue-100/40">
                          Service with a Heart
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <ShieldCheck className="h-5 w-5 text-blue-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right form */}
              <section className="bg-white">
                <div className="flex min-h-[700px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
                  {/* Mobile brand */}
                  <div className="mb-10 flex items-center gap-3 lg:hidden">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200">
                      <img
                        src="/img/LOGO.png"
                        alt="BREA 88 Realty"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-black tracking-[0.2em] text-slate-950">
                        BREA 88
                      </p>
                      <p className="text-[9px] font-bold tracking-[0.22em] text-blue-800">
                        REALTY ADMIN
                      </p>
                    </div>
                  </div>

                  {/* Form header */}
                  <div className="mb-8">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">
                      <ShieldCheck className="h-4 w-4" />
                      Secure Administrator Portal
                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      Welcome back
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Sign in to access your BREA 88 REALTY administration
                      workspace.
                    </p>
                  </div>

                  {/* Auth required */}
                  {authRequired && !error && (
                    <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium leading-5 text-amber-800">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <span>
                        Your admin session has expired. Please sign in again.
                      </span>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium leading-5 text-red-700"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-600">
                        !
                      </div>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                      <label
                        htmlFor="username"
                        className="mb-2.5 block text-sm font-bold text-slate-700"
                      >
                        Username
                      </label>

                      <div className="group relative">
                        <div className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 transition group-focus-within:bg-blue-50">
                          <User className="h-4 w-4 text-slate-400 transition group-focus-within:text-blue-700" />
                        </div>

                        <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter admin username"
                          disabled={loading}
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-sm font-bold text-slate-700"
                        >
                          Password
                        </label>

                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Protected
                        </span>
                      </div>

                      <div className="group relative">
                        <div className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 transition group-focus-within:bg-blue-50">
                          <LockKeyhole className="h-4 w-4 text-slate-400 transition group-focus-within:text-blue-700" />
                        </div>

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter admin password"
                          disabled={loading}
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-14 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          disabled={loading}
                          aria-label={
                            showPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#071936] px-5 text-sm font-bold text-white shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b2a6f] hover:shadow-2xl hover:shadow-blue-950/30 focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {/* Button glow */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {loading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="h-5 w-5" />
                          <span>Sign In</span>
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security card */}
                  <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                        <LockKeyhole className="h-4 w-4 text-blue-800" />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Protected administrator access
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          This portal is restricted to authorized BREA 88
                          administrators. Agents and Brokers use the separate
                          Agent Portal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      Service with a Heart
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Secure
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Bottom copyright */}
          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
            © {new Date().getFullYear()} BREA 88 REALTY OPC
            <span className="mx-2 text-slate-700">•</span>
            Service with a Heart
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#030b1c] px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
            </div>

            <p className="text-sm font-medium text-slate-400">
              Loading administrator portal...
            </p>
          </div>
        </main>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}