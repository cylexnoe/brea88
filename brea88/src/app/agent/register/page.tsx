'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  UserPlus,
} from 'lucide-react';

export default function AgentRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Agent',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/agent/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Registration failed.'
        );
      }

      // Registration successful
      router.push('/agent/login');
    } catch (error) {
      console.error('Agent registration error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* BACK */}
        <button
          type="button"
          onClick={() => router.push('/agent/login')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        {/* CARD */}
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* HEADER */}
          <div className="bg-blue-950 text-white px-6 sm:px-7 py-8 text-center">

            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-300" />
              </div>
            </div>

            <h1 className="text-2xl font-black">
              Agent / Broker Registration
            </h1>

            <p className="mt-2 text-sm text-blue-200">
              Create your professional BREA 88 Realty account.
            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleRegister}
            className="p-5 sm:p-7 space-y-5"
          >

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* FULL NAME */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Full Name
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white transition overflow-hidden">

                <div className="px-4 text-slate-400">
                  <User className="w-5 h-5" />
                </div>

                <input
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* ROLE */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Account Type
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none text-sm focus:border-blue-600 focus:bg-white transition"
              >
                <option value="Agent">
                  Real Estate Agent
                </option>

                <option value="Broker">
                  Real Estate Broker
                </option>
              </select>

            </div>

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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="agent@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* PHONE */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Phone Number
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white transition overflow-hidden">

                <div className="px-4 text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>

                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+63"
                  autoComplete="tel"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* CONFIRM PASSWORD */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Confirm Password
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white transition overflow-hidden">

                <div className="px-4 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  required
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm"
                />

              </div>

            </div>

            {/* REGISTER */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >

              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Agent Account
                </>
              )}

            </button>

            {/* LOGIN */}
            <div className="pt-4 border-t border-slate-100 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?
              </p>

              <button
                type="button"
                onClick={() => router.push('/agent/login')}
                className="mt-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition"
              >
                Sign in instead
              </button>

            </div>

          </form>

        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          BREA 88 REALTY • Agent Portal
        </p>

      </div>

    </main>
  );
}

