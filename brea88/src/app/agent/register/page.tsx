'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  UserPlus,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

export default function AgentRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'Agent',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Registration failed.');
      }

      router.push('/agent/login');
    } catch (error) {
      console.error('Agent registration error:', error);
      setError(
        error instanceof Error ? error.message : 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400';
  const fieldClass =
    'group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10';

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.14),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <div className="w-full max-w-5xl">
          <button
            type="button"
            onClick={() => router.push('/agent/login')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/40">
            <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
              <div className="relative hidden overflow-hidden bg-blue-950 lg:flex">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/10" />
                <div className="relative flex w-full flex-col justify-between p-10 xl:p-12">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
                        <Building2 className="h-6 w-6 text-blue-950" />
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-[0.18em]">BREA 88</p>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-300">REALTY</p>
                      </div>
                    </div>

                    <div className="mt-16">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Join the Team</p>
                      <h2 className="mt-4 text-4xl font-black leading-tight xl:text-5xl">
                        Build trust.
                        <br />
                        Serve clients.
                        <br />
                        Grow together.
                      </h2>
                      <p className="mt-6 max-w-sm text-sm leading-7 text-blue-200">
                        Create your BREA 88 REALTY Agent account and build your professional presence.
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Professional public profile
                    </div>
                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Client inquiry workspace
                    </div>
                    <div className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle2 className="h-5 w-5 text-blue-300" />
                      Secure account access
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-5 py-7 text-slate-900 sm:px-9 sm:py-9 lg:px-12 xl:px-14">
                <div className="mb-7 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-[0.18em]">BREA 88</p>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-blue-900">REALTY</p>
                  </div>
                </div>

                <div className="mb-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">
                    <UserPlus className="h-4 w-4" />
                    Agent Registration
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Create your account</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Register as an Agent. Broker status is managed by an administrator.
                  </p>
                </div>

                {error && (
                  <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium leading-5 text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
                    <div className={fieldClass}>
                      <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><User className="h-5 w-5" /></div>
                      <input id="fullName" required name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Juan Dela Cruz" autoComplete="name" className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Account Type</label>
                    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-blue-800" />
                      <div>
                        <p className="text-sm font-bold text-blue-950">Real Estate Agent</p>
                        <p className="text-xs text-blue-800/70">An administrator may change your role to Broker later.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
                    <div className={fieldClass}>
                      <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Mail className="h-5 w-5" /></div>
                      <input id="email" required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="agent@example.com" autoComplete="email" className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
                    <div className={fieldClass}>
                      <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Phone className="h-5 w-5" /></div>
                      <input id="phone" required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+63 9XX XXX XXXX" autoComplete="tel" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                      <div className={fieldClass}>
                        <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Lock className="h-5 w-5" /></div>
                        <input id="password" required type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} className={inputClass} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="mr-2 rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">Confirm Password</label>
                      <div className={fieldClass}>
                        <div className="pl-4 text-slate-400 group-focus-within:text-blue-700"><Lock className="h-5 w-5" /></div>
                        <input id="confirmPassword" required type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" minLength={8} className={inputClass} />
                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="mr-2 rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating Account...</> : <><UserPlus className="h-5 w-5" /> Create Agent Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
                  <ShieldCheck className="h-4 w-4" /> Your account information is securely protected
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                  <p className="text-sm text-slate-500">Already have an account?</p>
                  <button type="button" onClick={() => router.push('/agent/login')} className="mt-2 text-sm font-bold text-blue-900 transition hover:text-blue-700">Sign in instead</button>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-500">© {new Date().getFullYear()} BREA 88 REALTY • Agent Portal</p>
        </div>
      </div>
    </main>
  );
}
