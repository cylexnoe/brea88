'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  UserPlus,
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Invalid email or password.'
        );
      }

      router.push('/agent/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Agent login error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* BACKGROUND */}
      <div className="absolute inset-0">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.14),transparent_45%)]" />

        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:40px_40px]" />

      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">

        <div className="w-full max-w-5xl">

          {/* BACK */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          {/* MAIN CARD */}
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/40">

            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

              {/* LEFT BRAND PANEL */}
              <div className="relative hidden overflow-hidden bg-blue-950 lg:flex">

                {/* Decorative shapes */}
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/10" />

                <div className="relative flex w-full flex-col justify-between p-10 xl:p-12">

                  {/* BRAND */}
                  <div>

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
                        <Building2 className="h-6 w-6 text-blue-950" />
                      </div>

                      <div>
                        <p className="text-sm font-black tracking-[0.18em] text-white">
                          BREA 88
                        </p>

                        <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-300">
                          REALTY
                        </p>
                      </div>

                    </div>

                    <div className="mt-16">

                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
                        Agent Portal
                      </p>

                      <h2 className="mt-4 text-4xl font-black leading-tight text-white xl:text-5xl">
                        Your properties.
                        <br />
                        Your clients.
                        <br />
                        Your business.
                      </h2>

                      <p className="mt-6 max-w-sm text-sm leading-7 text-blue-200">
                        Manage your professional profile, properties,
                        client inquiries, and real estate activities
                        from one secure workspace.
                      </p>

                    </div>

                  </div>

                  {/* FEATURES */}
                  <div className="mt-12 space-y-4">

                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Manage your property listings
                    </div>

                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Maintain your professional profile
                    </div>

                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Connect with potential clients
                    </div>

                  </div>

                </div>
              </div>

              {/* RIGHT LOGIN */}
              <div className="bg-white px-6 py-8 text-slate-900 sm:px-10 sm:py-10 lg:px-12 xl:px-16 xl:py-12">

                {/* MOBILE BRAND */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 shadow-sm">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-black tracking-[0.18em] text-slate-900">
                      BREA 88
                    </p>

                    <p className="text-[10px] font-bold tracking-[0.2em] text-blue-900">
                      REALTY
                    </p>
                  </div>

                </div>

                {/* HEADER */}
                <div className="mb-8">

                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">

                    <ShieldCheck className="h-4 w-4" />

                    Secure Agent Portal

                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Welcome back
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in to access your BREA 88 REALTY agent dashboard.
                  </p>

                </div>

                {/* ERROR */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">

                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                    <p className="leading-5">
                      {error}
                    </p>

                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="space-y-5"
                >

                  {/* EMAIL */}
                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Email Address
                    </label>

                    <div className="group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10">

                      <div className="pl-4 text-slate-400 transition group-focus-within:text-blue-700">
                        <Mail className="h-5 w-5" />
                      </div>

                      <input
                        id="email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@example.com"
                        autoComplete="email"
                        className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}
                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="block text-sm font-bold text-slate-700"
                      >
                        Password
                      </label>

                    </div>

                    <div className="group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10">

                      <div className="pl-4 text-slate-400 transition group-focus-within:text-blue-700">
                        <Lock className="h-5 w-5" />
                      </div>

                      <input
                        id="password"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 hover:shadow-xl hover:shadow-blue-950/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Sign In
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}

                  </button>

                </form>

                {/* DIVIDER */}
                <div className="my-7 flex items-center gap-4">

                  <div className="h-px flex-1 bg-slate-100" />

                  <span className="text-xs font-semibold text-slate-400">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-slate-100" />

                </div>

                {/* REGISTER */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

                      <UserPlus className="h-5 w-5 text-blue-900" />

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-bold text-slate-900">
                        New to BREA 88 REALTY?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Create your professional agent account
                        and start managing your listings.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          router.push('/agent/register')
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 transition hover:text-blue-700"
                      >
                        Register as Agent / Broker
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                    </div>

                  </div>

                </div>

                {/* SECURITY */}
                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">

                  <ShieldCheck className="h-4 w-4" />

                  Your account information is securely protected

                </div>

              </div>

            </div>

          </div>

          {/* FOOTER */}
          <p className="mt-6 text-center text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} BREA 88 REALTY • Agent Portal
          </p>

        </div>

      </div>

    </main>
  );
}

