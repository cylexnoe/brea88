'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Activity,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserCheck,
  UserRound,
  UserX,
  X,
} from 'lucide-react';

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

function formatLastSeen(value: string | null) {
  if (!value) return 'Never';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  const difference = Date.now() - date.getTime();

  if (difference < 60 * 1000) {
    return 'Just now';
  }

  const minutes = Math.floor(
    difference / (60 * 1000)
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
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

function isOnline(value: string | null) {
  if (!value) return false;

  const difference =
    Date.now() -
    new Date(value).getTime();

  return (
    difference >= 0 &&
    difference <= 5 * 60 * 1000
  );
}

export default function ActiveProfilesSidebar() {
  const [open, setOpen] =
    useState(false);

  const [agents, setAgents] =
    useState<Agent[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState('');

  const loadAgents = async (
    refresh = false
  ) => {
    try {
      if (refresh) {
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

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Unable to load profiles.'
        );
      }

      setAgents(
        Array.isArray(data.agents)
          ? data.agents
          : []
      );
    } catch (error) {
      console.error(
        'Active profiles error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load profiles.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAgents();
    }
  }, [open]);

  const activeAgents =
    useMemo(
      () =>
        agents.filter(
          (agent) =>
            agent.isActive
        ),
      [agents]
    );

  const onlineAgents =
    useMemo(
      () =>
        activeAgents.filter(
          (agent) =>
            isOnline(
              agent.lastSeen
            )
        ),
      [activeAgents]
    );

  const filteredAgents =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return activeAgents.filter(
        (agent) => {
          if (!search) {
            return true;
          }

          return (
            agent.fullName
              .toLowerCase()
              .includes(search) ||
            agent.email
              .toLowerCase()
              .includes(search) ||
            agent.role
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      activeAgents,
      searchTerm,
    ]);

  const toggleAgent =
    async (
      agent: Agent
    ) => {
      if (
        updatingId !== null
      ) {
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
                isActive: false,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              'Unable to update profile.'
          );
        }

        setAgents(
          (previous) =>
            previous.map(
              (item) =>
                item.id === agent.id
                  ? {
                      ...item,
                      isActive:
                        false,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          'Profile status error:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'Unable to update profile.'
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  return (
    <>
      {/* =====================================================
          SIDEBAR BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="fixed left-0 top-1/2 z-[70] -translate-y-1/2 rounded-r-2xl border border-l-0 border-slate-200 bg-white px-2 py-3 shadow-lg transition hover:bg-slate-50"
        aria-label="Open Active Profiles"
      >
        <span className="flex flex-col items-center gap-1.5">

          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">

            <UserCheck className="h-4 w-4" />

            {activeAgents.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-white">
                {activeAgents.length}
              </span>
            )}

          </span>

          <span className="hidden text-[9px] font-black uppercase tracking-wide text-slate-500 sm:block [writing-mode:vertical-rl]">
            Active Profiles
          </span>

        </span>
      </button>

      {/* =====================================================
          DRAWER
      ===================================================== */}

      {open && (
        <div className="fixed inset-0 z-[80]">

          {/* BACKDROP */}

          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            aria-label="Close Active Profiles"
          />

          {/* DRAWER */}

          <aside className="absolute left-0 top-0 flex h-full w-full max-w-md flex-col border-r border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Active Profiles
                  </h2>

                  <p className="text-[11px] font-medium text-slate-400">
                    Agent profile management
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4">

              <div className="rounded-xl bg-slate-50 p-3">

                <p className="text-xl font-black text-slate-900">
                  {activeAgents.length}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Active
                </p>

              </div>

              <div className="rounded-xl bg-emerald-50 p-3">

                <p className="text-xl font-black text-emerald-700">
                  {onlineAgents.length}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  Online
                </p>

              </div>

            </div>

            {/* SEARCH */}

            <div className="space-y-3 border-b border-slate-100 p-4">

              <div className="relative">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={
                    searchTerm
                  }
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search active profiles..."
                  className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  loadAgents(true)
                }
                disabled={
                  refreshing
                }
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >

                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }`}
                />

                Refresh Profiles

              </button>

            </div>

            {/* PROFILES */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">

              {loading ? (

                <div className="flex min-h-40 items-center justify-center text-sm font-semibold text-slate-400">
                  Loading profiles...
                </div>

              ) : error ? (

                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>

              ) : filteredAgents.length === 0 ? (

                <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center">

                  <UserRound className="h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    No active profiles
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Profiles marked active will appear here.
                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {filteredAgents.map(
                    (agent) => {

                      const online =
                        isOnline(
                          agent.lastSeen
                        );

                      const busy =
                        updatingId ===
                        agent.id;

                      return (
                        <div
                          key={
                            agent.id
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >

                          <div className="flex gap-3">

                            {/* PROFILE IMAGE */}

                            <div className="relative shrink-0">

                              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">

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

                                  <UserRound className="h-6 w-6 text-slate-400" />

                                )}

                              </div>

                              <span
                                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                                  online
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300'
                                }`}
                              />

                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <div className="min-w-0">

                                  <h3 className="truncate text-sm font-black text-slate-900">
                                    {
                                      agent.fullName
                                    }
                                  </h3>

                                  <p className="truncate text-[11px] font-semibold text-slate-400">
                                    {
                                      agent.role
                                    }
                                  </p>

                                </div>

                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                                  Active
                                </span>

                              </div>

                              {/* CONTACT */}

                              <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">

                                <p className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5" />
                                  {
                                    agent.email
                                  }
                                </p>

                                {agent.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    {
                                      agent.phone
                                    }
                                  </p>
                                )}

                                {agent.address && (
                                  <p className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {
                                      agent.address
                                    }
                                  </p>
                                )}

                              </div>

                              {/* COUNTS */}

                              <div className="mt-3 grid grid-cols-2 gap-2">

                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">

                                  <p className="text-sm font-black text-slate-800">
                                    {
                                      agent._count.properties
                                    }
                                  </p>

                                  <p className="text-[9px] font-bold uppercase text-slate-400">
                                    Properties
                                  </p>

                                </div>

                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">

                                  <p className="text-sm font-black text-slate-800">
                                    {
                                      agent._count.inquiries
                                    }
                                  </p>

                                  <p className="text-[9px] font-bold uppercase text-slate-400">
                                    Inquiries
                                  </p>

                                </div>

                              </div>

                              {/* ACTIONS */}

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

                                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">

                                  {online ? (
                                    <Activity className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Clock className="h-3 w-3" />
                                  )}

                                  {online
                                    ? 'Online now'
                                    : `Last seen ${formatLastSeen(
                                        agent.lastSeen
                                      )}`}

                                </span>

                                <div className="flex gap-2">

                                  {agent.slug && (
                                    <a
                                      href={`/profile/${agent.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Profile
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleAgent(
                                        agent
                                      )
                                    }
                                    disabled={
                                      busy
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >

                                    {busy ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <UserX className="h-3 w-3" />
                                    )}

                                    Deactivate

                                  </button>

                                </div>

                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-semibold text-slate-400">

              Only profiles marked active are shown here.
              Changes are saved through the admin agents API.

            </div>

          </aside>

        </div>
      )}

    </>
  );
}
