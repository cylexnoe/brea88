'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ButterflyLoader from '@/components/ButterflyLoader';

import {
  Building2,
  Home,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Phone,
  LayoutDashboard,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
} from 'lucide-react';

type Agent = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  slug: string;
  phone: string | null;
  address?: string | null;
  profileImage: string | null;
  bio: string | null;
  facebook: string | null;
  messenger: string | null;
  isActive: boolean;
  lastSeen?: string | null;
};

type Property = {
  id: number;
  title: string;
  tag: string;
  price: string;
  location: string;
  image: string;
  images: string[];
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  agentId: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [agent, setAgent] =
    useState<Agent | null>(null);

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [propertiesLoading, setPropertiesLoading] =
    useState(true);

  const [propertiesError, setPropertiesError] =
    useState('');

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [heartbeatActive, setHeartbeatActive] =
    useState(false);

  // =========================================================
  // LOAD CURRENT AGENT
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAgent = async () => {
      try {
        const response = await fetch(
          '/api/agent/me',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          router.replace('/agent/login');
          return;
        }

        const data =
          await response.json();

        if (
          !data?.success ||
          !data?.agent ||
          !data.agent.isActive
        ) {
          router.replace('/agent/login');
          return;
        }

        if (mounted) {
          setAgent(data.agent);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Failed to load agent:',
          error
        );

        router.replace('/agent/login');
      }
    };

    loadAgent();

    return () => {
      mounted = false;
    };
  }, [router]);

  // =========================================================
  // AGENT HEARTBEAT
  //
  // Updates Agent.lastSeen every 60 seconds.
  //
  // Admin uses lastSeen to determine:
  //
  // Online  = lastSeen within 5 minutes
  // Offline = lastSeen older than 5 minutes
  //
  // Agents do NOT manage properties here.
  // =========================================================

  useEffect(() => {
    if (!agent) return;

    let mounted = true;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch(
          '/api/agent/heartbeat',
          {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          router.replace('/agent/login');
          return;
        }

        if (!response.ok) {
          console.error(
            'Heartbeat request failed:',
            response.status
          );

          if (mounted) {
            setHeartbeatActive(false);
          }

          return;
        }

        const data =
          await response.json();

        if (
          data?.success &&
          mounted
        ) {
          setHeartbeatActive(true);

          /*
           * Keep the local agent state synchronized
           * with the server.
           */
          if (data.agent) {
            setAgent((previous) => {
              if (!previous) {
                return previous;
              }

              return {
                ...previous,
                lastSeen:
                  data.agent.lastSeen ??
                  previous.lastSeen,
              };
            });
          }
        }
      } catch (error) {
        console.error(
          'Agent heartbeat error:',
          error
        );

        if (mounted) {
          setHeartbeatActive(false);
        }
      }
    };

    /*
     * Send immediately when dashboard opens.
     */
    sendHeartbeat();

    /*
     * Then send every 60 seconds.
     */
    const heartbeatInterval =
      window.setInterval(
        sendHeartbeat,
        60 * 1000
      );

    return () => {
      mounted = false;
      window.clearInterval(
        heartbeatInterval
      );
    };
  }, [agent, router]);

  // =========================================================
  // LOAD ASSIGNED PROPERTIES
  // =========================================================

  const loadProperties = async () => {
    setPropertiesLoading(true);
    setPropertiesError('');

    try {
      const response = await fetch(
        '/api/agent/properties',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (response.status === 401) {
        router.replace('/agent/login');
        return;
      }

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Unable to load properties.'
        );
      }

      setProperties(
        Array.isArray(data.properties)
          ? data.properties
          : []
      );
    } catch (error) {
      console.error(
        'Failed to load properties:',
        error
      );

      setPropertiesError(
        error instanceof Error
          ? error.message
          : 'Unable to load assigned properties.'
      );
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    if (!agent) return;

    loadProperties();
  }, [agent]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch(
        '/api/agent/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } catch (error) {
      console.error(
        'Agent logout error:',
        error
      );
    } finally {
      router.replace('/agent/login');
      router.refresh();
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigation = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      name: 'Dashboard',
      href: '/agent/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Properties',
      href: '/marketplace',
      icon: Building2,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  // =========================================================
  // VIEW PUBLIC PROFILE
  // =========================================================

  const handleViewPublicProfile = () => {
    if (!agent?.slug) return;

    router.push(
      `/agent/${agent.slug}`
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading || !agent) {
    return <ButterflyLoader />;
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex h-16 items-center justify-between">

            {/* BRAND */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/agent/dashboard'
                )
              }
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-950 shadow-sm">

                <img
                  src="/img/LOGO.png"
                  alt="BREA 88 Realty"
                  className="h-full w-full object-cover"
                />

              </div>

              <div className="hidden text-left sm:block">

                <p className="text-sm font-black tracking-tight text-blue-950">
                  BREA 88 REALTY
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Agent Portal
                </p>

              </div>

            </button>

            {/* DESKTOP NAV */}

            <div className="hidden items-center gap-1 md:flex">

              {navigation.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const isActive =
                    pathname ===
                    item.href;

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() =>
                        router.push(
                          item.href
                        )
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-blue-950 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-blue-950'
                      }`}
                    >

                      <Icon size={17} />

                      {item.name}

                    </button>
                  );
                }
              )}

            </div>

            {/* DESKTOP ACCOUNT */}

            <div className="hidden items-center gap-3 md:flex">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/profile'
                  )
                }
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
              >

                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100">

                  {agent.profileImage ? (
                    <img
                      src={
                        agent.profileImage
                      }
                      alt={
                        agent.fullName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={18}
                      className="text-slate-400"
                    />
                  )}

                </div>

                <div className="max-w-[150px] text-left">

                  <p className="truncate text-sm font-bold text-slate-900">
                    {agent.fullName}
                  </p>

                  <p className="truncate text-[11px] text-slate-500">
                    {agent.role}
                  </p>

                </div>

              </button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loggingOut ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={17}
                  />
                )}

                <span className="hidden lg:inline">
                  Logout
                </span>

              </button>

            </div>

            {/* MOBILE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (previous) =>
                    !previous
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
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

        {/* MOBILE MENU */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">

            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">

                  {agent.profileImage ? (
                    <img
                      src={
                        agent.profileImage
                      }
                      alt={
                        agent.fullName
                      }
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

                {navigation.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const isActive =
                      pathname ===
                      item.href;

                    return (
                      <button
                        key={
                          item.href
                        }
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(
                            false
                          );

                          router.push(
                            item.href
                          );
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? 'bg-blue-950 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >

                        <Icon size={18} />

                        <span className="flex-1">
                          {item.name}
                        </span>

                        <ChevronRight
                          size={17}
                          className="opacity-50"
                        />

                      </button>
                    );
                  }
                )}

              </div>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >

                {loggingOut ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={18}
                  />
                )}

                Logout

              </button>

            </div>

          </div>
        )}

      </nav>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ===================================================
            WELCOME
        ==================================================== */}

        <div className="rounded-3xl bg-blue-950 p-6 text-white shadow-xl sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <p className="text-sm font-medium text-blue-300">
                Agent / Broker Portal
              </p>

              <h1 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                Welcome,{" "}
                {agent.fullName}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                View your assigned properties
                and manage your professional
                information from your agent
                portal.
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* ACCOUNT STATUS */}

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">

                <p className="text-xs text-blue-200">
                  Account Status
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-sm font-bold">
                    Active
                  </span>

                </div>

              </div>

              {/* HEARTBEAT STATUS */}

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">

                <p className="text-xs text-blue-200">
                  Presence
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      heartbeatActive
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />

                  <span className="text-sm font-bold">
                    {heartbeatActive
                      ? 'Online'
                      : 'Connecting...'}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* ASSIGNED PROPERTIES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Assigned Properties
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {propertiesLoading
                    ? '—'
                    : properties.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Properties assigned to you
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-950">
                <Building2
                  size={23}
                />
              </div>

            </div>

          </div>

          {/* PROFILE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Profile
                </p>

                <p className="mt-2 truncate text-lg font-black text-slate-900">
                  {agent.role}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Professional account
                </p>

              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <User size={23} />
              </div>

            </div>

          </div>

          {/* CONTACT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Contact
                </p>

                <p className="mt-2 truncate text-sm font-black text-slate-900">
                  {agent.phone ||
                    'Phone not provided'}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {agent.email}
                </p>

              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Phone size={22} />
              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            ASSIGNED PROPERTIES
        ==================================================== */}

        <div className="mt-8">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-900">
                Property Portfolio
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Assigned Properties
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Properties assigned to you by
                the BREA 88 Realty administrator.
              </p>

            </div>

            <button
              type="button"
              onClick={
                loadProperties
              }
              disabled={
                propertiesLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RefreshCw
                size={16}
                className={
                  propertiesLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>

          </div>

          {/* ERROR */}

          {propertiesError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div className="flex-1">

                  <p className="font-bold text-red-900">
                    Unable to load properties
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {propertiesError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadProperties
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                  >

                    <RefreshCw
                      size={14}
                    />

                    Try Again

                  </button>

                </div>

              </div>

            </div>
          )}

          {/* LOADING */}

          {propertiesLoading &&
            !propertiesError && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >

                      <div className="h-52 animate-pulse bg-slate-200" />

                      <div className="space-y-3 p-5">

                        <div className="h-5 animate-pulse rounded bg-slate-200" />

                        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />

                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          {/* EMPTY */}

          {!propertiesLoading &&
            !propertiesError &&
            properties.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Building2
                    size={30}
                  />

                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No properties assigned
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  You currently don't have
                  any properties assigned to
                  your account. Contact the
                  BREA 88 Realty administrator
                  if you need assistance.
                </p>

              </div>
            )}

          {/* PROPERTY GRID */}

          {!propertiesLoading &&
            !propertiesError &&
            properties.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                {properties.map(
                  (property) => {
                    const coverImage =
                      property.image ||
                      property.images?.[0] ||
                      '/img/placeholder-property.jpg';

                    return (
                      <article
                        key={
                          property.id
                        }
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >

                        {/* IMAGE */}

                        <div className="relative h-56 overflow-hidden bg-slate-100">

                          <img
                            src={
                              coverImage
                            }
                            alt={
                              property.title
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className="absolute left-3 top-3">

                            <span className="rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-blue-950 shadow-sm backdrop-blur-sm">
                              {
                                property.tag
                              }
                            </span>

                          </div>

                          <div className="absolute bottom-3 left-3">

                            <span className="rounded-lg bg-blue-950/95 px-3 py-1.5 text-sm font-black text-white shadow-sm">
                              {
                                property.price
                              }
                            </span>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="p-5">

                          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-black text-slate-900">
                            {
                              property.title
                            }
                          </h3>

                          <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">

                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-blue-900"
                            />

                            <span className="line-clamp-2">
                              {
                                property.location
                              }
                            </span>

                          </div>

                          {/* PROPERTY SPECS */}

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">

                            {property.beds !==
                              null && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">

                                <BedDouble
                                  size={15}
                                  className="text-slate-400"
                                />

                                {
                                  property.beds
                                }{' '}
                                Beds

                              </div>
                            )}

                            {property.baths !==
                              null && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">

                                <Bath
                                  size={15}
                                  className="text-slate-400"
                                />

                                {
                                  property.baths
                                }{' '}
                                Baths

                              </div>
                            )}

                            {property.sqft !==
                              null && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">

                                <Maximize
                                  size={15}
                                  className="text-slate-400"
                                />

                                {property.sqft.toLocaleString()}{' '}
                                sqft

                              </div>
                            )}

                          </div>

                          {/* VIEW PROPERTY */}

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/marketplace?property=${property.id}`
                              )
                            }
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
                          >

                            View Property

                            <ArrowRight
                              size={16}
                              className="transition-transform group-hover:translate-x-1"
                            />

                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </div>

        {/* ===================================================
            AGENT PROFILE
        ==================================================== */}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* PROFESSIONAL PROFILE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

              {/* IMAGE */}

              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">

                {agent.profileImage ? (
                  <img
                    src={
                      agent.profileImage
                    }
                    alt={
                      agent.fullName
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User
                    size={35}
                    className="text-slate-400"
                  />
                )}

              </div>

              {/* DETAILS */}

              <div className="min-w-0 flex-1">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-900">
                  Professional Profile
                </p>

                <h2 className="mt-1 break-words text-2xl font-black text-slate-900">
                  {agent.fullName}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {agent.role}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">

                    <Phone
                      size={16}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                      {agent.phone ||
                        'Phone not provided'}
                    </span>

                  </div>

                  <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">

                    <User
                      size={16}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                      {agent.email}
                    </span>

                  </div>

                </div>

                {agent.bio && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                    {agent.bio}
                  </p>
                )}

              </div>

            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/profile'
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
              >

                <User size={16} />

                Manage Profile

              </button>

              {agent.slug && (
                <button
                  type="button"
                  onClick={
                    handleViewPublicProfile
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >

                  <ExternalLink
                    size={16}
                  />

                  View Public Profile

                </button>
              )}

            </div>

          </div>

          {/* ONLINE STATUS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  heartbeatActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >

                {heartbeatActive ? (
                  <CheckCircle2
                    size={21}
                  />
                ) : (
                  <Clock3
                    size={21}
                  />
                )}

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Presence
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {heartbeatActive
                    ? 'Online'
                    : 'Connecting...'}
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">

              <p className="text-sm leading-6 text-slate-500">
                Your account automatically sends
                a heartbeat while this dashboard
                is open.
              </p>

              <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                The administrator will see you as
                Offline after your heartbeat stops
                for more than 5 minutes.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}