import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getEmployees } from '@/actions/employees';
import NewDelegationForm from '@/components/delegation/NewDelegationForm';

export const metadata = {
  title: 'New Delegation | TRTH Assessment',
  description: 'Create a new permission delegation',
};

export default async function NewDelegationPage() {
  // Check if user is admin
  const session = await auth();
  const currentUser = (session?.user as any);
  const role = currentUser?.role;
  const userType = currentUser?.userType;
  const empCode = currentUser?.empCode;

  if (userType !== 'SYSTEM_ADMIN' && role !== 'HR') {
    redirect('/dashboard');
  }

  // Get all employees
  const employees = await getEmployees();

  // Filter out admin user
  const availableEmployees = employees.filter(emp => emp.empCode !== 'EMP999');

  return <NewDelegationForm employees={availableEmployees} />;
}
