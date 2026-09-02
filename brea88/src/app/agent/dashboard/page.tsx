'use client';

import { useEffect, useMemo, useState } from 'react';
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
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Search,
  MessageSquare,
  CalendarDays,
  MapPin,
  ExternalLink,
  ChevronDown,
  Inbox,
  Check,
  Circle,
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

type InquiryProperty = {
  id: number;
  title: string;
  price: string;
  location: string;
  image: string;
  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | null;
};

type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: number | null;
  agentId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: InquiryProperty | null;
};

const INQUIRY_STATUSES = [
  'New',
  'Read',
  'Contacted',
  'Viewing Scheduled',
  'Viewing Completed',
  'Follow Up',
  'Closed',
  'Cancelled',
];

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-700 border-blue-200';

    case 'Read':
      return 'bg-slate-100 text-slate-600 border-slate-200';

    case 'Contacted':
      return 'bg-purple-100 text-purple-700 border-purple-200';

    case 'Viewing Scheduled':
      return 'bg-amber-100 text-amber-700 border-amber-200';

    case 'Viewing Completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';

    case 'Follow Up':
      return 'bg-orange-100 text-orange-700 border-orange-200';

    case 'Closed':
      return 'bg-slate-200 text-slate-700 border-slate-300';

    case 'Cancelled':
      return 'bg-red-100 text-red-700 border-red-200';

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'New':
      return <Circle size={10} fill="currentColor" />;

    case 'Read':
      return <Check size={13} />;

    case 'Contacted':
      return <Phone size={13} />;

    case 'Viewing Scheduled':
      return <CalendarDays size={13} />;

    case 'Viewing Completed':
      return <CheckCircle2 size={13} />;

    case 'Follow Up':
      return <Clock3 size={13} />;

    case 'Closed':
      return <CheckCircle2 size={13} />;

    case 'Cancelled':
      return <X size={13} />;

    default:
      return <Circle size={10} />;
  }
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [agent, setAgent] = useState<Agent | null>(null);

  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const [heartbeatActive, setHeartbeatActive] = useState(false);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  const [inquiriesError, setInquiriesError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedInquiry, setSelectedInquiry] =
    useState<Inquiry | null>(null);

  const [updatingInquiryId, setUpdatingInquiryId] =
    useState<number | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // =========================================================
  // LOAD CURRENT AGENT
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAgent = async () => {
      try {
        const response = await fetch('/api/agent/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          router.replace('/agent/login');
          return;
        }

        const data = await response.json();

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
        console.error('Failed to load agent:', error);

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

        const data = await response.json();

        if (data?.success && mounted) {
          setHeartbeatActive(true);

          if (data.agent) {
            setAgent((previous) => {
              if (!previous) return previous;

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

    sendHeartbeat();

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
  // LOAD INQUIRIES
  // =========================================================

  const loadInquiries = async (
    showLoading = true
  ) => {
    if (showLoading) {
      setInquiriesLoading(true);
    }

    setInquiriesError('');

    try {
      const response = await fetch(
        '/api/inquiries',
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Unable to load inquiry messages.'
        );
      }

      /*
       * Supports both possible response formats:
       *
       * 1. { success: true, inquiries: [...] }
       * 2. [...]
       */

      const receivedInquiries = Array.isArray(
        data
      )
        ? data
        : Array.isArray(data?.inquiries)
          ? data.inquiries
          : [];

      setInquiries(receivedInquiries);

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        'Failed to load inquiries:',
        error
      );

      setInquiriesError(
        error instanceof Error
          ? error.message
          : 'Unable to load inquiry messages.'
      );
    } finally {
      if (showLoading) {
        setInquiriesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!agent) return;

    loadInquiries(true);

    /*
     * Automatically check for new inquiries
     * every 15 seconds.
     */
    const inquiryInterval =
      window.setInterval(() => {
        loadInquiries(false);
      }, 15 * 1000);

    return () => {
      window.clearInterval(
        inquiryInterval
      );
    };
  }, [agent]);

  // =========================================================
  // MARK INQUIRY AS READ
  // =========================================================

  const markInquiryAsRead = async (
    inquiry: Inquiry
  ) => {
    if (inquiry.status !== 'New') {
      return inquiry;
    }

    try {
      const response = await fetch(
        '/api/inquiries',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            id: inquiry.id,
            status: 'Read',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Failed to mark inquiry as read:',
          data?.message ||
            data?.error
        );

        return inquiry;
      }

      const updatedInquiry =
        data?.inquiry;

      setInquiries((previous) =>
        previous.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                status:
                  updatedInquiry?.status ??
                  'Read',
                updatedAt:
                  updatedInquiry?.updatedAt ??
                  item.updatedAt,
              }
            : item
        )
      );

      if (
        selectedInquiry?.id ===
        inquiry.id
      ) {
        setSelectedInquiry(
          (previous) =>
            previous
              ? {
                  ...previous,
                  status:
                    updatedInquiry?.status ??
                    'Read',
                  updatedAt:
                    updatedInquiry?.updatedAt ??
                    previous.updatedAt,
                }
              : previous
        );
      }

      return {
        ...inquiry,
        status:
          updatedInquiry?.status ??
          'Read',
        updatedAt:
          updatedInquiry?.updatedAt ??
          inquiry.updatedAt,
      };
    } catch (error) {
      console.error(
        'Mark inquiry as read error:',
        error
      );

      return inquiry;
    }
  };

  // =========================================================
  // OPEN INQUIRY
  // =========================================================

  const handleOpenInquiry = async (
    inquiry: Inquiry
  ) => {
    setSelectedInquiry(inquiry);

    if (inquiry.status === 'New') {
      await markInquiryAsRead(inquiry);
    }
  };

  // =========================================================
  // UPDATE INQUIRY STATUS
  // =========================================================

  const updateInquiryStatus = async (
    inquiryId: number,
    status: string
  ) => {
    if (updatingInquiryId === inquiryId) {
      return;
    }

    setUpdatingInquiryId(inquiryId);

    try {
      const response = await fetch(
        '/api/inquiries',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            id: inquiryId,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Unable to update inquiry status.'
        );
      }

      const updatedInquiry =
        data?.inquiry;

      setInquiries((previous) =>
        previous.map((item) =>
          item.id === inquiryId
            ? {
                ...item,
                status:
                  updatedInquiry?.status ??
                  status,
                updatedAt:
                  updatedInquiry?.updatedAt ??
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedInquiry((previous) =>
        previous?.id === inquiryId
          ? {
              ...previous,
              status:
                updatedInquiry?.status ??
                status,
              updatedAt:
                updatedInquiry?.updatedAt ??
                new Date().toISOString(),
            }
          : previous
      );
    } catch (error) {
      console.error(
        'Failed to update inquiry:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update inquiry status.'
      );
    } finally {
      setUpdatingInquiryId(null);
    }
  };

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
  // SEARCH
  // =========================================================

  const filteredInquiries = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    if (!query) {
      return inquiries;
    }

    return inquiries.filter(
      (inquiry) => {
        return (
          inquiry.name
            ?.toLowerCase()
            .includes(query) ||
          inquiry.email
            ?.toLowerCase()
            .includes(query) ||
          inquiry.phone
            ?.toLowerCase()
            .includes(query) ||
          inquiry.message
            ?.toLowerCase()
            .includes(query) ||
          inquiry.property?.title
            ?.toLowerCase()
            .includes(query) ||
          inquiry.property?.location
            ?.toLowerCase()
            .includes(query) ||
          inquiry.status
            ?.toLowerCase()
            .includes(query)
        );
      }
    );
  }, [inquiries, searchQuery]);

  // =========================================================
  // STATS
  // =========================================================

  const unreadCount =
    inquiries.filter(
      (inquiry) =>
        inquiry.status === 'New'
    ).length;

  const totalInquiries =
    inquiries.length;

  const contactedCount =
    inquiries.filter(
      (inquiry) =>
        inquiry.status ===
          'Contacted' ||
        inquiry.status ===
          'Viewing Scheduled'
    ).length;

  // =========================================================
  // PUBLIC PROFILE
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
                      key={
                        item.href
                      }
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

                      {item.name ===
                        'Dashboard' &&
                        unreadCount >
                          0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                            {unreadCount >
                            99
                              ? '99+'
                              : unreadCount}
                          </span>
                        )}

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

                        {item.name ===
                          'Dashboard' &&
                          unreadCount >
                            0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                              {unreadCount >
                              99
                                ? '99+'
                                : unreadCount}
                            </span>
                          )}

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

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-2 flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                {heartbeatActive
                  ? 'Online'
                  : 'Connecting...'}

              </span>

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {agent.role}
              </span>

            </div>

            <h1 className="text-2xl font-black tracking-tight text-blue-950 sm:text-3xl">
              Welcome, {agent.fullName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your client inquiry
              messages from here.
            </p>

          </div>

          <button
            type="button"
            onClick={
              handleViewPublicProfile
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 sm:w-auto"
          >

            <ExternalLink
              size={16}
            />

            View Public Profile

          </button>

        </div>

        {/* ===================================================
            STAT CARDS
        ==================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Inquiries
                </p>

                <p className="mt-2 text-3xl font-black text-blue-950">
                  {totalInquiries}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">

                <Inbox size={23} />

              </div>

            </div>

          </div>

          {/* UNREAD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unread
                </p>

                <p className="mt-2 text-3xl font-black text-red-600">
                  {unreadCount}
                </p>

              </div>

              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">

                <Mail size={23} />

                {unreadCount >
                  0 && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                )}

              </div>

            </div>

          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Leads
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {contactedCount}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">

                <MessageSquare
                  size={23}
                />

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            INQUIRY SECTION
        ==================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SECTION HEADER */}

          <div className="border-b border-slate-200 p-4 sm:p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white">

                  <MessageSquare
                    size={19}
                  />

                </div>

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-base font-black text-slate-900 sm:text-lg">
                      Inquiry Messages
                    </h2>

                    {unreadCount >
                      0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                        {unreadCount} NEW
                      </span>
                    )}

                  </div>

                  <p className="text-xs text-slate-500">
                    Messages from clients
                    interested in your properties
                    or contacting you directly.
                  </p>

                </div>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* SEARCH */}

                <div className="relative">

                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={
                      searchQuery
                    }
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search inquiries..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64"
                  />

                </div>

                {/* REFRESH */}

                <button
                  type="button"
                  onClick={() =>
                    loadInquiries(
                      true
                    )
                  }
                  disabled={
                    inquiriesLoading
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <RefreshCw
                    size={16}
                    className={
                      inquiriesLoading
                        ? 'animate-spin'
                        : ''
                    }
                  />

                  <span className="hidden sm:inline">
                    Refresh
                  </span>

                </button>

              </div>

            </div>

            {lastUpdated && (
              <p className="mt-3 text-[11px] text-slate-400">
                Last updated{' '}
                {lastUpdated.toLocaleTimeString(
                  'en-PH',
                  {
                    hour: 'numeric',
                    minute:
                      '2-digit',
                    second:
                      '2-digit',
                  }
                )}
                {' · '}
                Auto-refreshes
                every 15 seconds
              </p>
            )}

          </div>

          {/* ERROR */}

          {inquiriesError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-4 sm:px-5">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div className="flex-1">

                  <p className="text-sm font-bold text-red-700">
                    Unable to load
                    inquiries
                  </p>

                  <p className="mt-0.5 text-xs text-red-600">
                    {inquiriesError}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    loadInquiries(
                      true
                    )
                  }
                  className="text-xs font-bold text-red-700 underline"
                >
                  Retry
                </button>

              </div>

            </div>
          )}

          {/* LOADING */}

          {inquiriesLoading &&
            inquiries.length ===
              0 && (
              <div className="flex min-h-[300px] items-center justify-center">

                <div className="text-center">

                  <Loader2
                    size={30}
                    className="mx-auto animate-spin text-blue-950"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Loading inquiry
                    messages...
                  </p>

                </div>

              </div>
            )}

          {/* EMPTY */}

          {!inquiriesLoading &&
            !inquiriesError &&
            filteredInquiries.length ===
              0 && (
              <div className="flex min-h-[320px] items-center justify-center px-5">

                <div className="max-w-sm text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">

                    <Inbox
                      size={30}
                      className="text-slate-400"
                    />

                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-900">
                    {searchQuery
                      ? 'No inquiries found'
                      : 'No inquiry messages yet'}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">

                    {searchQuery
                      ? 'Try searching using another client name, email, phone number, or property.'
                      : 'When a client sends you an inquiry from your profile or about a property, the message will appear here.'}

                  </p>

                </div>

              </div>
            )}

          {/* INQUIRY LIST */}

          {filteredInquiries.length >
            0 && (
            <div className="divide-y divide-slate-100">

              {filteredInquiries.map(
                (inquiry) => {

                  const isNew =
                    inquiry.status ===
                    'New';

                  return (
                    <button
                      key={
                        inquiry.id
                      }
                      type="button"
                      onClick={() =>
                        handleOpenInquiry(
                          inquiry
                        )
                      }
                      className={`group flex w-full flex-col gap-4 p-4 text-left transition hover:bg-slate-50 sm:p-5 ${
                        isNew
                          ? 'bg-blue-50/40'
                          : 'bg-white'
                      }`}
                    >

                      <div className="flex items-start gap-3 sm:gap-4">

                        {/* AVATAR */}

                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-950 text-sm font-black text-white sm:h-12 sm:w-12">

                          {inquiry.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ||
                            '?'}

                          {isNew && (
                            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                          )}

                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex min-w-0 items-center gap-2">

                              <h3
                                className={`truncate text-sm sm:text-base ${
                                  isNew
                                    ? 'font-black text-slate-950'
                                    : 'font-bold text-slate-800'
                                }`}
                              >
                                {
                                  inquiry.name
                                }
                              </h3>

                              {isNew && (
                                <span className="shrink-0 rounded-full bg-blue-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                                  New
                                </span>
                              )}

                            </div>

                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatDate(
                                inquiry.createdAt
                              )}
                            </span>

                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">

                            <span className="inline-flex items-center gap-1">
                              <Mail
                                size={
                                  12
                                }
                              />
                              {
                                inquiry.email
                              }
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Phone
                                size={
                                  12
                                }
                              />
                              {
                                inquiry.phone
                              }
                            </span>

                          </div>

                          {inquiry.property && (
                            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-blue-900">

                              <Building2
                                size={
                                  13
                                }
                              />

                              <span className="truncate">
                                {
                                  inquiry
                                    .property
                                    .title
                                }
                              </span>

                            </div>
                          )}

                          <p
                            className={`mt-2 line-clamp-2 text-xs leading-5 ${
                              isNew
                                ? 'font-medium text-slate-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {
                              inquiry.message
                            }
                          </p>

                        </div>

                        {/* RIGHT */}

                        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                              inquiry.status
                            )}`}
                          >

                            {getStatusIcon(
                              inquiry.status
                            )}

                            {
                              inquiry.status
                            }

                          </span>

                          <ChevronRight
                            size={17}
                            className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-950"
                          />

                        </div>

                      </div>

                      {/* MOBILE STATUS */}

                      <div className="flex items-center justify-between sm:hidden">

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                            inquiry.status
                          )}`}
                        >

                          {getStatusIcon(
                            inquiry.status
                          )}

                          {
                            inquiry.status
                          }

                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-950">
                          View
                          <ChevronRight
                            size={
                              15
                            }
                          />
                        </span>

                      </div>

                    </button>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          INQUIRY MODAL
      ====================================================== */}

      {selectedInquiry && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedInquiry(
                null
              );
            }
          }}
        >

          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-950 text-sm font-black text-white">

                  {selectedInquiry.name
                    ?.charAt(
                      0
                    )
                    .toUpperCase() ||
                    '?'}

                </div>

                <div className="min-w-0">

                  <h2 className="truncate text-lg font-black text-slate-950">
                    {
                      selectedInquiry.name
                    }
                  </h2>

                  <p className="truncate text-xs text-slate-500">
                    Inquiry received{' '}
                    {formatDateTime(
                      selectedInquiry.createdAt
                    )}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedInquiry(
                    null
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close inquiry"
              >

                <X size={20} />

              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5 sm:p-6">

              {/* CLIENT DETAILS */}

              <div className="grid gap-3 sm:grid-cols-2">

                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">

                    <Mail
                      size={16}
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Email
                    </p>

                    <p className="truncate text-sm font-semibold text-slate-800">
                      {
                        selectedInquiry.email
                      }
                    </p>

                  </div>

                </a>

                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">

                    <Phone
                      size={16}
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Phone
                    </p>

                    <p className="truncate text-sm font-semibold text-slate-800">
                      {
                        selectedInquiry.phone
                      }
                    </p>

                  </div>

                </a>

              </div>

              {/* PROPERTY */}

              {selectedInquiry.property && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">

                  <div className="flex gap-3 p-3 sm:p-4">

                    {selectedInquiry
                      .property
                      .image && (
                      <img
                        src={
                          selectedInquiry
                            .property
                            .image
                        }
                        alt={
                          selectedInquiry
                            .property
                            .title
                        }
                        className="h-20 w-24 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32"
                      />
                    )}

                    <div className="min-w-0">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        Property
                      </p>

                      <h3 className="mt-1 text-sm font-black text-slate-900 sm:text-base">
                        {
                          selectedInquiry
                            .property
                            .title
                        }
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">

                        <MapPin
                          size={
                            12
                          }
                        />

                        <span className="truncate">
                          {
                            selectedInquiry
                              .property
                              .location
                          }
                        </span>

                      </div>

                      <p className="mt-1 text-sm font-black text-blue-950">
                        ₱
                        {
                          selectedInquiry
                            .property
                            .price
                        }
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* MESSAGE */}

              <div className="mt-5">

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Client Message
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      selectedInquiry.message
                    }
                  </p>

                </div>

              </div>

              {/* STATUS */}

              <div className="mt-5">

                <label
                  htmlFor="inquiry-status"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400"
                >
                  Inquiry Status
                </label>

                <div className="relative">

                  <select
                    id="inquiry-status"
                    value={
                      selectedInquiry.status
                    }
                    onChange={(
                      event
                    ) =>
                      updateInquiryStatus(
                        selectedInquiry.id,
                        event.target
                          .value
                      )
                    }
                    disabled={
                      updatingInquiryId ===
                      selectedInquiry.id
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {INQUIRY_STATUSES.map(
                      (status) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {status}
                        </option>
                      )
                    )}

                  </select>

                  {updatingInquiryId ===
                  selectedInquiry.id ? (
                    <Loader2
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-950"
                    />
                  ) : (
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  )}

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">

                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
                >

                  <Mail
                    size={16}
                  />

                  Email Client

                </a>

                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >

                  <Phone
                    size={16}
                  />

                  Call Client

                </a>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

