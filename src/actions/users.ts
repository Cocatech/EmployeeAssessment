'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

/**
 * Reset User Password
 */
export async function resetUserPassword(empCode: string) {
    try {
        const user = await prisma.user.findFirst({
            where: { empCode }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const hashedPassword = await bcrypt.hash('Welcome@2025', 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                isActive: true // Ensure active on reset
            }
        });

        // [AUDIT LOG]
        await logAudit('USER_PASSWORD_RESET', 'User', user.id, { empCode });

        revalidatePath(`/admin/employees/${empCode}`);
        return { success: true, message: 'Password reset to Welcome@2025' };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}

/**
 * Toggle User Active Status
 */
export async function toggleUserStatus(empCode: string, isActive: boolean) {
    try {
        const user = await prisma.user.findFirst({
            where: { empCode }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { isActive }
        });

        // [AUDIT LOG]
        await logAudit('USER_STATUS_UPDATE', 'User', user.id, { empCode, isActive });

        revalidatePath(`/admin/employees/${empCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error toggling user status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

/**
 * Manually Create User for existing Employee
 */
export async function createUserForEmployee(empCode: string) {
    try {
        const session = await import('@/lib/auth').then(m => m.auth());
        const currentUser = session?.user as any;
        const isSysAdmin = currentUser?.userType === 'SYSTEM_ADMIN';

        const employee = await prisma.employee.findUnique({
            where: { empCode }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        if (!employee.email) {
            return { success: false, error: 'Employee does not have an email address' };
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: employee.email },
                    { empCode: empCode }
                ]
            }
        });

        if (existingUser) {
            return { success: false, error: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash('Welcome@2025', 10);

        // Force defaults for non-SYSADMIN
        const newUserType = 'EMPLOYEE'; // Always EMPLOYEE unless updated later by SYSADMIN
        const newRole = 'EMPLOYEE'; // Default role

        await prisma.user.create({
            data: {
                empCode: employee.empCode,
                email: employee.email,
                name: employee.empName_Eng,
                passwordHash: hashedPassword,
                role: newRole,
                userType: newUserType,
                isActive: true
            }
        });

        revalidatePath(`/admin/employees/${empCode}`);

        // [AUDIT LOG]
        // Fetch the created user ID for logging? Or just log by empCode which is unique enough for prompt
        const createdUser = await prisma.user.findUnique({ where: { email: employee.email } });
        if (createdUser) {
            await logAudit('USER_CREATE', 'User', createdUser.id, { empCode, email: employee.email });
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

/**
 * Set Custom Password for User
 */
export async function setUserPassword(empCode: string, password: string) {
    try {
        if (!password || password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        const user = await prisma.user.findFirst({
            where: { empCode }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                isActive: true
            }
        });

        // [AUDIT LOG]
        await logAudit('USER_PASSWORD_RESET', 'User', user.id, { action: 'Set Custom Password', empCode });

        revalidatePath(`/admin/employees/${empCode}`);
        return { success: true, message: 'Password updated successfully' };
    } catch (error) {
        console.error('Error setting password:', error);
        return { success: false, error: 'Failed to set password' };
    }
}

/**
 * Update User Role and Type
 */
export async function updateUserRole(empCode: string, role: string, userType: string) {
    try {
        const session = await import('@/lib/auth').then(m => m.auth());
        const currentUser = session?.user as any;

        if (!currentUser) {
            return { success: false, error: 'Unauthorized' };
        }

        const isSysAdmin = currentUser.userType === 'SYSTEM_ADMIN';
        const currentEmpCode = currentUser.empCode;

        // 1. Self-Promotion Prevention
        if (empCode === currentEmpCode && !isSysAdmin) {
            return { success: false, error: 'Security Alert: You cannot change your own role.' };
        }

        const targetUser = await prisma.user.findFirst({
            where: { empCode }
        });

        if (!targetUser) {
            return { success: false, error: 'User not found' };
        }

        // 2. SYSADMIN Protection (Target)
        if (targetUser.userType === 'SYSTEM_ADMIN' && !isSysAdmin) {
            return { success: false, error: 'Unauthorized: Cannot modify System Admin profile' };
        }

        // 3. SYSADMIN Creation Restriction (New Role)
        if ((userType === 'SYSTEM_ADMIN' || role === 'HR') && !isSysAdmin) {
            return { success: false, error: 'Unauthorized: You valid privileges to grant high-level roles.' };
        }

        // 4. Validate allowed roles for non-SYSADMIN (HR)
        if (!isSysAdmin) {
            // HR can only assign EMPLOYEE or MANAGER
            const allowedRoles = ['EMPLOYEE', 'MANAGER'];
            if (!allowedRoles.includes(role)) {
                return { success: false, error: 'Unauthorized: Invalid role assignment.' };
            }
            // Enforce userType to be EMPLOYEE
            if (userType !== 'EMPLOYEE') {
                return { success: false, error: 'Unauthorized: Cannot assign special User Type.' };
            }
        }

        await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                role,
                userType
            }
        });

        // [AUDIT LOG]
        await logAudit('USER_ROLE_UPDATE', 'User', targetUser.id, {
            empCode,
            oldRole: targetUser.role,
            newRole: role,
            oldType: targetUser.userType,
            newType: userType
        });

        revalidatePath(`/admin/employees/${empCode}`);
        return { success: true, message: 'User role updated successfully' };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error: 'Failed to update role' };
    }
}
