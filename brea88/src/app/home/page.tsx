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
  Home,
  Check
} from 'lucide-react';

import { PROPERTIES } from '../data';
import AgentPicker from '../../components/AgentPicker';

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


const [agentSlug, setAgentSlug] = useState('');

const [selectedInquiryAgent, setSelectedInquiryAgent] =
  useState<{
    id: number;
    fullName: string;
    role: string;
    slug: string;
    profileImage?: string | null;
    lastSeen?: string | null;
  } | null>(null);

const [showAgentPicker, setShowAgentPicker] =
  useState(false);

const [pendingInquiry, setPendingInquiry] =
  useState<{
    name: string;
    email: string;
    phone: string;
    message: string;
    agentSlug?: string;
  } | null>(null);
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('agent') || '';
  setAgentSlug(slug);
}, []);

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

  // =========================================================
// HOME INQUIRY
// =========================================================

  const submitInquiry = async (payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
  agentSlug?: string;
}) => {
  try {
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'Failed to send inquiry'
      );
    }

    setSubmitStatus('success');

    if (formRef.current) {
      formRef.current.reset();
    }

    setSelectedInquiryAgent(null);
    setPendingInquiry(null);
    setShowAgentPicker(false);

  } catch (error) {
    console.error('Inquiry Error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};

const sendEmail = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  if (!formRef.current || isSubmitting) {
    return;
  }

  setIsSubmitting(true);
  setSubmitStatus('idle');

  const formData = new FormData(formRef.current);

  const name = String(
    formData.get('name') || ''
  ).trim();

  const email = String(
    formData.get('email') || ''
  ).trim();

  const phone = String(
    formData.get('contact_number') || ''
  ).trim();

  const message = String(
    formData.get('message') || ''
  ).trim();

  const preferLocation = String(
    formData.get('prefer_location') || ''
  ).trim();

  const fullMessage = preferLocation
    ? `${message}\n\nPreferred Location: ${preferLocation}`
    : message;

  /*
   * If this page was opened through a permanent
   * agent link, use that agent automatically.
   */
  const resolvedAgentSlug =
    agentSlug ||
    selectedInquiryAgent?.slug ||
    undefined;

  /*
   * Direct website:
   * client must choose an agent first.
   */
  if (!resolvedAgentSlug) {
    setPendingInquiry({
      name,
      email,
      phone,
      message: fullMessage,
    });

    setIsSubmitting(false);
    setShowAgentPicker(true);

    return;
  }

  await submitInquiry({
    name,
    email,
    phone,
    message: fullMessage,
    agentSlug: resolvedAgentSlug,
  });
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


<nav className="fixed inset-x-0 top-0 z-50 w-full px-3 pt-3 sm:px-5 lg:px-8">

  {/* GLASS NAVBAR */}
  <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-[0_12px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl backdrop-saturate-150">

    {/* Top glass reflection */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

    {/* Bottom ambient glow */}
    <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

    {/* Soft internal light */}
    <div className="pointer-events-none absolute -top-20 left-1/3 h-32 w-64 rounded-full bg-blue-400/5 blur-3xl" />

    <div className="relative">

      {/* =====================================================
          MAIN NAV
      ====================================================== */}

      <div className="flex min-h-[70px] items-center justify-between gap-3 px-3 sm:min-h-[76px] sm:px-5 lg:px-6">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <a
          href="#hero"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex min-w-0 items-center gap-3"
        >

          {/* Logo */}
          <div className="relative shrink-0">

            <div className="absolute -inset-2 rounded-full bg-blue-500/10 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />

            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/80 shadow-[0_5px_20px_rgba(15,23,42,0.12)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.18)] sm:h-11 sm:w-11 lg:h-12 lg:w-12">

              <Image
                src="/img/LOGO.png"
                alt="BREA 88 Realty OPC"
                width={56}
                height={56}
                priority
                className="h-full w-full rounded-full object-cover"
              />

            </div>
          </div>

          {/* Brand */}
          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <p className="truncate text-[11px] font-black tracking-[-0.025em] text-slate-950 sm:text-base lg:text-[17px]">
                BREA 88 REALTY
              </p>

              <span className="hidden rounded-full border border-amber-200/70 bg-amber-50/70 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-amber-700 shadow-sm sm:inline-flex">
                OPC
              </span>

            </div>

            <div className="mt-0.5 flex items-center gap-2">

              <span className="h-px w-5 bg-gradient-to-r from-amber-500 to-transparent" />

              <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600 sm:text-[8px]">
                Service with a Heart
              </p>

            </div>

          </div>

        </a>


        {/* =====================================================
            CLIENT NAVIGATION
        ====================================================== */}

        {!agent && !agentLoading && (
          <div className="hidden items-center gap-1 lg:flex">

            {/* Navigation group */}
            <div className="flex items-center rounded-xl border border-white/60 bg-white/35 p-1 shadow-inner backdrop-blur-md">

              <a
                href="#hero"
                className="group relative rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-blue-950 xl:px-4"
              >
                Home

                <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-5" />
              </a>

              <a
                href="#profile"
                className="group relative rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-blue-950 xl:px-4"
              >
                About Us

                <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-5" />
              </a>

              <a
                href="#ceo"
                className="group relative rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-blue-950 xl:px-4"
              >
                Leadership

                <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-5" />
              </a>

              <a
                href="#services"
                className="group relative rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-blue-950 xl:px-4"
              >
                Services

                <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-5" />
              </a>

            </div>

            {/* Contact */}
            <a
              href="#contact"
              className="ml-2 inline-flex items-center rounded-xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_7px_22px_rgba(30,64,175,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-900 hover:to-blue-700 hover:shadow-[0_10px_30px_rgba(30,64,175,0.30)]"
            >
              Contact Us
            </a>

          </div>
        )}


        {/* =====================================================
            AGENT / BROKER NAVIGATION
        ====================================================== */}

        {agent && !agentLoading && (
          <div className="hidden items-center gap-1 md:flex">

            <div className="flex items-center rounded-xl border border-white/60 bg-white/35 p-1 shadow-inner backdrop-blur-md">

              <a
                href="/home"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_18px_rgba(23,37,84,0.18)] transition-all duration-300 hover:bg-blue-900"
              >
                <Home className="h-4 w-4" />
                Home
              </a>

              <a
                href="/agent/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-950"
              >
                <Briefcase className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                Dashboard
              </a>

              <a
                href={
                  agentSlug
                    ? `/marketplace?agent=${encodeURIComponent(agentSlug)}`
                    : "/marketplace"
                }
                className="group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-950"
              >
                <Building2 className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                Properties
              </a>

            </div>

          </div>
        )}


        {/* =====================================================
            AGENT ACCOUNT
        ====================================================== */}

        {agent && !agentLoading && (
          <div className="hidden items-center gap-2 md:flex">

            {/* Profile */}
            <a
              href="/profile"
              className="group flex items-center gap-3 rounded-xl border border-white/70 bg-white/45 px-2.5 py-1.5 shadow-[0_4px_18px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:bg-white/75 hover:shadow-[0_8px_25px_rgba(15,23,42,0.10)]"
            >

              <div className="relative shrink-0">

                <div className="rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-300 p-[2px] shadow-sm">

                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">

                    {agent.profileImage ? (
                      <img
                        src={agent.profileImage}
                        alt={agent.fullName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <User
                        size={17}
                        className="text-slate-400"
                      />
                    )}

                  </div>

                </div>

                {/* Online */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />

              </div>


              <div className="max-w-[135px] min-w-0 text-left">

                <p className="truncate text-[12px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-800">
                  {agent.fullName}
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">

                  <span className="truncate rounded-md bg-blue-50/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-blue-800">
                    {agent.role}
                  </span>

                  <span className="text-[8px] font-medium text-slate-400">
                    Account
                  </span>

                </div>

              </div>

              <ChevronRight
                size={14}
                className="mr-1 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-blue-600"
              />

            </a>


            {/* Logout */}
            <button
              type="button"
              onClick={handleAgentLogout}
              disabled={agentLoggingOut}
              aria-label="Logout"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/45 text-slate-500 shadow-[0_4px_18px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-[0_8px_25px_rgba(239,68,68,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
            >

              {agentLoggingOut ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LogOut
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              )}

            </button>

          </div>
        )}


        {/* =====================================================
            MOBILE BUTTON
        ====================================================== */}

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(previous => !previous)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/65 text-slate-700 shadow-[0_4px_15px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-950 active:scale-95 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

      </div>


      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (
        <div className="border-t border-white/60 bg-white/75 backdrop-blur-2xl lg:hidden">

          <div className="px-3 py-3 sm:px-5">

            {agent && !agentLoading ? (
              <>

                {/* Agent Account */}
                <div className="mb-3 rounded-xl border border-white/80 bg-white/60 p-3 shadow-[0_5px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl">

                  <div className="flex items-center gap-3">

                    <div className="relative">

                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-blue-100 shadow-md">

                        {agent.profileImage ? (
                          <img
                            src={agent.profileImage}
                            alt={agent.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User
                            size={19}
                            className="text-slate-400"
                          />
                        )}

                      </div>

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-slate-900">
                        {agent.fullName}
                      </p>

                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-800">
                        {agent.role}
                      </p>

                    </div>

                  </div>

                </div>


                {/* Agent Links */}
                <div className="space-y-1.5">

                  <a
                    href="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex w-full items-center gap-3 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300"
                  >
                    <Home size={18} />

                    <span className="flex-1">
                      Home
                    </span>

                    <ChevronRight size={16} className="opacity-50" />
                  </a>

                  <a
                    href="/agent/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                  >
                    <Briefcase size={18} />

                    <span className="flex-1">
                      Dashboard
                    </span>

                    <ChevronRight size={16} className="opacity-30" />
                  </a>

                  <a
                    href={
                      agentSlug
                        ? `/marketplace?agent=${encodeURIComponent(agentSlug)}`
                        : "/marketplace"
                    }
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                  >
                    <Building2 size={18} />

                    <span className="flex-1">
                      Properties
                    </span>

                    <ChevronRight size={16} className="opacity-30" />
                  </a>

                  <a
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                  >
                    <User size={18} />

                    <span className="flex-1">
                      Profile
                    </span>

                    <ChevronRight size={16} className="opacity-30" />
                  </a>

                </div>


                {/* Logout */}
                <button
                  type="button"
                  onClick={handleAgentLogout}
                  disabled={agentLoggingOut}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl border border-red-100/80 bg-red-50/70 px-4 py-3.5 text-left text-sm font-semibold text-red-600 backdrop-blur-md transition-all duration-300 hover:bg-red-100 disabled:opacity-50"
                >

                  {agentLoggingOut ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={18} />
                  )}

                  <span>
                    Logout
                  </span>

                </button>

              </>
            ) : (

              /* =================================================
                 CLIENT MOBILE NAVIGATION
              ================================================== */

              <div className="space-y-1.5">

                <a
                  href="#hero"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center rounded-xl bg-blue-50/80 px-4 py-3.5 text-sm font-semibold text-blue-950 transition-all duration-300"
                >
                  <span className="flex-1">
                    Home
                  </span>

                  <ChevronRight size={17} className="text-blue-400" />
                </a>

                <a
                  href="#profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                >
                  <span className="flex-1">
                    About Us
                  </span>

                  <ChevronRight size={17} className="text-slate-300" />
                </a>

                <a
                  href="#ceo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                >
                  <span className="flex-1">
                    Leadership
                  </span>

                  <ChevronRight size={17} className="text-slate-300" />
                </a>

                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white hover:text-blue-950"
                >
                  <span className="flex-1">
                    Services
                  </span>

                  <ChevronRight size={17} className="text-slate-300" />
                </a>

                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex w-full items-center rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-blue-900"
                >
                  <span className="flex-1">
                    Contact Us
                  </span>

                  <ChevronRight size={17} className="opacity-50" />
                </a>

              </div>

            )}

          </div>
        </div>
      )}

    </div>
  </div>
</nav>




      {/* =====================================================
          HERO
      ====================================================== */}

      <section
            id="hero"
            className="relative isolate flex min-h-[720px] items-center overflow-hidden bg-[#050d1d] py-24 sm:min-h-[760px] sm:py-28 md:min-h-[800px] lg:min-h-[820px] lg:py-32"
          >
            {/* =====================================================
                BACKGROUND IMAGE
            ====================================================== */}
            <div className="absolute inset-0 -z-20">
              <Image
                src="/img/background.png"
                alt=""
                fill
                priority
                className="object-cover object-center opacity-30"
              />
            </div>

            {/* =====================================================
                PREMIUM OVERLAYS
            ====================================================== */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,rgba(37,99,235,0.20),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(201,169,110,0.10),transparent_30%)]" />

            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050d1d] via-[#07152d]/95 to-[#07152d]/55" />

            <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#050d1d] to-transparent" />

            {/* Decorative glow */}
            <div className="absolute -right-32 top-24 -z-10 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute -left-40 bottom-10 -z-10 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl" />

            {/* =====================================================
                CONTENT
            ====================================================== */}
            <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl text-white">

                {/* PREMIUM BRAND BADGE */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.20)] backdrop-blur-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-[10px]">
                    BREA 88 REALTY OPC
                  </span>
                </div>

                {/* HEADLINE */}
                <h1 className="mt-7 max-w-4xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-[5.25rem]">
                  Service with a Heart,
                  <br />

                  <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Building Trust from the Start.
                  </span>
                </h1>

                {/* GOLD ACCENT */}
                <div className="mt-7 flex items-center gap-3">
                  <span className="h-[2px] w-12 bg-gradient-to-r from-amber-400 to-amber-200" />
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  <span className="h-px w-20 bg-white/20" />
                </div>

                {/* DESCRIPTION */}
                <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 md:text-lg">
                  BREA 88 REALTY OPC provides professional real estate
                  solutions with <span className="font-semibold text-white">Integrity</span>,
                  <span className="font-semibold text-white"> Excellence</span>, and
                  <span className="font-semibold text-white"> Compassion</span>
                  <br />throughout the Philippines.
                </p>

                {/* =====================================================
                    PROPERTY CTA
                ====================================================== */}
                <div className="mt-9 sm:mt-10">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">

                    <a
                      href={
                        agentSlug
                          ? `/marketplace?agent=${encodeURIComponent(agentSlug)}`
                          : '/marketplace'
                      }
                      className="group relative inline-flex min-h-[60px] items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.40)] ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,0.35)] active:translate-y-0 sm:min-w-[290px] sm:px-9"
                    >
                      {/* Button shine */}
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      <Building2 className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110" />

                      <span className="relative">
                        Property For You
                      </span>

                      <ChevronRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>

                  </div>
                </div>

                {/* =====================================================
                    TRUST DETAILS
                ====================================================== */}
                <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 text-xs text-slate-400 sm:mt-12">

                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Check className="h-3.5 w-3.5 text-cyan-300" />
                    </span>

                    <span className="font-medium">
                      Professional Service
                    </span>
                  </div>

                  <div className="hidden h-4 w-px bg-white/15 sm:block" />

                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Check className="h-3.5 w-3.5 text-cyan-300" />
                    </span>

                    <span className="font-medium">
                      Trusted Assistance
                    </span>
                  </div>

                  <div className="hidden h-4 w-px bg-white/15 sm:block" />

                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Check className="h-3.5 w-3.5 text-cyan-300" />
                    </span>

                    <span className="font-medium">
                      Client-Focused
                    </span>
                  </div>

                </div>

              </div>
            </div>

            {/* =====================================================
                BOTTOM FADE
            ====================================================== */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          </section>


      {/* =====================================================
          CORPORATE PROFILE
      ====================================================== */}

      <section
          id="profile"
          className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-32"
        >
          {/* Background accents */}
          <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* =====================================================
                SECTION INTRO
            ====================================================== */}
            <div className="mb-10 max-w-3xl sm:mb-12">

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-[10px]">
                  Corporate Profile
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl md:text-5xl">
                Built on Trust.
                <br />

                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Driven by Purpose.
                </span>
              </h2>

              <div className="mt-5 flex items-center gap-3">
                <span className="h-[2px] w-10 bg-gradient-to-r from-amber-500 to-amber-300" />
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                <span className="h-px w-16 bg-slate-300" />
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                Discover the values, vision, and commitment behind BREA 88 REALTY OPC.
              </p>

            </div>

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}
            <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">

              {/* ===================================================
                  COMPANY OVERVIEW
              ==================================================== */}
              <div className="flex lg:col-span-7">

                <div className="group relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.10)] sm:p-8 lg:p-10">

                  {/* Decorative glow */}
                  <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-50 blur-3xl transition-all duration-700 group-hover:bg-blue-100" />

                  <div className="relative">

                    {/* Label */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-900">
                        Who We Are
                      </span>
                    </div>

                    <h3 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
                      Company Overview
                    </h3>

                    <div className="mt-6 max-w-3xl space-y-5">

                      <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
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

                      <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                        Established in 2026, BREA 88 Realty OPC was founded to deliver
                        exceptional real estate solutions while building lasting
                        relationships with developers, investors, property owners, and
                        homebuyers.
                      </p>

                    </div>

                    {/* Registration Cards */}
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* SEC */}
                      <div className="group/item flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 shadow-sm transition-transform duration-300 group-hover/item:scale-105">
                          <FileText className="h-5 w-5 text-white" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            SEC Registration
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            May 14, 2026
                          </p>
                        </div>

                      </div>

                      {/* BIR */}
                      <div className="group/item flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 shadow-sm transition-transform duration-300 group-hover/item:scale-105">
                          <FileText className="h-5 w-5 text-white" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            BIR Registration
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            May 19, 2026
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Bottom accent */}
                  <div className="relative mt-8 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="h-px w-12 bg-amber-200" />
                  </div>

                </div>
              </div>

              {/* ===================================================
                  VISION & MISSION
              ==================================================== */}
              <div className="flex lg:col-span-5">

                <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#06142d] via-blue-950 to-blue-900 p-6 text-white shadow-[0_20px_60px_rgba(7,25,54,0.20)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_75px_rgba(7,25,54,0.28)] sm:p-8 lg:p-10">

                  {/* Background effects */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

                  <div className="pointer-events-none absolute right-8 top-8 h-20 w-20 rounded-full border border-white/5" />

                  {/* Header */}
                  <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-6">

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-300">
                        Our Direction
                      </p>

                      <h3 className="mt-2 text-2xl font-black tracking-[-0.02em] sm:text-3xl">
                        Vision & Mission
                      </h3>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-[2px] w-8 bg-amber-400" />
                        <span className="h-1 w-1 rounded-full bg-amber-400" />
                      </div>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-inner">
                      <Award className="h-5 w-5 text-blue-200" />
                    </div>

                  </div>

                  {/* Vision */}
                  <div className="relative mt-7">

                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        Vision
                      </h4>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-blue-100 sm:text-base sm:leading-8">
                      To be a trusted and respected real estate brokerage company
                      recognized for excellence, integrity, innovation, and
                      compassionate service, creating meaningful opportunities for
                      clients, developers, and communities.
                    </p>

                  </div>

                  {/* Mission */}
                  <div className="relative mt-7 border-t border-white/10 pt-6">

                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        Mission Focus
                      </h4>
                    </div>

                    <ul className="mt-5 space-y-4 text-sm leading-6 text-blue-100">

                      {[
                        'Delivering professional and ethical real estate services.',
                        'Building long-term partnerships based on trust, transparency, and mutual success.',
                        'Assisting clients in making informed and rewarding property investment decisions.',
                        'Supporting developer partners through effective project marketing and sales strategies.',
                        'Providing “Service with a Heart” in every transaction and client engagement.',
                      ].map((item) => (
                        <li
                          key={item}
                          className="group/mission flex items-start gap-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-bold text-amber-300 transition-all duration-300 group-hover/mission:border-amber-300/30 group-hover/mission:bg-amber-400/10">
                            ✓
                          </span>

                          <span className="transition-colors duration-300 group-hover/mission:text-white">
                            {item}
                          </span>
                        </li>
                      ))}

                    </ul>

                  </div>

                  {/* Footer */}
                  <div className="relative mt-auto pt-8">

                    <div className="h-px bg-gradient-to-r from-white/10 via-amber-400/30 to-transparent" />

                    <div className="mt-4 flex items-center justify-between gap-4">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300">
                        Service with a Heart
                      </p>

                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                        Since 2026
                      </span>

                    </div>

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
        className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32"
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-slate-100/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* SECTION HEADER */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-[10px]">
                Our Leadership
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl md:text-5xl">
              Led with Purpose,
              <br />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Driven by Service.
              </span>
            </h2>

            {/* Premium accent */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="h-[2px] w-10 bg-gradient-to-r from-transparent to-amber-400" />
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              <span className="h-px w-16 bg-slate-300" />
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              At BREA 88 Realty OPC, leadership means creating meaningful
              relationships, delivering professional service, and putting
              our clients first.
            </p>
          </div>

          {/* LEADER CARD */}
          <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
            <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_15px_55px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.13)]">

              <div className="grid lg:grid-cols-2">

                {/* LEADER IMAGE */}
                <div className="relative min-h-[400px] overflow-hidden bg-slate-100 sm:min-h-[500px] lg:min-h-[620px]">

                  <Image
                    src="/img/CEO.png"
                    alt="Rodesa E Estremos, Chief Executive Officer of BREA 88 Realty OPC"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Dark image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06142d]/90 via-[#06142d]/10 to-transparent" />

                  {/* Subtle blue glow */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-cyan-400/10" />

                  {/* Bottom image information */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                    <div className="max-w-md">

                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        BREA 88 REALTY OPC
                      </div>

                      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-blue-200">
                        Leadership • Integrity • Service
                      </p>

                    </div>
                  </div>
                </div>

                {/* LEADER INFORMATION */}
                <div className="relative flex flex-col justify-center overflow-hidden p-7 sm:p-10 lg:p-12 xl:p-14">

                  {/* Decorative glow */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-50 blur-3xl" />

                  <div className="relative">

                    {/* Role */}
                    <div className="flex items-center gap-3">
                      <span className="h-[2px] w-8 bg-gradient-to-r from-amber-500 to-amber-300" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                        Chief Executive Officer
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-[2.65rem]">
                      Rodesa E Estremos
                    </h3>

                    {/* Accent */}
                    <div className="mt-5 flex items-center gap-2">
                      <span className="h-[3px] w-12 rounded-full bg-gradient-to-r from-blue-800 to-blue-500" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </div>

                    {/* Description */}
                    <div className="mt-7 space-y-4">
                      <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                        As the leader of BREA 88 Realty OPC, our commitment is
                        to provide clients with professional real estate
                        guidance built on integrity, trust, and genuine care.
                      </p>

                      <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                        Every property journey is different. Our goal is to
                        understand each client's needs and help them make
                        confident decisions while building relationships that
                        last beyond the transaction.
                      </p>
                    </div>

                    {/* VALUES */}
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">

                      {/* Integrity */}
                      <div className="group/value rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-transform duration-300 group-hover/value:scale-105">
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

                      {/* Compassion */}
                      <div className="group/value rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-transform duration-300 group-hover/value:scale-105">
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

                      {/* Excellence */}
                      <div className="group/value rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-transform duration-300 group-hover/value:scale-105">
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

                      {/* Commitment */}
                      <div className="group/value rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-transform duration-300 group-hover/value:scale-105">
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

                    {/* Bottom statement */}
                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-gradient-to-r from-blue-200 via-slate-200 to-transparent" />
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Service with a Heart
                      </p>
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
              className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-32"
            >
              {/* Decorative background */}
              <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
              <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />

              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* SECTION HEADER */}
                <div className="mx-auto max-w-3xl text-center">

                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-[10px]">
                      What We Offer
                    </span>
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl md:text-5xl">
                    Real Estate Services
                    <br />
                    <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      Built Around You.
                    </span>
                  </h2>

                  <div className="mt-5 flex items-center justify-center gap-3">
                    <span className="h-[2px] w-10 bg-gradient-to-r from-transparent to-amber-400" />
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    <span className="h-px w-16 bg-slate-300" />
                  </div>

                  <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                    From finding the right property to making confident real estate
                    decisions, BREA 88 Realty OPC provides professional support
                    throughout your property journey.
                  </p>

                </div>

                {/* SERVICE GRID */}
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  {/* SERVICE 1 — PROPERTY SEARCH */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_rgba(15,23,42,0.10)] sm:p-7">

                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <Search className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          01
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em] text-slate-950">
                        Property Search
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Find residential, commercial, and investment properties
                        that match your needs, preferences, and budget.
                      </p>

                      <a
                        href={
                          agentSlug
                            ? `/marketplace?agent=${encodeURIComponent(agentSlug)}`
                            : '/marketplace'
                        }
                        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-900 transition-all duration-300 group-hover:gap-3"
                      >
                        Browse Properties
                        <span aria-hidden="true">→</span>
                      </a>

                    </div>
                  </div>

                  {/* SERVICE 2 — PROPERTY MARKETING */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_rgba(15,23,42,0.10)] sm:p-7">

                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <Building2 className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          02
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em] text-slate-950">
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

                  {/* SERVICE 3 — INVESTMENT GUIDANCE */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_rgba(15,23,42,0.10)] sm:p-7">

                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <Briefcase className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          03
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em] text-slate-950">
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

                  {/* SERVICE 4 — PROPERTY ASSISTANCE */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_rgba(15,23,42,0.10)] sm:p-7">

                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <FileText className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          04
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em] text-slate-950">
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

                  {/* SERVICE 5 — PROPERTY VIEWING */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_55px_rgba(15,23,42,0.10)] sm:p-7">

                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <MapPin className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          05
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em] text-slate-950">
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

                  {/* SERVICE 6 — CONSULTATION */}
                  <div className="group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#06142d] via-blue-950 to-blue-900 p-6 text-white shadow-[0_15px_45px_rgba(7,25,54,0.18)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(7,25,54,0.28)] sm:p-7">

                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-200 backdrop-blur-sm">
                          <Phone className="h-6 w-6" />
                        </div>

                        <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                          06
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-black tracking-[-0.02em]">
                        Personalized Consultation
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-blue-100/80">
                        Have questions about buying, selling, or investing?
                        Talk directly with our team and let us understand what
                        you're looking for.
                      </p>

                      <a
                        href="#contact"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-950 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
                      >
                        Talk to Us
                        <span aria-hidden="true">→</span>
                      </a>

                    </div>
                  </div>

                </div>

                {/* BOTTOM CTA */}
                <div className="relative mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#06142d] via-blue-950 to-blue-800 p-7 shadow-[0_20px_60px_rgba(7,25,54,0.20)] sm:p-9 lg:p-10">

                  {/* CTA decoration */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

                  <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                    <div className="max-w-2xl">

                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300 sm:text-[10px]">
                          Ready to Find Your Property?
                        </p>
                      </div>

                      <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-white sm:text-3xl lg:text-4xl">
                        Let's find the right
                        <br className="hidden sm:block" />
                        <span className="text-blue-300"> opportunity for you.</span>
                      </h3>

                      <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100/70">
                        Explore available properties or speak with our team
                        about your real estate goals.
                      </p>

                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">

                      <a
                        href={
                          agentSlug
                            ? `/marketplace?agent=${encodeURIComponent(agentSlug)}`
                            : '/marketplace'
                        }
                        className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg"
                      >
                        View Properties
                        <span className="ml-2">→</span>
                      </a>

                      <a
                        href="#contact"
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                      >
                        Contact Us
                      </a>

                    </div>

                  </div>

                  {/* Bottom accent */}
                  <div className="relative mt-8 flex items-center gap-3">
                    <span className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="h-px w-10 bg-amber-400/30" />
                  </div>

                </div>

              </div>
            </section>

      {/* =====================================================
          CORE VALUES
      ====================================================== */}

      <section
            className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32"
          >
            {/* Decorative background */}
            <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-slate-100/80 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">

                {/* =====================================================
                    CORE VALUES
                ====================================================== */}
                <div className="lg:col-span-7">

                  {/* Section heading */}
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-[10px]">
                        Guiding Principles
                      </span>
                    </div>

                    <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl md:text-5xl">
                      Our Core Values
                    </h2>

                    <div className="mt-5 flex items-center gap-3">
                      <span className="h-[2px] w-10 bg-gradient-to-r from-amber-500 to-amber-300" />
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                      <span className="h-px w-16 bg-slate-300" />
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                      The principles that guide how we serve our clients,
                      build relationships, and deliver professional real estate
                      solutions.
                    </p>
                  </div>

                  {/* Values */}
                  <div className="mt-10 grid gap-4">

                    {/* VALUE 1 */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-6">

                      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-50 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="relative flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <Heart className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black tracking-tight text-slate-950">
                              Service With A Heart
                            </h3>

                            <span className="h-1 w-1 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                              01
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            We place people at the center of everything we do
                            and serve with sincerity, compassion, and dedication.
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* VALUE 2 */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-6">

                      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-50 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="relative flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black tracking-tight text-slate-950">
                              Integrity
                            </h3>

                            <span className="h-1 w-1 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                              02
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            We uphold honesty, transparency, accountability,
                            and ethical conduct in every transaction.
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* VALUE 3 */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)] sm:p-6">

                      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-50 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="relative flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-800">
                          <Award className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black tracking-tight text-slate-950">
                              Excellence
                            </h3>

                            <span className="h-1 w-1 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                              03
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            We continuously strive to exceed expectations
                            through professionalism and quality service.
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>


                {/* =====================================================
                    WHY PARTNER WITH US
                ====================================================== */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#06142d] via-blue-950 to-blue-900 p-6 text-white shadow-[0_20px_60px_rgba(7,25,54,0.20)] sm:p-8 lg:col-span-5 lg:p-10">

                  {/* Background glow */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

                  <div className="relative">

                    {/* Header */}
                    <div className="border-b border-white/10 pb-6">

                      <div className="flex items-center gap-3">
                        <span className="h-[2px] w-8 bg-amber-400" />

                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300">
                          Why BREA 88
                        </span>
                      </div>

                      <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] sm:text-3xl">
                        Why Partner With Us?
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-blue-100/70">
                        A professional approach built around trust,
                        service, and meaningful results.
                      </p>

                    </div>


                    {/* Benefits */}
                    <div className="mt-6 grid gap-3">

                      {[
                        'SEC and BIR Registered Company (2026)',
                        'Led by an experienced Licensed Real Estate Broker',
                        'Strong commitment to ethical and professional practices',
                        'Personalized client care through “Service with a Heart”',
                        'Dedicated to achieving sales targets & developer objectives',
                        'Professional, reliable, and results-oriented framework',
                      ].map((text, index) => (
                        <div
                          key={text}
                          className="group/benefit rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:border-blue-300/20 hover:bg-white/[0.08]"
                        >
                          <div className="flex items-start gap-3">

                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-all duration-300 group-hover/benefit:border-amber-400/30 group-hover/benefit:bg-amber-400/10">
                              <CheckCircle className="h-3.5 w-3.5 text-blue-300 transition-colors duration-300 group-hover/benefit:text-amber-300" />
                            </div>

                            <div className="min-w-0">
                              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-300/50">
                                {String(index + 1).padStart(2, '0')}
                              </span>

                              <p className="mt-0.5 text-sm leading-6 text-blue-100/85 transition-colors duration-300 group-hover/benefit:text-white">
                                {text}
                              </p>
                            </div>

                          </div>
                        </div>
                      ))}

                    </div>


                    {/* Bottom accent */}
                    <div className="mt-7 flex items-center gap-3">
                      <span className="h-px flex-1 bg-gradient-to-r from-white/10 via-amber-400/30 to-transparent" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="h-px w-10 bg-amber-400/30" />
                    </div>

                    <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300/60">
                      Service with a Heart
                    </p>

                  </div>
                </div>

              </div>
            </div>
          </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}
      <section
            id="contact"
            className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-32"
          >
            {/* Background decoration */}
            <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl" />

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

              {/* =====================================================
                  SECTION HEADER
              ====================================================== */}
              <div className="mx-auto max-w-3xl text-center">

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-[10px]">
                    Property Inquiry
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl md:text-5xl">
                  Tell Us What
                  <br />
                  <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    You're Looking For.
                  </span>
                </h2>

                {/* Accent */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400" />
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  <span className="h-px w-16 bg-slate-300" />
                </div>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                  Share your property needs with us and our team will help you
                  find the right opportunities based on your goals.
                </p>

              </div>


              {/* =====================================================
                  INQUIRY FORM
              ====================================================== */}
              <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-8 lg:p-10">

                {/* Glass decoration */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl" />

                {/* Top glass line */}
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />

                <div className="relative">

                  {/* FORM INTRO */}
                  <div className="mb-8 text-center">

                    <div className="flex items-center justify-center gap-3">
                      <span className="h-[2px] w-7 bg-gradient-to-r from-blue-800 to-blue-500" />

                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-700 sm:text-[10px]">
                        Let's Connect
                      </p>

                      <span className="h-[2px] w-7 bg-gradient-to-l from-blue-800 to-blue-500" />
                    </div>

                    <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                      Start Your Property Journey
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Complete the form below and let us know how we can assist you.
                    </p>

                  </div>


                  {/* FORM */}
                  <form
                    ref={formRef}
                    onSubmit={sendEmail}
                    className="space-y-5"
                  >

                    {/* NAME + EMAIL */}
                    <div className="grid gap-5 sm:grid-cols-2">

                      {/* FULL NAME */}
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700"
                        >
                          Full Name
                        </label>

                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          required
                          placeholder="Enter your full name"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                        />
                      </div>


                      {/* EMAIL */}
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700"
                        >
                          Email Address
                        </label>

                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          required
                          placeholder="Enter your email"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                        />
                      </div>

                    </div>


                    {/* CONTACT + LOCATION */}
                    <div className="grid gap-5 sm:grid-cols-2">

                      {/* CONTACT NUMBER */}
                      <div>
                        <label
                          htmlFor="contact-number"
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700"
                        >
                          Contact Number
                        </label>

                        <input
                          id="contact-number"
                          type="tel"
                          name="contact_number"
                          required
                          placeholder="09XX XXX XXXX"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                        />
                      </div>


                      {/* PREFERRED LOCATION */}
                      <div>
                        <label
                          htmlFor="prefer-location"
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700"
                        >
                          Preferred Location
                        </label>

                        <input
                          id="prefer-location"
                          type="text"
                          name="prefer_location"
                          required
                          placeholder="e.g. Cebu City, Mandaue, Lapu-Lapu"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                        />
                      </div>

                    </div>


                    {/* MESSAGE */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700"
                      >
                        Message
                      </label>

                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={6}
                        placeholder="Tell us what type of property you're looking for, your budget, preferred area, or any other details..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                      />
                    </div>


                    {/* SUBMIT */}
                    <div className="pt-2">

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgba(30,64,175,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-900 hover:to-cyan-700 hover:shadow-[0_14px_35px_rgba(30,64,175,0.25)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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

                    </div>


                    {/* SUCCESS */}
                    {submitStatus === 'success' && !isSubmitting && (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                        ✓ Inquiry sent successfully! We'll get back to you soon.
                      </div>
                    )}


                    {/* ERROR */}
                    {submitStatus === 'error' && !isSubmitting && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                        ✕ Failed to send your inquiry. Please try again.
                      </div>
                    )}


                    {/* PRIVACY */}
                    <div className="flex items-start justify-center gap-2 pt-1">

                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <p className="text-center text-[11px] leading-5 text-slate-400">
                        By submitting this form, you agree to be contacted regarding
                        your inquiry.
                      </p>

                    </div>

                  </form>

                </div>
              </div>


              {/* BOTTOM TRUST MESSAGE */}
              <div className="mt-7 flex flex-col items-center justify-center gap-2 text-center">

                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    BREA 88 REALTY OPC
                  </span>
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                </div>

                <p className="text-xs text-slate-400">
                  Service with a Heart
                </p>

              </div>

            </div>
          </section>
        {/* =====================================================
            DIRECT WEBSITE — AGENT SELECTION
        ====================================================== */}

        {showAgentPicker && !agentSlug && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">

            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* CLOSE */}
              <button
                type="button"
                onClick={() => {
                  setShowAgentPicker(false);
                  setPendingInquiry(null);
                }}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close agent selection"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-5 sm:p-7 lg:p-8">

                <div className="mb-6 pr-10">

                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Agent Assistance
                  </span>

                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Choose an Agent to Assist You
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Select the Agent or Broker you would like to assist
                    you with your property inquiry.
                  </p>

                </div>

                <AgentPicker
                  selectedAgentId={
                    selectedInquiryAgent?.id ?? null
                  }
                  onSelect={async (selectedAgent) => {

                    setSelectedInquiryAgent(selectedAgent);

                    /*
                    * If there is a pending inquiry,
                    * submit it immediately after the client
                    * chooses an agent.
                    */
                    if (pendingInquiry) {

                      setShowAgentPicker(false);
                      setIsSubmitting(true);
                      setSubmitStatus('idle');

                      await submitInquiry({
                        ...pendingInquiry,
                        agentSlug: selectedAgent.slug,
                      });

                      return;
                    }

                    setShowAgentPicker(false);
                  }}
                />

              </div>
            </div>
          </div>
        )}
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

      <footer className="relative overflow-hidden border-t border-slate-800 bg-[#06142d] text-slate-300">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">

              {/* BRAND HEADER */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                  {/* Logo */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />

                    <Image
                      src="/img/LOGO.png"
                      alt="BREA 88 Realty OPC Logo"
                      width={64}
                      height={64}
                      className="relative h-16 w-16 rounded-full border border-white/10 object-cover shadow-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />

                      <p className="text-sm font-bold tracking-[0.12em] text-white">
                        BREA 88 REALTY OPC
                      </p>
                    </div>

                    <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
                      Professional Real Estate Solutions with Integrity,
                      Excellence, and Compassion.
                    </p>
                  </div>

                </div>
              </div>

              {/* CONTACT + ADDRESS */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">

                {/* CONTACT */}
                <div className="lg:col-span-7">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">

                    <div className="mb-5 flex items-center gap-3">
                      <span className="h-px w-7 bg-[#c9a96e]" />

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Get in Touch
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* PHONE */}
                      <a
                        href="tel:+639196131001"
                        className="group rounded-xl border border-white/10 bg-[#020b1d]/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-950/30 hover:shadow-lg hover:shadow-blue-950/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                            <Phone className="h-4 w-4 text-blue-400" />
                          </div>

                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                            Phone
                          </p>
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-300 transition-colors group-hover:text-white">
                          +63919 613 1001
                        </p>
                      </a>

                      {/* EMAIL */}
                      <a
                        href="mailto:brea081828@gmail.com"
                        className="group rounded-xl border border-white/10 bg-[#020b1d]/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-950/30 hover:shadow-lg hover:shadow-blue-950/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                            <Mail className="h-4 w-4 text-blue-400" />
                          </div>

                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                            Email
                          </p>
                        </div>

                        <p className="mt-4 break-all text-sm font-semibold text-slate-300 transition-colors group-hover:text-white">
                          brea081828@gmail.com
                        </p>
                      </a>

                      {/* FACEBOOK */}
                      <a
                        href="https://facebook.com/rodessa.estremos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-xl border border-white/10 bg-[#020b1d]/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-950/30 hover:shadow-lg hover:shadow-blue-950/30 sm:col-span-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-blue-500 text-xs font-black leading-none text-white">
                              f
                            </div>
                          </div>

                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                            Facebook
                          </p>
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-300 transition-colors group-hover:text-white">
                          Broker Rodesa Estremos
                        </p>
                      </a>

                    </div>
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="lg:col-span-5">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">

                    <div className="mb-5 flex items-center gap-3">
                      <span className="h-px w-7 bg-[#c9a96e]" />

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Office Address
                      </p>
                    </div>

                    <div className="flex h-full min-h-[150px] items-center rounded-xl border border-white/10 bg-[#020b1d]/70 p-5 transition-all duration-300 hover:border-blue-400/30">

                      <div className="flex gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <MapPin className="h-5 w-5 text-blue-400" />
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                            BREA 88 Realty Office
                          </p>

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

              </div>

              {/* TAGLINE */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-center sm:flex-row sm:text-left">

                <div>
                  <p className="text-sm font-semibold text-white">
                    Service with a Heart.
                  </p>

                  <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                    <span className="h-1 w-1 rounded-full bg-[#c9a96e]" />
                    <span className="h-px w-8 bg-[#c9a96e]/70" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end">

                  <a
                    href="#privacy"
                    className="text-[10px] text-slate-500 transition-colors hover:text-blue-300 sm:text-[11px]"
                  >
                    Privacy Policy
                  </a>

                  <span className="h-3 w-px bg-slate-800" />

                  <a
                    href="#terms"
                    className="text-[10px] text-slate-500 transition-colors hover:text-blue-300 sm:text-[11px]"
                  >
                    Terms of Service
                  </a>

                </div>
              </div>

              {/* COPYRIGHT */}
              <div className="mt-5 text-center">
                <p className="text-[10px] text-slate-600 sm:text-[11px]">
                  © {new Date().getFullYear()} BREA 88 REALTY OPC. All rights reserved.
                </p>
              </div>

            </div>

            {/* Bottom accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          </footer>

    </div>
  );
}



