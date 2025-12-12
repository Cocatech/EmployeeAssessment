'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

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

        await prisma.user.create({
            data: {
                empCode: employee.empCode,
                email: employee.email,
                name: employee.empName_Eng,
                passwordHash: hashedPassword,
                role: 'EMPLOYEE',
                userType: 'EMPLOYEE',
                isActive: true
            }
        });

        revalidatePath(`/admin/employees/${empCode}`);
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
        const user = await prisma.user.findFirst({
            where: { empCode }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                role,
                userType
            }
        });

        revalidatePath(`/admin/employees/${empCode}`);
        return { success: true, message: 'User role updated successfully' };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error: 'Failed to update role' };
    }
}
