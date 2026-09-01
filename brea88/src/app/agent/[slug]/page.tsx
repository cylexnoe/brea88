'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  MessageCircle,
  Building2,
  Mail,
  ExternalLink,
  Loader2,
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

export default function AgentProfilePage({
  params,
}: PageProps) {
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        console.error('Failed to load agent profile:', err);

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
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </main>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
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
   * =========================================================
   * SEND INQUIRY
   *
   * The client does NOT need to log in.
   *
   * The agent slug is passed to the inquiry page so the
   * inquiry can be associated with this specific agent.
   * =========================================================
   */

  const sendInquiry = () => {
    router.push(
      `/inquiry?agent=${encodeURIComponent(agent.slug)}`
    );
  };

  /*
   * =========================================================
   * VIEW PROPERTIES
   * =========================================================
   */

  const viewProperties = () => {
    router.push(
      `/marketplace?agent=${encodeURIComponent(agent.slug)}`
    );
  };

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
                    alt={`${agent.fullName} profile`}
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
                      <MessageCircle className="h-5 w-5 text-slate-300" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Contact Number
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

              {/* =================================================
                  ACTION BUTTONS
                  ================================================= */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* SEND INQUIRY */}
                <button
                  type="button"
                  onClick={sendInquiry}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
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
                onClick={viewProperties}
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

    </main>
  );
}

