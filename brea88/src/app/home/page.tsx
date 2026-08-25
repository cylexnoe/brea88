'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Menu,
  Building2,
  Phone,
  Mail,
  Loader2,
  User,
  LogOut,
  ChevronRight,
  Home
} from 'lucide-react';

import { PROPERTIES } from '../data';
import emailjs from '@emailjs/browser';

export default function HomePage() {
  const [agent, setAgent] = useState<{
    id: number;
    fullName: string;
    email: string;
    role: string;
    slug: string;
    phone: string | null;
    profileImage: string | null;
    bio: string | null;
    facebook: string | null;
    messenger: string | null;
    isActive: boolean;
  } | null>(null);

  const [agentLoading, setAgentLoading] = useState(true);
  const [agentLoggingOut, setAgentLoggingOut] = useState(false);
  useEffect(() => {
    let mounted = true;

    const checkAgentSession = async () => {
      try {
        const response = await fetch('/api/agent/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (mounted) {
            setAgent(null);
            setAgentLoading(false);
          }
          return;
        }

        const data = await response.json();

        if (
          mounted &&
          data?.success &&
          data?.agent &&
          data.agent.isActive
        ) {
          setAgent(data.agent);
        } else if (mounted) {
          setAgent(null);
        }
      } catch (error) {
        console.error('Agent session check failed:', error);

        if (mounted) {
          setAgent(null);
        }
      } finally {
        if (mounted) {
          setAgentLoading(false);
        }
      }
    };

    checkAgentSession();

    return () => {
      mounted = false;
    };
  }, []);

    const handleAgentLogout = async () => {
    if (agentLoggingOut) return;

    setAgentLoggingOut(true);

    try {
      await fetch('/api/agent/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Agent logout error:', error);
    } finally {
      window.location.href = '/home';
    }
  };
  
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

    // EmailJS successfully accepted the email
    setSubmitStatus('success');
    formRef.current.reset();

  } catch (error) {
    console.error('EmailJS Error:', error);

    // EmailJS failed
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

{/* =====================================================
    NAVIGATION
====================================================== */}

<nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    <div className="flex min-h-[68px] items-center justify-between gap-4 sm:min-h-[76px]">

      {/* LOGO */}
      <a
        href="#hero"
        className="group flex min-w-0 items-center gap-2 sm:gap-3"
      >
        <Image
          src="/img/LOGO.png"
          alt="BREA 88 Realty OPC"
          width={56}
          height={56}
          priority
          className="h-10 w-10 shrink-0 rounded-full object-cover shadow-md ring-2 ring-blue-50 transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
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

      {/* =================================================
          CLIENT NAVIGATION
          Shown when NOT logged in as an agent
      ================================================== */}

      {!agent && !agentLoading && (
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
      )}

      {/* =================================================
          AGENT / BROKER NAVIGATION
          Shown ONLY when authenticated
      ================================================== */}

      {agent && !agentLoading && (
        <div className="hidden items-center gap-1 md:flex">

          <a
            href="/home"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            <Home className="h-4 w-4" />
            Home
          </a>

          <a
            href="/agent/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950"
          >
            <Briefcase className="h-4 w-4" />
            Dashboard
          </a>

          <a
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950"
          >
            <Building2 className="h-4 w-4" />
            Properties
          </a>

          <a
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950"
          >
            <User className="h-4 w-4" />
            Profile
          </a>

        </div>
      )}

      {/* =================================================
          AGENT ACCOUNT
      ================================================== */}

      {agent && !agentLoading && (
        <div className="hidden items-center gap-3 md:flex">

          <a
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >

            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100">

              {agent.profileImage ? (
                <img
                  src={agent.profileImage}
                  alt={agent.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User
                  size={18}
                  className="text-slate-400"
                />
              )}

            </div>

            <div className="max-w-[140px] text-left">

              <p className="truncate text-sm font-bold text-slate-900">
                {agent.fullName}
              </p>

              <p className="truncate text-[11px] text-slate-500">
                {agent.role}
              </p>

            </div>

          </a>

          <button
            type="button"
            onClick={handleAgentLogout}
            disabled={agentLoggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {agentLoggingOut ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <LogOut size={17} />
            )}

            <span className="hidden xl:inline">
              Logout
            </span>

          </button>

        </div>
      )}

      {/* =================================================
          MOBILE MENU
      ================================================== */}

      <button
        type="button"
        onClick={() =>
          setMobileMenuOpen(
            previous => !previous
          )
        }
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileMenuOpen ? (
          <X size={21} />
        ) : (
          <Menu size={21} />
        )}
      </button>

    </div>

  </div>

  {/* =====================================================
      MOBILE NAVIGATION
  ====================================================== */}

  {mobileMenuOpen && (
    <div className="border-t border-slate-200 bg-white lg:hidden">

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

        {/* ===============================================
            AGENT MOBILE NAVIGATION
        ================================================ */}

        {agent && !agentLoading ? (
          <>
            {/* AGENT ACCOUNT */}

            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">

                {agent.profileImage ? (
                  <img
                    src={agent.profileImage}
                    alt={agent.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User
                    size={20}
                    className="text-slate-400"
                  />
                )}

              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-bold text-slate-900">
                  {agent.fullName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {agent.role}
                </p>

              </div>

            </div>

            <div className="space-y-1">

              <a
                href="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl bg-blue-950 px-4 py-3 text-left text-sm font-semibold text-white"
              >
                <Home size={18} />

                <span className="flex-1">
                  Home
                </span>

                <ChevronRight
                  size={17}
                  className="opacity-50"
                />
              </a>

              <a
                href="/agent/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Briefcase size={18} />

                <span className="flex-1">
                  Dashboard
                </span>

                <ChevronRight
                  size={17}
                  className="opacity-50"
                />
              </a>

              <a
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Building2 size={18} />

                <span className="flex-1">
                  Properties
                </span>

                <ChevronRight
                  size={17}
                  className="opacity-50"
                />
              </a>

              <a
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <User size={18} />

                <span className="flex-1">
                  Profile
                </span>

                <ChevronRight
                  size={17}
                  className="opacity-50"
                />
              </a>

            </div>

            <button
              type="button"
              onClick={handleAgentLogout}
              disabled={agentLoggingOut}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >

              {agentLoggingOut ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={18} />
              )}

              Logout

            </button>
          </>
        ) : (
          <>
            {/* =============================================
                CLIENT MOBILE NAVIGATION
            ============================================== */}

            <div className="space-y-1">

              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Home
              </a>

              <a
                href="#profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                About Us
              </a>

              <a
                href="#ceo"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Leadership
              </a>

              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Services
              </a>

              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Contact Us
              </a>

            </div>
          </>
        )}

      </div>

    </div>
  )}

</nav>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section id="hero"className="relative isolate overflow-hidden bg-slate-950 py-20 sm:py-24 md:py-32 lg:min-h-[680px] lg:py-36">
        <div className="absolute inset-0">
          <Image src="/img/background.png" alt="" fill priority className="object-cover object-center opacity-35"/>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-4xl text-white">

            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300 backdrop-blur-sm sm:text-xs">
              BREA 88 Realty OPC
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl md:text-6xl lg:text-7xl">
              Service with a Heart,
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Building Trust from the Start.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
              BREA 88 REALTY OPC provides professional real
              estate solutions with Integrity, Excellence,
              and Compassion throughout the Philippines.
            </p>

                    <div className="mt-9 w-full max-w-4xl sm:mt-10">
                  <div className="rounded-2xl border border-white/20 bg-white/95 p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-3">

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">

                      {/* SEARCH INPUT */}
                      <div className="relative md:col-span-8">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                        <input
                          type="text"
                          placeholder="Search properties, locations, or keywords..."
                          className="w-full rounded-xl border border-transparent bg-slate-100 py-4 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* PROPERTY BUTTON */}
                      <div className="md:col-span-4">
                        <a
                          href="/marketplace"
                          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg active:translate-y-0"
                        >
                          <Building2 className="h-4 w-4" />
                          Property For You
                        </a>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>  


      {/* =====================================================
          CORPORATE PROFILE
      ====================================================== */}

      <section
        id="profile"
        className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">

            {/* COMPANY OVERVIEW */}
            <div className="flex lg:col-span-7">

              <div className="group flex w-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)] sm:p-8 lg:p-10">

                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Corporate Profile
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Company Overview
                </h2>

                <div className="mt-6 max-w-3xl space-y-5">

                  <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                    BREA 88 Realty OPC is a duly registered real estate brokerage
                    company committed to providing professional, ethical, and
                    client-centered real estate services. Guided by our core
                    principle,
                    <strong className="text-blue-900">
                      {' '}“Service with a Heart,”
                    </strong>{' '}
                    we are dedicated to helping clients achieve their real estate
                    goals through integrity, expertise, and personalized service.
                  </p>

                  <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                    Established in 2026, BREA 88 Realty OPC was founded to deliver
                    exceptional real estate solutions while building lasting
                    relationships with developers, investors, property owners, and
                    homebuyers.
                  </p>

                </div>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 transition-transform duration-300 group-hover:scale-105">
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

                  <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 transition-transform duration-300 group-hover:scale-105">
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

              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-6 text-white shadow-[0_20px_50px_rgba(30,64,175,0.20)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(30,64,175,0.28)] sm:p-8 lg:p-10">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

                  <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="flex items-center justify-between gap-4 border-b border-blue-800 pb-5">

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                      Our Direction
                    </p>

                    <h3 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
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
                      'Providing “Service with a Heart” in every transaction and client engagement.',
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
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-28"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* SECTION HEADER */}
        <div className="mx-auto max-w-2xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Our Leadership
          </span>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Led with Purpose,
            <span className="text-blue-900"> Driven by Service</span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            At BREA 88 Realty OPC, leadership means creating meaningful
            relationships, delivering professional service, and putting
            our clients first.
          </p>

        </div>


        {/* LEADER CARD */}
        <div className="mx-auto mt-12 max-w-5xl">

          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.12)]">

            <div className="grid lg:grid-cols-2">


              {/* =================================================
                  LEADER IMAGE
              ================================================== */}

              <div className="relative min-h-[380px] overflow-hidden bg-slate-100 sm:min-h-[450px] lg:min-h-[560px]">

                <Image
                  src="/img/CEO.png"
                  alt="Chief Executive Officer of BREA 88 Realty OPC"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                {/* Bottom image label */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                    BREA 88 REALTY OPC
                  </div>

                </div>

              </div>


              {/* =================================================
                  LEADER INFORMATION
              ================================================== */}

              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Chief Executive Officer
                </span>

                <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Rodesa E Estremos
                </h3>

                <div className="mt-5 h-1 w-12 rounded-full bg-blue-900" />

                <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  As the leader of BREA 88 Realty OPC, our commitment is
                  to provide clients with professional real estate
                  guidance built on integrity, trust, and genuine care.
                </p>

                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  Every property journey is different. Our goal is to
                  understand each client's needs and help them make
                  confident decisions while building relationships that
                  last beyond the transaction.
                </p>


                {/* VALUES */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">

                  {/* VALUE 1 */}
                  <div className="group/value rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Integrity
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Honest and transparent service
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* VALUE 2 */}
                  <div className="group/value rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                        <Heart className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Compassion
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Service with a genuine heart
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* VALUE 3 */}
                  <div className="group/value rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                        <Award className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Excellence
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Professional real estate solutions
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* VALUE 4 */}
                  <div className="group/value rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                        <CheckCircle className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Commitment
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Focused on client success
                        </p>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

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
          className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-28"
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-slate-200/60 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* SECTION HEADER */}
            <div className="mx-auto max-w-3xl text-center">

              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                What We Offer
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Real Estate Services
                <span className="text-blue-900"> Built Around You</span>
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                From finding the right property to making confident real estate
                decisions, BREA 88 Realty OPC provides professional support
                throughout your property journey.
              </p>

            </div>


            {/* SERVICE GRID */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* SERVICE 1 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-7">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-white">
                    <Search className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                    Property Search
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Find residential, commercial, and investment properties
                    that match your needs, preferences, and budget.
                  </p>

                  <a
                    href="/marketplace"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                  >
                    Browse Properties
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>


              {/* SERVICE 2 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-7">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-white">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                    Property Marketing
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Professional property presentation and marketing designed
                    to connect properties with the right buyers and investors.
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                  >
                    Market Your Property
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>


              {/* SERVICE 3 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-7">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-white">
                    <Briefcase className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                    Investment Guidance
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Explore property opportunities with guidance focused on
                    your investment goals and long-term plans.
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                  >
                    Discuss an Investment
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>


              {/* SERVICE 4 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-7">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-white">
                    <FileText className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                    Property Assistance
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Get support throughout the property process, from initial
                    inquiries to the important steps of your transaction.
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                  >
                    Get Assistance
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>


              {/* SERVICE 5 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-7">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-900 group-hover:text-white">
                    <MapPin className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                    Property Viewing
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Schedule a property viewing and experience potential
                    properties with assistance from our team.
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                  >
                    Schedule a Viewing
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>


              {/* SERVICE 6 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-blue-950 p-6 text-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(30,64,175,0.20)] sm:p-7">

                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/10">
                    <Phone className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black tracking-tight">
                    Personalized Consultation
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-blue-100/80">
                    Have questions about buying, selling, or investing?
                    Talk directly with our team and let us understand what
                    you're looking for.
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-950 transition-all duration-300 hover:bg-blue-50"
                  >
                    Talk to Us
                    <span aria-hidden="true">→</span>
                  </a>

                </div>

              </div>

            </div>


            {/* BOTTOM CTA */}
            <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-7 shadow-xl sm:p-9 lg:p-10">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="max-w-2xl">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                    Ready to Find Your Property?
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Let's find the right opportunity for you.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-100/75">
                    Explore available properties or speak with our team
                    about your real estate goals.
                  </p>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <a
                    href="/marketplace"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    View Properties
                  </a>

                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    Contact Us
                  </a>

                </div>

              </div>

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
                'Personalized client care through “Service with a Heart”',
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
        className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-28"
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* SECTION HEADER */}
          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Get in Touch
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Let's Talk About Your
              <span className="text-blue-900"> Property Goals</span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Whether you're looking to buy, sell, invest, or simply learn
              more about a property, our team is ready to help.
            </p>

          </div>


          {/* CONTACT CONTENT */}
          <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">

            <div className="relative overflow-hidden rounded-3xl bg-blue-950 p-7 text-white shadow-[0_20px_50px_rgba(30,64,175,0.18)] sm:p-9 lg:p-10">

              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

              <div className="relative">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  BREA 88 Realty OPC
                </p>

                <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  Your next property journey starts here.
                </h3>

                <p className="mt-4 text-sm leading-7 text-blue-100/75">
                  Tell us what you're looking for and our team will help
                  you explore the right property opportunities.
                </p>


                {/* CONTACT DETAILS */}
                <div className="mt-8 space-y-4">

                  {/* LOCATION */}
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        Office
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white">
                        Cebu, Philippines
                      </p>
                    </div>

                  </div>


                  {/* PHONE */}
                  <a
                    href="tel:+639XXXXXXXXX"
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                      <Phone className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        Phone
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white">
                        Contact our team
                      </p>
                    </div>

                  </a>


                  {/* EMAIL */}
                  <a
                    href="mailto:info@brea88realty.com"
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                      <Mail className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm leading-6 text-white">
                        info@brea88realty.com
                      </p>
                    </div>

                  </a>

                </div>


                {/* TRUST MESSAGE */}
                <div className="mt-8 border-t border-white/10 pt-7">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400/10 text-blue-200">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">
                        Professional & Client-Focused
                      </p>

                      <p className="mt-0.5 text-xs text-blue-100/60">
                        Your property goals are our priority.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                INQUIRY FORM
            ================================================== */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_50px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Property Inquiry
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Send us a message
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill out the form below and our team will get back to you.
                </p>

              </div>


              {/* =================================================
                  FORM

                  IMPORTANT:
                  Keep your existing form field names and
                  sendEmail() handler if they already exist.
              ================================================== */}

              <form
                ref={formRef}
                onSubmit={sendEmail}
                className="mt-8 space-y-5"
              >

                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* CONTACT NUMBER */}
                <div>
                  <label
                    htmlFor="contact-number"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Contact Number
                  </label>

                  <input
                    id="contact-number"
                    type="tel"
                    name="contact_number"
                    required
                    placeholder="09XX XXX XXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* PREFERRED LOCATION */}
                <div>
                  <label
                    htmlFor="prefer-location"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Preferred Location
                  </label>

                  <input
                    id="prefer-location"
                    type="text"
                    name="prefer_location"
                    required
                    placeholder="e.g. Cebu City, Mandaue, Lapu-Lapu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* MESSAGE */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Message
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us what you're looking for..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                {/* SUBMIT */}
               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Inquiry

                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </>
                  )}
                </button>
                                  {submitStatus === 'success' && !isSubmitting && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                      ✓ Inquiry sent successfully! We'll get back to you soon.
                    </div>
                  )}

                  {submitStatus === 'error' && !isSubmitting && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                      ✕ Failed to send your inquiry. Please try again.
                    </div>
                  )}


                <p className="text-center text-[11px] leading-5 text-slate-400">
                  By submitting this form, you agree to be contacted regarding
                  your inquiry.
                </p>

              </form>

            </div>

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



