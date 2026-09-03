'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Circle,
  CircleUserRound,
  Loader2,
  MessageCircle,
  UserRound,
} from 'lucide-react';

interface Agent {
  id: number;
  fullName: string;
  role: string;
  slug: string;
  profileImage?: string | null;
  lastSeen?: string | null;
}

interface AgentPickerProps {
  selectedAgentId?: number | null;
  selectedAgentSlug?: string | null;
  onSelect: (agent: Agent) => void;
  onContinue?: () => void;
}

function isOnline(
  lastSeen: string | null | undefined
): boolean {
  if (!lastSeen) {
    return false;
  }

  const difference =
    Date.now() - new Date(lastSeen).getTime();

  return (
    difference >= 0 &&
    difference <= 5 * 60 * 1000
  );
}

export default function AgentPicker({
  selectedAgentId = null,
  selectedAgentSlug = null,
  onSelect,
  onContinue,
}: AgentPickerProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] =
    useState<number | null>(selectedAgentId);
  const [selectedSlug, setSelectedSlug] =
    useState<string | null>(selectedAgentSlug);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedId(selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    setSelectedSlug(selectedAgentSlug);
  }, [selectedAgentSlug]);

  useEffect(() => {
    let mounted = true;

    const loadAgents = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch('/api/agents', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || 'Failed to load agents.'
          );
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid agent response.');
        }

        if (mounted) {
          const activeAgents: Agent[] = data.filter(
            (agent): agent is Agent =>
              agent &&
              typeof agent.id === 'number' &&
              typeof agent.fullName === 'string' &&
              typeof agent.role === 'string' &&
              typeof agent.slug === 'string'
          );

          activeAgents.sort((a, b) => {
            const aOnline = isOnline(a.lastSeen);
            const bOnline = isOnline(b.lastSeen);

            if (aOnline && !bOnline) {
              return -1;
            }

            if (!aOnline && bOnline) {
              return 1;
            }

            return a.fullName.localeCompare(
              b.fullName
            );
          });

          setAgents(activeAgents);
        }
      } catch (err) {
        console.error(
          'Failed to load agents:',
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load available agents.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAgents();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (agent: Agent) => {
    setSelectedId(agent.id);
    setSelectedSlug(agent.slug);

    onSelect(agent);
  };

  const isAgentSelected = (agent: Agent) => {
    if (
      selectedAgentId !== null &&
      selectedAgentId !== undefined
    ) {
      return agent.id === selectedAgentId;
    }

    if (
      selectedAgentSlug !== null &&
      selectedAgentSlug !== undefined
    ) {
      return agent.slug === selectedAgentSlug;
    }

    return (
      agent.id === selectedId ||
      agent.slug === selectedSlug
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />

          <p className="text-sm font-medium text-slate-600">
            Loading available agents...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <UserRound className="h-6 w-6" />
        </div>

        <h4 className="mt-4 text-base font-bold text-red-900">
          Unable to load agents
        </h4>

        <p className="mt-2 text-sm leading-6 text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <CircleUserRound className="h-7 w-7" />
        </div>

        <h4 className="mt-4 text-lg font-bold text-slate-900">
          No agents are currently available
        </h4>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Please try again later or contact BREA 88 REALTY directly.
        </p>
      </div>
    );
  }

  const hasSelection =
    selectedId !== null ||
    selectedSlug !== null;

  return (
    <div className="space-y-3">
      {/* AGENT / BROKER LIST */}
      <div className="space-y-3">
        {agents.map((agent) => {
          const online = isOnline(agent.lastSeen);
          const selected = isAgentSelected(agent);

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleSelect(agent)}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 sm:gap-4 sm:p-5 md:gap-3 md:rounded-xl md:p-3.5 ${
                selected
                  ? 'border-blue-700 bg-blue-50 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >

              {/* PROFILE */}
              <div className="relative shrink-0">
                {agent.profileImage ? (
                  <img
                    src={agent.profileImage}
                    alt={agent.fullName}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover md:h-12 md:w-12"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 md:h-12 md:w-12">
                    <CircleUserRound className="h-7 w-7 md:h-6 md:w-6" />
                  </div>
                )}

                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white md:h-3 md:w-3 ${
                    online
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* AGENT / BROKER INFORMATION */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base font-extrabold leading-tight text-slate-900 sm:text-lg md:text-base">
                  {agent.fullName}
                </h4>

                <p className="mt-1 truncate text-xs font-semibold leading-tight text-slate-500 sm:text-sm md:text-xs">
                  {agent.role}
                </p>

                <div className="mt-2 flex min-w-0 items-center gap-1.5 md:mt-1.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full md:h-1.5 md:w-1.5 ${
                      online
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    }`}
                  />

                  <span
                    className={`truncate text-xs font-bold md:text-[11px] ${
                      online
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {online
                      ? 'Online — Available'
                      : 'Offline'}
                  </span>
                </div>
              </div>

              {/* SELECT BUTTON */}
              <div className="shrink-0">
                <span
                  className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap md:h-9 md:min-w-[68px] md:px-2.5 md:text-[11px] ${
                    selected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                  }`}
                >
                  <Circle className="h-3.5 w-3.5 shrink-0 md:h-3 md:w-3" />

                  {selected
                    ? 'Selected'
                    : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CONTINUE BUTTON */}
      {hasSelection && onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
        >
          Continue with Selected Agent
        </button>
      )}
    </div>
  );
}