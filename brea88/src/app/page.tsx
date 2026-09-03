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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b18] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,.18),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(201,169,110,.14),transparent_30%),linear-gradient(135deg,#050b18,#071936_55%,#020617)]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="liquid-blob blob-one pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-blue-700/30 blur-[110px]" />
      <div className="liquid-blob blob-two pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="liquid-blob blob-three pointer-events-none absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full bg-blue-800/25 blur-[115px]" />
      <div className="liquid-blob blob-four pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-[#c9a96e]/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <header className="mb-8 text-center sm:mb-12">
          <div className="mb-5 flex justify-center">
            <div className="relative rounded-full bg-gradient-to-br from-[#ead9b8] via-white/20 to-[#c9a96e] p-[2px] shadow-[0_0_55px_rgba(201,169,110,.18)]">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white sm:h-24 sm:w-24">
                <img src="/img/LOGO.png" alt="BREA 88 Realty" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#d8bc87] sm:text-xs">BREA 88 REALTY</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">Welcome to BREA 88</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Choose how you want to access the platform.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6" aria-label="Platform access">
          <button type="button" onClick={() => router.push('/home')} className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.10] p-4 text-left shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a96e]/45 hover:bg-white/[0.14] hover:shadow-blue-950/30 active:scale-[.98] sm:rounded-3xl sm:p-7 md:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:bg-blue-400/30" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl transition-all duration-700 group-hover:scale-125" />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between sm:mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg shadow-blue-950/40 transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 md:h-16 md:w-16 md:rounded-2xl"><Users className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8" /></div>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[8px] font-bold uppercase tracking-[.15em] text-slate-300 sm:px-3 sm:text-[10px]">Client</span>
              </div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-blue-300 sm:mb-2 sm:text-xs sm:tracking-widest">Looking For Property</p>
              <h2 className="text-base font-black leading-tight text-white sm:text-2xl md:text-3xl">I’m a Client</h2>
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4 sm:mt-8 sm:pt-5">
                <span className="text-[10px] font-bold leading-tight text-blue-100 sm:text-sm md:text-base">Browse Properties</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#c9a96e] group-hover:text-[#071936] sm:h-10 sm:w-10"><ArrowRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" /></span>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => router.push('/agent/login')} className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#c9a96e]/20 bg-gradient-to-br from-[#0b2348]/90 via-[#071936]/85 to-[#040d20]/95 p-4 text-left shadow-2xl shadow-blue-950/30 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a96e]/50 hover:shadow-blue-900/40 active:scale-[.98] sm:rounded-3xl sm:p-7 md:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ead9b8] to-transparent opacity-70" />
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#c9a96e]/15 blur-3xl transition-all duration-700 group-hover:scale-125" />
            <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl transition-all duration-700 group-hover:scale-125" />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between sm:mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#071936] shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 md:h-16 md:w-16 md:rounded-2xl"><BriefcaseBusiness className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8" /></div>
                <span className="rounded-full border border-[#ead9b8]/20 bg-white/5 px-2 py-1 text-[8px] font-bold uppercase tracking-[.15em] text-[#ead9b8] sm:px-3 sm:text-[10px]">Professional</span>
              </div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-[#ead9b8] sm:mb-2 sm:text-xs sm:tracking-widest">For Real Estate Professionals</p>
              <h2 className="text-base font-black leading-tight text-white sm:text-2xl md:text-3xl">Agent / Broker</h2>
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4 sm:mt-8 sm:pt-5">
                <span className="text-[10px] font-bold leading-tight text-white sm:text-sm md:text-base">Agent Login</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#ead9b8] group-hover:text-[#071936] sm:h-10 sm:w-10"><ArrowRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" /></span>
              </div>
            </div>
          </button>
        </section>

        <footer className="mt-8 flex items-center justify-center gap-2 text-slate-500 sm:mt-10">
          <Building2 className="h-4 w-4 text-[#c9a96e]/70" />
          <p className="text-xs sm:text-sm">BREA 88 Realty • Your Property. Your Future.</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes liquidOne { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(130px,60px,0) scale(1.12)} }
        @keyframes liquidTwo { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-100px,120px,0) scale(1.15)} }
        @keyframes liquidThree { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(150px,-80px,0) scale(1.1)} }
        @keyframes liquidFour { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-120px,-80px,0) scale(1.15)} }
        .blob-one{animation:liquidOne 16s ease-in-out infinite}.blob-two{animation:liquidTwo 19s ease-in-out infinite}.blob-three{animation:liquidThree 18s ease-in-out infinite}.blob-four{animation:liquidFour 15s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.blob-one,.blob-two,.blob-three,.blob-four{animation:none}}
      `}</style>
    </main>
  );
}
