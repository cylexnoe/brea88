'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function ProfileSecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/agent/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || 'Unable to change password.');
        return;
      }

      setMessage('Password changed successfully. Your session has been refreshed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const passwordInput = (
    value: string,
    setter: (value: string) => void,
    visible: boolean,
    toggle: () => void,
    placeholder: string
  ) => (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => setter(event.target.value)}
        placeholder={placeholder}
        autoComplete={placeholder === 'Current password' ? 'current-password' : 'new-password'}
        required
        minLength={8}
        maxLength={128}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="bg-slate-950 px-5 py-7 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c9a96e]/15 text-[#c9a96e]">
                <ShieldCheck size={25} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Account Security</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">Change Password</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Keep your BREA 88 Agent/Broker account protected with a strong password.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {message && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Current password</label>
                {passwordInput(currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent((v) => !v), 'Current password')}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">New password</label>
                  {passwordInput(newPassword, setNewPassword, showNew, () => setShowNew((v) => !v), 'New password')}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Confirm new password</label>
                  {passwordInput(confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm((v) => !v), 'Confirm new password')}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="mb-2 flex items-center gap-2 font-bold text-slate-800">
                  <KeyRound size={17} /> Password requirements
                </div>
                <ul className="space-y-1 pl-5 text-xs leading-5 sm:text-sm">
                  <li>At least 8 characters</li>
                  <li>Maximum 128 characters</li>
                  <li>Contains at least one letter and one number</li>
                  <li>Must be different from your current password</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                {saving ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
