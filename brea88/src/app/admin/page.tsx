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
  Terminal,
  ShieldCheck,
  Cpu,
  Activity,
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
      const response = await fetch(
        '/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            'Invalid username or password.'
        );

        setLoading(false);
        return;
      }

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-8 text-green-400">

      {/* MATRIX / GRID BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,197,94,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.5) 1px, transparent 1px)',
            backgroundSize: '45px 45px',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_55%)]" />

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      </div>

      {/* SCANLINES */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,197,94,0.5) 4px)',
          }}
        />
      </div>

      {/* MAIN */}
      <div className="relative z-10 w-full max-w-md">

        {/* TERMINAL HEADER */}
        <div className="mb-5 rounded-xl border border-green-500/20 bg-black/80 px-4 py-3 font-mono text-xs shadow-[0_0_30px_rgba(34,197,94,0.08)]">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 animate-pulse text-green-400" />

              <span className="text-green-500">
                SECURE_CONNECTION
              </span>
            </div>

            <span className="text-green-700">
              ONLINE
            </span>

          </div>

        </div>

        {/* BRAND */}
        <div className="mb-6 text-center">

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-green-500/40 bg-black shadow-[0_0_35px_rgba(34,197,94,0.18)]">

            <img
              src="/img/LOGO.png"
              alt="BREA 88 Realty"
              className="h-full w-full rounded-2xl object-cover opacity-90"
            />

            <div className="absolute inset-0 rounded-2xl ring-1 ring-green-400/20" />

          </div>

          <h1 className="mt-5 font-mono text-2xl font-black tracking-[0.15em] text-green-400">
            BREA 88 REALTY
          </h1>

          <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.3em] text-green-700">
            [ ADMINISTRATOR_ACCESS ]
          </p>

        </div>

        {/* LOGIN TERMINAL */}
        <div className="overflow-hidden rounded-2xl border border-green-500/30 bg-black/90 shadow-[0_0_50px_rgba(34,197,94,0.08)]">

          {/* TERMINAL BAR */}
          <div className="flex items-center justify-between border-b border-green-500/20 bg-green-950/10 px-5 py-3">

            <div className="flex items-center gap-2">

              <Terminal className="h-4 w-4 text-green-500" />

              <span className="font-mono text-xs font-bold tracking-wider text-green-500">
                root@brea88:~$
              </span>

            </div>

            <div className="flex gap-1.5">

              <span className="h-2 w-2 rounded-full bg-green-900" />
              <span className="h-2 w-2 rounded-full bg-green-700" />
              <span className="h-2 w-2 rounded-full bg-green-500" />

            </div>

          </div>

          {/* HEADER */}
          <div className="border-b border-green-500/15 px-6 py-6 sm:px-8">

            <div className="flex items-center gap-3">

              <ShieldCheck className="h-6 w-6 text-green-500" />

              <div>

                <h2 className="font-mono text-lg font-bold text-green-400">
                  SYSTEM LOGIN
                </h2>

                <p className="mt-1 font-mono text-xs text-green-800">
                  Restricted administrator terminal
                </p>

              </div>

            </div>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
          >

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3">

                <p className="font-mono text-xs font-medium text-red-400">
                  [ERROR] {error}
                </p>

              </div>
            )}

            {/* USERNAME */}
            <div>

              <label
                htmlFor="admin-username"
                className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-green-700"
              >
                Username
              </label>

              <div className="relative">

                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700"
                />

                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="admin_username"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-green-900/60 bg-green-950/10 pl-10 pr-4 font-mono text-sm text-green-400 outline-none transition placeholder:text-green-900 focus:border-green-500 focus:bg-green-950/20 focus:ring-2 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label
                htmlFor="admin-password"
                className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-green-700"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700"
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
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-green-900/60 bg-green-950/10 pl-10 pr-12 font-mono text-sm text-green-400 outline-none transition placeholder:text-green-900 focus:border-green-500 focus:bg-green-950/20 focus:ring-2 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-green-800 transition hover:bg-green-500/10 hover:text-green-400 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* STATUS */}
            <div className="flex items-center gap-2 rounded-lg border border-green-900/30 bg-green-950/10 px-3 py-2">

              <Cpu className="h-3.5 w-3.5 text-green-700" />

              <span className="font-mono text-[10px] text-green-800">
                SYSTEM_STATUS: AUTHENTICATION_REQUIRED
              </span>

            </div>

            {/* LOGIN */}
            <button
              type="submit"
              disabled={
                loading ||
                !username.trim() ||
                !password
              }
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-5 font-mono text-sm font-bold uppercase tracking-wider text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.05)] transition hover:border-green-400 hover:bg-green-500/20 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >

              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <LogIn
                    size={17}
                    className="transition group-hover:translate-x-0.5"
                  />

                  EXECUTE LOGIN
                </>
              )}

            </button>

          </form>

          {/* FOOTER */}
          <div className="border-t border-green-500/15 bg-green-950/5 px-6 py-5 text-center sm:px-8">

            <p className="font-mono text-[10px] leading-5 text-green-900">
              WARNING: AUTHORIZED PERSONNEL ONLY.
              <br />
              ALL ACCESS ATTEMPTS MAY BE LOGGED.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/home')
              }
              className="mt-4 font-mono text-xs font-semibold text-green-700 transition hover:text-green-400 hover:underline"
            >
              &lt; RETURN_TO_BREA88
            </button>

          </div>

        </div>

        {/* TERMINAL FOOTER */}
        <div className="mt-5 text-center font-mono text-[9px] tracking-widest text-green-950">
          BREA88_SECURE_ADMIN_TERMINAL // ACCESS_CONTROL_v1.0
        </div>

      </div>

    </main>
  );
}

