'use client';

import { useRouter } from 'next/navigation';
import { User, Building2, ArrowRight } from 'lucide-react';

export default function EntryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl">

        {/* LOGO / BRAND */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/img/LOGO.png"
              alt="BREA 88 Realty"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl border-4 border-white/10"
            />
          </div>

          <p className="text-blue-400 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3">
            BREA 88 REALTY
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Welcome
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-7">
            Choose how you would like to continue.
          </p>
        </div>

        {/* OPTIONS */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* CLIENT */}
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="group text-left bg-white text-slate-900 rounded-3xl p-7 sm:p-9 border border-white/10 shadow-2xl hover:-translate-y-2 hover:shadow-blue-900/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">

              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <User className="w-7 h-7 text-blue-900" />
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-900 group-hover:translate-x-1 transition-all" />

            </div>

            <h2 className="mt-7 text-2xl font-black">
              I am a Client
            </h2>

            <p className="mt-3 text-sm text-slate-500 leading-6">
              Browse properties, explore listings, view agent profiles,
              and find your next property.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-900">
              Continue as Client
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* AGENT / BROKER */}
          <button
            type="button"
            onClick={() => router.push('/agent/login')}
            className="group text-left bg-slate-900 text-white rounded-3xl p-7 sm:p-9 border border-slate-800 shadow-2xl hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">

              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-blue-400" />
              </div>

              <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />

            </div>

            <h2 className="mt-7 text-2xl font-black">
              I am an Agent / Broker
            </h2>

            <p className="mt-3 text-sm text-slate-400 leading-6">
              Sign in to manage your professional profile, properties,
              and permanent profile link.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-400">
              Continue as Agent / Broker
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* FOOTER */}
        <div className="text-center mt-12">
          <p className="text-xs text-slate-600">
            BREA 88 REALTY • Property Marketplace
          </p>
        </div>

      </div>
    </main>
  );
}