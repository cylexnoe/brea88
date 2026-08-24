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
} from 'lucide-react';

export default function AgentLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

      router.push('/profile');

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
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* BACK */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* CARD */}
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* HEADER */}
          <div className="bg-blue-950 text-white px-7 py-8 text-center">

            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-300" />
              </div>
            </div>

            <h1 className="text-2xl font-black">
              Agent / Broker Login
            </h1>

            <p className="mt-2 text-sm text-blue-200">
              Sign in to manage your professional profile.
            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="p-7 space-y-5"
          >

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* EMAIL */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Email Address
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white transition overflow-hidden">

                <div className="px-4 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Password
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white transition overflow-hidden">

                <div className="px-4 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >

              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Sign In
                </>
              )}

            </button>

            {/* REGISTER */}
            <div className="pt-4 border-t border-slate-100 text-center">

              <p className="text-sm text-slate-500">
                Don't have an agent account?
              </p>

              <button
                type="button"
                onClick={() => router.push('/agent/register')}
                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                Register as Agent / Broker
              </button>

            </div>

          </form>

        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-600 mt-6">
          BREA 88 REALTY • Agent Portal
        </p>

      </div>

    </main>
  );
}