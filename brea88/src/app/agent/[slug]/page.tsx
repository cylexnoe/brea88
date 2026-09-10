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

  const openAgentMarketplace = () => {
    if (!agent?.slug) {
      router.push('/marketplace');
      return;
    }

    router.push(
      `/marketplace?agent=${encodeURIComponent(agent.slug)}`
    );
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061329] px-4">
        <MapBackground />

        <div className="relative z-20 flex animate-[fadeInUp_0.7s_ease-out_both] flex-col items-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#071936]/80 shadow-2xl backdrop-blur-xl sm:h-16 sm:w-16">
            <div className="absolute inset-0 rounded-2xl bg-[#d6b77a]/10 blur-xl" />

            <Loader2 className="relative h-6 w-6 animate-spin text-[#d6b77a] sm:h-7 sm:w-7" />
          </div>

          <p className="mt-4 text-xs font-medium text-white/50 sm:text-sm">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !agent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061329] px-5 text-white">
        <MapBackground />

        <div className="relative z-20 w-full max-w-md animate-[fadeInUp_0.8s_ease-out_both] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl sm:h-16 sm:w-16">
            <Building2 className="h-6 w-6 text-white/40 sm:h-7 sm:w-7" />
          </div>

          <h1 className="mt-5 text-xl font-black sm:text-2xl">
            Profile Not Found
          </h1>

          <p className="mt-2 text-xs leading-6 text-white/45 sm:text-sm">
            {error ||
              'This Agent or Broker profile is not available.'}
          </p>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#061329] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#ead9b8] hover:shadow-xl sm:px-6 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
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
    <>
      <main className="relative min-h-screen overflow-hidden bg-[#061329] px-3 py-4 sm:px-6 sm:py-10">
        <MapBackground />

        {/* =====================================================
            PROFILE
        ====================================================== */}

        <section className="relative z-20 mx-auto mt-2 w-full max-w-2xl sm:mt-8">
          <div className="profile-card relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/[0.96] shadow-[0_25px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:shadow-[0_30px_100px_rgba(0,0,0,0.45)]">

            {/* Premium background effects */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="profile-light-sweep absolute -left-[120%] top-0 h-full w-[75%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="absolute left-1/2 top-0 h-32 w-56 -translate-x-1/2 rounded-full bg-[#d6b77a]/10 blur-3xl sm:h-40 sm:w-72" />

              <div className="absolute -right-24 top-24 h-48 w-48 rounded-full bg-blue-100/30 blur-3xl sm:-right-32 sm:h-64 sm:w-64" />

              <div className="absolute -left-24 bottom-16 h-48 w-48 rounded-full bg-[#ead9b8]/20 blur-3xl sm:-left-32 sm:h-64 sm:w-64" />
            </div>

            {/* Top accent */}

            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#d6b77a]/70 to-transparent sm:inset-x-8" />

            <div className="relative px-4 pb-6 pt-7 sm:px-9 sm:pb-9 sm:pt-10">

              {/* =================================================
                  PROFILE IMAGE
              ================================================== */}

              <div className="profile-element profile-element-1 flex justify-center">
                <div className="relative">

                  {/* Outer orbit */}

                  <div className="profile-orbit absolute -inset-3 rounded-full border border-[#d6b77a]/20 sm:-inset-4" />

                  <div className="profile-orbit profile-orbit-two absolute -inset-5 rounded-full border border-blue-200/20 sm:-inset-6" />

                  {/* Gold rotating ring */}

                  <div className="profile-ring absolute -inset-2.5 rounded-full sm:-inset-3" />

                  {/* Image glow */}

                  <div className="absolute -inset-5 rounded-full bg-[#d6b77a]/10 blur-xl sm:-inset-7 sm:blur-2xl" />

                  <div className="relative rounded-full bg-white p-1 shadow-[0_15px_35px_rgba(7,25,54,0.18)]">

                    {agent.profileImage ? (
                      <img
                        src={agent.profileImage}
                        alt={agent.fullName}
                        className="profile-image h-24 w-24 rounded-full object-cover shadow-[0_12px_30px_rgba(7,25,54,0.18)] sm:h-36 sm:w-36"
                      />
                    ) : (
                      <div className="profile-image flex h-24 w-24 items-center justify-center rounded-full bg-[#071936] text-2xl font-black text-white shadow-[0_12px_30px_rgba(7,25,54,0.18)] sm:h-36 sm:w-36 sm:text-3xl">
                        {initials}
                      </div>
                    )}

                  </div>

                  {/* Online indicator */}

                  <div className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 shadow-lg sm:bottom-1 sm:right-1 sm:h-7 sm:w-7 sm:border-4">
                    <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-white sm:h-2 sm:w-2" />
                  </div>

                </div>
              </div>

              {/* =================================================
                  NAME
              ================================================== */}

              <div className="profile-element profile-element-2 mt-5 text-center sm:mt-7">

                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-5 bg-gradient-to-r from-transparent to-[#d6b77a] sm:w-8" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#b08a48] sm:text-[9px] sm:tracking-[0.22em]">
                    BREA 88 REALTY
                  </span>

                  <span className="h-px w-5 bg-gradient-to-l from-transparent to-[#d6b77a] sm:w-8" />
                </div>

                <h1 className="profile-name mt-2 break-words px-2 text-xl font-black leading-tight tracking-tight text-[#071936] sm:mt-3 sm:text-3xl">
                  {agent.fullName}
                </h1>

                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b08a48] sm:mt-2 sm:text-sm sm:tracking-[0.18em]">
                  {role}
                </p>

              </div>

              {/* =================================================
                  BIO
              ================================================== */}

              {agent.bio && (
                <div className="profile-element profile-element-3 mx-auto mt-5 max-w-xl sm:mt-6">
                  <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:rounded-2xl sm:px-5 sm:py-4">

                    <div className="absolute left-1/2 top-0 h-px w-12 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d6b77a]/60 to-transparent sm:w-16" />

                    <p className="text-center text-xs leading-6 text-slate-600 sm:text-base sm:leading-7">
                      {agent.bio}
                    </p>

                  </div>
                </div>
              )}

              {/* =================================================
                  CONTACT
              ================================================== */}

              <div className="mt-5 space-y-2 sm:mt-7 sm:space-y-2.5">

                {/* Email */}

                <div className="profile-element profile-element-4 contact-card group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-all duration-500 hover:-translate-y-1 hover:border-[#ead9b8] hover:bg-[#faf8f2] hover:shadow-[0_12px_30px_rgba(7,25,54,0.08)] sm:rounded-2xl sm:p-3.5">

                  <div className="contact-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-all duration-500 group-hover:bg-[#071936] group-hover:shadow-lg sm:h-10 sm:w-10 sm:rounded-xl">
                    <Mail className="h-4 w-4 text-[#071936] transition-colors duration-500 group-hover:text-[#ead9b8]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px] sm:tracking-[0.15em]">
                      Email
                    </p>

                    <p className="mt-0.5 break-all text-xs font-semibold text-slate-700 sm:text-sm">
                      {agent.email}
                    </p>
                  </div>

                </div>

                {/* Phone */}

                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="profile-element profile-element-5 contact-card group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-all duration-500 hover:-translate-y-1 hover:border-[#ead9b8] hover:bg-[#faf8f2] hover:shadow-[0_12px_30px_rgba(7,25,54,0.08)] sm:rounded-2xl sm:p-3.5"
                  >
                    <div className="contact-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-all duration-500 group-hover:bg-[#071936] group-hover:shadow-lg sm:h-10 sm:w-10 sm:rounded-xl">
                      <Phone className="h-4 w-4 text-[#071936] transition-colors duration-500 group-hover:text-[#ead9b8]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px] sm:tracking-[0.15em]">
                        Phone
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-slate-700 sm:text-sm">
                        {agent.phone}
                      </p>
                    </div>
                  </a>
                )}

                {/* Location */}

                {agent.address && (
                  <div className="profile-element profile-element-6 contact-card group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-all duration-500 hover:-translate-y-1 hover:border-[#ead9b8] hover:bg-[#faf8f2] hover:shadow-[0_12px_30px_rgba(7,25,54,0.08)] sm:rounded-2xl sm:p-3.5">

                    <div className="contact-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-all duration-500 group-hover:bg-[#071936] group-hover:shadow-lg sm:h-10 sm:w-10 sm:rounded-xl">
                      <MapPin className="h-4 w-4 text-[#b08a48] transition-colors duration-500 group-hover:text-[#ead9b8]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px] sm:tracking-[0.15em]">
                        Location
                      </p>

                      <p className="mt-0.5 break-words text-xs font-semibold leading-5 text-slate-700 sm:text-sm">
                        {agent.address}
                      </p>
                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  MESSENGER + FACEBOOK
              ================================================== */}

              {(agent.messenger || agent.facebook) && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-2.5">

                  {agent.messenger && (
                    <a
                      href={agent.messenger}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-element profile-element-7 premium-button group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#071936] px-4 py-2.5 text-xs font-bold text-white shadow-lg transition duration-500 hover:-translate-y-1 hover:bg-[#10294e] hover:shadow-[0_15px_30px_rgba(7,25,54,0.25)] sm:min-h-12 sm:text-sm"
                    >
                      <span className="button-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <MessageCircle className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110" />

                      <span className="relative">
                        Messenger
                      </span>
                    </a>
                  )}

                  {agent.facebook && (
                    <a
                      href={agent.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-element profile-element-8 premium-button group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition duration-500 hover:-translate-y-1 hover:border-[#c9a96e] hover:bg-[#faf7ef] hover:shadow-[0_12px_30px_rgba(7,25,54,0.08)] sm:min-h-12 sm:text-sm"
                    >
                      <span className="button-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#d6b77a]/10 to-transparent" />

                      <ExternalLink className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />

                      <span className="relative">
                        Facebook
                      </span>
                    </a>
                  )}

                </div>
              )}

              {/* =================================================
                  VIEW PROPERTIES
              ================================================== */}

              <div className="profile-element profile-element-9 mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={openAgentMarketplace}
                  className="premium-main-button group relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#071936] px-5 py-3 text-xs font-black text-white shadow-[0_10px_25px_rgba(7,25,54,0.2)] transition duration-500 hover:-translate-y-1 hover:bg-[#10294e] hover:shadow-[0_18px_40px_rgba(7,25,54,0.3)] active:translate-y-0 sm:min-h-14 sm:gap-2.5 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
                >
                  <span className="button-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <span className="relative z-10 flex items-center gap-2">
                    <Building2 className="h-4 w-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 sm:h-5 sm:w-5" />

                    View Properties
                  </span>
                </button>
              </div>

              {/* =================================================
                  SEND INQUIRY
              ================================================== */}

              <div className="profile-element profile-element-10 mt-2.5 sm:mt-3">
                <button
                  type="button"
                  onClick={openInquiry}
                  className="premium-main-button group relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#c9a96e] bg-gradient-to-r from-[#ead9b8] to-[#d6b77a] px-5 py-3 text-xs font-black text-[#071936] shadow-[0_10px_25px_rgba(201,169,110,0.2)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(201,169,110,0.3)] active:translate-y-0 sm:min-h-14 sm:gap-2.5 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-sm"
                >
                  <span className="button-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                  <span className="relative z-10 flex items-center gap-2">
                    <Send className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-rotate-3 sm:h-5 sm:w-5" />

                    Send Inquiry
                  </span>
                </button>
              </div>

              {/* =================================================
                  BOTTOM ACCENT
              ================================================== */}

              <div className="profile-element profile-element-11 mt-5 flex items-center justify-center gap-2 sm:mt-7 sm:gap-3">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-slate-200 sm:w-16" />

                <span className="h-1.5 w-1.5 rounded-full bg-[#d6b77a] shadow-[0_0_10px_rgba(214,183,122,0.6)]" />

                <span className="h-px w-10 bg-gradient-to-l from-transparent to-slate-200 sm:w-16" />
              </div>

            </div>

            {/* Bottom premium line */}

            <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d6b77a]/50 to-transparent sm:inset-x-8" />
          </div>

          <p className="profile-footer-text mt-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 sm:mt-5 sm:text-[10px] sm:tracking-[0.22em]">
            BREA 88 REALTY
          </p>
        </section>
      </main>

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
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e] disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Modal Header */}

            <div className="relative overflow-hidden bg-[#071936] p-5 text-white sm:p-7">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ead9b8] sm:text-[10px]">
                  BREA 88 REALTY
                </p>

                <h2 className="mt-2 pr-8 text-xl font-black sm:text-2xl">
                  Contact {role}
                </h2>

                <p className="mt-1 text-xs leading-6 text-white/60 sm:text-sm">
                  Your message will be securely routed to{' '}
                  {agent.fullName}.
                </p>
              </div>
            </div>

            {/* Success */}

            {status === 'success' ? (
              <div className="p-6 text-center sm:p-9">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:h-16 sm:w-16">
                  <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-950 sm:text-xl">
                  Inquiry Sent
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                  Thank you. Your inquiry has been submitted
                  successfully. {agent.fullName} will get back to
                  you soon.
                </p>

                <button
                  type="button"
                  onClick={() => setShowInquiry(false)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071936] px-6 py-3 text-xs font-bold text-white transition hover:bg-slate-800 sm:text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={submitInquiry}
                className="space-y-4 p-5 sm:p-7"
              >
                {/* Name */}

                <div>
                  <label
                    htmlFor="inquiry-name"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs"
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
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10 sm:min-h-12"
                  />
                </div>

                {/* Email */}

                <div>
                  <label
                    htmlFor="inquiry-email"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs"
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
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10 sm:min-h-12"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label
                    htmlFor="inquiry-phone"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs"
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
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10 sm:min-h-12"
                  />
                </div>

                {/* Message */}

                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs"
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
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700 sm:text-sm"
                  >
                    We could not send your inquiry. Please check
                    your details and try again.
                  </div>
                )}

                {/* Submit */}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:text-sm"
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

                <p className="text-center text-[9px] leading-5 text-slate-400 sm:text-[10px]">
                  Your inquiry will be securely routed to this{' '}
                  {role.toLowerCase()} through BREA 88 REALTY.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          PREMIUM ANIMATION CSS
      ========================================================== */}

      <style jsx global>{`
        /* =====================================================
           MAP
        ====================================================== */

        .map-perspective {
          position: absolute;
          left: -20%;
          top: 20%;
          width: 140%;
          height: 100%;
          transform: perspective(900px) rotateX(62deg)
            rotateZ(-7deg) scale(1.15);
          transform-origin: center center;
          opacity: 0.65;
        }

        .map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              rgba(101, 135, 177, 0.18) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(101, 135, 177, 0.18) 1px,
              transparent 1px
            );
          background-size: 70px 70px;
          animation: mapMove 14s linear infinite;
        }

        .map-grid-small {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              rgba(201, 169, 110, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(201, 169, 110, 0.08) 1px,
              transparent 1px
            );
          background-size: 28px 28px;
          animation: mapMoveSmall 10s linear infinite;
        }

        .road {
          position: absolute;
          height: 5px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(111, 151, 201, 0.5),
            rgba(234, 217, 184, 0.75),
            rgba(111, 151, 201, 0.5),
            transparent
          );
          box-shadow: 0 0 15px rgba(100, 145, 200, 0.18);
          animation: roadGlow 5s ease-in-out infinite;
        }

        .road-one {
          width: 70%;
          left: 2%;
          top: 25%;
          transform: rotate(16deg);
        }

        .road-two {
          width: 62%;
          right: -5%;
          top: 48%;
          transform: rotate(-12deg);
          animation-delay: -1s;
        }

        .road-three {
          width: 58%;
          left: 14%;
          top: 68%;
          transform: rotate(-24deg);
          animation-delay: -2s;
        }

        .road-four {
          width: 45%;
          left: 32%;
          top: 10%;
          transform: rotate(48deg);
          opacity: 0.7;
          animation-delay: -3s;
        }

        .road-five {
          width: 42%;
          right: 12%;
          top: 78%;
          transform: rotate(28deg);
          opacity: 0.55;
          animation-delay: -4s;
        }

        .map-block {
          position: absolute;
          border: 1px solid rgba(99, 135, 175, 0.14);
          background: rgba(18, 43, 75, 0.2);
          box-shadow: inset 0 0 30px rgba(20, 50, 90, 0.08);
        }

        .block-one {
          width: 150px;
          height: 110px;
          left: 14%;
          top: 32%;
          transform: rotate(10deg);
        }

        .block-two {
          width: 210px;
          height: 130px;
          right: 14%;
          top: 23%;
          transform: rotate(-8deg);
        }

        .block-three {
          width: 170px;
          height: 125px;
          left: 28%;
          bottom: 14%;
          transform: rotate(-6deg);
        }

        .block-four {
          width: 130px;
          height: 95px;
          right: 28%;
          bottom: 7%;
          transform: rotate(12deg);
        }

        .map-marker {
          position: absolute;
          width: 15px;
          height: 15px;
          border-radius: 9999px;
          background: #d6b77a;
          border: 3px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            0 0 0 5px rgba(214, 183, 122, 0.12),
            0 0 25px rgba(214, 183, 122, 0.7);
          animation: markerPulse 2.5s ease-in-out infinite;
        }

        .marker-one {
          left: 24%;
          top: 35%;
        }

        .marker-two {
          left: 63%;
          top: 25%;
          animation-delay: -0.8s;
        }

        .marker-three {
          left: 48%;
          top: 61%;
          animation-delay: -1.4s;
        }

        .marker-four {
          left: 77%;
          top: 69%;
          animation-delay: -2s;
        }

        .marker-five {
          left: 16%;
          top: 71%;
          animation-delay: -1.1s;
        }

        .marker-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 42px;
          height: 42px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(214, 183, 122, 0.35);
          border-radius: 9999px;
          animation: markerRing 2.5s ease-out infinite;
        }

        .map-glow {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 9999px;
          filter: blur(100px);
          opacity: 0.2;
        }

        .map-glow-one {
          left: -100px;
          top: -120px;
          background: rgba(37, 99, 235, 0.65);
          animation: glowFloat 12s ease-in-out infinite;
        }

        .map-glow-two {
          right: -120px;
          bottom: -150px;
          background: rgba(201, 169, 110, 0.4);
          animation: glowFloat 15s ease-in-out infinite reverse;
        }

        .map-glow-three {
          left: 42%;
          top: 38%;
          width: 300px;
          height: 300px;
          background: rgba(38, 91, 150, 0.3);
          animation: glowFloat 18s ease-in-out infinite;
        }

        .map-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              circle at center,
              transparent 20%,
              rgba(3, 12, 28, 0.18) 55%,
              rgba(3, 12, 28, 0.78) 100%
            );
        }

        .map-noise {
          position: absolute;
          inset: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
        }

        /* =====================================================
           PROFILE
        ====================================================== */

        .profile-card {
          animation: profileEnter 0.95s
            cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center top;
        }

        .profile-light-sweep {
          animation: lightSweep 5.5s
            cubic-bezier(0.22, 1, 0.36, 1) 1.1s both;
        }

        .profile-orbit {
          animation: orbitFloat 5s ease-in-out infinite;
        }

        .profile-orbit-two {
          animation-duration: 7s;
          animation-delay: -2s;
        }

        .profile-ring {
          background: conic-gradient(
            from 0deg,
            rgba(176, 138, 72, 0.2),
            rgba(234, 217, 184, 0.95),
            rgba(176, 138, 72, 0.2),
            rgba(234, 217, 184, 0.95),
            rgba(176, 138, 72, 0.2)
          );
          animation: ringRotate 8s linear infinite;
          filter: blur(1px);
        }

        .profile-image {
          animation: imageEnter 1s
            cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }

        .profile-name {
          animation: nameReveal 0.8s
            cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
        }

        .profile-element {
          opacity: 0;
          animation: elementReveal 0.75s
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .profile-element-1 {
          animation-delay: 0.05s;
        }

        .profile-element-2 {
          animation-delay: 0.2s;
        }

        .profile-element-3 {
          animation-delay: 0.35s;
        }

        .profile-element-4 {
          animation-delay: 0.45s;
        }

        .profile-element-5 {
          animation-delay: 0.52s;
        }

        .profile-element-6 {
          animation-delay: 0.59s;
        }

        .profile-element-7 {
          animation-delay: 0.66s;
        }

        .profile-element-8 {
          animation-delay: 0.72s;
        }

        .profile-element-9 {
          animation-delay: 0.8s;
        }

        .profile-element-10 {
          animation-delay: 0.88s;
        }

        .profile-element-11 {
          animation-delay: 0.96s;
        }

        .profile-footer-text {
          animation: footerReveal 1s
            cubic-bezier(0.22, 1, 0.36, 1) 1.2s both;
        }

        .contact-card {
          transform: translateZ(0);
        }

        .premium-button,
        .premium-main-button {
          transform: translateZ(0);
        }

        .premium-button:hover .button-shine,
        .premium-main-button:hover .button-shine {
          animation: buttonShine 0.9s
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* =====================================================
           KEYFRAMES
        ====================================================== */

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes profileEnter {
          0% {
            opacity: 0;
            transform:
              translateY(45px)
              scale(0.94)
              rotateX(5deg);
          }

          60% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1)
              rotateX(0deg);
          }
        }

        @keyframes imageEnter {
          from {
            opacity: 0;
            transform: scale(0.72) rotate(-8deg);
          }

          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes nameReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes elementReveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes footerReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ringRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbitFloat {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.05) rotate(5deg);
            opacity: 0.9;
          }
        }

        @keyframes lightSweep {
          0% {
            transform: translateX(-20%) skewX(-18deg);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          55% {
            opacity: 0.6;
          }

          100% {
            transform: translateX(250%) skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes buttonShine {
          from {
            transform: translateX(-120%);
          }

          to {
            transform: translateX(120%);
          }
        }

        @keyframes statusPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.7;
          }

          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        @keyframes mapMove {
          from {
            background-position: 0 0;
          }

          to {
            background-position: 70px 70px;
          }
        }

        @keyframes mapMoveSmall {
          from {
            background-position: 0 0;
          }

          to {
            background-position: -28px 28px;
          }
        }

        @keyframes roadGlow {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 0.9;
          }
        }

        @keyframes markerPulse {
          0%,
          100% {
            transform: scale(0.85);
            box-shadow:
              0 0 0 4px rgba(214, 183, 122, 0.08),
              0 0 15px rgba(214, 183, 122, 0.35);
          }

          50% {
            transform: scale(1.15);
            box-shadow:
              0 0 0 9px rgba(214, 183, 122, 0.05),
              0 0 30px rgba(214, 183, 122, 0.8);
          }
        }

        @keyframes markerRing {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(0.45);
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        @keyframes glowFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(35px, -30px, 0) scale(1.12);
          }
        }

        /* =====================================================
           MOBILE
        ====================================================== */

        @media (max-width: 640px) {
          .map-perspective {
            left: -80%;
            width: 260%;
            transform:
              perspective(700px)
              rotateX(62deg)
              rotateZ(-7deg)
              scale(1);
          }

          .map-grid {
            background-size: 55px 55px;
          }

          .map-grid-small {
            background-size: 24px 24px;
          }

          .map-block {
            opacity: 0.55;
          }

          .map-glow {
            transform: scale(0.7);
          }

          .profile-card {
            box-shadow:
              0 20px 65px rgba(0, 0, 0, 0.42);
          }

          .profile-light-sweep {
            display: none;
          }

          .profile-orbit {
            animation-duration: 6s;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ====================================================== */

        @media (prefers-reduced-motion: reduce) {
          .map-grid,
          .map-grid-small,
          .road,
          .map-marker,
          .marker-ring,
          .map-glow,
          .profile-ring,
          .profile-orbit,
          .profile-light-sweep,
          .profile-card,
          .profile-image,
          .profile-name,
          .profile-element,
          .profile-footer-text,
          .premium-button,
          .premium-main-button,
          .button-shine {
            animation: none !important;
            transition: none !important;
          }

          .profile-element,
          .profile-footer-text {
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
}

/* =============================================================
   3D MAP BACKGROUND COMPONENT
============================================================= */

function MapBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">

      {/* Deep map background */}

      <div className="absolute inset-0 bg-[#061329]" />

      {/* Large atmospheric glows */}

      <div className="map-glow map-glow-one" />
      <div className="map-glow map-glow-two" />
      <div className="map-glow map-glow-three" />

      {/* =======================================================
          3D MAP
      ======================================================== */}

      <div className="map-perspective">

        {/* Main map grid */}

        <div className="map-grid" />

        {/* Smaller streets/grid */}

        <div className="map-grid-small" />

        {/* Roads */}

        <div className="road road-one" />
        <div className="road road-two" />
        <div className="road road-three" />
        <div className="road road-four" />
        <div className="road road-five" />

        {/* City blocks */}

        <div className="map-block block-one" />
        <div className="map-block block-two" />
        <div className="map-block block-three" />
        <div className="map-block block-four" />

        {/* Property markers */}

        <div className="map-marker marker-one">
          <span className="marker-ring" />
        </div>

        <div className="map-marker marker-two">
          <span className="marker-ring" />
        </div>

        <div className="map-marker marker-three">
          <span className="marker-ring" />
        </div>

        <div className="map-marker marker-four">
          <span className="marker-ring" />
        </div>

        <div className="map-marker marker-five">
          <span className="marker-ring" />
        </div>

      </div>

      {/* Dark cinematic overlay */}

      <div className="map-vignette" />

      {/* Subtle texture */}

      <div className="map-noise" />

      {/* Top cinematic fade */}

      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#061329] via-[#061329]/40 to-transparent" />

      {/* Bottom cinematic fade */}

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#061329] via-[#061329]/50 to-transparent" />

    </div>
  );
}

