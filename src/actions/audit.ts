'use server';

import { prisma } from '@/lib/db';
import { isSystemAdmin } from '@/lib/permissions';

/**
 * Get Audit Logs
 * Restricted to System Admin Only
 */
export async function getAuditLogs(params?: {
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
}) {
    try {
        // 1. Strict Authorization Check
        const isSysAdmin = await isSystemAdmin();
        if (!isSysAdmin) {
            throw new Error('Unauthorized');
        }

        const where: any = {};

        if (params?.action) where.action = params.action;
        if (params?.entity) where.entity = params.entity;

        // Date Range Filter
        if (params?.startDate || params?.endDate) {
            where.createdAt = {};
            if (params.startDate) where.createdAt.gte = new Date(params.startDate);
            if (params.endDate) where.createdAt.lte = new Date(params.endDate);
        }

        // Search (Email or EntityID)
        if (params?.search) {
            where.OR = [
                { userEmail: { contains: params.search, mode: 'insensitive' } },
                { entityId: { contains: params.search, mode: 'insensitive' } },
                { userId: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: params?.limit || 100, // Default limit 100 to prevent overload
        });

        // Serialize dates for client component
        return logs.map(log => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
            changes: log.changes ? JSON.stringify(log.changes) : null, // Flatten JSON for simpler table handling if needed, or keep as is
        }));

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        // Return empty array or throw based on UI handling preference. 
        // Here we return empty to avoid breaking page, but could handle error state in UI.
        return [];
    }
}
