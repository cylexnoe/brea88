'use client';

import React, { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, User } from 'lucide-react';

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.14),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/40">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative hidden overflow-hidden bg-blue-950 lg:flex">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/10" />
                <div className="relative flex w-full flex-col justify-between p-10 xl:p-12 text-white">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
                        <img src="/img/LOGO.png" alt="BREA 88 Realty" className="h-full w-full object-cover" />
                      </div>
                      <div><p className="text-sm font-black tracking-[0.18em]">BREA 88</p><p className="text-[10px] font-semibold tracking-[0.2em] text-blue-300">REALTY ADMIN</p></div>
                    </div>
                    <div className="mt-16">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Administrator Portal</p>
                      <h1 className="mt-4 text-4xl font-black leading-tight xl:text-5xl">Manage the platform.<br />Protect the team.<br />Serve clients.</h1>
                      <p className="mt-6 max-w-sm text-sm leading-7 text-blue-200">Secure administrator access for property management, account controls, and platform settings.</p>
                    </div>
                  </div>
                  <div className="mt-12 space-y-4 text-sm text-blue-100">
                    <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-blue-300" /> Protected administrator access</div>
                    <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-blue-300" /> Manage Agents and Brokers</div>
                    <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-blue-300" /> Manage property listings</div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12 xl:px-16 xl:py-12">
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><img src="/img/LOGO.png" alt="BREA 88 Realty" className="h-full w-full object-cover" /></div>
                  <div><p className="text-sm font-black tracking-[0.18em] text-slate-950">BREA 88</p><p className="text-[10px] font-bold tracking-[0.2em] text-blue-900">REALTY ADMIN</p></div>
                </div>

                <div className="mb-8">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900"><ShieldCheck className="h-4 w-4" /> Secure Administrator Portal</div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage BREA 88 REALTY.</p>
                </div>

                {authRequired && !error && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm font-medium leading-5 text-amber-800">Your admin session has expired. Please sign in again.</div>}
                {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium leading-5 text-red-700">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="username" className="mb-2 block text-sm font-bold text-slate-700">Username</label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700" />
                      <input id="username" name="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter admin username" disabled={loading} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:opacity-60" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                    <div className="group relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700" />
                      <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" disabled={loading} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:opacity-60" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} disabled={loading} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in...</> : <><LogIn className="h-5 w-5" /> Sign In</>}
                  </button>
                </form>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-2 font-semibold text-slate-600"><LockKeyhole className="h-4 w-4" /> Protected administrator access</div>
                  <p className="mt-1.5">Agents and Brokers do not use this portal.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs font-medium text-slate-500">© {new Date().getFullYear()} BREA 88 REALTY OPC • Service with a Heart</p>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 px-4"><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" /><p className="text-sm text-slate-400">Loading administrator portal...</p></div></main>}>
      <AdminLoginContent />
    </Suspense>
  );
}
