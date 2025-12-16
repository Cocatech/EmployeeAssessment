'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Delegation, DelegationPermission } from '@/types/delegation';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

/**
 * Get all delegations (Admin only)
 */
export async function getDelegations(params?: {
  delegateeId?: string;
  permission?: string;
  isActive?: boolean;
}): Promise<Delegation[]> {
  try {
    const where: any = {};

    if (params?.delegateeId) where.delegateeId = params.delegateeId;
    if (params?.permission) where.permission = params.permission;
    if (params?.isActive !== undefined) where.isActive = params.isActive;

    const delegations = await prisma.delegation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return delegations.map((d) => ({
      id: d.id,
      delegatorId: d.delegatorId,
      delegateeId: d.delegateeId,
      permission: d.permission as DelegationPermission,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      reason: d.reason || undefined,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      revokedAt: d.revokedAt?.toISOString(),
      revokedBy: d.revokedBy || undefined,
    }));
  } catch (error) {
    console.error('Error fetching delegations:', error);
    throw new Error('Failed to fetch delegations');
  }
}

/**
 * Get active delegations for a specific user
 */
export async function getActiveDelegations(empCode: string): Promise<Delegation[]> {
  try {
    const now = new Date();

    const delegations = await prisma.delegation.findMany({
      where: {
        delegateeId: empCode,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return delegations.map((d) => ({
      id: d.id,
      delegatorId: d.delegatorId,
      delegateeId: d.delegateeId,
      permission: d.permission as DelegationPermission,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      reason: d.reason || undefined,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      revokedAt: d.revokedAt?.toISOString(),
      revokedBy: d.revokedBy || undefined,
    }));
  } catch (error) {
    console.error('Error fetching active delegations:', error);
    return [];
  }
}

/**
 * Check if user has specific permission (native or delegated)
 */
export async function hasPermission(
  empCode: string,
  permission: DelegationPermission
): Promise<boolean> {
  try {
    if (!empCode) return false;

    // Check for active delegation
    const now = new Date();
    const delegation = await prisma.delegation.findFirst({
      where: {
        delegateeId: empCode,
        permission,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    return !!delegation;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Create a new delegation (Admin only)
 */
export async function createDelegation(data: {
  delegateeId: string;
  permission: DelegationPermission;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  try {
    // [SECURITY] Check Permissions
    const isSysAdmin = await import('@/lib/permissions').then(m => m.isSystemAdmin());
    // Also allow HR (Role=ADMIN) if decided, but design said SYSADMIN or HR Manager. 
    // For now, adhering to strict SYSADMIN or Admin Role as per "isSystemAdmin()" which checks userType=SYSTEM_ADMIN or role=ADMIN.

    if (!await isSysAdmin) {
      return { success: false, error: 'Unauthorized: Only Admins can create delegations' };
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return { success: false, error: 'End date must be after start date' };
    }

    const session = await auth();
    const delegatorId = (session?.user as any)?.empCode || 'SYSTEM';

    const delegation = await prisma.delegation.create({
      data: {
        delegatorId: delegatorId,
        delegateeId: data.delegateeId,
        permission: data.permission,
        startDate,
        endDate,
        reason: data.reason || null,
        isActive: true,
      },
    });

    // [AUDIT LOG]
    await logAudit('DELEGATION_GRANT', 'Delegation', delegation.id, {
      permission: data.permission,
      delegatee: data.delegateeId,
      reason: data.reason
    });

    revalidatePath('/dashboard/delegations');
    return { success: true, id: delegation.id };
  } catch (error) {
    console.error('Error creating delegation:', error);
    return { success: false, error: 'Failed to create delegation' };
  }
}

/**
 * Update delegation
 */
export async function updateDelegation(
  id: string,
  data: {
    startDate?: string;
    endDate?: string;
    reason?: string;
    isActive?: boolean;
  }
) {
  try {
    const isSysAdmin = await import('@/lib/permissions').then(m => m.isSystemAdmin());
    if (!await isSysAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const updateData: any = {};

    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.reason !== undefined) updateData.reason = data.reason || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.delegation.update({
      where: { id },
      data: updateData,
    });

    // [AUDIT LOG]
    await logAudit('DELEGATION_UPDATE', 'Delegation', id, updateData);

    revalidatePath('/dashboard/delegations');
    return { success: true };
  } catch (error) {
    console.error('Error updating delegation:', error);
    return { success: false, error: 'Failed to update delegation' };
  }
}

/**
 * Revoke delegation
 */
export async function revokeDelegation(id: string) {
  try {
    const isSysAdmin = await import('@/lib/permissions').then(m => m.isSystemAdmin());
    if (!await isSysAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const session = await auth();
    const revokerId = (session?.user as any)?.empCode || 'SYSTEM';

    await prisma.delegation.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: revokerId,
      },
    });

    // [AUDIT LOG]
    await logAudit('DELEGATION_REVOKE', 'Delegation', id, { revokedBy: revokerId });

    revalidatePath('/dashboard/delegations');
    return { success: true };
  } catch (error) {
    console.error('Error revoking delegation:', error);
    return { success: false, error: 'Failed to revoke delegation' };
  }
}

/**
 * Delete delegation
 */
export async function deleteDelegation(id: string) {
  try {
    const isSysAdmin = await import('@/lib/permissions').then(m => m.isSystemAdmin());
    if (!await isSysAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    // [AUDIT LOG] - Log before delete since ID will be gone
    await logAudit('DELEGATION_REVOKE', 'Delegation', id, { action: 'DELETE' });

    await prisma.delegation.delete({
      where: { id },
    });

    revalidatePath('/dashboard/delegations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting delegation:', error);
    return { success: false, error: 'Failed to delete delegation' };
  }
}

/**
 * Auto-deactivate expired delegations (run this periodically)
 */
export async function deactivateExpiredDelegations() {
  try {
    const now = new Date();

    await prisma.delegation.updateMany({
      where: {
        isActive: true,
        endDate: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating expired delegations:', error);
    return { success: false, error: 'Failed to deactivate expired delegations' };
  }
}
