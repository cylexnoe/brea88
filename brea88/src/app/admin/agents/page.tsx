'use client';

import { useEffect, useMemo, useState } from 'react';
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

type StatusFilter = 'all' | 'active' | 'inactive';

function formatLastSeen(value: string | null): string {
  if (!value) return 'Never';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  const difference = Date.now() - date.getTime();

  if (difference < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(difference / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) {
    return false;
  }

  const date = new Date(lastSeen);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const difference = Date.now() - date.getTime();

  return (
    difference >= 0 &&
    difference <= 5 * 60 * 1000
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50/50 blur-2xl transition group-hover:bg-blue-100/60" />

      <div className="relative flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={20} />
        </div>

        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>

      <div className="relative mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AdminAgentsPage() {
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const loadAgents = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch(
        '/api/admin/agents',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      );

      if (response.status === 401) {
        router.replace('/admin');
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            'Unable to load Agents and Brokers.',
        );
      }

      setAgents(
        Array.isArray(data.agents)
          ? data.agents
          : [],
      );
    } catch (error) {
      console.error(
        'Failed to load agents:',
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load Agents and Brokers.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const updateAgent = async (
    agent: Agent,
    changes: {
      isActive?: boolean;
      role?: 'Agent' | 'Broker';
    },
  ) => {
    if (updatingId !== null) {
      return;
    }

    const nextRole =
      changes.role ?? agent.role;

    const nextStatus =
      changes.isActive ?? agent.isActive;

    const roleChanged =
      nextRole !== agent.role;

    const statusChanged =
      nextStatus !== agent.isActive;

    if (!roleChanged && !statusChanged) {
      return;
    }

    const confirmation = roleChanged
      ? `Change ${agent.fullName}'s role from ${agent.role} to ${nextRole}?`
      : nextStatus
        ? `Activate ${agent.fullName}?`
        : `Deactivate ${agent.fullName}?`;

    if (!window.confirm(confirmation)) {
      return;
    }

    setUpdatingId(agent.id);

    try {
      const body: {
        id: number;
        isActive?: boolean;
        role?: 'Agent' | 'Broker';
      } = {
        id: agent.id,
      };

      if (statusChanged) {
        body.isActive = nextStatus;
      }

      if (roleChanged) {
        body.role =
          nextRole as 'Agent' | 'Broker';
      }

      const response = await fetch(
        '/api/admin/agents',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      );

      if (response.status === 401) {
        router.replace('/admin');
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            'Unable to update account.',
        );
      }

      setAgents((previous) =>
        previous.map((item) =>
          item.id === agent.id
            ? {
                ...item,
                role:
                  data.agent?.role ??
                  nextRole,
                isActive:
                  data.agent?.isActive ??
                  nextStatus,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(
        'Failed to update agent:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update account.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAgents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return agents.filter((agent) => {
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
        statusFilter === 'all' ||
        (statusFilter === 'active' &&
          agent.isActive) ||
        (statusFilter === 'inactive' &&
          !agent.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    agents,
    searchTerm,
    statusFilter,
  ]);

  const totalAgents = agents.length;

  const activeAgents = agents.filter(
    (agent) => agent.isActive,
  ).length;

  const inactiveAgents = agents.filter(
    (agent) => !agent.isActive,
  ).length;

  const onlineAgents = agents.filter(
    (agent) =>
      agent.isActive &&
      isOnline(agent.lastSeen),
  ).length;

  const brokerCount = agents.filter(
    (agent) => agent.role === 'Broker',
  ).length;

  const agentCount = agents.filter(
    (agent) => agent.role !== 'Broker',
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-400/5 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/dashboard',
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#030b1c] shadow-sm">
                <img
                  src="/img/LOGO.png"
                  alt="BREA 88 Realty"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-bold tracking-wide text-slate-900">
                  BREA{' '}
                  <span className="text-blue-600">
                    88
                  </span>{' '}
                  REALTY
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Team Management
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/dashboard',
                  )
                }
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </button>

              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20"
              >
                Agents &amp; Brokers
              </button>
            </div>

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (previous) => !previous,
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(
                    '/admin/dashboard',
                  );
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Building2 size={18} />
                Dashboard
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-bold text-white"
              >
                <UserCheck size={18} />
                Agents &amp; Brokers
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        {/* PAGE HEADING */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              <span className="h-px w-6 bg-[#c9a96e]" />
              Administration
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Agents &amp; Brokers
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage team roles, account access,
              and activity. Only administrators can
              change roles or account status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAgents(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total"
            value={totalAgents}
            icon={User}
            description="Team members"
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Agents"
            value={agentCount}
            icon={UserCheck}
            description="Agent accounts"
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            label="Brokers"
            value={brokerCount}
            icon={ShieldCheck}
            description="Broker accounts"
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            label="Active"
            value={activeAgents}
            icon={CheckCircle2}
            description="Active accounts"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Inactive"
            value={inactiveAgents}
            icon={UserX}
            description="Disabled accounts"
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            label="Online"
            value={onlineAgents}
            icon={Activity}
            description="Seen within 5 minutes"
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* SEARCH / FILTER */}
        <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search by name, email, or role..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
              <button
                type="button"
                onClick={() =>
                  setStatusFilter('all')
                }
                className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-[#030b1c] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter('active')
                }
                className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter('inactive')
                }
                className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  statusFilter === 'inactive'
                    ? 'bg-red-600 text-white shadow-md'
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={19} />
              </div>

              <div>
                <p className="font-bold text-red-900">
                  Unable to load team
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadAgents()
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-28 animate-pulse bg-slate-200" />

                  <div className="space-y-4 p-5">
                    <div className="h-5 animate-pulse rounded-lg bg-slate-200" />

                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-200" />

                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredAgents.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <User size={29} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No team members found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {agents.length === 0
                  ? 'No Agents or Brokers have registered yet.'
                  : 'No team members match your current search or filter.'}
              </p>
            </div>
          )}

        {/* AGENT CARDS */}
        {!loading &&
          !error &&
          filteredAgents.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAgents.map((agent) => {
                const online = isOnline(
                  agent.lastSeen,
                );

                const updating =
                  updatingId === agent.id;

                const role =
                  agent.role === 'Broker'
                    ? 'Broker'
                    : 'Agent';

                return (
                  <article
                    key={agent.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                  >
                    {/* PROFILE HEADER */}
                    <div className="relative overflow-hidden bg-[#030b1c] px-5 py-6">
                      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />

                      <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />

                      <div className="relative flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl">
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
                                size={29}
                                className="text-slate-400"
                              />
                            )}
                          </div>

                          <span
                            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#030b1c] ${
                              online
                                ? 'bg-emerald-400'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="truncate text-lg font-bold text-white">
                                {agent.fullName}
                              </h2>

                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-100">
                                  {role}
                                </span>

                                <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      online
                                        ? 'bg-emerald-400'
                                        : 'bg-slate-500'
                                    }`}
                                  />

                                  {online
                                    ? 'Online'
                                    : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="p-5">
                      {/* Contact */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Mail size={15} />
                          </div>

                          <p className="min-w-0 truncate text-sm font-medium text-slate-600">
                            {agent.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Phone size={15} />
                          </div>

                          <p className="truncate text-sm font-medium text-slate-600">
                            {agent.phone ||
                              'No phone provided'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <MapPin size={15} />
                          </div>

                          <p className="truncate text-sm font-medium text-slate-600">
                            {agent.address ||
                              'No address provided'}
                          </p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition group-hover:bg-blue-50/40">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Building2 size={15} />

                            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                              Properties
                            </span>
                          </div>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {agent._count
                              .properties}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition group-hover:bg-blue-50/40">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail size={15} />

                            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                              Inquiries
                            </span>
                          </div>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {agent._count
                              .inquiries}
                          </p>
                        </div>
                      </div>

                      {/* Last Seen */}
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                        <Clock
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="text-xs text-slate-400">
                          Last seen
                        </span>

                        <span className="truncate text-xs font-bold text-slate-700">
                          {formatLastSeen(
                            agent.lastSeen,
                          )}
                        </span>
                      </div>

                      {/* Role */}
                      <div className="mt-5">
                        <label
                          htmlFor={`role-${agent.id}`}
                          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400"
                        >
                          Team Role
                        </label>

                        <div className="relative">
                          <select
                            id={`role-${agent.id}`}
                            value={role}
                            onChange={(event) =>
                              updateAgent(
                                agent,
                                {
                                  role: event
                                    .target
                                    .value as
                                    | 'Agent'
                                    | 'Broker',
                                },
                              )
                            }
                            disabled={updating}
                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Agent">
                              Agent
                            </option>

                            <option value="Broker">
                              Broker
                            </option>
                          </select>

                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Account Status */}
                      <button
                        type="button"
                        onClick={() =>
                          updateAgent(
                            agent,
                            {
                              isActive:
                                !agent.isActive,
                            },
                          )
                        }
                        disabled={updating}
                        className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          agent.isActive
                            ? 'border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100'
                            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                        }`}
                      >
                        {updating ? (
                          <>
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                            />
                            Updating...
                          </>
                        ) : agent.isActive ? (
                          <>
                            <UserX size={16} />
                            Deactivate Account
                          </>
                        ) : (
                          <>
                            <UserCheck
                              size={16}
                            />
                            Activate Account
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        {/* ACCESS CONTROL */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-[#030b1c] p-6 shadow-xl shadow-slate-900/10 sm:p-7">
          <div className="pointer-events-none absolute" />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
              <ShieldCheck size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="h-px w-5 bg-[#c9a96e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a96e]">
                  Security
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-white">
                Team access control
              </h3>

              <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-400">
                Only administrators can change
                Agent/Broker roles or activate and
                deactivate accounts. Public registration
                creates Agent accounts only. Agents and
                Brokers cannot manage properties.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                  <CheckCircle2
                    size={12}
                    className="text-emerald-400"
                  />
                  Admin controlled
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                  <ShieldCheck
                    size={12}
                    className="text-blue-400"
                  />
                  Role protected
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                  <Building2
                    size={12}
                    className="text-[#c9a96e]"
                  />
                  Property access restricted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}