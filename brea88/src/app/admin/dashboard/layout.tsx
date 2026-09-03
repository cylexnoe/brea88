import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect('/admin?auth=required');
  }

  return (
    <div className="admin-dashboard-shell">
      {children}
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 82% -8%, rgba(201,169,110,.12), transparent 28%),
            radial-gradient(circle at 8% 24%, rgba(7,25,54,.05), transparent 30%),
            #f6f7f9;
        }
        .admin-dashboard-shell main {
          position: relative;
        }
        .admin-dashboard-shell main::before {
          content: "";
          position: absolute;
          top: 0;
          right: 5%;
          width: 320px;
          height: 220px;
          pointer-events: none;
          background: radial-gradient(circle, rgba(201,169,110,.08), transparent 70%);
        }
        .admin-dashboard-shell header {
          border-bottom-color: rgba(15,23,42,.08) !important;
          background: rgba(255,255,255,.9) !important;
          box-shadow: 0 10px 32px rgba(15,23,42,.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .admin-dashboard-shell aside {
          border-right-color: rgba(15,23,42,.08) !important;
          background: rgba(255,255,255,.96) !important;
          box-shadow: 18px 0 55px rgba(15,23,42,.045);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .admin-dashboard-shell aside button {
          transition: background-color 220ms ease, color 220ms ease, border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
        }
        .admin-dashboard-shell aside button:hover {
          border-color: rgba(201,169,110,.2);
          transform: translateX(2px);
        }
        .admin-dashboard-shell main > div:first-child h2 {
          color: #071936;
        }
        .admin-dashboard-shell main > div:first-child h2::after {
          content: "";
          display: block;
          width: 52px;
          height: 2px;
          margin-top: 10px;
          border-radius: 999px;
          background: linear-gradient(90deg,#c9a96e,transparent);
        }
        .admin-dashboard-shell main .rounded-2xl.border.border-slate-200.bg-white {
          border-color: rgba(15,23,42,.075);
          box-shadow: 0 14px 38px rgba(15,23,42,.055);
          transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
        }
        .admin-dashboard-shell main .rounded-2xl.border.border-slate-200.bg-white:hover {
          border-color: rgba(201,169,110,.24);
          box-shadow: 0 20px 50px rgba(15,23,42,.08);
          transform: translateY(-2px);
        }
        .admin-dashboard-shell input,
        .admin-dashboard-shell textarea,
        .admin-dashboard-shell select {
          border-color: rgba(15,23,42,.12);
        }
        .admin-dashboard-shell input:focus,
        .admin-dashboard-shell textarea:focus,
        .admin-dashboard-shell select:focus {
          border-color: rgba(201,169,110,.7) !important;
          box-shadow: 0 0 0 4px rgba(201,169,110,.1) !important;
        }
        .admin-dashboard-shell button,
        .admin-dashboard-shell a {
          -webkit-tap-highlight-color: transparent;
        }
        @media (max-width: 639px) {
          .admin-dashboard-shell main { padding-bottom: 2rem; }
          .admin-dashboard-shell aside { width: min(86vw,320px); }
          .admin-dashboard-shell main::before { width: 180px; height: 150px; right: 0; }
        }
      ` }} />
    </div>
  );
}