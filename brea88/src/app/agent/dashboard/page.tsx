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
  Eye,
  Image as ImageIcon,
  PhilippinePeso,
  Sparkles,
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

function isOnline(
  lastSeen: string | null | undefined
): boolean {
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
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'Read':
      return 'border-slate-200 bg-slate-50 text-slate-600';

    case 'Contacted':
      return 'border-purple-200 bg-purple-50 text-purple-700';

    case 'Viewing Scheduled':
      return 'border-amber-200 bg-amber-50 text-amber-700';

    case 'Viewing Completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'Follow Up':
      return 'border-orange-200 bg-orange-50 text-orange-700';

    case 'Closed':
      return 'border-slate-300 bg-slate-100 text-slate-700';

    case 'Cancelled':
      return 'border-red-200 bg-red-50 text-red-700';

    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'New':
      return (
        <Circle
          size={9}
          fill="currentColor"
        />
      );

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
      return <Circle size={9} />;
  }
}

function getPropertyTypeText(
  property: InquiryProperty
) {
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

  const [agent, setAgent] =
    useState<Agent | null>(null);

  const [loading, setLoading] =
    useState(true);

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

  const [
    selectedInquiryId,
    setSelectedInquiryId,
  ] = useState<number | null>(null);

  const [
    updatingInquiryId,
    setUpdatingInquiryId,
  ] = useState<number | null>(null);

  const [
    deletingInquiryId,
    setDeletingInquiryId,
  ] = useState<number | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const selectedInquiry = useMemo(
    () =>
      inquiries.find(
        (inquiry) =>
          inquiry.id === selectedInquiryId
      ) ?? null,
    [inquiries, selectedInquiryId]
  );

  /*
   * =========================================================
   * LOAD CURRENT AGENT
   * =========================================================
   */

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
        }
      } catch (error) {
        console.error(
          'Failed to load agent:',
          error
        );

        if (mounted) {
          setLoading(false);
        }

        router.replace('/agent/login');
        return;
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadAgent();

    return () => {
      mounted = false;
    };
  }, [router]);

  /*
   * =========================================================
   * LOAD INQUIRIES
   * =========================================================
   */

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

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      if (!response.ok) {
        const errorData =
          typeof data === 'object' &&
          data !== null
            ? (data as Record<string, unknown>)
            : {};

        throw new Error(
          typeof errorData.message === 'string'
            ? errorData.message
            : typeof errorData.error === 'string'
              ? errorData.error
              : 'Unable to load inquiry messages.'
        );
      }

      const receivedInquiries =
        Array.isArray(data)
          ? data
          : typeof data === 'object' &&
              data !== null &&
              Array.isArray(
                (data as Record<string, unknown>)
                  .inquiries
              )
            ? (
                data as Record<string, unknown>
              ).inquiries
            : [];

      setInquiries(
        receivedInquiries as Inquiry[]
      );

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
      setInquiriesLoading(false);
    }
  };

  /*
   * =========================================================
   * INITIAL INQUIRY LOAD
   * =========================================================
   */

  useEffect(() => {
    if (!agent?.id) return;

    loadInquiries(true);
  }, [agent?.id]);

  /*
   * =========================================================
   * HEARTBEAT
   * =========================================================
   */

  useEffect(() => {
    if (!agent?.id) return;

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

        let data: any = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (data?.success && mounted) {
          setHeartbeatActive(true);

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
  }, [agent?.id, router]);

  /*
   * =========================================================
   * MARK INQUIRY AS READ
   * =========================================================
   */

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

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

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

  /*
   * =========================================================
   * OPEN INQUIRY
   * =========================================================
   */

  const handleOpenInquiry = async (
    inquiry: Inquiry
  ) => {
    setSelectedInquiryId(inquiry.id);

    if (inquiry.status === 'New') {
      await markInquiryAsRead(inquiry);
    }
  };

  /*
   * =========================================================
   * UPDATE STATUS
   * =========================================================
   */

  const updateInquiryStatus = async (
    inquiryId: number,
    status: string
  ) => {
    if (updatingInquiryId === inquiryId) {
      return;
    }

    setUpdatingInquiryId(inquiryId);
    setInquiriesError('');

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

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 401) {
        router.replace('/agent/login');
        return;
      }

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

      setLastUpdated(new Date());
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

  /*
   * =========================================================
   * DELETE INQUIRY
   * =========================================================
   */

  const deleteInquiry = async (
    inquiryId: number
  ) => {
    if (deletingInquiryId === inquiryId) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this inquiry? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setDeletingInquiryId(inquiryId);
    setInquiriesError('');

    try {
      const response = await fetch(
        '/api/inquiries',
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            id: inquiryId,
          }),
        }
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 401) {
        router.replace('/agent/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Unable to delete inquiry.'
        );
      }

      setInquiries((previous) =>
        previous.filter(
          (inquiry) =>
            inquiry.id !== inquiryId
        )
      );

      setSelectedInquiryId(null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        'Delete inquiry error:',
        error
      );

      setInquiriesError(
        error instanceof Error
          ? error.message
          : 'Unable to delete inquiry.'
      );
    } finally {
      setDeletingInquiryId(null);
    }
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

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

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

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

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

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

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

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

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <ButterflyLoader />
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  const agentOnline =
    isOnline(agent.lastSeen);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
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
          w-[285px]
          flex-col
          border-r
          border-slate-800
          bg-[#071936]
          text-white
          shadow-2xl
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

        {/* BRAND */}

        <div className="relative flex h-[82px] items-center justify-between border-b border-white/10 px-5">

          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/70 to-transparent" />

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-lg">
              <Building2
                size={21}
                className="text-[#ead9b8]"
              />
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-white">
                BREA 88
              </p>

              <p className="mt-0.5 text-[10px] font-medium tracking-[0.25em] text-slate-400">
                REALTY
              </p>
            </div>

          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        {/* PROFILE */}

        <div className="border-b border-white/10 p-5">

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">

            <div className="flex items-center gap-3">

              <div className="relative">

                {agent.profileImage ? (
                  <img
                    src={agent.profileImage}
                    alt={agent.fullName}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                    <User size={20} />
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
                    border-[#071936]
                    ${
                      agentOnline
                        ? 'bg-emerald-400'
                        : 'bg-slate-500'
                    }
                  `}
                />

              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-white">
                  {agent.fullName}
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span className="rounded-full bg-[#c9a96e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ead9b8]">
                    {agent.role}
                  </span>

                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[10px]">

                  <span
                    className={
                      agentOnline
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }
                  >
                    {agentOnline
                      ? 'Online'
                      : 'Offline'}
                  </span>

                  {heartbeatActive && (
                    <span className="text-slate-500">
                      • Active
                    </span>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-2 p-4">

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>

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
                    group
                    relative
                    flex
                    w-full
                    items-center
                    gap-3
                    overflow-hidden
                    rounded-xl
                    px-4
                    py-3.5
                    text-sm
                    font-medium
                    transition-all
                    ${
                      active
                        ? 'bg-white text-[#071936] shadow-lg shadow-black/10'
                        : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                    }
                  `}
                >

                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#c9a96e]" />
                  )}

                  <Icon
                    size={19}
                    className={
                      active
                        ? 'text-[#071936]'
                        : 'text-slate-500 transition group-hover:text-white'
                    }
                  />

                  <span>
                    {item.name}
                  </span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto text-[#071936]"
                    />
                  )}

                </button>
              );
            }
          )}

        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="border-t border-white/10 p-4">

          <div className="mb-3 flex items-center gap-2 px-3 text-[10px] text-slate-500">
            <Sparkles
              size={12}
              className="text-[#c9a96e]"
            />
            <span>
              BREA 88 REALTY
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loggingOut ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <LogOut size={19} />
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
          MAIN
      ===================================================== */}

      <div className="lg:pl-[285px]">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

            <div className="flex min-w-0 items-center gap-3">

              <button
                type="button"
                aria-label="Open navigation"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
              >
                <Menu size={21} />
              </button>

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="hidden h-1.5 w-1.5 rounded-full bg-[#c9a96e] sm:block" />

                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Agent / Broker Workspace
                  </p>

                </div>

                <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-[#071936] sm:text-xl">
                  Inquiry Messages
                </h1>

              </div>

            </div>

            <div className="flex items-center gap-2">

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm sm:flex">

                <span
                  className={`h-2 w-2 rounded-full ${
                    agentOnline
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />

                {agentOnline
                  ? 'Online'
                  : 'Offline'}

              </div>

              <button
                type="button"
                onClick={() =>
                  loadInquiries(true)
                }
                disabled={
                  inquiriesLoading
                }
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >

                <RefreshCw
                  size={16}
                  className={
                    inquiriesLoading
                      ? 'animate-spin'
                      : 'transition group-hover:rotate-90'
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>

              </button>

            </div>

          </div>

        </header>

        {/* ===================================================
            PAGE
        =================================================== */}

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* =================================================
              WELCOME / HERO
          ================================================= */}

          <section className="relative mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-[#071936] p-6 text-white shadow-xl sm:p-8">

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-[#c9a96e]/10 blur-3xl" />

            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#ead9b8] via-[#c9a96e] to-transparent" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              <div className="max-w-2xl">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ead9b8]">

                  <Sparkles size={12} />

                  BREA 88 REALTY

                </div>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back,{' '}
                  <span className="text-[#ead9b8]">
                    {agent.fullName.split(' ')[0]}
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Manage your client inquiries,
                  follow up with leads, and keep
                  every conversation organized
                  in one place.
                </p>

              </div>

              <div className="shrink-0">

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Account Status
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        agentOnline
                          ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30'
                          : 'bg-slate-500'
                      }`}
                    />

                    <span className="text-sm font-semibold text-white">
                      {agentOnline
                        ? 'Currently Online'
                        : 'Currently Offline'}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* TOTAL */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">

              <div className="absolute left-0 top-0 h-1 w-full bg-slate-900" />

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Total Inquiries
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-[#071936]">
                    {totalInquiries}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    All client messages
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-[#071936] group-hover:text-white">
                  <Inbox size={20} />
                </div>

              </div>

            </div>

            {/* UNREAD */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">

              <div className="absolute left-0 top-0 h-1 w-full bg-blue-600" />

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Unread
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600">
                    {unreadInquiries}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Need your attention
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <MessageSquare size={20} />
                </div>

              </div>

            </div>

            {/* ACTIVE */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">

              <div className="absolute left-0 top-0 h-1 w-full bg-emerald-500" />

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Active Leads
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">
                    {activeLeads}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Open client opportunities
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
                  <User size={20} />
                </div>

              </div>

            </div>

            {/* PROPERTY */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d9c08d] hover:shadow-lg">

              <div className="absolute left-0 top-0 h-1 w-full bg-[#c9a96e]" />

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Property Inquiries
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-[#071936]">
                    {propertyInquiries}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {directProfileInquiries}{' '}
                    direct profile
                    {directProfileInquiries === 1
                      ? ''
                      : 's'}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f2e7] text-[#a9823e] transition group-hover:bg-[#c9a96e] group-hover:text-white">
                  <Building2 size={20} />
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              SEARCH + SUMMARY
          ================================================= */}

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="relative w-full lg:max-w-xl">

                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:bg-white focus:ring-4 focus:ring-[#c9a96e]/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearchQuery('')
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}

              </div>

              <div className="flex items-center justify-between gap-4 text-sm lg:justify-end">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Showing
                  </p>

                  <p className="mt-0.5 font-semibold text-[#071936]">
                    {filteredInquiries.length}{' '}
                    <span className="font-normal text-slate-400">
                      of
                    </span>{' '}
                    {inquiries.length}
                  </p>
                </div>

                <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                <div className="hidden text-right sm:block">

                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Last Sync
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lastUpdated
                      ? lastUpdated.toLocaleTimeString(
                          'en-PH',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )
                      : '—'}
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {inquiriesError && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle size={18} />
              </div>

              <div className="flex-1">

                <p className="font-bold">
                  Unable to load inquiries
                </p>

                <p className="mt-1 text-sm leading-6">
                  {inquiriesError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadInquiries(true)
                  }
                  disabled={inquiriesLoading}
                  className="mt-3 rounded-lg text-sm font-bold underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Try again
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              INQUIRIES HEADER
          ================================================= */}

          <div className="mb-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-6 w-1 rounded-full bg-[#c9a96e]" />

                <h2 className="text-xl font-bold tracking-tight text-[#071936]">
                  Client Inquiries
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Review and manage your client conversations.
              </p>

            </div>

            <p className="text-xs text-slate-400">
              Click an inquiry to view details
            </p>

          </div>

          {/* =================================================
              INQUIRIES
          ================================================= */}

          <div>

            {inquiriesLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">

                  <Loader2
                    size={27}
                    className="animate-spin text-[#c9a96e]"
                  />

                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Loading inquiry messages...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait while we retrieve your client conversations.
                </p>

              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm sm:p-16">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">

                  {searchQuery ? (
                    <Search size={32} />
                  ) : (
                    <Inbox size={32} />
                  )}

                </div>

                <h3 className="mt-6 text-xl font-bold text-[#071936]">
                  {searchQuery
                    ? 'No inquiries found'
                    : 'No inquiry messages yet'}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {searchQuery
                    ? 'Try a different search term or clear your search.'
                    : 'When a client sends you an inquiry from your profile or about a property, the message will appear here.'}
                </p>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery('')
                    }
                    className="mt-5 rounded-xl bg-[#071936] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102c53]"
                  >
                    Clear Search
                  </button>
                )}

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
                        className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#c9a96e]/10"
                      >

                        {inquiry.status ===
                          'New' && (
                          <span className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
                        )}

                        <div className="p-4 sm:p-5 lg:p-6">

                          <div className="flex flex-col gap-5 lg:flex-row">

                            {/* PROPERTY / SOURCE IMAGE */}

                            <div className="relative shrink-0">

                              {property?.image ? (
                                <div className="relative overflow-hidden rounded-2xl">

                                  <img
                                    src={
                                      property.image
                                    }
                                    alt={
                                      property.title
                                    }
                                    className="h-36 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-32 sm:w-48"
                                  />

                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent opacity-0 transition group-hover:opacity-100" />

                                </div>
                              ) : (
                                <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-300 sm:h-32 sm:w-48">

                                  {property ? (
                                    <ImageIcon
                                      size={30}
                                    />
                                  ) : (
                                    <User
                                      size={30}
                                    />
                                  )}

                                </div>
                              )}

                              {inquiry.status ===
                                'New' && (
                                <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full border border-white/20 bg-blue-600 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-white shadow-lg">
                                  <Circle
                                    size={6}
                                    fill="currentColor"
                                  />
                                  NEW
                                </span>
                              )}

                            </div>

                            {/* CONTENT */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h3 className="truncate text-base font-bold text-[#071936] sm:text-lg">
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
                                        text-[10px]
                                        font-bold
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

                                  <p className="mt-1 text-[11px] font-medium text-slate-400">
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

                                <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-300 transition group-hover:border-slate-300 group-hover:text-[#071936] sm:flex">

                                  <ChevronRight
                                    size={18}
                                    className="transition group-hover:translate-x-0.5"
                                  />

                                </div>

                              </div>

                              {/* PROPERTY */}

                              {property ? (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">

                                  <div className="flex items-start gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#071936] text-white shadow-sm">
                                      <Building2
                                        size={16}
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a9823e]">
                                        Property Inquired
                                      </p>

                                      <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                                        {
                                          property.title
                                        }
                                      </p>

                                      <div className="mt-1.5 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">

                                        <span className="inline-flex items-center gap-1.5">
                                          <MapPin
                                            size={
                                              12
                                            }
                                          />

                                          {
                                            property.location
                                          }
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                                          <PhilippinePeso
                                            size={
                                              12
                                            }
                                          />

                                          ₱
                                          {
                                            property.price
                                          }
                                        </span>

                                      </div>

                                      {propertyType && (
                                        <p className="mt-1 text-[10px] text-slate-400">
                                          {
                                            propertyType
                                          }
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                                      <User
                                        size={
                                          16
                                        }
                                      />
                                    </div>

                                    <div>

                                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Inquiry Source
                                      </p>

                                      <p className="text-sm font-semibold text-slate-700">
                                        Direct Agent Profile Inquiry
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-400">
                                        No specific property selected
                                      </p>

                                    </div>

                                  </div>

                                </div>
                              )}

                              {/* MESSAGE */}

                              <div className="mt-4 flex items-start gap-2.5">

                                <MessageSquare
                                  size={15}
                                  className="mt-1 shrink-0 text-slate-300"
                                />

                                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                                  {
                                    inquiry.message
                                  }
                                </p>

                              </div>

                              {/* CONTACT */}

                              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">

                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                  <Mail
                                    size={13}
                                    className="shrink-0 text-slate-400"
                                  />

                                  <span className="truncate">
                                    {
                                      inquiry.email
                                    }
                                  </span>
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Phone
                                    size={13}
                                    className="shrink-0 text-slate-400"
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (
                deletingInquiryId !==
                selectedInquiry.id
              ) {
                setSelectedInquiryId(
                  null
                );
              }
            }
          }}
        >

          <div className="relative max-h-[96vh] w-full max-w-4xl overflow-hidden rounded-t-3xl border border-white/20 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">

            {/* GOLD ACCENT */}

            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#071936] via-[#c9a96e] to-[#071936]" />

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071936] text-[#ead9b8]">
                  <MessageSquare size={19} />
                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a9823e]">
                    Client Communication
                  </p>

                  <h2 className="truncate text-lg font-bold text-[#071936]">
                    Inquiry #
                    {
                      selectedInquiry.id
                    }
                  </h2>

                </div>

              </div>

              <button
                type="button"
                aria-label="Close inquiry"
                onClick={() =>
                  setSelectedInquiryId(
                    null
                  )
                }
                disabled={
                  deletingInquiryId ===
                  selectedInquiry.id
                }
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="max-h-[calc(96vh-86px)] overflow-y-auto p-5 sm:max-h-[calc(92vh-86px)] sm:p-7">

              {/* CLIENT */}

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#071936] text-white shadow-lg">
                    <User size={20} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <h3 className="text-xl font-bold tracking-tight text-[#071936]">
                          {
                            selectedInquiry.name
                          }
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-400">
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
                          font-bold
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

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                      <a
                        href={`mailto:${selectedInquiry.email}`}
                        className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-[#071936]"
                      >
                        <Mail
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="truncate">
                          {
                            selectedInquiry.email
                          }
                        </span>
                      </a>

                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-[#071936]"
                      >
                        <Phone
                          size={15}
                          className="shrink-0 text-slate-400"
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

              {/* PROPERTY */}

              <div className="mt-6">

                <div className="mb-3 flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-[#ead9b8]">
                    <Building2 size={15} />
                  </div>

                  <div>

                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a9823e]">
                      Reference
                    </p>

                    <h3 className="text-sm font-bold text-[#071936]">
                      Property Inquired
                    </h3>

                  </div>

                </div>

                {selectedInquiry.property ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="grid grid-cols-1 sm:grid-cols-[210px_1fr]">

                      <div className="relative h-48 sm:h-full sm:min-h-[250px]">

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
                              size={38}
                            />
                          </div>
                        )}

                      </div>

                      <div className="p-5 sm:p-6">

                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a9823e]">
                          Property
                        </p>

                        <h4 className="mt-1 text-xl font-bold leading-tight text-[#071936]">
                          {
                            selectedInquiry
                              .property
                              .title
                          }
                        </h4>

                        <div className="mt-5 space-y-3">

                          <div className="flex items-start gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                              <MapPin
                                size={15}
                              />
                            </div>

                            <div>

                              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Location
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {
                                  selectedInquiry
                                    .property
                                    .location
                                }
                              </p>

                            </div>

                          </div>

                          <div className="flex items-start gap-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                              <PhilippinePeso
                                size={15}
                              />
                            </div>

                            <div>

                              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Price
                              </p>

                              <p className="mt-0.5 text-sm font-bold text-[#071936]">
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
                            <div className="flex items-start gap-3">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Building2
                                  size={15}
                                />
                              </div>

                              <div>

                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Classification
                                </p>

                                <p className="mt-0.5 text-sm font-semibold text-slate-800">
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
                          disabled={
                            deletingInquiryId ===
                            selectedInquiry.id
                          }
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-[#102c53] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          <Eye size={16} />

                          View Marketplace

                          <ExternalLink
                            size={14}
                          />
                        </button>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                        <User size={20} />
                      </div>

                      <div>

                        <p className="font-bold text-slate-800">
                          Direct Agent Profile Inquiry
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          This client contacted you directly through your Agent Profile. No specific property was selected.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* MESSAGE */}

              <div className="mt-6">

                <div className="mb-3 flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-[#ead9b8]">
                    <MessageSquare size={15} />
                  </div>

                  <div>

                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a9823e]">
                      Communication
                    </p>

                    <h3 className="text-sm font-bold text-[#071936]">
                      Client Message
                    </h3>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      selectedInquiry.message
                    }
                  </p>

                </div>

              </div>

              {/* DETAILS */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-white p-4">

                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Submitted
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedInquiry.createdAt
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">

                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Last Updated
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedInquiry.updatedAt
                    )}
                  </p>

                </div>

              </div>

              {/* STATUS */}

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="font-bold text-[#071936]">
                      Inquiry Status
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Update the progress of this client lead.
                    </p>

                  </div>

                  <div className="relative w-full sm:w-auto">

                    <select
                      value={
                        selectedInquiry.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateInquiryStatus(
                          selectedInquiry.id,
                          event.target.value
                        )
                      }
                      disabled={
                        updatingInquiryId ===
                          selectedInquiry.id ||
                        deletingInquiryId ===
                          selectedInquiry.id
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm font-bold text-slate-700 outline-none transition focus:border-[#c9a96e] focus:bg-white focus:ring-4 focus:ring-[#c9a96e]/10 disabled:opacity-60 sm:w-56"
                    >
                      {INQUIRY_STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>

                    {updatingInquiryId ===
                    selectedInquiry.id ? (
                      <Loader2
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#a9823e]"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    )}

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-[#102c53]"
                >
                  <Mail size={17} />
                  Email Client
                </a>

                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Phone size={17} />
                  Call Client
                </a>

              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    deleteInquiry(
                      selectedInquiry.id
                    )
                  }
                  disabled={
                    deletingInquiryId ===
                      selectedInquiry.id ||
                    updatingInquiryId ===
                      selectedInquiry.id
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {deletingInquiryId ===
                  selectedInquiry.id ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Deleting...
                    </>
                  ) : (
                    <>
                      <X size={17} />
                      Delete Inquiry
                    </>
                  )}

                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInquiryId(
                      null
                    )
                  }
                  disabled={
                    deletingInquiryId ===
                    selectedInquiry.id
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>

              </div>

              {deletingInquiryId ===
                selectedInquiry.id && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Deleting inquiry...
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}