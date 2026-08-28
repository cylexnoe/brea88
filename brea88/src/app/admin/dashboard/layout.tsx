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

  return children;
}