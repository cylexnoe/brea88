'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  MapPin,
  Phone,
  MessageCircle,
  Building2,
  BedDouble,
  Bath,
  Maximize,
  Loader2,
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
  const [agent, setAgent] =
    useState<Agent | null>(null);

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadProfile =
      async () => {
        try {
          const { slug } =
            await params;

          const response =
            await fetch(
              `/api/agent/profile/${slug}`,
              {
                cache: 'no-store',
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'Profile not found.'
            );
          }

          setAgent(data.agent);
          setProperties(
            data.properties || []
          );
        } catch (err) {
          console.error(err);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">
            Agent Not Found
          </h1>

          <p className="text-slate-400 mt-2">
            {error ||
              'This profile does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HERO */}

      <section className="relative overflow-hidden bg-slate-950 text-white">

        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-black" />

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* PROFILE IMAGE */}

            <div className="flex-shrink-0">

              {agent.profileImage ? (
                <img
                  src={agent.profileImage}
                  alt={agent.fullName}
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-blue-900 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  <span className="text-5xl font-black">
                    {agent.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}

            </div>

            {/* INFO */}

            <div className="text-center md:text-left">

              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                {agent.role}
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-4">
                {agent.fullName}
              </h1>

              {agent.bio && (
                <p className="mt-4 max-w-2xl text-slate-300 leading-7">
                  {agent.bio}
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">

                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold transition"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}

                {agent.messenger && (
                  <a
                    href={agent.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 rounded-xl font-bold transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Messenger
                  </a>
                )}

                {agent.facebook && (
                  <a
                    href={agent.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/10 px-5 py-3 rounded-xl font-bold transition"
                  >
                    <span className="font-bold text-sm">Facebook</span>
                  </a>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* LISTINGS */}

      <section className="max-w-6xl mx-auto px-6 py-14">

        <div className="mb-8">

          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Property Listings
          </p>

          <h2 className="text-3xl md:text-4xl font-black mt-2">
            Properties by {agent.fullName}
          </h2>

          <p className="text-slate-500 mt-2">
            Browse the current property listings
            from this {agent.role.toLowerCase()}.
          </p>

        </div>

        {properties.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />

            <h3 className="font-bold text-lg mt-4">
              No Properties Yet
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              This agent has not published any
              properties yet.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {properties.map(
              (property) => (
                <article
                  key={property.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition"
                >

                  <div className="h-56 overflow-hidden bg-slate-100">

                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />

                  </div>

                  <div className="p-5">

                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      {property.tag}
                    </span>

                    <h3 className="font-black text-xl mt-2">
                      {property.title}
                    </h3>

                    <p className="text-2xl font-black text-blue-900 mt-3">
                      ₱{property.price}
                    </p>

                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-3">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {property.location}
                    </div>

                    <div className="flex gap-4 mt-4 text-xs text-slate-500">

                      {property.beds !==
                        null &&
                        property.beds !==
                          undefined && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-4 h-4" />
                            {property.beds}
                          </span>
                        )}

                      {property.baths !==
                        null &&
                        property.baths !==
                          undefined && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            {property.baths}
                          </span>
                        )}

                      {property.sqft !==
                        null &&
                        property.sqft !==
                          undefined && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />
                            {property.sqft} sqm
                          </span>
                        )}

                    </div>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </section>

    </main>
  );
}