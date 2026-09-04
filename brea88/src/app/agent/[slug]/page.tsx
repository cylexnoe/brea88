'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  X,
} from 'lucide-react';

interface Agent {
  id: number;
  fullName: string;
  email: string;
  role: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  facebook?: string | null;
  messenger?: string | null;
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Status = 'idle' | 'success' | 'error';

export default function AgentProfilePage({
  params,
}: PageProps) {
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInquiry, setShowInquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { slug } = await params;

        const response = await fetch(
          `/api/agent/profile/${encodeURIComponent(slug)}`,
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || 'Profile not found.'
          );
        }

        if (mounted) {
          setAgent(data.agent);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Profile not found.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params]);

  const openInquiry = () => {
    setStatus('idle');

    setForm({
      name: '',
      email: '',
      phone: '',
      message: '',
    });

    setShowInquiry(true);
  };

  const submitInquiry = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!agent?.slug) return;

    setSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          agentSlug: agent.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || 'Failed to send inquiry.'
        );
      }

      setStatus('success');

      setForm({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071936]">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-white/50">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !agent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071936] px-6 text-white">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Building2 className="h-7 w-7 text-slate-500" />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Profile Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              'This Agent or Broker profile is not available.'}
          </p>

          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#ead9b8]"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const role = agent.role === 'Broker' ? 'Broker' : 'Agent';

  const initials = agent.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* =========================================================
          HERO
      ========================================================== */}
      <div className="relative overflow-hidden bg-[#071936]">
        {/* Background effects */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-[#c9a96e]/10 blur-3xl" />

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/40 to-transparent" />

        {/* Header */}
        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />

            <span>Back</span>
          </button>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ead9b8]">
              BREA 88 REALTY
            </p>

            <p className="mt-1 text-xs text-white/40">
              Official {role} Profile
            </p>
          </div>
        </header>

        {/* Profile Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-10">
          <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
            {/* Profile Image */}
            <div className="flex justify-center lg:justify-start">
              {agent.profileImage ? (
                <div className="relative">
                  <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-white/20 to-[#c9a96e]/20 blur-sm" />

                  <img
                    src={agent.profileImage}
                    alt={agent.fullName}
                    className="relative h-28 w-28 rounded-[1.75rem] border-4 border-white/15 object-cover shadow-2xl sm:h-36 sm:w-36"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-4xl font-black text-white shadow-2xl sm:h-36 sm:w-36">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ead9b8]/20 bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ead9b8]">
                <Building2 className="h-3.5 w-3.5" />

                {role}
              </span>

              <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                {agent.fullName}
              </h1>

              {agent.bio && (
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base lg:mx-0">
                  {agent.bio}
                </p>
              )}

              {/* Profile Badges */}
              <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />

                  Verified Profile
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/50">
                  <Building2 className="h-3.5 w-3.5 text-[#c9a96e]" />

                  BREA 88 REALTY
                </span>
              </div>
            </div>

            {/* Inquiry Button */}
            <div className="flex justify-center lg:justify-end">
              <button
                onClick={openInquiry}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#071936] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ead9b8] active:translate-y-0 sm:w-auto"
              >
                <Send className="h-4 w-4" />

                Send Inquiry
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <section className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.8fr_1.2fr]">
        {/* =======================================================
            LEFT COLUMN
        ======================================================== */}
        <aside className="space-y-5">
          {/* Contact Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Professional Contact
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Get in touch
                </h2>
              </div>

              {/* Active Badge */}
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Active
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {/* Email */}
              <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Mail className="h-5 w-5 text-[#071936]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-700">
                    {agent.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3.5 transition hover:bg-[#faf7ef]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Phone className="h-5 w-5 text-[#071936]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {agent.phone}
                    </p>
                  </div>
                </a>
              )}

              {/* Location */}
              {agent.address && (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <MapPin className="h-5 w-5 text-[#c9a96e]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {agent.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Buttons */}
            {(agent.messenger || agent.facebook) && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {agent.messenger && (
                  <a
                    href={agent.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    <MessageCircle className="h-4 w-4" />

                    Messenger
                  </a>
                )}

                {agent.facebook && (
                  <a
                    href={agent.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"
                  >
                    <ExternalLink className="h-4 w-4" />

                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Marketplace CTA */}
          <div className="relative overflow-hidden rounded-3xl border border-[#ead9b8] bg-[#faf7ef] p-5 sm:p-6">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#c9a96e]/10 blur-2xl" />

            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b7b3f]">
                Looking for a property?
              </p>

              <h2 className="mt-2 text-xl font-black text-[#071936]">
                Browse available properties
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Explore properties available through BREA 88 REALTY
                and contact our team for assistance.
              </p>

              <button
                onClick={() => router.push('/marketplace')}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Building2 className="h-4 w-4" />

                View Marketplace
              </button>
            </div>
          </div>
        </aside>

        {/* =======================================================
            RIGHT COLUMN
        ======================================================== */}
        <div className="space-y-5">
          {/* About Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a96e]">
                Professional Profile
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                About {agent.fullName.split(' ')[0]}
              </h2>
            </div>

            <div className="mt-6 h-px bg-slate-100" />

            <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base">
              {agent.bio ||
                `Connect with ${agent.fullName}, an official ${role.toLowerCase()} of BREA 88 REALTY. For property inquiries, viewing requests, and real estate assistance, feel free to get in touch.`}
            </p>

            {/* Professional Status */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Position
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#c9a96e]" />

                  <p className="text-sm font-black text-slate-900">
                    {role}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  <p className="text-sm font-black text-slate-900">
                    Active & Verified
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-[#071936] p-6 text-white shadow-[0_20px_50px_rgba(7,25,54,0.18)] sm:p-8">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#c9a96e]/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">
                BREA 88 REALTY
              </p>

              <h2 className="mt-2 max-w-xl text-2xl font-black sm:text-3xl">
                Need help with your next property?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Send an inquiry to {agent.fullName} and our team
                will help you with your property needs.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={openInquiry}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#071936] transition hover:-translate-y-0.5 hover:bg-[#ead9b8]"
                >
                  <Send className="h-4 w-4" />

                  Send Inquiry
                </button>

                <button
                  onClick={() => router.push('/marketplace')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  <Building2 className="h-4 w-4" />

                  Browse Properties
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="border-t border-slate-200 bg-white px-4 py-7 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#071936]">
          BREA 88 REALTY
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Service with a Heart • Official {role} Profile
        </p>
      </footer>

      {/* =========================================================
          INQUIRY MODAL
      ========================================================== */}
      {showInquiry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !submitting
            ) {
              setShowInquiry(false);
            }
          }}
        >
          <div className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl sm:rounded-[2rem]">
            {/* Close */}
            <button
              type="button"
              onClick={() =>
                !submitting && setShowInquiry(false)
              }
              disabled={submitting}
              aria-label="Close inquiry"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="relative overflow-hidden bg-[#071936] p-6 text-white sm:p-7">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">
                  BREA 88 REALTY
                </p>

                <h2 className="mt-2 pr-10 text-2xl font-black">
                  Contact {role}
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/60">
                  Your message will be securely routed to{' '}
                  {agent.fullName}.
                </p>
              </div>
            </div>

            {/* Success */}
            {status === 'success' ? (
              <div className="p-7 text-center sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  Inquiry Sent
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Thank you. Your inquiry has been submitted
                  successfully. {agent.fullName} will get back to
                  you soon.
                </p>

                <button
                  onClick={() => setShowInquiry(false)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071936] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Inquiry Form */
              <form
                onSubmit={submitInquiry}
                className="space-y-4 p-6 sm:p-7"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="inquiry-name"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Full Name
                  </label>

                  <input
                    id="inquiry-name"
                    required
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="inquiry-email"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email Address
                  </label>

                  <input
                    id="inquiry-email"
                    required
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="inquiry-phone"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Contact Number
                  </label>

                  <input
                    id="inquiry-phone"
                    required
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Message
                  </label>

                  <textarea
                    id="inquiry-message"
                    required
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        message: event.target.value,
                      })
                    }
                    placeholder="Tell us what property or assistance you are looking for..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Error */}
                {status === 'error' && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
                  >
                    We could not send your inquiry. Please check
                    your details and try again.
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />

                      Submit Inquiry
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] leading-5 text-slate-400">
                  Your inquiry will be securely routed to this{' '}
                  {role.toLowerCase()} through BREA 88 REALTY.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}