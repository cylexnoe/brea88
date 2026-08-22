'use client';

import { useRef, useState } from 'react';
import {Home, MapPin, Heart, ShieldCheck, Award, Briefcase, FileText, CheckCircle, Lock, Eye, EyeOff, X, User, Menu, Building2} from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // ADMIN AUTHENTICATION STATES
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // =========================
  // EMAILJS CONTACT FORM
  // =========================
  const sendEmail = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!formRef.current) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await emailjs.sendForm(
        'service_ypezpkv',
        'template_ab5mkom',
        formRef.current,
        'PVaFDUtH8z3a_c3NS'
      );

      setSubmitStatus('success');
      formRef.current.reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // ADMIN LOGIN
  // =========================
  const handleAdminLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setAuthError('');
    setIsAuthenticating(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = '/admin';
      } else {
        setAuthError(
          data.message ||
            'Access denied. Please check your credentials.'
        );
      }
    } catch (error) {
      console.error('Login Error:', error);
      setAuthError(
        'Network connection failed. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // =========================
  // CLOSE MOBILE MENU
  // =========================
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 scroll-smooth">

      {/* =====================================================
          NAVIGATION BAR
      ====================================================== */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex h-16 items-center justify-between sm:h-20">

            {/* LOGO + BRAND */}
            <a
              href="#hero"
              onClick={closeMobileMenu}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <img
                src="/img/LOGO.png"
                alt="BREA 88 Realty Logo"
                className="h-10 w-10 flex-shrink-0 rounded-full object-cover shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14"
              />

              <div className="flex min-w-0 flex-col justify-center">
                <span className="truncate text-sm font-black leading-tight tracking-tight text-blue-900 sm:text-lg lg:text-xl">
                  BREA 88 REALTY OPC
                </span>

                <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-slate-600 sm:text-[10px] sm:tracking-[0.15em]">
                  Service with a Heart
                </span>
              </div>
            </a>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex xl:gap-7">

              <a
                href="#hero"
                className="transition hover:text-blue-600"
              >
                Home
              </a>

              <a
                href="#profile"
                className="transition hover:text-blue-600"
              >
                About Us
              </a>

              <a
                href="#ceo"
                className="transition hover:text-blue-600"
              >
                Leadership
              </a>

              <a
                href="#services"
                className="transition hover:text-blue-600"
              >
                Services
              </a>

              <a
                href="#contact"
                className="transition hover:text-blue-600"
              >
                Contact Us
              </a>
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden items-center gap-3 lg:flex">

              {/* PROPERTY FOR YOU */}
              <a
                href="/marketplace"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-blue-800"
              >
                <Building2 className="h-4 w-4" />
                Property For You
              </a>

              {/* PROFILE */}
              <a
                href="/profile"
                className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-blue-900 transition hover:text-blue-600"
              >
                <User className="h-4 w-4" />
                Profile
              </a>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((previous) => !previous)
              }
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* MOBILE NAVIGATION */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-100 py-4 lg:hidden">
              <div className="flex flex-col gap-1">

                <a
                  href="#hero"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                >
                  Home
                </a>

                <a
                  href="#profile"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                >
                  About Us
                </a>

                <a
                  href="#ceo"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                >
                  Leadership
                </a>

                <a
                  href="#services"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                >
                  Services
                </a>

                <a
                  href="#contact"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                >
                  Contact Us
                </a>

                {/* MOBILE ACTIONS */}
                <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">

                  <a
                    href="/marketplace"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-800"
                  >
                    <Building2 className="h-4 w-4" />
                    Property For You
                  </a>

                  <a
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section
        id="hero"
        className="relative overflow-hidden bg-slate-950 py-20 sm:py-24 md:py-36"
      >
        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0 opacity-30">
          <img
            src="/img/background.png"
            alt="Premium property exterior"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-white sm:px-6 lg:px-8">

          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:mt-6 sm:text-4xl md:text-6xl">
            &quot;Service with a Heart,
            <br />
            Building Trust from the Start.&quot;
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:mt-6 sm:text-lg">
            BREA 88 REALTY OPC provides professional real estate
            solutions with Integrity, Excellence, and Compassion
            throughout the Philippines.
          </p>

          {/* PROPERTY SEARCH */}
          <div className="mt-8 flex w-full max-w-4xl flex-col gap-3 rounded-xl bg-white p-3 text-slate-800 shadow-xl sm:mt-12 sm:p-4 md:flex-row md:gap-4">

            {/* LOCATION */}
            <div className="flex flex-1 items-center gap-3 border-b border-slate-200 px-2 pb-3 md:border-b-0 md:border-r md:pb-0">
              <MapPin className="h-5 w-5 flex-shrink-0 text-blue-900" />

              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Region
                </p>

                <input
                  type="text"
                  placeholder="e.g., Cebu, Manila, Cavite"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* PROPERTY TYPE */}
            <div className="flex flex-1 items-center gap-3 border-b border-slate-200 px-2 pb-3 md:border-b-0 md:border-r md:pb-0">
              <Home className="h-5 w-5 flex-shrink-0 text-blue-900" />

              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Property Type
                </p>

                <select className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none">
                  <option>Villa / House</option>
                  <option>Apartment</option>
                  <option>Loft</option>
                  <option>Commercial</option>
                  <option>Condominium</option>
                  <option>Lot</option>
                </select>
              </div>
            </div>

            {/* PROPERTY FOR YOU BUTTON */}
            <a
              href="/marketplace"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-6 py-4 text-center text-sm font-bold uppercase tracking-wider text-white transition hover:bg-blue-800 md:w-auto md:px-8"
            >
              <Building2 className="h-4 w-4" />
              Property For You
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          CORPORATE PROFILE
      ====================================================== */}
      <section
        id="profile"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="grid items-start gap-12 lg:grid-cols-12">

          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-900">
              Corporate Profile
            </span>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Company Overview
            </h2>

            <p className="mt-6 leading-relaxed text-slate-600">
              BREA 88 Realty OPC is a duly registered real estate
              brokerage company committed to providing professional,
              ethical, and client-centered real estate services.
              Guided by our core principle,
              <strong className="text-blue-900">
                {' '}
                &quot;Service with a Heart,&quot;
              </strong>{' '}
              we are dedicated to helping clients achieve their real
              estate goals through integrity, expertise, and
              personalized service.
            </p>

            <p className="mt-4 leading-relaxed text-slate-600">
              Established in 2026, BREA 88 Realty OPC was founded to
              deliver exceptional real estate solutions while
              building lasting relationships with developers,
              investors, property owners, and homebuyers.
            </p>

            <div className="mt-8 grid gap-4 rounded-xl border border-slate-200/60 bg-white p-6 sm:grid-cols-2">

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-blue-900" />

                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    SEC Registration
                  </p>

                  <p className="text-sm font-bold text-slate-800">
                    May 14, 2026
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-blue-900" />

                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    BIR Registration
                  </p>

                  <p className="text-sm font-bold text-slate-800">
                    May 19, 2026
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* VISION + MISSION */}
          <div className="rounded-2xl bg-blue-900 p-6 text-white shadow-xl sm:p-8">
            <h3 className="border-b border-blue-800 pb-4 text-xl font-bold tracking-tight">
              Our Vision &amp; Mission
            </h3>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400">
                Vision
              </h4>

              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                To be a trusted and respected real estate brokerage
                company recognized for excellence, integrity,
                innovation, and compassionate service, creating
                meaningful opportunities for clients, developers,
                and communities.
              </p>
            </div>

            <div className="mt-6 border-t border-blue-800 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400">
                Mission Focus
              </h4>

              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                <li>
                  ✔ Delivering professional and ethical real estate
                  services.
                </li>

                <li>
                  ✔ Building long-term partnerships based on trust,
                  transparency, and mutual success.
                </li>

                <li>
                  ✔ Assisting clients in making informed and
                  rewarding property investment decisions.
                </li>

                <li>
                  ✔ Supporting developer partners through effective
                  project marketing and sales strategies.
                </li>

                <li>
                  ✔ Providing &quot;Service with a Heart&quot; in every
                  transaction and client engagement.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXECUTIVE LEADERSHIP
      ====================================================== */}
      <section
        id="ceo"
        className="bg-slate-900 py-20 text-white sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">

            {/* CEO IMAGE */}
            <div className="relative h-[360px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:h-[420px] lg:col-span-5 lg:h-[480px]">

              <img
                src="/img/CEO.png"
                alt="Rodesa E. Estremos - CEO"
                className="h-full w-full object-cover grayscale contrast-125"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6">
                <p className="text-lg font-bold">
                  Rodesa E. Estremos, REB, REA
                </p>

                <p className="text-xs font-semibold text-rose-400">
                  Founder &amp; Chief Executive Officer
                </p>
              </div>
            </div>

            {/* CEO CONTENT */}
            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
                Founder Profile
              </span>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Executive Advisory
              </h2>

              <p className="mt-6 leading-relaxed text-slate-300">
                With eight (8) years of active, multi-disciplinary
                experience in the Philippine real estate market,
                Mrs. Estremos has built an immaculate career
                foundation across sales, marketing, client
                management, and brokerage compliance operations.
              </p>

              <div className="mt-6 space-y-4 text-sm text-slate-300 sm:text-base lg:text-sm">

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-slate-800 font-bold text-rose-500">
                    6
                  </div>

                  <p className="leading-relaxed">
                    <strong className="text-white">
                      6 Years Registered Salesperson:
                    </strong>{' '}
                    Worked closely assisting home buyers in property
                    selection while consistently beating sales
                    pipelines for tier-1 development builders.
                  </p>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-slate-800 font-bold text-blue-400">
                    2
                  </div>

                  <p className="leading-relaxed">
                    <strong className="text-white">
                      2 Years Corporate Broker:
                    </strong>{' '}
                    Practiced as a Licensed Corporate Broker
                    developing core competencies in portfolio
                    management, project planning, and notary
                    compliance operations.
                  </p>
                </div>

              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <p className="italic leading-relaxed text-slate-400">
                  &quot;Driven by a passion for serving people and
                  helping families achieve their property aspirations,
                  she established BREA 88 Realty OPC with a vision
                  of delivering professional real estate services
                  founded on trust, excellence, and genuine care.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SERVICES
      ====================================================== */}
      <section
        id="services"
        className="border-y border-slate-200/50 bg-slate-100 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-900">
              Capabilities
            </span>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              Professional Services Offered
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {[
              'Real Estate Brokerage',
              'Residential Property Sales',
              'Commercial Property Brokerage',
              'Project Selling & Marketing',
              'Property Investment Consultation',
              'Property Acquisition Assistance',
              'Lead Generation Asset Control',
              'Real Estate Advisory Services',
            ].map((service) => (
              <div
                key={service}
                className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
              >
                <Briefcase className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-900" />

                <span className="text-sm font-bold text-slate-800">
                  {service}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CORE VALUES
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-900">
              Guiding Principles
            </span>

            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
              Our Core Values
            </h2>

            <div className="mt-8 space-y-6">

              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                  Service With A Heart
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  We place people at the center of everything we do
                  and serve with sincerity, compassion, and dedication.
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Integrity
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  We uphold honesty, transparency, accountability,
                  and ethical conduct in every transaction.
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
                  <Award className="h-4 w-4 text-amber-500" />
                  Excellence
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  We continuously strive to exceed expectations
                  through professionalism and quality service.
                </p>
              </div>

            </div>
          </div>

          {/* WHY PARTNER */}
          <div className="rounded-2xl bg-slate-900 p-8 text-white sm:p-10">
            <h3 className="mb-6 text-xl font-bold tracking-tight">
              Why Partner With Us?
            </h3>

            <div className="space-y-4 text-sm">
              {[
                'SEC and BIR Registered Company (2026)',
                'Led by an experienced Licensed Real Estate Broker',
                'Strong commitment to ethical and professional practices',
                "Personalized client care through 'Service with a Heart'",
                'Dedicated to achieving sales targets & developer objectives',
                'Professional, reliable, and results-oriented framework',
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-start gap-3 text-slate-300"
                >
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          CONTACT FORM
      ====================================================== */}
      <section
        id="contact"
        className="bg-slate-900 py-16 text-white sm:py-20"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl sm:p-8 md:p-12">

            <div className="mx-auto mb-10 max-w-xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
                Connect With Us
              </span>

              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Schedule an Advisory Session
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Our office will follow up with verified compliance
                details within 12 business hours.
              </p>
            </div>

            {/* SUCCESS MESSAGE */}
            {submitStatus === 'success' && (
              <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-4 text-center text-sm font-semibold text-emerald-200">
                Thank you! Your corporate inquiry has been routed
                straight to our office inbox.
              </div>
            )}

            {/* ERROR MESSAGE */}
            {submitStatus === 'error' && (
              <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/50 p-4 text-center text-sm font-semibold text-rose-200">
                Something went wrong. Please check your connection
                or contact us directly at{' '}
                <a
                  href="mailto:cylexnoecatadman123@gmail.com"
                  className="underline hover:text-white"
                >
                  cylexnoecatadman123@gmail.com
                </a>
                .
              </div>
            )}

            <form
              ref={formRef}
              onSubmit={sendEmail}
              className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2"
            >

              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* CONTACT */}
              <div>
                <label
                  htmlFor="contact_number"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Contact Number
                </label>

                <input
                  id="contact_number"
                  type="tel"
                  name="contact_number"
                  required
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* LOCATION */}
              <div>
                <label
                  htmlFor="prefer_location"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Preferred Location
                </label>

                <input
                  id="prefer_location"
                  type="text"
                  name="prefer_location"
                  required
                  placeholder="Metro Manila, Cebu..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* MESSAGE */}
              <div className="md:col-span-2">
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Your inquiry..."
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 py-3.5 font-bold text-white transition hover:bg-blue-800 active:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              >
                {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================
          ADMIN LOGIN MODAL
      ====================================================== */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">

            {/* CLOSE */}
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                setAuthError('');
                setAdminPassword('');
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="Close admin login"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 sm:p-8">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                <Lock className="h-6 w-6" />
              </div>

              <h3
                id="admin-modal-title"
                className="text-center text-xl font-bold tracking-tight text-slate-900"
              >
                Admin Gateway
              </h3>

              <p className="mb-6 mt-1 text-center text-xs text-slate-500">
                Access restricted to authorized compliance personnel.
              </p>

              {/* LOGIN ERROR */}
              {authError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">
                  {authError}
                </div>
              )}

              <form
                onSubmit={handleAdminLogin}
                className="space-y-4 text-slate-900"
              >

                {/* USERNAME */}
                <div>
                  <label
                    htmlFor="adminUsername"
                    className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Username ID
                  </label>

                  <input
                    id="adminUsername"
                    type="text"
                    required
                    autoComplete="username"
                    value={adminUsername}
                    onChange={(e) =>
                      setAdminUsername(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
                    placeholder="Enter ID"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="adminPassword"
                    className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Password Credentials
                  </label>

                  <div className="relative">
                    <input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) =>
                        setAdminPassword(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
                      placeholder="••••••••"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAuthenticating
                    ? 'Validating Token...'
                    : 'Authorize Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col items-start justify-between gap-8 border-b border-slate-900 pb-8 md:flex-row">

            {/* BRANDING */}
            <div className="flex max-w-sm items-start gap-4 text-left">
              <img
                src="/img/LOGO.png"
                alt="BREA 88 Realty Logo"
                className="h-14 w-14 rounded-full border border-slate-800 bg-black object-cover"
              />

              <div>
                <p className="text-sm font-bold tracking-wider text-slate-300">
                  BREA 88 REALTY OPC
                </p>

                <p className="mt-1 text-[11px] leading-relaxed">
                  Professional Real Estate Solutions with
                  Integrity, Excellence, and Compassion.
                </p>
              </div>
            </div>

            {/* CONTACT */}
            <div className="flex w-full flex-col gap-6 text-left sm:flex-row sm:gap-12">

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Get in Touch
                </p>

                <ul className="space-y-1.5 text-[11px]">

                  <li>
                    <span className="text-slate-400">
                      Phone:
                    </span>{' '}
                    <a
                      href="tel:+639196131001"
                      className="transition-colors hover:text-white"
                    >
                      +63919 613 1001
                    </a>
                  </li>

                  <li>
                    <span className="text-slate-400">
                      Email:
                    </span>{' '}
                    <a
                      href="mailto:brea081828@gmail.com"
                      className="transition-colors hover:text-white"
                    >
                      brea081828@gmail.com
                    </a>
                  </li>

                  <li>
                    <span className="text-slate-400">
                      Facebook:
                    </span>{' '}
                    <a
                      href="https://facebook.com/rodessa.estremos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-white"
                    >
                      Broker Rodesa Estremos
                    </a>
                  </li>

                </ul>
              </div>

              {/* OFFICE */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Office Address
                </p>

                <p className="max-w-[200px] text-[11px] leading-relaxed">
                  Block 20 Lot 1 Zone 3 Banderas,
                  Canduman Mandaue City 6014
                </p>
              </div>

            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center text-[10px] text-slate-500 sm:flex-row sm:text-left sm:text-[11px]">

            <p>
              © {new Date().getFullYear()} BREA 88 REALTY OPC.
              All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-4 sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(true);
                  setAuthError('');
                }}
                className="transition-colors hover:text-blue-400"
              >
                Admin
              </button>

              <a
                href="#privacy"
                className="transition-colors hover:text-slate-300"
              >
                Privacy Policy
              </a>

              <a
                href="#terms"
                className="transition-colors hover:text-slate-300"
              >
                Terms of Service
              </a>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}