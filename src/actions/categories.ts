'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

/**
 * Helper to get current user
 */
async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}

export type AssessmentCategoryResult = {
    success: boolean;
    error?: string;
    data?: any;
};

// Initial Categories for lazy seeding
const INITIAL_CATEGORIES = [
    "Technical Knowledge",
    "Responsibility",
    "Collaboration",
    "Communication",
    "Problem Solving",
    "Leadership",
    "Discipline",
    "Quality"
];

/**
 * Get all assessment categories
 */
export async function getAssessmentCategories() {
    try {
        const categories = await prisma.assessmentCategory.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        return categories;
    } catch (error) {
        console.error('Failed to fetch assessment categories:', error);
        return [];
    }
}

/**
 * Create a new assessment category
 */
export async function createAssessmentCategory(data: {
    name: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
    // Dual Language
    nameTh?: string;
    nameJa?: string;
    descriptionTh?: string;
    descriptionJa?: string;
}): Promise<AssessmentCategoryResult> {
    try {
        const user = await getCurrentUser();
        const currentUser = user as any;
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'HR' && currentUser.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        const existing = await prisma.assessmentCategory.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return { success: false, error: 'Category name already exists' };
        }

        const result = await prisma.assessmentCategory.create({
            data,
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('CATEGORY_CREATE', 'AssessmentCategory', result.id, { name: data.name });

        return { success: true };
    } catch (error) {
        console.error('Failed to create assessment category:', error);
        return { success: false, error: 'Failed to create assessment category' };
    }
}

/**
 * Update an assessment category
 */
export async function updateAssessmentCategory(
    id: string,
    data: {
        name?: string;
        description?: string;
        sortOrder?: number;
        isActive?: boolean;
        // Dual Language
        nameTh?: string;
        nameJa?: string;
        descriptionTh?: string;
        descriptionJa?: string;
    }
): Promise<AssessmentCategoryResult> {
    try {
        const user = await getCurrentUser();
        const currentUser = user as any;
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'HR' && currentUser.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        const currentCategory = await prisma.assessmentCategory.findUnique({
            where: { id },
        });

        if (!currentCategory) {
            return { success: false, error: 'Category not found' };
        }

        // Check name uniqueness if changing name
        if (data.name && data.name !== currentCategory.name) {
            const existing = await prisma.assessmentCategory.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                return { success: false, error: 'Category name already exists' };
            }
        }

        // If Name is changing, cascade update to Questions (Soft Link)
        if (data.name && data.name !== currentCategory.name) {
            await prisma.$transaction([
                prisma.assessmentCategory.update({
                    where: { id },
                    data,
                }),
                prisma.assessmentQuestion.updateMany({
                    where: { category: currentCategory.name },
                    data: { category: data.name }
                })
            ]);
        } else {
            await prisma.assessmentCategory.update({
                where: { id },
                data,
            });
        }

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('CATEGORY_UPDATE', 'AssessmentCategory', id, { changes: data });

        return { success: true };
    } catch (error) {
        console.error('Failed to update assessment category:', error);
        return { success: false, error: 'Failed to update assessment category' };
    }
}

/**
 * Delete an assessment category
 */
export async function deleteAssessmentCategory(id: string): Promise<AssessmentCategoryResult> {
    try {
        const user = await getCurrentUser();
        const currentUser = user as any;
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'HR' && currentUser.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        const category = await prisma.assessmentCategory.findUnique({
            where: { id },
        });

        if (!category) {
            return { success: false, error: 'Category not found' };
        }

        // Check if used in questions
        const usedCount = await prisma.assessmentQuestion.count({
            where: { category: category.name }
        });

        if (usedCount > 0) {
            return { success: false, error: `Cannot delete category used by ${usedCount} questions. Please reassign them first.` };
        }

        const target = await prisma.assessmentCategory.findUnique({ where: { id } });

        await prisma.assessmentCategory.delete({
            where: { id },
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        if (target) await logAudit('CATEGORY_DELETE', 'AssessmentCategory', id, { name: target.name });

        return { success: true };
    } catch (error) {
        console.error('Failed to delete assessment category:', error);
        return { success: false, error: 'Failed to delete assessment category' };
    }
}

/**
 * Delete multiple assessment categories (Bulk Delete)
 */
export async function deleteAssessmentCategories(ids: string[]): Promise<AssessmentCategoryResult> {
    try {
        const user = await getCurrentUser();
        const currentUser = user as any;
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'HR' && currentUser.role !== 'MANAGER')) {
            return { success: false, error: 'Unauthorized' };
        }

        // Sanity Check: Ensure no category is used
        // Get names of categories to be deleted
        const categoriesToDelete = await prisma.assessmentCategory.findMany({
            where: { id: { in: ids } },
            select: { name: true }
        });

        const names = categoriesToDelete.map(c => c.name);

        const usedCount = await prisma.assessmentQuestion.count({
            where: { category: { in: names } }
        });

        if (usedCount > 0) {
            return {
                success: false,
                error: `Cannot delete categories because ${usedCount} questions are linked to them. Please reassign questions first.`
            };
        }

        const result = await prisma.assessmentCategory.deleteMany({
            where: { id: { in: ids } },
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('CATEGORY_DELETE', 'AssessmentCategory', 'BULK', { count: result.count, names });

        return { success: true, data: { count: result.count } };
    } catch (error) {
        console.error('Failed to delete assessment categories:', error);
        return { success: false, error: 'Failed to delete assessment categories' };
    }
}

/**
 * Toggle category active status
 */
export async function toggleAssessmentCategoryStatus(id: string): Promise<AssessmentCategoryResult> {
    try {
        const category = await prisma.assessmentCategory.findUnique({
            where: { id },
        });

        if (!category) {
            return { success: false, error: 'Category not found' };
        }

        await prisma.assessmentCategory.update({
            where: { id },
            data: { isActive: !category.isActive }
        });

        revalidatePath('/dashboard/settings/assessment-questions');

        // [AUDIT LOG]
        await logAudit('CATEGORY_UPDATE', 'AssessmentCategory', id, { isActive: !category.isActive });

        return { success: true };
    } catch (error) {
        console.error('Failed to toggle category status:', error);
        return { success: false, error: 'Failed to toggle status' };
    }
}
