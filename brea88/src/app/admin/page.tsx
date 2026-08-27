'use client';

import {
  FormEvent,
  useState,
} from 'react';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  LogIn,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
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

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            'Invalid username or password.'
        );

        setLoading(false);
        return;
      }

      /*
       * Speak only after successful authentication.
       * This prevents the welcome message from playing
       * when the user simply opens the login page.
       */
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();

        const welcomeMessage =
          new SpeechSynthesisUtterance(
            'Welcome to Brea Eighty Eight Admin.'
          );

        welcomeMessage.rate = 0.9;
        welcomeMessage.pitch = 1;
        welcomeMessage.volume = 1;

        window.speechSynthesis.speak(welcomeMessage);
      }

      router.replace('/admin/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Admin login error:', error);

      setError(
        'Unable to connect to the server. Please try again.'
      );

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-900">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-slate-200/60 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-slate-200/60 blur-3xl" />

      </div>

      {/* =====================================================
          MAIN LAYOUT
      ====================================================== */}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

        <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_70px_rgba(15,23,42,0.12)]">

          <div className="grid min-h-[680px] lg:grid-cols-2">

            {/* =================================================
                LEFT BRAND PANEL
            ================================================== */}

            <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">

              {/* Decorative background */}

              <div className="absolute inset-0">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(148,163,184,0.15),transparent_35%)]" />

                <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-slate-800/40 blur-3xl" />

                <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full border border-white/5" />

                <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full border border-white/5" />

              </div>

              {/* Content */}

              <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

                <div>

                  {/* Logo */}

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl">

                      <img
                        src="/img/LOGO.png"
                        alt="BREA 88 Realty"
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <div>

                      <p className="text-lg font-bold tracking-tight text-white">
                        BREA 88
                      </p>

                      <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                        Realty
                      </p>

                    </div>

                  </div>

                  {/* Heading */}

                  <div className="mt-28">

                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">

                      <Building2 className="h-6 w-6 text-slate-300" />

                    </div>

                    <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">

                      Manage your
                      <br />

                      <span className="text-slate-400">
                        real estate business.
                      </span>

                    </h1>

                    <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
                      Access the BREA 88 Realty administration
                      platform to manage property listings,
                      inquiries, agents, and your real estate
                      operations.
                    </p>

                  </div>

                </div>

                {/* Bottom information */}

                <div>

                  <div className="mb-8 h-px w-full bg-white/10" />

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">

                      <ShieldCheck className="h-4 w-4 text-slate-300" />

                    </div>

                    <div>

                      <p className="text-xs font-semibold text-white">
                        Secure Administration
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Authorized personnel only
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                RIGHT LOGIN PANEL
            ================================================== */}

            <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">

              <div className="w-full max-w-md">

                {/* Mobile Logo */}

                <div className="mb-10 flex flex-col items-center text-center lg:hidden">

                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-1 ring-slate-200">

                    <img
                      src="/img/LOGO.png"
                      alt="BREA 88 Realty"
                      className="h-full w-full object-cover"
                    />

                  </div>

                  <h1 className="mt-4 text-xl font-bold text-slate-900">
                    BREA 88 REALTY
                  </h1>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Administration Portal
                  </p>

                </div>

                {/* Header */}

                <div className="mb-8">

                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                    <ShieldCheck className="h-5 w-5 text-slate-700" />

                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in to access the BREA 88 Realty
                    administration dashboard.
                  </p>

                </div>

                {/* Error */}

                {error && (

                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                      <p className="text-xs font-medium leading-5 text-red-600">
                        {error}
                      </p>

                    </div>

                  </div>

                )}

                {/* =================================================
                    LOGIN FORM
                ================================================== */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* Username */}

                  <div>

                    <label
                      htmlFor="admin-username"
                      className="mb-2 block text-xs font-semibold text-slate-700"
                    >
                      Username
                    </label>

                    <div className="relative">

                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="admin-username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        placeholder="Enter your username"
                        autoComplete="username"
                        required
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* Password */}

                  <div>

                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <div className="relative">

                      <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="admin-password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (previous) => !previous
                          )
                        }
                        disabled={loading}
                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >

                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}

                      </button>

                    </div>

                  </div>

                  {/* Security notice */}

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                    <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />

                    <p className="text-[11px] leading-5 text-slate-500">
                      Your administrator session is protected
                      with secure authentication.
                    </p>

                  </div>

                  {/* Login Button */}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !username.trim() ||
                      !password
                    }
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >

                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />

                        Sign in
                      </>
                    )}

                  </button>

                </form>

                {/* =================================================
                    FOOTER
                ================================================== */}

                <div className="mt-8 text-center">

                  <button
                    type="button"
                    onClick={() =>
                      router.push('/home')
                    }
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-900 hover:underline"
                  >
                    ← Return to BREA 88 Realty
                  </button>

                  <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    BREA 88 REALTY • ADMIN PORTAL
                  </p>

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>

    </main>
  );
}