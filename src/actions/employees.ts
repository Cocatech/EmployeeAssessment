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
    // Optimized query to select only necessary fields for the list view
    const where: any = { isActive: true };
    if (params?.group) where.group = { contains: params.group };
    if (params?.employeeType) where.employeeType = params.employeeType;
    if (params?.search) {
      where.OR = [
        { empCode: { contains: params.search, mode: 'insensitive' } },
        { empName_Eng: { contains: params.search, mode: 'insensitive' } },
        { empName_Thai: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { empCode: 'asc' },
      select: {
        empCode: true,
        empName_Eng: true,
        empName_Thai: true,
        email: true,
        phoneNumber: true,
        position: true,
        group: true,
        team: true,
        assessmentLevel: true,
        employeeType: true,
        joinDate: true,
        warningCount: true,
        isActive: true,
        // Exclude heavy fields like profileImage or relationship IDs not needed for table
      }
    });

    return employees.map((emp) => ({
      empCode: emp.empCode,
      empName_Eng: emp.empName_Eng,
      empName_Thai: emp.empName_Thai || undefined,
      email: emp.email || null,
      phoneNumber: emp.phoneNumber || undefined,
      profileImage: null, // Optimization: List view doesn't render images, returning null saves bandwidth
      position: emp.position,
      group: emp.group,
      team: emp.team || undefined,
      assessmentLevel: emp.assessmentLevel,
      employeeType: emp.employeeType as 'Permanent' | 'Temporary',
      approver1_ID: '', // Not needed in list
      approver2_ID: null,
      approver3_ID: null,
      manager_ID: null,
      gm_ID: '',
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

    // specific lookup for approver names
    const approverCodes = [
      emp.approver1_ID,
      emp.approver2_ID,
      emp.approver3_ID,
      emp.manager_ID,
      emp.gm_ID
    ].filter((code): code is string => !!code);

    let approverMap: Record<string, string> = {};

    if (approverCodes.length > 0) {
      const approvers = await prisma.employee.findMany({
        where: { empCode: { in: approverCodes } },
        select: { empCode: true, empName_Eng: true }
      });

      approvers.forEach(a => {
        approverMap[a.empCode] = a.empName_Eng;
      });
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
      approver1_Name: emp.approver1_ID ? (approverMap[emp.approver1_ID] || '') : '',

      approver2_ID: emp.approver2_ID || null,
      approver2_Name: emp.approver2_ID ? (approverMap[emp.approver2_ID] || '') : '',

      approver3_ID: emp.approver3_ID || null,
      approver3_Name: emp.approver3_ID ? (approverMap[emp.approver3_ID] || '') : '',

      manager_ID: emp.manager_ID || null,
      manager_Name: emp.manager_ID ? (approverMap[emp.manager_ID] || '') : '',

      gm_ID: emp.gm_ID || '',
      gm_Name: emp.gm_ID ? (approverMap[emp.gm_ID] || '') : '',

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
export async function createEmployee(data: Omit<Employee, 'empCode'> & {
  empCode: string;
  profileImage?: string | null;
  password?: string;
  userRole?: string;
  userType?: string;
}) {
  try {
    // 1. Check if Employee already exists (Active or Inactive)
    const existingEmployee = await prisma.employee.findUnique({
      where: { empCode: data.empCode },
      include: { user: true }
    });

    if (existingEmployee) {
      if (existingEmployee.isActive) {
        return { success: false, error: 'Employee with this code already exists and is active.' };
      }

      // RESTORE logic for Inactive Employee
      const bcrypt = await import('bcryptjs');
      let passwordHash = undefined;

      if (data.password) {
        passwordHash = await bcrypt.hash(data.password, 10);
      } else if (!existingEmployee.user) {
        // Only set default if No user existed before
        passwordHash = await bcrypt.hash('Welcome@2025', 10);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Restore Employee
        await tx.employee.update({
          where: { empCode: data.empCode },
          data: {
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
            isActive: true, // REACTIVATE
          },
        });

        // Handle User
        if (existingEmployee.user) {
          // Update existing User
          await tx.user.update({
            where: { id: existingEmployee.user.id },
            data: {
              email: data.email || existingEmployee.user.email,
              name: data.empName_Eng,
              isActive: true, // REACTIVATE
              role: data.userRole || existingEmployee.user.role,
              userType: data.userType || existingEmployee.user.userType,
              ...(passwordHash ? { passwordHash } : {}),
            }
          });
        } else if (data.email) {
          // Create new User if didn't exist
          // Check if email is taken by SOMEONE ELSE first
          const emailUser = await tx.user.findUnique({ where: { email: data.email } });
          if (emailUser) throw new Error('Email is already in use by another user.');

          await tx.user.create({
            data: {
              empCode: data.empCode,
              email: data.email,
              name: data.empName_Eng,
              passwordHash: passwordHash || await bcrypt.hash('Welcome@2025', 10),
              role: data.userRole || 'EMPLOYEE',
              userType: data.userType || 'EMPLOYEE',
              isActive: true,
            }
          });
        }
      });

      revalidatePath('/admin/employees');
      revalidatePath('/dashboard/employees');
      return { success: true };
    }

    // 2. Validate Email Uniqueness for NEW Creation
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: data.email }
      });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists.' };
      }
    }

    const bcrypt = await import('bcryptjs');
    // Use provided password or default
    const passwordToHash = data.password || 'Welcome@2025';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Employee
      const newEmployee = await tx.employee.create({
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

      // 2. Create User if email is present
      if (data.email) {
        await tx.user.create({
          data: {
            empCode: data.empCode,
            email: data.email,
            name: data.empName_Eng,
            passwordHash: hashedPassword,
            role: data.userRole || 'EMPLOYEE', // Use provided role or default
            userType: data.userType || 'EMPLOYEE', // Use provided type or default
            isActive: true,
          }
        });
      }

      return newEmployee;
    });

    revalidatePath('/admin/employees');
    revalidatePath('/dashboard/employees');
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    // Unique constraint failed on user table potentially
    if (error.code === 'P2002') {
      return { success: false, error: 'Employee or User with this specific unique field already exists.' };
    }
    return { success: false, error: 'Failed to create employee: ' + error.message };
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

    // Use transaction to update both Employee and User
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { empCode },
        data: updateData,
      });

      // Update linked User if critical fields change
      if (data.email !== undefined || data.isActive !== undefined || data.empName_Eng !== undefined) {
        const userUpdateData: any = {};
        if (data.email !== undefined) userUpdateData.email = data.email;
        if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
        if (data.empName_Eng !== undefined) userUpdateData.name = data.empName_Eng;

        // Only update if there is a linked user
        // We can try to update directly, if not found it throws or returns info depending on query
        // safe way: updateMany (returns count) or findFirst then update

        // Check if user exists linked to this empCode
        const user = await tx.user.findFirst({ where: { empCode } });
        if (user) {
          await tx.user.update({
            where: { id: user.id },
            data: userUpdateData
          });
        } else if (data.email) {
          // Option: Create user if not exists? 
          // The requirement says "Create Employess -> Get User". 
          // If updating an employee that doesn't have a user (legacy?), maybe we should create one?
          // For now, let's just update if exists.
        }
      }
    });

    revalidatePath('/admin/employees');
    revalidatePath('/dashboard/employees');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return { success: false, error: 'Failed to update employee: ' + error.message };
  }
}

/**
 * Delete an employee (soft delete)
 */
/**
 * Delete an employee (soft delete)
 * Also deactivates the linked User account
 */
export async function deleteEmployee(empCode: string) {
  try {
    const employee = await findEmployeeByCode(empCode);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // Soft delete by setting isActive to false for both Employee and User
    await prisma.$transaction(async (tx) => {
      // 1. Deactivate Employee
      await tx.employee.update({
        where: { empCode },
        data: { isActive: false },
      });

      // 2. Deactivate Linked User
      const user = await tx.user.findFirst({ where: { empCode } });
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: { isActive: false }
        });
      }
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
