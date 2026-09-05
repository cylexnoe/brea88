'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';

type Role = 'Agent' | 'Broker';

export default function AdminCreateAccountPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Agent' as Role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

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
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        router.replace('/admin');
        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to create account.');
      }

      setSuccess(`${formData.role} account created successfully.`);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: formData.role,
      });
    } catch (submitError) {
      console.error('Admin account creation error:', submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create account.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10';
  const inputClass =
    'w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/agents')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              aria-label="Back to Agents and Brokers"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#030b1c] shadow-sm">
              <img
                src="/img/LOGO.png"
                alt="BREA 88 Realty"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900">
                BREA <span className="text-blue-600">88</span> REALTY
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck size={15} />
              Admin Only
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                <span className="h-px w-6 bg-[#c9a96e]" />
                Account Management
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Create Team Account
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create a secure Agent or Broker account. Registration is controlled by the administrator.
              </p>
            </div>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="relative hidden overflow-hidden bg-[#030b1c] p-10 text-white lg:block xl:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full border border-blue-400/10" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                <UserPlus className="h-6 w-6 text-blue-950" />
              </div>

              <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-blue-300">
                Administrator Control
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight xl:text-4xl">
                Build your team with control and confidence.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Only authenticated administrators can create Agent and Broker accounts through this workspace.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  <div>
                    <p className="text-sm font-bold">Agent or Broker role</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Choose the correct team role during creation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  <div>
                    <p className="text-sm font-bold">Secure password storage</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Passwords are hashed before being stored.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  <div>
                    <p className="text-sm font-bold">No self-registration</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Agents and Brokers cannot create accounts themselves.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Admin-only account creation</p>
                <p className="text-xs text-slate-500">Agent &amp; Broker management</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium leading-5 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium leading-5 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
                <div className={fieldClass}>
                  <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><User className="h-5 w-5" /></div>
                  <input id="fullName" required disabled={loading} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Juan Dela Cruz" autoComplete="name" className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-bold text-slate-700">Account Type</label>
                <div className="relative">
                  <select id="role" name="role" value={formData.role} onChange={handleChange} disabled={loading} className="h-[54px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-60">
                    <option value="Agent">Agent</option>
                    <option value="Broker">Broker</option>
                  </select>
                  <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
                <div className={fieldClass}>
                  <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Mail className="h-5 w-5" /></div>
                  <input id="email" required disabled={loading} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="agent@example.com" autoComplete="email" className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
                <div className={fieldClass}>
                  <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Phone className="h-5 w-5" /></div>
                  <input id="phone" required disabled={loading} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+63 9XX XXX XXXX" autoComplete="tel" className={inputClass} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Temporary Password</label>
                  <div className={fieldClass}>
                    <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Lock className="h-5 w-5" /></div>
                    <input id="password" required disabled={loading} type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} className={inputClass} />
                    <button type="button" disabled={loading} onClick={() => setShowPassword((value) => !value)} className="mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">Confirm Password</label>
                  <div className={fieldClass}>
                    <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Lock className="h-5 w-5" /></div>
                    <input id="confirmPassword" required disabled={loading} type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" minLength={8} className={inputClass} />
                    <button type="button" disabled={loading} onClick={() => setShowConfirmPassword((value) => !value)} className="mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating Account...</> : <><UserPlus className="h-5 w-5" /> Create {formData.role} Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4" /> Only authenticated administrators can use this form
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
