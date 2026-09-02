'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

type Agent = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  slug: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  bio: string | null;
  facebook: string | null;
  messenger: string | null;
  isActive: boolean;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;

  _count: {
    properties: number;
    inquiries: number;
  };
};

function formatLastSeen(
  value: string | null
): string {
  if (!value) {
    return 'Never';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown';
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  if (difference < 0) {
    return 'Just now';
  }

  const seconds =
    Math.floor(
      difference / 1000
    );

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? '' : 's'
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? '' : 's'
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 30) {
    return `${days} day${
      days === 1 ? '' : 's'
    } ago`;
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function isOnline(
  lastSeen: string | null
): boolean {
  if (!lastSeen) {
    return false;
  }

  const difference =
    Date.now() -
    new Date(lastSeen).getTime();

  return (
    difference >= 0 &&
    difference <=
      5 * 60 * 1000
  );
}

export default function AdminAgentsPage() {
  const router =
    useRouter();

  const [
    agents,
    setAgents,
  ] = useState<Agent[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const [
    updatingId,
    setUpdatingId,
  ] = useState<number | null>(
    null
  );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD AGENTS
  |--------------------------------------------------------------------------
  */

  const loadAgents =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response =
          await fetch(
            '/api/admin/agents',
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }
          );

        if (
          response.status === 401
        ) {
          router.replace(
            '/admin'
          );

          return;
        }

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              'Unable to load agents.'
          );
        }

        setAgents(
          Array.isArray(
            data.agents
          )
            ? data.agents
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load agents:',
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load agents.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadAgents();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  const toggleAgentStatus =
    async (
      agent: Agent
    ) => {
      if (
        updatingId !== null
      ) {
        return;
      }

      const nextStatus =
        !agent.isActive;

      const confirmed =
        window.confirm(
          nextStatus
            ? `Activate ${agent.fullName}?`
            : `Deactivate ${agent.fullName}?`
        );

      if (!confirmed) {
        return;
      }

      setUpdatingId(
        agent.id
      );

      try {
        const response =
          await fetch(
            '/api/admin/agents',
            {
              method: 'PATCH',
              headers: {
                'Content-Type':
                  'application/json',
              },
              credentials:
                'include',

              body: JSON.stringify({
                id: agent.id,
                isActive:
                  nextStatus,
              }),
            }
          );

        if (
          response.status === 401
        ) {
          router.replace(
            '/admin'
          );

          return;
        }

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              'Unable to update agent.'
          );
        }

        setAgents(
          previous =>
            previous.map(
              item =>
                item.id ===
                agent.id
                  ? {
                      ...item,
                      isActive:
                        nextStatus,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          'Failed to update agent:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'Unable to update agent.'
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredAgents =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return agents.filter(
        agent => {
          const matchesSearch =
            !search ||
            agent.fullName
              .toLowerCase()
              .includes(search) ||
            agent.email
              .toLowerCase()
              .includes(search) ||
            agent.role
              .toLowerCase()
              .includes(search);

          const matchesStatus =
            statusFilter ===
              'all' ||
            (statusFilter ===
              'active' &&
              agent.isActive) ||
            (statusFilter ===
              'inactive' &&
              !agent.isActive);

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      agents,
      searchTerm,
      statusFilter,
    ]);

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalAgents =
    agents.length;

  const activeAgents =
    agents.filter(
      agent =>
        agent.isActive
    ).length;

  const inactiveAgents =
    agents.filter(
      agent =>
        !agent.isActive
    ).length;

  const onlineAgents =
    agents.filter(
      agent =>
        agent.isActive &&
        isOnline(
          agent.lastSeen
        )
    ).length;

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex h-16 items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/dashboard'
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Back to dashboard"
              >
                <ArrowLeft
                  size={19}
                />
              </button>

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-950">
                <img
                  src="/img/LOGO.png"
                  alt="BREA 88 Realty"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-black tracking-tight text-blue-950">
                  BREA 88 REALTY
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Agent Management
                </p>
              </div>

            </div>

            {/* DESKTOP */}

            <div className="hidden items-center gap-2 md:flex">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/dashboard'
                  )
                }
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dashboard
              </button>

              <button
                type="button"
                className="rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Agents
              </button>

            </div>

            {/* MOBILE */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  previous =>
                    !previous
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>

          </div>

        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">

            <div className="space-y-1 px-4 py-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/dashboard'
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Building2
                  size={18}
                />

                Dashboard
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl bg-blue-950 px-4 py-3 text-left text-sm font-semibold text-white"
              >
                <UserCheck
                  size={18}
                />

                Agents
              </button>

            </div>

          </div>
        )}

      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* TITLE */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-900">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Agents
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage BREA 88 Realty agents,
              monitor their activity, and
              control account access.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadAgents(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="rounded-xl bg-blue-50 p-3 text-blue-950">
                <User
                  size={20}
                />
              </div>

              <p className="text-2xl font-black text-slate-900">
                {totalAgents}
              </p>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Total Agents
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2
                  size={20}
                />
              </div>

              <p className="text-2xl font-black text-slate-900">
                {activeAgents}
              </p>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Active
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <UserX
                  size={20}
                />
              </div>

              <p className="text-2xl font-black text-slate-900">
                {inactiveAgents}
              </p>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Inactive
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <Activity
                  size={20}
                />
              </div>

              <p className="text-2xl font-black text-slate-900">
                {onlineAgents}
              </p>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Online Now
            </p>

          </div>

        </div>

        {/* SEARCH / FILTER */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={event =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search agents by name, email, or role..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

            </div>

            <div className="grid grid-cols-3 gap-2 lg:w-[330px]">

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'all'
                  )
                }
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  statusFilter ===
                  'all'
                    ? 'bg-blue-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'active'
                  )
                }
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  statusFilter ===
                  'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'inactive'
                  )
                }
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  statusFilter ===
                  'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inactive
              </button>

            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-bold text-red-900">
                  Unable to load agents
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadAgents()
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
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

        {loading && (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map(
              item => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-24 animate-pulse bg-slate-200" />

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

        {!loading &&
          !error &&
          filteredAgents.length ===
            0 && (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <User
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No agents found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {agents.length ===
                0
                  ? 'No agents have registered yet.'
                  : 'No agents match your current search or filter.'}
              </p>

            </div>
          )}

        {/* AGENTS */}

        {!loading &&
          !error &&
          filteredAgents.length >
            0 && (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {filteredAgents.map(
                agent => {
                  const online =
                    isOnline(
                      agent.lastSeen
                    );

                  const updating =
                    updatingId ===
                    agent.id;

                  return (
                    <article
                      key={agent.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >

                      {/* TOP */}

                      <div className="relative bg-blue-950 px-5 py-6">

                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.12),transparent_30%)]" />

                        <div className="relative flex items-center gap-4">

                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">

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
                                size={28}
                                className="text-slate-400"
                              />
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <h2 className="truncate text-lg font-black text-white">
                              {agent.fullName}
                            </h2>

                            <p className="mt-0.5 text-xs font-semibold text-blue-200">
                              {agent.role}
                            </p>

                            <div className="mt-2 flex items-center gap-2">

                              <span
                                className={`h-2 w-2 rounded-full ${
                                  online
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-400'
                                }`}
                              />

                              <span className="text-[11px] font-medium text-blue-100">
                                {online ? 'Online' : 'Offline'}
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* BODY */}

                      <div className="p-5">

                        {/* CONTACT */}

                        <div className="space-y-3">

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Mail
                                size={15}
                              />
                            </div>

                            <p className="min-w-0 truncate text-sm text-slate-600">
                              {agent.email}
                            </p>

                          </div>

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Phone
                                size={15}
                              />
                            </div>

                            <p className="text-sm text-slate-600">
                              {agent.phone ||
                                'No phone provided'}
                            </p>

                          </div>

                          <div className="flex items-center gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <MapPin
                                size={15}
                              />
                            </div>

                            <p className="truncate text-sm text-slate-600">
                              {agent.address ||
                                'No address provided'}
                            </p>

                          </div>

                        </div>

                        {/* STATS */}

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          <div className="rounded-xl bg-slate-50 p-3">

                            <div className="flex items-center gap-2 text-slate-400">

                              <Building2
                                size={15}
                              />

                              <span className="text-[10px] font-bold uppercase tracking-wide">
                                Properties
                              </span>

                            </div>

                            <p className="mt-2 text-lg font-black text-slate-900">
                              {
                                agent
                                  ._count
                                  .properties
                              }
                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">

                            <div className="flex items-center gap-2 text-slate-400">

                              <Mail
                                size={15}
                              />

                              <span className="text-[10px] font-bold uppercase tracking-wide">
                                Inquiries
                              </span>

                            </div>

                            <p className="mt-2 text-lg font-black text-slate-900">
                              {
                                agent
                                  ._count
                                  .inquiries
                              }
                            </p>

                          </div>

                        </div>

                        {/* LAST SEEN */}

                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">

                          <Clock
                            size={15}
                            className="text-slate-400"
                          />

                          <span className="text-xs text-slate-500">
                            Last seen:
                          </span>

                          <span className="text-xs font-bold text-slate-700">
                            {formatLastSeen(
                              agent.lastSeen
                            )}
                          </span>

                        </div>

                        {/* ACTION */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleAgentStatus(
                              agent
                            )
                          }
                          disabled={
                            updating
                          }
                          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            agent.isActive
                              ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >

                          {updating ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                            />
                          ) : agent.isActive ? (
                            <UserX
                              size={16}
                            />
                          ) : (
                            <UserCheck
                              size={16}
                            />
                          )}

                          {updating
                            ? 'Updating...'
                            : agent.isActive
                              ? 'Deactivate Agent'
                              : 'Activate Agent'}

                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        {/* SECURITY NOTE */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950">
              <ShieldCheck
                size={19}
              />
            </div>

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Agent access control
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Deactivating an agent prevents
                the account from logging into the
                Agent Portal. Existing session
                validation also checks the
                account's active status.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}