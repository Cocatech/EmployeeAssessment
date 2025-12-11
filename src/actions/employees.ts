'use server';

import { prisma, findEmployeeByCode, findActiveEmployees } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Employee } from '@/types';

/**
 * Get all employees with optional filters
 */
export async function getEmployees(params?: {
  group?: string;
  employeeType?: string;
  search?: string;
}): Promise<Employee[]> {
  try {
    const employees = await findActiveEmployees(params);

    return employees.map((emp) => ({
      empCode: emp.empCode,
      empName_Eng: emp.empName_Eng,
      empName_Thai: emp.empName_Thai || undefined,
      email: emp.email || null,
      phoneNumber: emp.phoneNumber || undefined,
      profileImage: emp.profileImage || null,
      position: emp.position,
      group: emp.group,
      team: emp.team || undefined,
      assessmentLevel: emp.assessmentLevel,
      employeeType: emp.employeeType as 'Permanent' | 'Temporary',
      approver1_ID: emp.approver1_ID || '',
      approver2_ID: emp.approver2_ID || null,
      approver3_ID: emp.approver3_ID || null,
      manager_ID: emp.manager_ID || null,
      gm_ID: emp.gm_ID || '',
      joinDate: emp.joinDate.toISOString(),
      warningCount: emp.warningCount,
      isActive: emp.isActive,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees');
  }
}

/**
 * Get single employee by code
 */
export async function getEmployee(empCode: string) {
  try {
    const emp = await findEmployeeByCode(empCode);

    if (!emp) {
      return { success: false, error: 'Employee not found' };
    }

    const employee: any = {
      empCode: emp.empCode,
      empName_Eng: emp.empName_Eng,
      empName_Thai: emp.empName_Thai || undefined,
      email: emp.email || null,
      phoneNumber: emp.phoneNumber || undefined,
      profileImage: emp.profileImage || null,
      position: emp.position,
      group: emp.group,
      team: emp.team || undefined,
      assessmentLevel: emp.assessmentLevel,
      employeeType: emp.employeeType as 'Permanent' | 'Temporary',
      approver1_ID: emp.approver1_ID || '',
      approver2_ID: emp.approver2_ID || null,
      approver3_ID: emp.approver3_ID || null,
      manager_ID: emp.manager_ID || null,
      gm_ID: emp.gm_ID || '',
      joinDate: emp.joinDate.toISOString(),
      warningCount: emp.warningCount,
      isActive: emp.isActive,
    };

    return { success: true, data: employee };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return { success: false, error: 'Failed to fetch employee' };
  }
}

/**
 * Search employees by query
 */
export async function searchEmployees(query: string) {
  try {
    if (!query.trim()) {
      return await getEmployees();
    }

    return await getEmployees({ search: query });
  } catch (error) {
    console.error('Error searching employees:', error);
    return [];
  }
}

/**
 * Filter employees by group
 */
export async function getEmployeesByGroup(group: string) {
  try {
    return await getEmployees({ group });
  } catch (error) {
    console.error('Error filtering employees:', error);
    return [];
  }
}

/**
 * Filter employees by type
 */
export async function getEmployeesByType(type: 'Permanent' | 'Temporary') {
  try {
    return await getEmployees({ employeeType: type });
  } catch (error) {
    console.error('Error filtering employees by type:', error);
    return [];
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(data: Omit<Employee, 'empCode'> & { empCode: string; profileImage?: string | null }) {
  try {
    const result = await prisma.employee.create({
      data: {
        empCode: data.empCode,
        empName_Eng: data.empName_Eng,
        empName_Thai: data.empName_Thai || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        profileImage: data.profileImage || null,
        position: data.position,
        group: data.group,
        team: data.team || null,
        assessmentLevel: data.assessmentLevel,
        employeeType: data.employeeType,
        approver1_ID: data.approver1_ID || null,
        approver2_ID: data.approver2_ID || null,
        approver3_ID: data.approver3_ID || null,
        manager_ID: (data as any).manager_ID || null,
        gm_ID: data.gm_ID || null,
        joinDate: new Date(data.joinDate),
        warningCount: data.warningCount || 0,
        isActive: true,
      },
    });

    revalidatePath('/admin/employees');
    revalidatePath('/dashboard/employees');
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: 'Failed to create employee' };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(empCode: string, data: Partial<Employee>) {
  try {
    const employee = await findEmployeeByCode(empCode);
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    const updateData: any = {};

    if (data.empName_Eng !== undefined) updateData.empName_Eng = data.empName_Eng;
    if (data.empName_Thai !== undefined) updateData.empName_Thai = data.empName_Thai || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || null;
    if ((data as any).profileImage !== undefined) updateData.profileImage = (data as any).profileImage || null;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.group !== undefined) updateData.group = data.group;
    if (data.team !== undefined) updateData.team = data.team || null;
    if (data.assessmentLevel !== undefined) updateData.assessmentLevel = data.assessmentLevel;
    if (data.employeeType !== undefined) updateData.employeeType = data.employeeType;
    if (data.approver1_ID !== undefined) updateData.approver1_ID = data.approver1_ID || null;
    if (data.approver2_ID !== undefined) updateData.approver2_ID = data.approver2_ID || null;
    if (data.approver3_ID !== undefined) updateData.approver3_ID = data.approver3_ID || null;
    if ((data as any).manager_ID !== undefined) updateData.manager_ID = (data as any).manager_ID || null;
    if (data.gm_ID !== undefined) updateData.gm_ID = data.gm_ID || null;
    if (data.joinDate !== undefined) updateData.joinDate = new Date(data.joinDate);
    if (data.warningCount !== undefined) updateData.warningCount = data.warningCount;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.employee.update({
      where: { empCode },
      data: updateData,
    });

    revalidatePath('/admin/employees');
    revalidatePath('/dashboard/employees');
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: 'Failed to update employee' };
  }
}

/**
 * Delete an employee (soft delete)
 */
export async function deleteEmployee(empCode: string) {
  try {
    const employee = await findEmployeeByCode(empCode);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // Soft delete by setting isActive to false
    await prisma.employee.update({
      where: { empCode },
      data: { isActive: false },
    });

    revalidatePath('/admin/employees');
    revalidatePath('/dashboard/employees');
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: 'Failed to delete employee' };
  }
}

/**
 * Get unique groups for filter
 */
export async function getGroups(): Promise<string[]> {
  try {
    const employees = await getEmployees();
    const groupSet = new Set(employees.map(emp => emp.group));
    const groups = Array.from(groupSet);
    return groups.sort();
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

/**
 * Get employee statistics
 */
export async function getEmployeeStats() {
  try {
    const total = await prisma.employee.count({
      where: { isActive: true },
    });

    const permanent = await prisma.employee.count({
      where: { isActive: true, employeeType: 'Permanent' },
    });

    const temporary = await prisma.employee.count({
      where: { isActive: true, employeeType: 'Temporary' },
    });

    const byGroup = await prisma.employee.groupBy({
      by: ['group'],
      where: { isActive: true },
      _count: true,
    });

    const stats = {
      total,
      permanent,
      temporary,
      byGroup: byGroup.reduce((acc, item) => {
        acc[item.group] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
