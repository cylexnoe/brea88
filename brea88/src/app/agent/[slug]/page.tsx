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
  CheckCircle2,
  AlertCircle,
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

export default function AgentProfilePage({
  params,
}: PageProps) {
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInquiryForm, setShowInquiryForm] =
    useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  const [submitSuccess, setSubmitSuccess] =
    useState('');

  /*
   * LOAD AGENT PROFILE
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
   * OPEN INQUIRY FORM
   */
  const openInquiryForm = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setShowInquiryForm(true);
  };

  /*
   * CLOSE INQUIRY FORM
   */
  const closeInquiryForm = () => {
    if (submitting) return;

    setShowInquiryForm(false);
    setSubmitError('');
    setSubmitSuccess('');
  };

  /*
   * HANDLE INPUT
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
  };

  /*
   * SUBMIT INQUIRY
   */
  const handleSubmitInquiry = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!agent) {
      setSubmitError(
        'Agent information is unavailable.'
      );
      return;
    }

    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      if (!form.name.trim()) {
        throw new Error(
          'Please enter your name.'
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          'Please enter your email address.'
        );
      }

      if (!form.phone.trim()) {
        throw new Error(
          'Please enter your phone number.'
        );
      }

      if (!form.message.trim()) {
        throw new Error(
          'Please enter your inquiry message.'
        );
      }

      /*
       * IMPORTANT:
       *
       * propertyId is completely removed.
       *
       * The inquiry is assigned using agentSlug.
       */
      const response = await fetch(
        '/api/inquiries',
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to submit inquiry.'
        );
      }

      setSubmitSuccess(
        data?.message ||
          'Your inquiry has been submitted successfully.'
      );

      setForm({
        name: '',
        email: '',
        phone: '',
        message: '',
      });

      setTimeout(() => {
        setShowInquiryForm(false);
        setSubmitSuccess('');
      }, 2500);
    } catch (err) {
      console.error(
        'Inquiry submission error:',
        err
      );

      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to submit inquiry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </main>
    );
  }

  /*
   * ERROR
   */
  if (error || !agent) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">
            Agent Not Found
          </h1>

          <p className="text-slate-400 mt-2">
            {error ||
              'This profile does not exist.'}
          </p>
        </div>
      </main>
    );
  }

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

      {/* =====================================================
          INQUIRY MODAL
      ====================================================== */}

      {showInquiryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">

          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  BREA 88 REALTY
                </p>

                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  Send an Inquiry
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Contact {agent.fullName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeInquiryForm}
                disabled={submitting}
                aria-label="Close inquiry form"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmitInquiry}
              className="space-y-5 p-5 sm:p-6"
            >

              {/* AGENT */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">

                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Sending to
                </p>

                <p className="mt-1 font-bold text-white">
                  {agent.fullName}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {agent.email}
                </p>

              </div>

              {/* NAME */}
              <div>
                <label
                  htmlFor="inquiry-name"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Full Name
                </label>

                <input
                  id="inquiry-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="inquiry-email"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Email Address
                </label>

                <input
                  id="inquiry-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  maxLength={255}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="inquiry-phone"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Phone Number
                </label>

                <input
                  id="inquiry-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="09XX XXX XXXX"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label
                  htmlFor="inquiry-message"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Message
                </label>

                <textarea
                  id="inquiry-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={`Hi ${agent.fullName}, I am interested in learning more about your services and available properties.`}
                  autoComplete="off"
                  required
                  maxLength={2000}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm leading-6 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.message.length}/2000
                </p>
              </div>

              {/* ERROR */}
              {submitError && (
                <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                  <p className="text-sm leading-6 text-red-300">
                    {submitError}
                  </p>

                </div>
              )}

              {/* SUCCESS */}
              {submitSuccess && (
                <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">

                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                  <p className="text-sm leading-6 text-emerald-300">
                    {submitSuccess}
                  </p>

                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={closeInquiryForm}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

              </div>

              <p className="text-center text-[11px] leading-5 text-slate-500">
                Your inquiry will be sent directly to{' '}
                {agent.fullName}.
              </p>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

