'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-levels';
import { logAudit } from '@/lib/audit';

async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}

export type AssessmentLevelResult = {
    success: boolean;
    error?: string;
    data?: any;
};

// --- Actions ---

export async function getAssessmentLevels() {
    try {
        const levels = await prisma.assessmentLevel.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        return levels;
    } catch (error) {
        console.error('Failed to fetch assessment levels:', error);
        return [];
    }
}

export async function createAssessmentLevel(data: {
    code: string;
    name: string;
    description?: string;
    label: string;
    formTitle?: string;
    sortOrder: number;
    // Dual Language
    nameTh?: string;
    nameJa?: string;
    descriptionTh?: string;
    descriptionJa?: string;
}): Promise<AssessmentLevelResult> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'HR' && user.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await prisma.assessmentLevel.create({
            data: {
                ...data,
                isActive: true,
            },
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('LEVEL_CREATE', 'AssessmentLevel', result.id, { name: data.name, code: data.code });

        return { success: true };
    } catch (error) {
        console.error('Failed to create assessment level:', error);
        return { success: false, error: 'Failed to create assessment level' };
    }
}

export async function updateAssessmentLevel(
    id: string,
    data: {
        code?: string;
        name?: string;
        description?: string;
        label?: string;
        formTitle?: string;
        sortOrder?: number;
        isActive?: boolean;
        // Dual Language
        nameTh?: string;
        nameJa?: string;
        descriptionTh?: string;
        descriptionJa?: string;
    }
): Promise<AssessmentLevelResult> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'HR' && user.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        const currentLevel = await prisma.assessmentLevel.findUnique({
            where: { id },
        });

        if (!currentLevel) {
            return { success: false, error: 'Level not found' };
        }

        // If code is changing, we need to update related records (Questions, Assessments)
        if (data.code && data.code !== currentLevel.code) {
            await prisma.$transaction([
                prisma.assessmentLevel.update({
                    where: { id },
                    data,
                }),
                // Update linked Questions
                prisma.assessmentQuestion.updateMany({
                    where: { applicableLevel: currentLevel.code },
                    data: { applicableLevel: data.code },
                }),
                // Update linked Assessments (targetLevel)
                prisma.assessment.updateMany({
                    where: { targetLevel: currentLevel.code },
                    data: { targetLevel: data.code },
                }),
            ]);
        } else {
            // No code change, simple update
            await prisma.assessmentLevel.update({
                where: { id },
                data,
            });
        }

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('LEVEL_UPDATE', 'AssessmentLevel', id, { changes: data });

        return { success: true };
    } catch (error) {
        console.error('Failed to update assessment level:', error);
        return { success: false, error: 'Failed to update assessment level' };
    }
}

export async function deleteAssessmentLevel(id: string): Promise<AssessmentLevelResult> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'HR')) { // Only Admin/HR can delete
            return { success: false, error: 'Unauthorized' };
        }

        const target = await prisma.assessmentLevel.findUnique({ where: { id } });

        await prisma.assessmentLevel.delete({
            where: { id },
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        if (target) await logAudit('LEVEL_DELETE', 'AssessmentLevel', id, { name: target.name, code: target.code });

        return { success: true };
    } catch (error) {
        console.error('Failed to delete assessment level:', error);
        return { success: false, error: 'Failed to delete assessment level' };
    }
}

export async function toggleAssessmentLevelStatus(id: string, isActive: boolean): Promise<AssessmentLevelResult> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'HR')) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.assessmentLevel.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('LEVEL_UPDATE', 'AssessmentLevel', id, { isActive });

        return { success: true };
    } catch (error) {
        console.error('Failed to toggle assessment level status:', error);
        return { success: false, error: 'Failed to toggle status' };
    }
}
