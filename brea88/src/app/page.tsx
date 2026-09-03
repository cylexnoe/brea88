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
      <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:gap-6">

        {/* CLIENT */}
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="group relative text-left bg-white text-slate-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-6 md:p-10 border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden min-w-0"
        >

          <div className="absolute -right-10 -top-10 sm:-right-16 sm:-top-16 w-24 h-24 sm:w-40 sm:h-40 bg-blue-100 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />

          <div className="relative">

            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-blue-900 text-white flex items-center justify-center mb-3 sm:mb-5 md:mb-6 shadow-lg group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>

            <p className="text-[8px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-blue-600 mb-1 sm:mb-2">
              Looking For Property
            </p>

            <h2 className="text-base sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">
              I’m a Client
            </h2>

            <div className="flex items-center justify-between gap-1 sm:gap-3">

              <span className="font-bold text-blue-900 text-[10px] sm:text-sm md:text-base leading-tight">
                Browse Properties
              </span>

              <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-blue-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>

            </div>

          </div>

        </button>


        {/* AGENT / BROKER */}
        <button
          type="button"
          onClick={() => router.push('/agent/login')}
          className="group relative text-left bg-blue-900 text-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-6 md:p-10 border border-blue-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden min-w-0"
        >

          <div className="absolute -right-10 -top-10 sm:-right-16 sm:-top-16 w-24 h-24 sm:w-40 sm:h-40 bg-blue-800 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />

          <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-32 h-32 sm:w-48 sm:h-48 bg-blue-950 rounded-full opacity-50" />

          <div className="relative">

            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-white text-blue-900 flex items-center justify-center mb-3 sm:mb-5 md:mb-6 shadow-lg group-hover:scale-105 transition-transform">
              <BriefcaseBusiness className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>

            <p className="text-[8px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-blue-200 mb-1 sm:mb-2">
              For Real Estate Professionals
            </p>

            <h2 className="text-base sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">
              Agent / Broker
            </h2>

            <div className="flex items-center justify-between gap-1 sm:gap-3">

              <span className="font-bold text-white text-[10px] sm:text-sm md:text-base leading-tight">
                Agent Login
              </span>

              <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white text-blue-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
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
