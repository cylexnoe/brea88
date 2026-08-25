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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        '/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

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
       * The API should set the admin_session
       * HttpOnly cookie before we redirect.
       */

      router.replace('/admin/dashboard');

      router.refresh();
    } catch (error) {
      console.error(
        'Admin login error:',
        error
      );

      setError(
        'Unable to connect to the server. Please try again.'
      );

      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-900/30 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-700/20 blur-3xl" />

      </div>

      {/* LOGIN CARD */}

      <div className="relative z-10 w-full max-w-md">

        {/* BRAND */}

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl">

            <img
              src="/img/LOGO.png"
              alt="BREA 88 Realty"
              className="h-full w-full object-cover"
            />

          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            BREA 88 REALTY
          </h1>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            Administrator Portal
          </p>

        </div>

        {/* CARD */}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">

          {/* HEADER */}

          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">

            <h2 className="text-xl font-bold text-slate-900">
              Admin Login
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sign in to access the BREA 88
              administration dashboard.
            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
          >

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>

              </div>
            )}

            {/* USERNAME */}

            <div>

              <label
                htmlFor="admin-username"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Enter admin username"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-900 focus:ring-4 focus:ring-blue-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={loading}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>

            {/* LOGIN */}

            <button
              type="submit"
              disabled={
                loading ||
                !username.trim() ||
                !password
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />

                  Sign In
                </>
              )}

            </button>

          </form>

          {/* FOOTER */}

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-center sm:px-8">

            <p className="text-xs leading-5 text-slate-500">
              Authorized personnel only.
              Unauthorized access is prohibited.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/home')
              }
              className="mt-3 text-xs font-semibold text-blue-900 transition hover:text-blue-700 hover:underline"
            >
              Back to BREA 88 Realty
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}