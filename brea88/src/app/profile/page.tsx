'use client';

import {Home, Search, MapPin, Heart, ShieldCheck, Award, Briefcase, FileText, CheckCircle, Lock, Eye, EyeOff, X, User, Phone, Mail, ChevronLeft, MessageCircle, CalendarDays, Send, Share2, CheckCircle2, BookSearch, CircleArrowLeft} from 'lucide-react';
export default function ProfilePage() {

  const profileUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'BREA 88 REALTY OPC',
          text: 'Contact BREA 88 REALTY OPC',
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied!');
      }
    } catch (error) {
      console.log('Share cancelled');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">

          <a href="/" className="flex items-center gap-3">
            <img
              src="/img/LOGO.png"
              alt="BREA 88 REALTY OPC"
              className="w-15 h-15 rounded-full object-cover"
            />

            <div>
              <p className="font-black text-blue-900 text-sm">
                BREA 88 REALTY OPC
              </p>

              <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                Service with a Heart
              </p>
            </div>
          </a>

          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-900 transition">
            <CircleArrowLeft className="w-8 h-8" />Back to Home
          </a>

        </div>
      </nav>


      {/* PROFILE HERO */}
      <section className="bg-slate-950 text-white relative overflow-hidden">

        <div className="absolute inset-0 opacity-20">
          <img
            src="/img/background.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 to-slate-950" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">

          <div className="flex flex-col items-center text-center">

            {/* PROFILE IMAGE */}
            <div className="relative">

              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-800">

                <img
                  src="/img/profile.png"
                  alt="Rodesa E. Estremos"
                  className="w-full h-full object-cover"
                />

              </div>

              <div className="absolute bottom-2 right-2 bg-emerald-500 w-7 h-7 rounded-full border-4 border-slate-950" />

            </div>

            <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">
              Testing lang
            </h1>

            <h1 className="mt-5 flex items-center gap-2 text-emerald-400 text-l font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Salesperson
            </h1>



            {/* SHARE */}
            <button
              onClick={handleShare}
              className="mt-7 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full text-xs font-bold transition"
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>

          </div>

        </div>
      </section>


      {/* CONTACT ACTIONS */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <a
            href="tel:+639196131001"
            className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg transition"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-bold">Call Now</span>
          </a>


          <a
            href="https://m.me/rodessa.estremos"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg transition"
          >
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold">Messenger</span>
          </a>


          <a
            href="mailto:brea081828@gmail.com"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg transition"
          >
            <Mail className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-bold">Email</span>
          </a>


          <a
            href="/marketplace"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg transition"
          >
            <Home className="w-5 h-5 text-blue-900" />
            <span className="text-xs font-bold">Properties</span>
          </a>

        </div>

      </section>


      {/* ABOUT */}
      <section className="max-w-4xl mx-auto px-4 py-16">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 md:p-10">

          <span className="text-blue-900 font-bold text-xs uppercase tracking-widest">
            About
          </span>

          <h2 className="mt-2 text-2xl md:text-3xl font-extrabold">
            Professional Real Estate Services
          </h2>

          <p className="mt-5 text-slate-600 leading-relaxed text-sm md:text-base">
            BREA 88 REALTY OPC provides professional real estate solutions
            with integrity, excellence, and compassion. We assist clients
            in finding properties, making informed investment decisions,
            and achieving their real estate goals.
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed text-sm md:text-base">
            Guided by our principle, <strong>"Service with a Heart,"</strong>
            we are committed to providing personalized and trustworthy
            service to every client.
          </p>

        </div>

      </section>


      {/* CONTACT INFORMATION */}
      <section className="max-w-4xl mx-auto px-4 pb-16">

        <div className="bg-slate-900 text-white rounded-2xl p-7 md:p-10">

          <div className="text-center mb-8">

            <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">
              Contact Details
            </span>

            <h2 className="mt-2 text-2xl font-bold">
              Let's Talk About Your Property Goals
            </h2>

          </div>


          <div className="space-y-4">

            <a
              href="tel:+639196131001"
              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-900 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Phone
                </p>

                <p className="font-semibold">
                  +63 919 613 1001
                </p>
              </div>
            </a>


            <a
              href="mailto:brea081828@gmail.com"
              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition"
            >
              <div className="w-11 h-11 rounded-lg bg-rose-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Email
                </p>

                <p className="font-semibold">
                  brea081828@gmail.com
                </p>
              </div>
            </a>


            <a
              href="https://facebook.com/rodessa.estremos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center">
               <span className="text-xl font-bold">f</span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Facebook
                </p>

                <p className="font-semibold">
                  Broker Rodesa Estremos
                </p>
              </div>
            </a>


            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">

              <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Office
                </p>

                <p className="font-semibold text-sm">
                  Block 20 Lot 1 Zone 3 Banderas,
                  Canduman, Mandaue City 6014
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="bg-blue-900 text-white">

        <div className="max-w-4xl mx-auto px-4 py-16 text-center">

          <BookSearch className="w-10 h-10 mx-auto text-white-400" />

          <h2 className="mt-4 text-2xl md:text-3xl font-extrabold">
            Ready to Find Your Property?
          </h2>

          <p className="mt-3 text-blue-100 text-sm">
            Let us help you find the right property for your needs.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">

            <a
              href="/#contact"
              className="bg-white text-blue-900 hover:bg-slate-100 px-7 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send an Inquiry
            </a>

            <a
              href="/marketplace"
              className="border border-white/30 hover:bg-white/10 px-7 py-3 rounded-lg font-bold text-sm transition"
            >
              View Properties
            </a>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-8 text-center">

        <p className="text-xs">
          © {new Date().getFullYear()} BREA 88 REALTY OPC.
          All rights reserved.
        </p>

        <p className="mt-1 text-[10px]">
          Service with a Heart
        </p>

      </footer>

    </main>
  );
}