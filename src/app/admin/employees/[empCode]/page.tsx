import { getEmployee } from '@/actions/employees';
import { notFound } from 'next/navigation';
import { EmployeeProfileView } from '@/components/employees/EmployeeProfileView';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ empCode: string }>;
}) {
  const { empCode } = await params;
  const result = await getEmployee(empCode);

  if (!result.success || !result.data) {
    notFound();
  }

  const employee = result.data;

  return (
    <EmployeeProfileView
      employee={employee}
      backUrl="/admin/employees"
      editUrl={`/admin/employees/${employee.empCode}/edit?returnUrl=/admin/employees`}
    />
  );
}
