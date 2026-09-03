
'use client';

import { useRouter } from 'next/navigation';
import {
  Users,
  BriefcaseBusiness,
  ArrowRight,
  Building2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">

      {/* =========================================================
          LIQUID GRADIENT BACKGROUND
      ========================================================= */}

      {/* Deep blue base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#172554_0%,#0f172a_42%,#020617_80%)]" />

      {/* Large liquid blob - top left */}
      <div className="liquid-blob blob-one pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-700/40 blur-[100px]" />

      {/* Large liquid blob - top right */}
      <div className="liquid-blob blob-two pointer-events-none absolute -right-40 top-10 h-[550px] w-[550px] rounded-full bg-indigo-600/30 blur-[120px]" />

      {/* Royal blue blob - bottom left */}
      <div className="liquid-blob blob-three pointer-events-none absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full bg-blue-800/30 blur-[110px]" />

      {/* Cyan accent - bottom right */}
      <div className="liquid-blob blob-four pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-600/20 blur-[120px]" />

      {/* Center glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[140px]" />

      {/* Moving light sweep */}
      <div className="pointer-events-none absolute inset-0 liquid-shine opacity-20" />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <div className="relative z-10 w-full max-w-5xl">

        {/* =======================================================
            LOGO / BRAND
        ======================================================= */}

        <div className="text-center mb-8 sm:mb-12">

          <div className="flex justify-center mb-5">

            {/* Logo glow */}
            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-blue-500/40 blur-2xl scale-110" />

              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl shadow-blue-950/50">
                <img
                  src="/img/LOGO.png"
                  alt="BREA 88 Realty"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>

          </div>

          <p className="text-blue-300 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-3">
            BREA 88 REALTY
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            Welcome to BREA 88
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3 leading-6">
            Choose how you want to access the platform.
          </p>

        </div>


        {/* =======================================================
            SELECTION CARDS
        ======================================================= */}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:gap-6">

          {/* =====================================================
              CLIENT CARD
          ===================================================== */}

          <button
            type="button"
            onClick={() => router.push('/home')}
            className="group relative text-left rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-6 md:p-10 min-w-0 overflow-hidden border border-white/20 bg-white/[0.10] backdrop-blur-2xl shadow-2xl shadow-black/20 hover:bg-white/[0.15] hover:border-blue-300/40 hover:shadow-blue-900/30 hover:-translate-y-1 active:scale-[0.98] transition-all duration-500"
          >

            {/* Glass highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />

            {/* Inner glow */}
            <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-400/30 group-hover:scale-125 transition-all duration-700" />

            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-400/20 group-hover:scale-125 transition-all duration-700" />

            <div className="relative">

              {/* Icon */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 text-white flex items-center justify-center mb-3 sm:mb-5 md:mb-6 shadow-lg shadow-blue-950/40 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-300">
                <Users className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>

              <p className="text-[8px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-blue-300 mb-1 sm:mb-2">
                Looking For Property
              </p>

              <h2 className="text-base sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight text-white">
                I’m a Client
              </h2>

              <div className="flex items-center justify-between gap-1 sm:gap-3">

                <span className="font-bold text-blue-200 text-[10px] sm:text-sm md:text-base leading-tight">
                  Browse Properties
                </span>

                <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center backdrop-blur-md group-hover:bg-blue-500 group-hover:border-blue-400 group-hover:translate-x-1 transition-all duration-300">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>

              </div>

            </div>

          </button>


          {/* =====================================================
              AGENT / BROKER CARD
          ===================================================== */}

          <button
            type="button"
            onClick={() => router.push('/agent/login')}
            className="group relative text-left rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-6 md:p-10 min-w-0 overflow-hidden border border-blue-300/25 bg-blue-950/30 backdrop-blur-2xl shadow-2xl shadow-blue-950/30 hover:bg-blue-900/40 hover:border-blue-300/50 hover:shadow-blue-700/30 hover:-translate-y-1 active:scale-[0.98] transition-all duration-500"
          >

            {/* Glass highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/80 to-transparent opacity-70" />

            {/* Royal blue liquid glow */}
            <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-blue-500/30 blur-3xl group-hover:bg-blue-400/40 group-hover:scale-125 transition-all duration-700" />

            <div className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-indigo-600/20 blur-3xl group-hover:bg-indigo-500/30 group-hover:scale-125 transition-all duration-700" />

            {/* Moving shine */}
            <div className="absolute inset-0 card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">

              {/* Icon */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-white text-blue-900 flex items-center justify-center mb-3 sm:mb-5 md:mb-6 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                <BriefcaseBusiness className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>

              <p className="text-[8px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-blue-200 mb-1 sm:mb-2">
                For Real Estate Professionals
              </p>

              <h2 className="text-base sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight text-white">
                Agent / Broker
              </h2>

              <div className="flex items-center justify-between gap-1 sm:gap-3">

                <span className="font-bold text-white text-[10px] sm:text-sm md:text-base leading-tight">
                  Agent Login
                </span>

                <div className="shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-blue-900 group-hover:translate-x-1 transition-all duration-300">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>

              </div>

            </div>

          </button>

        </div>


        {/* =======================================================
            BOTTOM BRAND
        ======================================================= */}

        <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10 text-slate-500">

          <Building2 className="w-4 h-4 text-blue-400/70" />

          <p className="text-xs sm:text-sm">
            BREA 88 Realty • Your Property. Your Future.
          </p>

        </div>

      </div>


      {/* =========================================================
          ANIMATION STYLES
      ========================================================= */}

      <style jsx>{`

        /* -------------------------------------------------------
           LIQUID BLOBS
        ------------------------------------------------------- */

        @keyframes liquidOne {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          25% {
            transform: translate3d(100px, 80px, 0) scale(1.15);
          }

          50% {
            transform: translate3d(180px, -20px, 0) scale(0.95);
          }

          75% {
            transform: translate3d(60px, -100px, 0) scale(1.1);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes liquidTwo {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          30% {
            transform: translate3d(-120px, 80px, 0) scale(1.2);
          }

          60% {
            transform: translate3d(-60px, 180px, 0) scale(0.9);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes liquidThree {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          40% {
            transform: translate3d(140px, -100px, 0) scale(1.15);
          }

          70% {
            transform: translate3d(220px, -20px, 0) scale(0.9);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes liquidFour {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-160px, -100px, 0) scale(1.2);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        .blob-one {
          animation: liquidOne 16s ease-in-out infinite;
        }

        .blob-two {
          animation: liquidTwo 19s ease-in-out infinite;
        }

        .blob-three {
          animation: liquidThree 18s ease-in-out infinite;
        }

        .blob-four {
          animation: liquidFour 14s ease-in-out infinite;
        }


        /* -------------------------------------------------------
           BACKGROUND LIGHT SWEEP
        ------------------------------------------------------- */

        @keyframes liquidShine {
          0% {
            transform: translateX(-100%) rotate(20deg);
          }

          50% {
            transform: translateX(100%) rotate(20deg);
          }

          100% {
            transform: translateX(100%) rotate(20deg);
          }
        }

        .liquid-shine {
          position: absolute;
          width: 50%;
          height: 150%;
          top: -25%;
          left: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(96, 165, 250, 0.12),
            transparent
          );
          filter: blur(60px);
          animation: liquidShine 14s ease-in-out infinite;
        }


        /* -------------------------------------------------------
           CARD SHINE
        ------------------------------------------------------- */

        @keyframes cardShine {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(120%);
          }
        }

        .card-shine {
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255,255,255,0.08) 50%,
            transparent 75%
          );
          animation: cardShine 2s ease-in-out;
        }


        /* -------------------------------------------------------
           REDUCE MOTION
        ------------------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .blob-one,
          .blob-two,
          .blob-three,
          .blob-four,
          .liquid-shine,
          .card-shine {
            animation: none;
          }
        }

      `}</style>

    </main>
  );
}

