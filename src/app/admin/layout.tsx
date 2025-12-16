import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await auth();

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user is System Admin or Employee Admin
  const currentUser = session.user as any;
  const role = currentUser?.role;
  const userType = currentUser?.userType;

  if (userType !== 'SYSTEM_ADMIN' && role !== 'HR') {
    // Non-admin users redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
