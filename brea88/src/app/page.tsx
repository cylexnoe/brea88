'use client';

import React, { useState, useRef } from 'react';
// import GoogleMap from "@/components/GoogleMap";
import {Home, Search, MapPin, Heart, ShieldCheck, Award, Briefcase, FileText, CheckCircle, Lock, Eye, EyeOff, X, User, Menu,} from 'lucide-react';
import { PROPERTIES } from './data';
import emailjs from '@emailjs/browser';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- ADMIN AUTHENTICATION STATES ---
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const filteredProperties = filter === 'All' 
    ? PROPERTIES 
    : PROPERTIES.filter(p => p.tag === filter);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      await emailjs.sendForm(
        "service_ypezpkv",
        "template_ab5mkom",
        formRef.current,
        "PVaFDUtH8z3a_c3NS"
      );

      setSubmitStatus("success");
      formRef.current.reset();
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER FOR BACKEND LOGIN ---
  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to protected admin dashboard layout area
        window.location.href = '/admin';
      } else {
        setAuthError(data.message || 'Access Denied. Check your credentials.');
      }
    } catch (err) {
      setAuthError('Network error connection failed. Try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 scroll-smooth">

      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 sm:h-20 flex items-center justify-between">

            {/* LOGO + BRAND */}
            <a href="#hero" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img
                src="./img/LOGO.png"
                alt="BREA 88 Logo"
                className="w-11 h-11 sm:w-14 sm:h-14 lg:w-15 lg:h-15 rounded-full object-cover shadow-sm flex-shrink-0"
              />

              <div className="flex flex-col justify-center min-w-0">
                <span className="font-black text-sm sm:text-lg lg:text-xl tracking-tight text-blue-900 leading-tight truncate">
                  BREA 88 REALTY OPC
                </span>

                <span className="text-[8px] sm:text-[10px] font-bold text-slate-600 tracking-[0.15em] uppercase mt-0.5">
                  Service with a Heart
                </span>
              </div>
            </a>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
              <a href="#hero" className="hover:text-blue-600 transition">
                Home
              </a>

              <a href="#profile" className="hover:text-blue-600 transition">
                About Us
              </a>

              <a href="#ceo" className="hover:text-blue-600 transition">
                Leadership
              </a>

              <a href="#services" className="hover:text-blue-600 transition">
                Services
              </a>

              <a href="#contact" className="hover:text-blue-600 transition">
                Contact Us
              </a>
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden lg:flex items-center gap-3">

              <a
                href="/marketplace"
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Property For You
              </a>

              <a
                href="/profile"
                className="flex items-center gap-2 text-blue-900 hover:text-blue-600 transition text-sm font-semibold whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                Profile
              </a>

            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

          </div>

          {/* MOBILE NAVIGATION */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-100 py-4">
              <div className="flex flex-col gap-1">

                <a
                  href="#hero"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition"
                >
                  Home
                </a>

                <a
                  href="#profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition"
                >
                  About Us
                </a>

                <a
                  href="#ceo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition"
                >
                  Leadership
                </a>

                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition"
                >
                  Services
                </a>

                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition"
                >
                  Contact Us
                </a>

                <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">

                  <a
                    href="/marketplace"
                    className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg text-center transition"
                  >
                    Property For You
                  </a>

                  <a
                    href="/profile"
                    className="flex items-center justify-center gap-2 text-blue-900 hover:bg-blue-50 px-4 py-3 rounded-lg text-sm font-semibold transition"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </a>

                </div>

              </div>
            </div>
          )}

        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero"className="relative bg-slate-950 py-20 sm:py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="./img/background.png" 
            alt="Premium property exterior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
            "Service with a Heart, <br/>Building Trust from the Start."
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            BREA 88 REALTY OPC provides professional real estate solutions with Integrity, Excellence, and Compassion throughout the Philippines.
          </p>

          {/* Core Search Matrix */}
          <div className="mt-8 sm:mt-12 bg-white p-3 sm:p-4 rounded-xl shadow-xl max-w-4xl w-full flex flex-col md:flex-row gap-3 sm:gap-4 text-slate-800">
            <div className="flex-1 flex items-center gap-3 px-2 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0">
              <MapPin className="text-blue-900 w-5 h-5 flex-shrink-0" />
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Region</p>
                <input type="text" placeholder="e.g., Metro Manila, Cebu, Cavite" className="w-full text-sm font-semibold outline-none bg-transparent" />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 px-2 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0">
              <Home className="text-blue-900 w-5 h-5 flex-shrink-0" />
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Type</p>
               <select className="w-full text-sm font-medium outline-none bg-transparent cursor-pointer">
                  <option>Villa / House</option>
                  <option>Apartment</option>
                  <option>Loft</option>
                </select>
              </div>
            </div>
           <button className="w-full md:w-auto bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm uppercase tracking-wider px-6 sm:px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition">
              <Search className="w-4 h-4" /> Find Inquiries
            </button>
          </div>
        </div>
       
      </section>

      {/* CORPORATE PROFILE & GOALS */}
      <section id="profile"className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <span className="text-blue-900 font-bold text-xs uppercase tracking-widest">Corporate Profile</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Company Overview</h2>
            <p className="mt-6 text-slate-600 leading-relaxed">
              BREA 88 Realty OPC is a duly registered real estate brokerage company committed to providing professional, ethical, and client-centered real estate services. Guided by our core principle, <strong className="text-blue-900">"Service with a Heart,"</strong> we are dedicated to helping clients achieve their real estate goals through integrity, expertise, and personalized service.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Established in 2026, BREA 88 Realty OPC was founded to deliver exceptional real estate solutions while building lasting relationships with developers, investors, property owners, and homebuyers.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 bg-white p-6 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-900 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">SEC Registration</p>
                  <p className="text-sm font-bold text-slate-800">May 14, 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="text-blue-900 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">BIR Registration</p>
                  <p className="text-sm font-bold text-slate-800">May 19, 2026</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-blue-900 text-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-bold tracking-tight border-b border-blue-800 pb-4">Our Vision & Mission</h3>
            
            <div className="mt-6">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest">Vision</h4>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                To be a trusted and respected real estate brokerage company recognized for excellence, integrity, innovation, and compassionate service, creating meaningful opportunities for clients, developers, and communities.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-800">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest">Mission Focus</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li className="flex items-start gap-2">✔ Delivering professional and ethical real estate services.</li>
                <li className="flex items-start gap-2">✔ Building long-term partnerships based on trust, transparency, and mutual success.</li>
                <li className="flex items-start gap-2">✔ Assisting clients in making informed and rewarding property investment decisions.</li>
                <li className="flex items-start gap-2">✔ Supporting developer partners through effective project marketing and sales strategies.</li>
                <li className="flex items-start gap-2">✔ Providing "Service with a Heart" in every transaction and client engagement.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* EXECUTIVE LEADERSHIP (CEO FOCUS) */}
      <section id="ceo" className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative h-[360px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden bg-slate-800 border border-slate-800">
              <img 
                src="././img/CEO.png" 
                alt="Rodesa E. Estremos - CEO" 
                className="w-full h-full object-cover grayscale contrast-115"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
                <p className="text-lg font-bold">Rodesa E. Estremos, REB, REA</p>
                <p className="text-xs font-semibold text-rose-400">Founder & Chief Executive Officer</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-rose-500 font-bold text-xs uppercase tracking-widest">Founder Profile</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Executive Advisory</h2>
              
              <p className="mt-6 text-slate-300 leading-relaxed">
                With eight (8) years of active, multi-disciplinary experience in the Philippine real estate market, Mrs. Estremos has built an immaculate career foundation across sales, marketing, client management, and brokerage compliance operations.
              </p>
              
              <div className="mt-6 space-y-4 text-sm sm:text-base lg:text-sm text-slate-300">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-rose-500 font-bold flex-shrink-0">6</div>
                  <p className="leading-relaxed"><strong className="text-white">6 Years Registered Salesperson:</strong> Worked closely assisting home buyers in property selection while consistently beating sales pipelines for tier-1 development builders.</p>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">2</div>
                  <p className="leading-relaxed"><strong className="text-white">2 Years Corporate Broker:</strong> Practiced as a Licensed Corporate Broker developing core competencies in portfolio management, project planning, and notary compliance operations.</p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <p className="italic text-slate-400">
                  "Driven by a passion for serving people and helping families achieve their property aspirations, she established BREA 88 Realty OPC with a vision of delivering professional real estate services founded on trust, excellence, and genuine care."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    

      {/* SERVICES MATRIX */}
      <section id="services" className="bg-slate-100 py-24 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-900 font-bold text-xs uppercase tracking-widest">Capabilities</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Professional Services Offered</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[
              "Real Estate Brokerage",
              "Residential Property Sales",
              "Commercial Property Brokerage",
              "Project Selling & Marketing",
              "Property Investment Consultation",
              "Property Acquisition Assistance",
              "Lead Generation Asset Control",
              "Real Estate Advisory Services"
            ].map((service, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-blue-900 mt-0.5 flex-shrink-0" />
                <span className="font-bold text-sm text-slate-800">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PARTNER SECTION WITH CORE VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-blue-900 font-bold text-s uppercase tracking-widest">Guiding Principles</span>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Our Core Values</h2>
            
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="font-bold text-base text-blue-900 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Service With A Heart</h3>
                <p className="mt-1 text-sm text-slate-600">We place people at the center of everything we do and serve with sincerity, compassion, and dedication.</p>
              </div>
              <div>
                <h3 className="font-bold text-base text-blue-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Integrity</h3>
                <p className="mt-1 text-sm text-slate-600">We uphold honesty, transparency, accountability, and ethical conduct in every transaction.</p>
              </div>
              <div>
                <h3 className="font-bold text-base text-blue-900 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Excellence</h3>
                <p className="mt-1 text-sm text-slate-600">We continuously strive to exceed expectations through professionalism and quality service.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 md:p-10 rounded-2xl">
            <h3 className="text-xl font-bold tracking-tight mb-6">Why Partner With Us?</h3>
            <div className="space-y-4 text-sm">
              {[
                "SEC and BIR Registered Company (2026)",
                "Led by an experienced Licensed Real Estate Broker",
                "Strong commitment to ethical and professional practices",
                "Personalized client care through 'Service with a Heart'",
                "Dedicated to achieving sales targets & developer objectives",
                "Professional, reliable, and results-oriented framework"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* GOOGLE MAP */}
      {/* <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3924.6359146178183!2d123.9308420676545!3d10.370968237405243!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9a32e4c2ddca3%3A0x9c33a1ac98bf3f1!2sH%20Tattoo%20%26%20Supplies!5e0!3m2!1sen!2sph!4v1784898577028!5m2!1sen!2sph" width="600" height="450" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </section> */}
    

      {/* CONTACT FORM */}
      <section id="contact" className="bg-slate-900 text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-8 md:p-12 shadow-2xl">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-blue-500 font-bold text-xs uppercase tracking-widest">Connect With Us</span>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Schedule an Advisory Session</h2>
            <p className="mt-2 text-sm text-slate-400">Our office will follow up with verified compliance details within 12 business hours.</p>
          </div>

          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-sm font-semibold rounded-lg text-center">
              Thank you! Your corporate inquiry has been routed straight to our office inbox.
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-rose-950/50 border border-rose-500/40 text-rose-200 text-sm font-semibold rounded-lg text-center">
              Something went wrong. Please check your connection or contact us directly "cylexnoecatadman123@gmail.com".
            </div>
          )}

          <form ref={formRef} onSubmit={sendEmail} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Full Name */}
        <div>
          <label className="block mb-2 text-white">Full Name</label>

          <input
            type="text"
            name="name"
            required
            placeholder="Fullname"
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-2 text-white">Email Address</label>

          <input
            type="email"
            name="email"
            required
            placeholder="Email Address"
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg"
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block mb-2 text-white">Contact Number</label>

          <input
            type="tel"
            name="contact_number"
            required
            placeholder="Phone Number"
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block mb-2 text-white">Preferred Location</label>

          <input
            type="text"
            name="prefer_location"
            required
            placeholder="Metro Manila, Cebu..."
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg"
          />
        </div>

        {/* Message */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-white">Message</label>

          <textarea
            name="message"
            rows={5}
            required
            placeholder="Your inquiry..."
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg"
          />
        </div>

        <button type="submit"disabled={isSubmitting} className="md:col-span-2 w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white py-3.5 rounded-lg font-bold transition">
            {isSubmitting ? "Sending..." : "Submit Inquiry"}
        </button>
      </form>

        </div>
      </div>
    </section>

      {/* BACKEND-DRIVEN ADMIN SECURITY GATEWAY MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
            
            <button 
              onClick={() => { setShowLoginModal(false); setAuthError(''); }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 mb-4 mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center tracking-tight">Admin Gateway</h3>
              <p className="text-xs text-slate-500 text-center mt-1 mb-6">Access restricted to authorized compliance personnel.</p>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg text-center">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-slate-900">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username ID</label>
                  <input 
                    type="text" 
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:bg-white text-sm transition"
                    placeholder="Enter ID"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password Credentials</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:bg-white text-sm transition pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 mt-2"
                >
                  {isAuthenticating ? 'Validating Token...' : 'Authorize Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-10 pb-8 border-b border-slate-900">
            
            {/* Branding Section */}
            <div className="flex items-start gap-4 text-left max-w-sm">
              <img 
                src="./img/LOGO.png" 
                alt="BREA 88 Logo" 
                className="w-14 h-14 rounded-full object-cover bg-black border border-slate-800"
              />
              <div>
                <p className="font-bold text-slate-300 text-sm tracking-wider">BREA 88 REALTY OPC</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Professional Real Estate Solutions with Integrity, Excellence, and Compassion.
                </p>
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="w-full flex flex-col sm:flex-row gap-6 sm:gap-12 text-left">
              <div>
                <p className="font-semibold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">Get in Touch</p>
                <ul className="space-y-1.5 text-[11px]">
                  <li>
                    <span className="text-slate-400">Phone:</span>{" "}
                    <a href="tel:+639196131001" className="hover:text-slate-300 transition-colors">+63919 613 1001</a>
                  </li>
                  <li>
                    <span className="text-slate-400">Email:</span>{" "}
                    <a href="mailto:brea081828@gmail.com" className="hover:text-slate-300 transition-colors">brea081828@gmail.com</a>
                  </li>
                  <li>
                    <span className="text-slate-400">Facebook:</span>{" "}
                    <a href="https://facebook.com/rodessa.estremos" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Broker Rodesa Estremos</a>
                  </li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">Office Address</p>
                <p className="text-[11px] leading-relaxed max-w-[200px]">
                  Block 20 Lot 1 Zone 3 Banderas, Canduman Mandaue City 6014
                </p>
              </div>
            </div>

          </div>

          {/* Copyright Section */}
          <div className="pt-8 flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-[10px] sm:text-[11px] text-center sm:text-left">
            <p>© {new Date().getFullYear()} BREA 88 REALTY OPC. All rights reserved.</p>
            <div className="flex gap-4">
              <button 
              onClick={() => setShowLoginModal(true)} 
              className="hover:text-blue-400 transition-colors">Admin</button>
              <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}