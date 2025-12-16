import { auth } from '@/lib/auth';
import { getEmployees } from '@/actions/employees';
import { hasPermission } from '@/actions/delegations';
import type { DelegationPermission } from '@/types/delegation';

/**
 * Check if user is System Admin or Employee Admin
 */
export async function isSystemAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const currentUser = session.user as any;
  const role = currentUser?.role;
  const userType = currentUser?.userType;

  return userType === 'SYSTEM_ADMIN' || role === 'HR';
}

/**
 * Check if current user has permission
 */
export async function checkPermission(permission: DelegationPermission): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  // System Admin has all permissions
  if (await isSystemAdmin()) return true;

  const empCode = (session.user as any)?.empCode;
  if (!empCode) return false;

  // Check for active delegation
  return await hasPermission(empCode, permission);
}

/**
 * Check if user is Admin or HR
 */
export async function isAdminOrHR(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  // Check if System Admin or Employee Admin (HR)
  if (await isSystemAdmin()) return true;

  const empCode = (session.user as any)?.empCode;
  if (!empCode) return false;

  // Check if HR
  const employees = await getEmployees();
  const currentUser = employees.find(emp => emp.empCode === empCode);
  // Keep looser check for grouping logic if needed, but primary role is now HR
  const isHR = currentUser?.group?.includes('HR') || currentUser?.group?.includes('ADM');

  return !!isHR;
}

/**
 * Check if user can manage employees
 */
export async function canManageEmployees(): Promise<boolean> {
  // Admin or HR or delegated permission
  const isAdminHR = await isAdminOrHR();
  if (isAdminHR) return true;

  return await checkPermission('MANAGE_EMPLOYEES');
}

/**
 * Check if user can create assessments (Admin only or delegated)
 */
export async function canCreateAssessments(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  // System Admin or Employee Admin
  if (await isSystemAdmin()) return true;

  return await checkPermission('MANAGE_ASSESSMENTS');
}

/**
 * Get current user permissions
 */
export async function getCurrentUserPermissions(): Promise<{
  empCode: string;
  isAdmin: boolean;
  isHR: boolean;
  canManageEmployees: boolean;
  canManageAssessments: boolean;
  canViewReports: boolean;
  canManageQuestions: boolean;
}> {
  const session = await auth();

  if (!session?.user) {
    return {
      empCode: '',
      isAdmin: false,
      isHR: false,
      canManageEmployees: false,
      canManageAssessments: false,
      canViewReports: false,
      canManageQuestions: false,
    };
  }

  const empCode = (session.user as any)?.empCode || '';
  const isAdmin = await isSystemAdmin();

  if (isAdmin) {
    return {
      empCode,
      isAdmin: true,
      isHR: false,
      canManageEmployees: true,
      canManageAssessments: true,
      canViewReports: true,
      canManageQuestions: true,
    };
  }

  if (!empCode) {
    return {
      empCode: '',
      isAdmin: false,
      isHR: false,
      canManageEmployees: false,
      canManageAssessments: false,
      canViewReports: false,
      canManageQuestions: false,
    };
  }

  // Check HR status
  const employees = await getEmployees();
  const currentUser = employees.find(emp => emp.empCode === empCode);
  const isHR = !!(currentUser?.group?.includes('HR') || currentUser?.group?.includes('ADM'));

  // Check delegated permissions
  const canManageEmployeesPermission = isHR || await hasPermission(empCode, 'MANAGE_EMPLOYEES');
  const canManageAssessmentsPermission = await hasPermission(empCode, 'MANAGE_ASSESSMENTS');
  const canViewReportsPermission = await hasPermission(empCode, 'VIEW_REPORTS');
  const canManageQuestionsPermission = await hasPermission(empCode, 'MANAGE_QUESTIONS');

  return {
    empCode,
    isAdmin: false,
    isHR,
    canManageEmployees: canManageEmployeesPermission,
    canManageAssessments: canManageAssessmentsPermission,
    canViewReports: canViewReportsPermission,
    canManageQuestions: canManageQuestionsPermission,
  };
}
