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
  DollarSign,
  Eye,
  Image as ImageIcon,
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

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;

  const difference =
    Date.now() - new Date(lastSeen).getTime();

  return (
    difference >= 0 &&
    difference <= 5 * 60 * 1000
  );
}

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

function getPropertyTypeText(property: InquiryProperty) {
  const values = [
    property.category,
    property.propertyType,
    property.houseType,
    property.storey
      ? `${property.storey} Storey`
      : null,
  ].filter(Boolean);

  return values.join(' • ');
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [agent, setAgent] = useState<Agent | null>(null);

  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [heartbeatActive, setHeartbeatActive] =
    useState(false);

  const [inquiries, setInquiries] =
    useState<Inquiry[]>([]);

  const [inquiriesLoading, setInquiriesLoading] =
    useState(true);

  const [inquiriesError, setInquiriesError] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedInquiryId, setSelectedInquiryId] =
    useState<number | null>(null);

  const [updatingInquiryId, setUpdatingInquiryId] =
    useState<number | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // =========================================================
  // LOAD CURRENT AGENT
  // =========================================================
const selectedInquiry = useMemo(
  () =>
    inquiries.find(
      (inquiry) =>
        inquiry.id === selectedInquiryId
    ) ?? null,
  [inquiries, selectedInquiryId]
);

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

      const receivedInquiries =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.inquiries)
            ? data.inquiries
            : [];

      setInquiries((previous) => {
        if (
          previous.length === receivedInquiries.length &&
          previous.every((previousInquiry, index) => {
            const nextInquiry =
              receivedInquiries[index];

            return (
              previousInquiry.id === nextInquiry.id &&
              previousInquiry.status ===
                nextInquiry.status &&
              previousInquiry.updatedAt ===
                nextInquiry.updatedAt
            );
          })
        ) {
          return previous;
        }

        return receivedInquiries;
      });

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
    setSelectedInquiryId(inquiry.id);

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
                'Content-Type': 'application/json',
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

          const updatedInquiry = data?.inquiry;

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
        } catch (error) {
          console.error(
            'Update inquiry status error:',
            error
          );

          setInquiriesError(
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
      name: 'My Profile',
      href: agent
        ? `/agent/${agent.slug}`
        : '/agent/dashboard',
      icon: User,
    },
  ];

  // =========================================================
  // FILTER INQUIRIES
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
        const propertyTitle =
          inquiry.property?.title ||
          '';

        const propertyLocation =
          inquiry.property?.location ||
          '';

        const propertyPrice =
          inquiry.property?.price ||
          '';

        const searchableText =
          [
            inquiry.name,
            inquiry.email,
            inquiry.phone,
            inquiry.message,
            inquiry.status,
            propertyTitle,
            propertyLocation,
            propertyPrice,
          ]
            .join(' ')
            .toLowerCase();

        return searchableText.includes(
          query
        );
      }
    );
  }, [
    inquiries,
    searchQuery,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalInquiries =
    inquiries.length;

  const unreadInquiries =
    inquiries.filter(
      (inquiry) =>
        inquiry.status === 'New'
    ).length;

  const activeLeads =
    inquiries.filter(
      (inquiry) =>
        [
          'New',
          'Read',
          'Contacted',
          'Viewing Scheduled',
          'Follow Up',
        ].includes(
          inquiry.status
        )
    ).length;

  const propertyInquiries =
    inquiries.filter(
      (inquiry) =>
        inquiry.property !== null
    ).length;

  const directProfileInquiries =
    inquiries.filter(
      (inquiry) =>
        inquiry.property === null
    ).length;

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ButterflyLoader />
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-72
          flex-col
          border-r
          border-slate-200
          bg-white
          shadow-xl
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            mobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* LOGO / BRAND */}

        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Building2
                size={22}
              />
            </div>

            <div>
              <p className="text-sm font-bold tracking-wide text-slate-950">
                BREA 88
              </p>

              <p className="text-xs text-slate-500">
                REALTY
              </p>
            </div>

          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        {/* AGENT MINI PROFILE */}

        <div className="border-b border-slate-100 p-5">

          <div className="flex items-center gap-3">

            <div className="relative">

              {agent.profileImage ? (
                <img
                  src={agent.profileImage}
                  alt={agent.fullName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
                  <User
                    size={21}
                  />
                </div>
              )}

              <span
                className={`
                  absolute
                  bottom-0
                  right-0
                  h-3
                  w-3
                  rounded-full
                  border-2
                  border-white
                  ${
                    isOnline(
                      agent.lastSeen
                    )
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }
                `}
              />

            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold text-slate-900">
                {agent.fullName}
              </p>

              <p className="text-xs text-slate-500">
                {agent.role}
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-[11px]">

                <span
                  className={
                    isOnline(
                      agent.lastSeen
                    )
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }
                >
                  {isOnline(
                    agent.lastSeen
                  )
                    ? 'Online'
                    : 'Offline'}
                </span>

                {heartbeatActive && (
                  <span className="text-slate-400">
                    • Active
                  </span>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 p-4">

          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                pathname ===
                item.href;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(
                      false
                    );

                    router.push(
                      item.href
                    );
                  }}
                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${
                      active
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }
                  `}
                >
                  <Icon
                    size={19}
                  />

                  <span>
                    {item.name}
                  </span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto"
                    />
                  )}
                </button>
              );
            }
          )}

        </nav>

        {/* LOGOUT */}

        <div className="border-t border-slate-100 p-4">

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loggingOut ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <LogOut
                size={19}
              />
            )}

            <span>
              {loggingOut
                ? 'Logging out...'
                : 'Logout'}
            </span>

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="lg:pl-72">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
              >
                <Menu size={22} />
              </button>

              <div>

                <p className="text-xs font-medium text-slate-500">
                  Agent / Broker Dashboard
                </p>

                <h1 className="text-lg font-bold text-slate-950">
                  Inquiry Messages
                </h1>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                loadInquiries(true)
              }
              disabled={
                inquiriesLoading
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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

        </header>

        {/* ===================================================
            PAGE
        =================================================== */}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* PAGE INTRO */}

          <div className="mb-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Inquiry Messages
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Messages from clients interested in your properties or contacting you directly.
                </p>

              </div>

              {lastUpdated && (
                <p className="text-xs text-slate-400">
                  Last updated{' '}
                  {lastUpdated.toLocaleTimeString(
                    'en-PH',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  )}
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* TOTAL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Total Inquiries
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {totalInquiries}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Inbox
                    size={21}
                  />
                </div>

              </div>

            </div>

            {/* UNREAD */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Unread
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {unreadInquiries}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MessageSquare
                    size={21}
                  />
                </div>

              </div>

            </div>

            {/* ACTIVE LEADS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Active Leads
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {activeLeads}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <User
                    size={21}
                  />
                </div>

              </div>

            </div>

            {/* PROPERTY INQUIRIES */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Property Inquiries
                  </p>

                  <p className="mt-2 text-3xl font-bold text-purple-600">
                    {propertyInquiries}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {directProfileInquiries}{' '}
                    direct profile
                    {directProfileInquiries ===
                    1
                      ? ''
                      : 's'}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Building2
                    size={21}
                  />
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div className="relative flex-1">

                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search client, property, location, message..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery(
                        ''
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X
                      size={15}
                    />
                  </button>
                )}

              </div>

              <div className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {
                    filteredInquiries.length
                  }
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {
                    inquiries.length
                  }
                </span>{' '}
                inquiries
              </div>

            </div>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {inquiriesError && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">

                <p className="font-semibold">
                  Unable to load inquiries
                </p>

                <p className="mt-1 text-sm">
                  {inquiriesError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadInquiries(
                      true
                    )
                  }
                  className="mt-3 text-sm font-semibold underline"
                >
                  Try again
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              INQUIRIES
          ================================================= */}

          <div className="mt-6">

            {inquiriesLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-slate-400"
                />

                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading inquiry messages...
                </p>

              </div>
            ) : filteredInquiries.length ===
              0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  {searchQuery ? (
                    <Search
                      size={28}
                    />
                  ) : (
                    <Inbox
                      size={28}
                    />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {searchQuery
                    ? 'No inquiries found'
                    : 'No inquiry messages yet'}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'When a client sends you an inquiry from your profile or about a property, the message will appear here.'}
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {filteredInquiries.map(
                  (inquiry) => {

                    const property =
                      inquiry.property;

                    const propertyType =
                      property
                        ? getPropertyTypeText(
                            property
                          )
                        : '';

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
                        className="group w-full rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                      >

                        <div className="p-4 sm:p-5">

                          <div className="flex flex-col gap-4 lg:flex-row">

                            {/* =================================
                                PROPERTY IMAGE
                            ================================= */}

                            <div className="relative shrink-0">

                              {property?.image ? (
                                <img
                                  src={
                                    property.image
                                  }
                                  alt={
                                    property.title
                                  }
                                  className="h-28 w-full rounded-xl object-cover sm:h-28 sm:w-40"
                                />
                              ) : (
                                <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:w-40">
                                  {property ? (
                                    <ImageIcon
                                      size={
                                        28
                                      }
                                    />
                                  ) : (
                                    <User
                                      size={
                                        28
                                      }
                                    />
                                  )}
                                </div>
                              )}

                              {inquiry.status ===
                                'New' && (
                                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow">
                                  <Circle
                                    size={
                                      7
                                    }
                                    fill="currentColor"
                                  />
                                  NEW
                                </span>
                              )}

                            </div>

                            {/* =================================
                                INQUIRY CONTENT
                            ================================= */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h3 className="truncate text-base font-bold text-slate-950 sm:text-lg">
                                      {
                                        inquiry.name
                                      }
                                    </h3>

                                    <span
                                      className={`
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        rounded-full
                                        border
                                        px-2.5
                                        py-1
                                        text-[11px]
                                        font-semibold
                                        ${getStatusClasses(
                                          inquiry.status
                                        )}
                                      `}
                                    >
                                      {getStatusIcon(
                                        inquiry.status
                                      )}

                                      {
                                        inquiry.status
                                      }
                                    </span>

                                  </div>

                                  <p className="mt-1 text-xs text-slate-400">
                                    Inquiry #
                                    {
                                      inquiry.id
                                    }{' '}
                                    •{' '}
                                    {
                                      formatDate(
                                        inquiry.createdAt
                                      )
                                    }
                                  </p>

                                </div>

                                <ChevronRight
                                  size={
                                    20
                                  }
                                  className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600 sm:block"
                                />

                              </div>

                              {/* =================================
                                  PROPERTY INFORMATION
                              ================================= */}

                              {property ? (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                                  <div className="flex items-start gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                                      <Building2
                                        size={
                                          17
                                        }
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Property Inquired
                                      </p>

                                      <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                                        {
                                          property.title
                                        }
                                      </p>

                                      <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-4">

                                        <span className="inline-flex items-center gap-1">
                                          <MapPin
                                            size={
                                              13
                                            }
                                          />

                                          {
                                            property.location
                                          }
                                        </span>

                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                          <DollarSign
                                            size={
                                              13
                                            }
                                          />

                                          ₱
                                          {
                                            property.price
                                          }
                                        </span>

                                      </div>

                                      {propertyType && (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                          {
                                            propertyType
                                          }
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                </div>
                              ) : (
                                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                                      <User
                                        size={
                                          17
                                        }
                                      />
                                    </div>

                                    <div>

                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Inquiry Source
                                      </p>

                                      <p className="text-sm font-semibold text-slate-700">
                                        Direct Agent Profile Inquiry
                                      </p>

                                      <p className="text-xs text-slate-400">
                                        No specific property selected
                                      </p>

                                    </div>

                                  </div>

                                </div>
                              )}

                              {/* =================================
                                  MESSAGE PREVIEW
                              ================================= */}

                              <div className="mt-3 flex items-start gap-2">

                                <MessageSquare
                                  size={
                                    15
                                  }
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />

                                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                                  {
                                    inquiry.message
                                  }
                                </p>

                              </div>

                              {/* =================================
                                  CLIENT CONTACT
                              ================================= */}

                              <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">

                                <span className="inline-flex items-center gap-1.5">
                                  <Mail
                                    size={
                                      14
                                    }
                                  />

                                  {
                                    inquiry.email
                                  }
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Phone
                                    size={
                                      14
                                    }
                                  />

                                  {
                                    inquiry.phone
                                  }
                                </span>

                              </div>

                            </div>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </main>

      </div>

      {/* =====================================================
          INQUIRY MODAL
      ===================================================== */}

      {selectedInquiry && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedInquiryId(
                null
              );
            }
          }}
        >

          <div className="max-h-[95vh] w-full max-w-3xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">

            {/* ===============================================
                MODAL HEADER
            =============================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="min-w-0">

                <p className="text-xs font-medium text-slate-400">
                  Inquiry #
                  {
                    selectedInquiry.id
                  }
                </p>

                <h2 className="truncate text-lg font-bold text-slate-950">
                  Client Inquiry
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedInquiryId(
                    null
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={21} />
              </button>

            </div>

            {/* ===============================================
                MODAL BODY
            =============================================== */}

            <div className="max-h-[calc(95vh-73px)] overflow-y-auto p-5 sm:max-h-[calc(90vh-73px)] sm:p-6">

              {/* =============================================
                  CLIENT
              ============================================= */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <User
                      size={20}
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="text-lg font-bold text-slate-950">
                          {
                            selectedInquiry.name
                          }
                        </h3>

                        <p className="text-xs text-slate-500">
                          Client
                        </p>

                      </div>

                      <span
                        className={`
                          inline-flex
                          w-fit
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-xs
                          font-semibold
                          ${getStatusClasses(
                            selectedInquiry.status
                          )}
                        `}
                      >
                        {getStatusIcon(
                          selectedInquiry.status
                        )}

                        {
                          selectedInquiry.status
                        }
                      </span>

                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">

                      <a
                        href={`mailto:${selectedInquiry.email}`}
                        className="flex min-w-0 items-center gap-2 text-slate-600 hover:text-slate-950"
                      >
                        <Mail
                          size={15}
                          className="shrink-0"
                        />

                        <span className="truncate">
                          {
                            selectedInquiry.email
                          }
                        </span>
                      </a>

                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-950"
                      >
                        <Phone
                          size={15}
                          className="shrink-0"
                        />

                        <span>
                          {
                            selectedInquiry.phone
                          }
                        </span>
                      </a>

                    </div>

                  </div>

                </div>

              </div>

              {/* =============================================
                  PROPERTY CARD
              ============================================= */}

              <div className="mt-5">

                <div className="mb-2 flex items-center gap-2">

                  <Building2
                    size={17}
                    className="text-slate-700"
                  />

                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Property Inquired
                  </h3>

                </div>

                {selectedInquiry.property ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr]">

                      {/* IMAGE */}

                      <div className="relative h-48 sm:h-full">

                        {selectedInquiry
                          .property
                          .image ? (
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
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-48 items-center justify-center bg-slate-100 text-slate-400">
                            <ImageIcon
                              size={
                                38
                              }
                            />
                          </div>
                        )}

                      </div>

                      {/* DETAILS */}

                      <div className="p-5">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Property
                        </p>

                        <h4 className="mt-1 text-xl font-bold leading-tight text-slate-950">
                          {
                            selectedInquiry
                              .property
                              .title
                          }
                        </h4>

                        <div className="mt-4 space-y-2.5">

                          <div className="flex items-start gap-2.5 text-sm text-slate-600">

                            <MapPin
                              size={
                                17
                              }
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <div>

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Location
                              </p>

                              <p className="font-medium text-slate-800">
                                {
                                  selectedInquiry
                                    .property
                                    .location
                                }
                              </p>

                            </div>

                          </div>

                          <div className="flex items-start gap-2.5 text-sm text-slate-600">

                            <DollarSign
                              size={
                                17
                              }
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <div>

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Price
                              </p>

                              <p className="font-bold text-slate-900">
                                ₱
                                {
                                  selectedInquiry
                                    .property
                                    .price
                                }
                              </p>

                            </div>

                          </div>

                          {getPropertyTypeText(
                            selectedInquiry.property
                          ) && (
                            <div className="flex items-start gap-2.5 text-sm text-slate-600">

                              <Building2
                                size={
                                  17
                                }
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <div>

                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Classification
                                </p>

                                <p className="font-medium text-slate-800">
                                  {getPropertyTypeText(
                                    selectedInquiry.property
                                  )}
                                </p>

                              </div>

                            </div>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInquiryId(
                              null
                            );

                            router.push(
                              `/marketplace?agent=${encodeURIComponent(
                                agent.slug
                              )}`
                            );
                          }}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Eye
                            size={
                              16
                            }
                          />

                          View Marketplace

                          <ExternalLink
                            size={
                              14
                            }
                          />
                        </button>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                        <User
                          size={20}
                        />
                      </div>

                      <div>

                        <p className="font-bold text-slate-800">
                          Direct Agent Profile Inquiry
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          This client contacted you directly through your Agent Profile. No specific property was selected.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* =============================================
                  CLIENT MESSAGE
              ============================================= */}

              <div className="mt-5">

                <div className="mb-2 flex items-center gap-2">

                  <MessageSquare
                    size={17}
                    className="text-slate-700"
                  />

                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Client Message
                  </h3>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      selectedInquiry.message
                    }
                  </p>

                </div>

              </div>

              {/* =============================================
                  INQUIRY DETAILS
              ============================================= */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Submitted
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedInquiry.createdAt
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedInquiry.updatedAt
                    )}
                  </p>

                </div>

              </div>

              {/* =============================================
                  STATUS
              ============================================= */}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Inquiry Status
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Update the progress of this client lead.
                    </p>

                  </div>

                  <div className="relative">

                    <select
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
                      className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
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
                            {
                              status
                            }
                          </option>
                        )
                      )}
                    </select>

                    {updatingInquiryId ===
                    selectedInquiry.id ? (
                      <Loader2
                        size={
                          16
                        }
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                      />
                    ) : (
                      <ChevronDown
                        size={
                          16
                        }
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    )}

                  </div>

                </div>

              </div>

              {/* =============================================
                  ACTIONS
              ============================================= */}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Mail
                    size={17}
                  />

                  Email Client
                </a>

                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Phone
                    size={17}
                  />

                  Call Client
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInquiryId(
                      null
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}