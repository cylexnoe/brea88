'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  BriefcaseBusiness,
  LayoutDashboard,
} from 'lucide-react';

type Agent = {
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
};

export default function AgentDashboardPage() {
const router = useRouter();
const pathname = usePathname();

const [agent, setAgent] = useState<Agent | null>(null);
const [loading, setLoading] = useState(true);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [loggingOut, setLoggingOut] = useState(false);

/*

* =========================================================
* AUTHENTICATION
* =========================================================
  */

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

/*

* =========================================================
* LOGOUT
* =========================================================
  */

const handleLogout = async () => {
if (loggingOut) return;


setLoggingOut(true);

try {
  await fetch('/api/agent/logout', {
    method: 'POST',
    credentials: 'include',
  });
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

/*

* =========================================================
* LOADING
* =========================================================
  */

if (loading || !agent) {
return ( <main className="flex min-h-screen items-center justify-center bg-slate-950"> <div className="flex flex-col items-center gap-4 text-white"> <Loader2
         size={36}
         className="animate-spin text-blue-400"
       />


      <p className="text-sm text-slate-400">
        Loading agent dashboard...
      </p>
    </div>
  </main>
);


}

/*

* =========================================================
* DASHBOARD
* =========================================================
  */

return ( <main className="min-h-screen bg-slate-50 text-slate-900">


  {/* =====================================================
      NAVBAR
  ====================================================== */}

  <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">

    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

      <div className="flex h-16 items-center justify-between">

        {/* BRAND */}

        <button
          type="button"
          onClick={() =>
            router.push('/agent/dashboard')
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

          <div className="hidden sm:block text-left">

            <p className="text-sm font-black tracking-tight text-blue-950">
              BREA 88 REALTY
            </p>

            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Agent Portal
            </p>

          </div>

        </button>

        {/* DESKTOP NAVIGATION */}

        <div className="hidden items-center gap-1 md:flex">

          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  router.push(item.href)
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
          })}

        </div>

        {/* DESKTOP AGENT ACCOUNT */}

        <div className="hidden items-center gap-3 md:flex">

          <button
            type="button"
            onClick={() =>
              router.push('/profile')
            }
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
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loggingOut ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <LogOut size={17} />
            )}

            <span className="hidden lg:inline">
              Logout
            </span>

          </button>

        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              (previous) => !previous
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

    {/* ===================================================
        MOBILE NAVIGATION
    ==================================================== */}

    {mobileMenuOpen && (
      <div className="border-t border-slate-200 bg-white md:hidden">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

          {/* AGENT INFORMATION */}

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

          {/* NAVIGATION */}

          <div className="space-y-1">

            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(item.href);
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
            })}

          </div>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >

            {loggingOut ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <LogOut size={18} />
            )}

            Logout

          </button>

        </div>

      </div>
    )}

  </nav>

  {/* =====================================================
      DASHBOARD CONTENT
  ====================================================== */}

  <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

    {/* WELCOME */}

    <div className="rounded-3xl bg-blue-950 p-6 text-white shadow-xl sm:p-8">

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-sm font-medium text-blue-300">
            Agent / Broker Portal
          </p>

          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Welcome, {agent.fullName}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
            Manage your professional profile,
            properties, and real estate activities
            from your agent portal.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            router.push('/profile')
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 transition hover:bg-blue-50 active:scale-[0.98]"
        >

          <User size={18} />

          View Profile

          <ChevronRight size={17} />

        </button>

      </div>

    </div>

    {/* PROFILE SUMMARY */}

    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">

            {agent.profileImage ? (
              <img
                src={agent.profileImage}
                alt={agent.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <BriefcaseBusiness
                size={23}
                className="text-slate-500"
              />
            )}

          </div>

          <div className="min-w-0">

            <h2 className="text-lg font-bold text-slate-900">
              Professional Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your information currently registered
              with BREA 88 Realty.
            </p>

          </div>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2 text-slate-400">
              <User size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Name
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-900">
              {agent.fullName}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2 text-slate-400">
              <BriefcaseBusiness size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Role
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              {agent.role}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Email
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-900">
              {agent.email}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2 text-slate-400">
              <Phone size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Phone
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-900">
              {agent.phone || 'Not provided'}
            </p>

          </div>

        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage your agent account.
        </p>

        <div className="mt-5 space-y-2">

          <button
            type="button"
            onClick={() =>
              router.push('/profile')
            }
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
              <User size={17} />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold">
                Edit Profile
              </p>

              <p className="text-xs text-slate-500">
                Update your information
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-400"
            />

          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/marketplace')
            }
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
              <Building2 size={17} />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold">
                Properties
              </p>

              <p className="text-xs text-slate-500">
                View property listings
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-400"
            />

          </button>

        </div>

      </div>

    </div>

  </section>

</main>

);
}
