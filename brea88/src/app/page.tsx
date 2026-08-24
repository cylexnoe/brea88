'use client';

import { useRouter } from 'next/navigation';
import { Users, BriefcaseBusiness, ArrowRight, Building2 } from 'lucide-react';

export default function LandingPage() {
const router = useRouter();

return ( <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

  <div className="w-full max-w-5xl">

    {/* LOGO / BRAND */}
    <div className="text-center mb-8 sm:mb-12">

      <div className="flex justify-center mb-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
          <img
            src="/img/LOGO.png"
            alt="BREA 88 Realty"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <p className="text-blue-400 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-3">
        BREA 88 REALTY
      </p>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
        Welcome to BREA 88
      </h1>

      <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3 leading-6">
        Choose how you want to access the platform.
      </p>

    </div>

    {/* SELECTION CARDS */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

      {/* CLIENT */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="group relative text-left bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden"
      >

        <div className="absolute -right-16 -top-16 w-40 h-40 bg-blue-100 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />

        <div className="relative">

          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
            <Users className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            For Property Hunters
          </p>

          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            I’m a Client
          </h2>

          <p className="text-sm sm:text-base text-slate-500 leading-6 mb-7">
            Browse properties, explore listings, view property photos,
            and find the right property for your needs.
          </p>

          <div className="flex items-center justify-between">

            <span className="font-bold text-blue-900 text-sm sm:text-base">
              Browse Properties
            </span>

            <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>

          </div>

        </div>

      </button>


      {/* AGENT / BROKER */}
      <button
        type="button"
        onClick={() => router.push('/agent/login')}
        className="group relative text-left bg-blue-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden"
      >

        <div className="absolute -right-16 -top-16 w-40 h-40 bg-blue-800 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />

        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-950 rounded-full opacity-50" />

        <div className="relative">

          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-blue-900 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
            <BriefcaseBusiness className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
            For Real Estate Professionals
          </p>

          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            Agent / Broker
          </h2>

          <p className="text-sm sm:text-base text-blue-100 leading-6 mb-7">
            Access your professional account, manage your profile,
            and share your permanent profile link with clients.
          </p>

          <div className="flex items-center justify-between">

            <span className="font-bold text-white text-sm sm:text-base">
              Agent Login
            </span>

            <div className="w-10 h-10 rounded-full bg-white text-blue-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>

          </div>

        </div>

      </button>

    </div>

    {/* BOTTOM BRAND */}
    <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10 text-slate-500">

      <Building2 className="w-4 h-4" />

      <p className="text-xs sm:text-sm">
        BREA 88 Realty • Your Property. Your Future.
      </p>

    </div>

  </div>

</main>

);
}
