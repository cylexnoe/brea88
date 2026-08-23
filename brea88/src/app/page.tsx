'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Heart,
  ShieldCheck,
  Award,
  Briefcase,
  FileText,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  X,
  User,
  Menu,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

import { PROPERTIES } from './data';
import emailjs from '@emailjs/browser';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const formRef = useRef<HTMLFormElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // ADMIN LOGIN
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const filteredProperties =
    filter === 'All'
      ? PROPERTIES
      : PROPERTIES.filter((property) => property.tag === filter);

  // =========================================================
  // EMAILJS
  // =========================================================

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
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // ADMIN LOGIN
  // =========================================================

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
        return;
      }

      setAuthError(
        data.message || 'Access Denied. Check your credentials.'
      );
    } catch (error) {
      console.error(error);

      setAuthError(
        'Network error. Connection failed. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex min-h-16 items-center justify-between gap-4 sm:min-h-20">

            {/* LOGO */}
            <a
              href="#hero"
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <Image
                src="/img/LOGO.png"
                alt="BREA 88 Realty OPC"
                width={56}
                height={56}
                priority
                className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14"
              />

              <div className="min-w-0">
                <p className="truncate text-xs font-black tracking-tight text-blue-900 sm:text-base lg:text-xl">
                  BREA 88 REALTY OPC
                </p>

                <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-slate-500 sm:text-[9px]">
                  Service with a Heart
                </p>
              </div>
            </a>

            {/* DESKTOP NAV */}
            <div className="hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex xl:gap-7">
              <a
                href="#hero"
                className="transition hover:text-blue-700"
              >
                Home
              </a>

              <a
                href="#profile"
                className="transition hover:text-blue-700"
              >
                About Us
              </a>

              <a
                href="#ceo"
                className="transition hover:text-blue-700"
              >
                Leadership
              </a>

              <a
                href="#services"
                className="transition hover:text-blue-700"
              >
                Services
              </a>

              <a
                href="#contact"
                className="transition hover:text-blue-700"
              >
                Contact Us
              </a>
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden items-center gap-3 lg:flex">  

              <a
                href="/profile"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                <User className="h-4 w-4" />
                Profile
              </a>
            </div>

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
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
              <div className="grid gap-1">

                {[
                  ['Home', '#hero'],
                  ['About Us', '#profile'],
                  ['Leadership', '#ceo'],
                  ['Services', '#services'],
                  ['Contact Us', '#contact'],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-900"
                  >
                    {label}
                  </a>
                ))}

                <div className="mt-2 grid gap-2 border-t border-slate-100 pt-3">

                  <a
                    href="/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-800"
                  >
                    <Building2 className="h-4 w-4" />
                    Property For You
                  </a>

                  <a
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
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
          HERO
      ====================================================== */}

      <section
        id="hero"
        className="relative overflow-hidden bg-slate-950 py-16 sm:py-20 md:py-28 lg:py-36"
      >
        <div className="absolute inset-0">

          <Image
            src="/img/background.png"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/50" />
        </div>
<div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg sm:p-6">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

            <div className="relative md:col-span-8">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

              <input
                type="text"
                placeholder="Search properties, locations, or keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-4">
              <a
                href="/marketplace"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md active:translate-y-0"
              >
                <Building2 className="h-4 w-4" />
                Property For You
              </a>
            </div>

          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-4xl text-white">

            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300 backdrop-blur-sm sm:text-xs">
              BREA 88 Realty OPC
            </span>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Service with a Heart,
              <br />
              <span className="text-blue-400">
                Building Trust from the Start.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
              BREA 88 REALTY OPC provides professional real
              estate solutions with Integrity, Excellence,
              and Compassion throughout the Philippines.
            </p>

          </div>
        </div>
      </section>

      {/* =====================================================
          PROPERTY SEARCH
      ====================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg sm:p-6">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

            <div className="relative md:col-span-8">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

              <input
                type="text"
                placeholder="Search properties, locations, or keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-4">
              <a
                href="/marketplace"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md active:translate-y-0"
              >
                <Building2 className="h-4 w-4" />
                Property For You
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CORPORATE PROFILE
      ====================================================== */}

      <section
        id="profile"
        className="bg-slate-50 py-10 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">

            {/* COMPANY OVERVIEW */}
            <div className="flex lg:col-span-7">

              <div className="flex w-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-7 lg:p-8">

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-900">
                  Corporate Profile
                </span>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Company Overview
                </h2>

                <div className="mt-5 space-y-4">

                  <p className="text-sm leading-7 text-slate-600 sm:text-base">
                    BREA 88 Realty OPC is a duly registered real estate brokerage
                    company committed to providing professional, ethical, and
                    client-centered real estate services. Guided by our core
                    principle,
                    <strong className="text-blue-900">
                      {' '}“Service with a Heart,”
                    </strong>{' '}
                    we are dedicated to helping clients achieve their real estate
                    goals through integrity, expertise, and personalized service.
                  </p>

                  <p className="text-sm leading-7 text-slate-600 sm:text-base">
                    Established in 2026, BREA 88 Realty OPC was founded to deliver
                    exceptional real estate solutions while building lasting
                    relationships with developers, investors, property owners, and
                    homebuyers.
                  </p>

                </div>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/40">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-900" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        SEC Registration
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        May 14, 2026
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/40">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-900" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        BIR Registration
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        May 19, 2026
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* VISION & MISSION */}
            <div className="flex lg:col-span-5">

              <div className="flex h-full w-full flex-col rounded-2xl bg-blue-900 p-5 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-7 lg:p-8">

                <div className="flex items-center justify-between gap-4 border-b border-blue-800 pb-5">

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
                      Our Direction
                    </p>

                    <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                      Vision & Mission
                    </h3>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Award className="h-5 w-5 text-blue-200" />
                  </div>

                </div>

                <div className="mt-7">
                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
                    Vision
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-blue-100 sm:text-base">
                    To be a trusted and respected real estate brokerage company
                    recognized for excellence, integrity, innovation, and
                    compassionate service, creating meaningful opportunities for
                    clients, developers, and communities.
                  </p>
                </div>

                <div className="mt-7 border-t border-blue-800 pt-6">

                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
                    Mission Focus
                  </h4>

                  <ul className="mt-4 space-y-4 text-sm leading-6 text-blue-100">

                    {[
                      'Delivering professional and ethical real estate services.',
                      'Building long-term partnerships based on trust, transparency, and mutual success.',
                      'Assisting clients in making informed and rewarding property investment decisions.',
                      'Supporting developer partners through effective project marketing and sales strategies.',
                      'Providing “Service with a Heart” in every transaction and client engagement.',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white">
                          ✓
                        </span>

                        <span>{item}</span>
                      </li>
                    ))}

                  </ul>
                </div>

                <div className="mt-auto pt-8">
                  <div className="h-px w-full bg-blue-800" />

                  <p className="mt-4 text-xs font-medium text-blue-300">
                    BREA 88 REALTY OPC — Service with a Heart
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CEO
      ====================================================== */}

      <section
        id="ceo"
        className="bg-slate-900 py-16 text-white sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">

            <div className="lg:col-span-5">

              <div className="relative h-[380px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:h-[480px]">

                <Image
                  src="/img/CEO.png"
                  alt="Rodesa E. Estremos - CEO"
                  fill
                  className="object-cover grayscale contrast-125"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 sm:p-6">

                  <p className="text-lg font-bold">
                    Rodesa E. Estremos, REB, REA
                  </p>

                  <p className="mt-1 text-xs font-semibold text-rose-400">
                    Founder & Chief Executive Officer
                  </p>

                </div>
              </div>
            </div>

            <div className="lg:col-span-7">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
                Founder Profile
              </span>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Executive Advisory
              </h2>

              <p className="mt-6 text-sm leading-7 text-slate-300 sm:text-base">
                With eight (8) years of active,
                multi-disciplinary experience in the
                Philippine real estate market, Mrs. Estremos
                has built an immaculate career foundation
                across sales, marketing, client management,
                and brokerage compliance operations.
              </p>

              <div className="mt-8 grid gap-4">

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">

                  <div className="flex gap-4">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-rose-500">
                      6
                    </div>

                    <div>
                      <p className="font-bold text-white">
                        6 Years Registered Salesperson
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Worked closely assisting home buyers
                        in property selection while consistently
                        beating sales pipelines for tier-1
                        development builders.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">

                  <div className="flex gap-4">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-blue-400">
                      2
                    </div>

                    <div>
                      <p className="font-bold text-white">
                        2 Years Corporate Broker
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Practiced as a Licensed Corporate Broker
                        developing core competencies in portfolio
                        management, project planning, and notary
                        compliance operations.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">

                <p className="text-sm italic leading-7 text-slate-400">
                  “Driven by a passion for serving people and
                  helping families achieve their property
                  aspirations, she established BREA 88 Realty
                  OPC with a vision of delivering professional
                  real estate services founded on trust,
                  excellence, and genuine care.”
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
        className="border-y border-slate-200/50 bg-slate-100 py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-900">
              Capabilities
            </span>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Professional Services Offered
            </h2>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <Briefcase className="h-5 w-5 text-blue-900 transition group-hover:scale-110" />

                <p className="mt-4 text-sm font-bold leading-6 text-slate-800">
                  {service}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* =====================================================
          CORE VALUES
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">

          <div>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-900">
              Guiding Principles
            </span>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Our Core Values
            </h2>

            <div className="mt-8 grid gap-5">

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />

                  <h3 className="font-bold text-blue-900">
                    Service With A Heart
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  We place people at the center of everything
                  we do and serve with sincerity, compassion,
                  and dedication.
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />

                  <h3 className="font-bold text-blue-900">
                    Integrity
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  We uphold honesty, transparency,
                  accountability, and ethical conduct in every
                  transaction.
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-amber-500" />

                  <h3 className="font-bold text-blue-900">
                    Excellence
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  We continuously strive to exceed expectations
                  through professionalism and quality service.
                </p>

              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl sm:p-8 lg:p-10">

            <h3 className="text-xl font-bold">
              Why Partner With Us?
            </h3>

            <div className="mt-6 grid gap-4">

              {[
                'SEC and BIR Registered Company (2026)',
                'Led by an experienced Licensed Real Estate Broker',
                'Strong commitment to ethical and professional practices',
                'Personalized client care through “Service with a Heart”',
                'Dedicated to achieving sales targets & developer objectives',
                'Professional, reliable, and results-oriented framework',
              ].map((text) => (
                <div
                  key={text}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="flex gap-3">

                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

                    <span className="text-sm leading-6 text-slate-300">
                      {text}
                    </span>

                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section
        id="contact"
        className="bg-slate-900 py-16 text-white sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl sm:p-8 md:p-12">

            <div className="mx-auto mb-10 max-w-xl text-center">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
                Connect With Us
              </span>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Schedule an Advisory Session
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Our office will follow up with verified
                compliance details within 12 business hours.
              </p>

            </div>

            {submitStatus === 'success' && (
              <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-center text-sm font-semibold text-emerald-200">
                Thank you! Your corporate inquiry has been
                routed straight to our office inbox.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-center text-sm font-semibold text-rose-200">
                Something went wrong. Please check your
                connection or contact us directly.
              </div>
            )}

            <form
              ref={formRef}
              onSubmit={sendEmail}
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Contact Number
                </label>

                <input
                  type="tel"
                  name="contact_number"
                  required
                  placeholder="Phone Number"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Preferred Location
                </label>

                <input
                  type="text"
                  name="prefer_location"
                  required
                  placeholder="Metro Manila, Cebu..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Message
                </label>

                <textarea
                  name="message"
                  rows={5}
                  required
                  placeholder="Your inquiry..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">

          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <button
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                setAuthError('');
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 sm:p-8">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                <Lock className="h-6 w-6" />
              </div>

              <h3 className="text-center text-xl font-bold text-slate-900">
                Admin Gateway
              </h3>

              <p className="mt-1 text-center text-xs leading-5 text-slate-500">
                Access restricted to authorized compliance
                personnel.
              </p>

              {authError && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">
                  {authError}
                </div>
              )}

              <form
                onSubmit={handleAdminLogin}
                className="mt-6 grid gap-5"
              >

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Username ID
                  </label>

                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) =>
                      setAdminUsername(e.target.value)
                    }
                    placeholder="Enter ID"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Password Credentials
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) =>
                        setAdminPassword(e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-slate-400 transition hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="mt-1 flex w-full items-center justify-center rounded-xl bg-blue-900 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
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

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <Image
                src="/img/LOGO.png"
                alt="BREA 88 Realty OPC Logo"
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full border border-slate-800 object-cover"
              />

              <div>
                <p className="text-sm font-bold tracking-wider text-white">
                  BREA 88 REALTY OPC
                </p>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                  Professional Real Estate Solutions with
                  Integrity, Excellence, and Compassion.
                </p>
              </div>

            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">

            <div className="lg:col-span-7">

              <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">

                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Get in Touch
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <a
                    href="tel:+639196131001"
                    className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-800"
                  >
                    <div className="flex items-center gap-3">

                      <Phone className="h-4 w-4 text-blue-500" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Phone
                      </p>

                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-300 group-hover:text-white">
                      +63919 613 1001
                    </p>
                  </a>

                  <a
                    href="mailto:brea081828@gmail.com"
                    className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-800"
                  >
                    <div className="flex items-center gap-3">

                      <Mail className="h-4 w-4 text-blue-500" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Email
                      </p>

                    </div>

                    <p className="mt-3 break-all text-sm font-semibold text-slate-300 group-hover:text-white">
                      brea081828@gmail.com
                    </p>
                  </a>

                  {/* FACEBOOK */}
                  <a
                    href="https://facebook.com/rodessa.estremos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-800 sm:col-span-2"
                  >

                    <div className="flex items-center gap-3">

                      {/* Facebook icon replacement */}
                      <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-blue-500 text-[11px] font-black leading-none text-white">
                        f
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Facebook
                      </p>

                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-300 group-hover:text-white">
                      Broker Rodesa Estremos
                    </p>

                  </a>

                </div>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="lg:col-span-5">

              <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">

                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Office Address
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <div className="flex gap-3">

                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-500" />

                    <p className="text-sm leading-6 text-slate-300">
                      Block 20 Lot 1 Zone 3 Banderas,
                      <br />
                      Canduman,
                      <br />
                      Mandaue City 6014
                    </p>

                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-900 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

            <p className="text-[10px] text-slate-500 sm:text-[11px]">
              © {new Date().getFullYear()} BREA 88
              REALTY OPC. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px]">

              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="text-slate-400 transition hover:text-blue-400"
              >
                Admin
              </button>

              <a
                href="#privacy"
                className="text-slate-400 transition hover:text-white"
              >
                Privacy Policy
              </a>

              <a
                href="#terms"
                className="text-slate-400 transition hover:text-white"
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