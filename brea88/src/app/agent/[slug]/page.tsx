'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  MessageCircle,
  Building2,
  Mail,
  ExternalLink,
  Loader2,
  X,
  Send,
} from 'lucide-react';

interface Property {
  id: number;
  title: string;
  tag: string;
  price: string;
  location: string;
  image: string;
  images?: string[];
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
}

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

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

type SubmitStatus = 'idle' | 'success' | 'error';

export default function AgentProfilePage({
  params,
}: PageProps) {
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] =
    useState<SubmitStatus>('idle');

  const [form, setForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    prefer_location: '',
    message: '',
  });

  /*
   * ============================================================
   * LOAD AGENT PROFILE
   * ============================================================
   */

  useEffect(() => {
    const loadProfile = async () => {
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

        setAgent(data.agent);
        setProperties(data.properties || []);
      } catch (err) {
        console.error(
          'Failed to load agent profile:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Profile not found.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [params]);

  /*
   * ============================================================
   * OPEN INQUIRY FORM
   * ============================================================
   */

  const openInquiryForm = () => {
    setSubmitStatus('idle');

    setForm({
      name: '',
      email: '',
      contact_number: '',
      prefer_location: '',
      message: '',
    });

    setShowInquiryForm(true);
  };

  /*
   * ============================================================
   * CLOSE INQUIRY FORM
   * ============================================================
   */

  const closeInquiryForm = () => {
    if (isSubmitting) return;

    setShowInquiryForm(false);
    setSubmitStatus('idle');
  };

  /*
   * ============================================================
   * HANDLE FORM INPUT
   * ============================================================
   */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  /*
   * ============================================================
   * SUBMIT INQUIRY
   *
   * IMPORTANT:
   * - NO propertyId
   * - Agent is automatically determined by agent.slug
   * - Uses the same field names as /home
   * ============================================================
   */

  const handleSubmitInquiry = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!agent?.slug) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          contact_number: form.contact_number.trim(),
          prefer_location: form.prefer_location.trim(),
          message: form.message.trim(),

          // Automatically assign inquiry
          // to the current agent from /agent/[slug]
          agentSlug: agent.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || 'Failed to send inquiry.'
        );
      }

      setSubmitStatus('success');

      setForm({
        name: '',
        email: '',
        contact_number: '',
        prefer_location: '',
        message: '',
      });
    } catch (err) {
      console.error(
        'Agent inquiry submission error:',
        err
      );

      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !agent) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">
            Agent Not Found
          </h1>

          <p className="text-slate-400 mt-2">
            {error || 'This profile does not exist.'}
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-black" />

        <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* CONTENT */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16">

        <div className="w-full max-w-lg">

          {/* BRAND */}
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              BREA 88 REALTY
            </p>

            <p className="text-sm text-slate-500 mt-2">
              Official Agent Profile
            </p>
          </div>

          {/* AGENT CARD */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">

            {/* TOP */}
            <div className="relative px-6 pt-8 pb-7 sm:px-8 sm:pt-10">

              {/* PROFILE IMAGE */}
              <div className="flex justify-center">

                {agent.profileImage ? (
                  <img
                    src={agent.profileImage}
                    alt={agent.fullName}
                    className="h-28 w-28 rounded-full object-cover border-4 border-white/20 shadow-xl sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-900 border-4 border-white/10 shadow-xl sm:h-32 sm:w-32">
                    <span className="text-4xl font-black">
                      {agent.fullName
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}

              </div>

              {/* NAME */}
              <div className="text-center mt-5">

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                  <Building2 className="h-3.5 w-3.5" />
                  {agent.role}
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {agent.fullName}
                </h1>

                {agent.bio && (
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                    {agent.bio}
                  </p>
                )}

              </div>

              {/* CONTACT INFORMATION */}
              <div className="mt-7 space-y-3">

                {/* EMAIL */}
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Mail className="h-5 w-5 text-slate-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </p>

                    <p className="mt-0.5 truncate text-sm font-medium text-white">
                      {agent.email}
                    </p>
                  </div>

                </div>

                {/* PHONE */}
                {agent.phone && (
                  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Phone className="h-5 w-5 text-slate-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Phone
                      </p>

                      <p className="mt-0.5 text-sm font-medium text-white">
                        {agent.phone}
                      </p>
                    </div>

                  </div>
                )}

                {/* ADDRESS */}
                {agent.address && (
                  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <MapPin className="h-5 w-5 text-slate-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Address
                      </p>

                      <p className="mt-0.5 text-sm font-medium text-white">
                        {agent.address}
                      </p>
                    </div>

                  </div>
                )}

              </div>

              {/* CONTACT BUTTONS */}
              <div className="mt-6">

                {/* SEND INQUIRY */}
                <button
                  type="button"
                  onClick={openInquiryForm}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  Send Inquiry
                </button>

                {/* MESSENGER */}
                {agent.messenger && (
                  <a
                    href={agent.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Messenger
                  </a>
                )}

              </div>

              {/* FACEBOOK */}
              {agent.facebook && (
                <a
                  href={agent.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Facebook
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

            </div>

            {/* PROPERTY BUTTON */}
            <div className="border-t border-white/10 bg-black/20 p-5 sm:p-6">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/marketplace?agent=${encodeURIComponent(
                      agent.slug
                    )}`
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
              >
                <Building2 className="h-4 w-4" />
                View Properties
              </button>

              {properties.length > 0 && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  View {properties.length}{' '}
                  {properties.length === 1
                    ? 'property'
                    : 'properties'}
                </p>
              )}

            </div>

          </div>

          {/* FOOTER */}
          <p className="mt-6 text-center text-xs text-slate-600">
            BREA 88 REALTY • Official Agent Contact
          </p>

        </div>

      </section>

      {/* ============================================================
          INQUIRY MODAL
          SAME FORM AS /HOME
          NO PROPERTY SELECTION
          NO PROPERTY ID
      ============================================================ */}

      {showInquiryForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInquiryForm();
            }
          }}
        >

          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={closeInquiryForm}
              disabled={isSubmitting}
              aria-label="Close inquiry form"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* =====================================================
                INQUIRY FORM
                SAME DESIGN AS /HOME
            ====================================================== */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_50px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">

              <div className="pr-10">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Property Inquiry
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Send us a message
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill out the form below and our team will get back to you.
                </p>

              </div>

              {/* AGENT INFORMATION */}
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Sending inquiry to
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {agent.fullName}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {agent.email}
                </p>

              </div>

              {/* FORM */}
              <form
                onSubmit={handleSubmitInquiry}
                className="mt-8 space-y-5"
              >

                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="agent-contact-name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="agent-contact-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="agent-contact-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="agent-contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    maxLength={255}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* CONTACT NUMBER */}
                <div>
                  <label
                    htmlFor="agent-contact-number"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Contact Number
                  </label>

                  <input
                    id="agent-contact-number"
                    type="tel"
                    name="contact_number"
                    value={form.contact_number}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    maxLength={30}
                    placeholder="09XX XXX XXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* PREFERRED LOCATION */}
                <div>
                  <label
                    htmlFor="agent-prefer-location"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Preferred Location
                  </label>

                  <input
                    id="agent-prefer-location"
                    type="text"
                    name="prefer_location"
                    value={form.prefer_location}
                    onChange={handleChange}
                    required
                    autoComplete="address-level2"
                    maxLength={255}
                    placeholder="e.g. Cebu City, Mandaue, Lapu-Lapu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* MESSAGE */}
                <div>
                  <label
                    htmlFor="agent-contact-message"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Message
                  </label>

                  <textarea
                    id="agent-contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder="Tell us what you're looking for..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.message.length}/2000
                  </p>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Inquiry

                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </>
                  )}
                </button>

                {/* SUCCESS */}
                {submitStatus === 'success' &&
                  !isSubmitting && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                      ✓ Inquiry sent successfully! We'll get back to you soon.
                    </div>
                  )}

                {/* ERROR */}
                {submitStatus === 'error' &&
                  !isSubmitting && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                      ✕ Failed to send your inquiry. Please try again.
                    </div>
                  )}

                {/* PRIVACY / AGREEMENT */}
                <p className="text-center text-[11px] leading-5 text-slate-400">
                  By submitting this form, you agree to be contacted regarding
                  your inquiry.
                </p>

              </form>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}