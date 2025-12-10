'use server';

import { prisma, findQuestionsByLevel, findQuestionsByCategory } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { AssessmentQuestion } from '@/types/assessment';

/**
 * Get all questions with optional filters
 */
export async function getQuestions(params?: { 
  level?: string; 
  category?: string;
  isActive?: boolean;
}): Promise<AssessmentQuestion[]> {
  try {
    const where: any = {};
    
    if (params?.level) where.applicableLevel = params.level;
    if (params?.category) where.category = params.category;
    if (params?.isActive !== undefined) where.isActive = params.isActive;

    const questions = await prisma.assessmentQuestion.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
      ],
    });

    return questions.map((q) => ({
      id: q.id,
      questionTitle: q.questionTitle,
      description: q.description || '',
      category: q.category as AssessmentQuestion['category'],
      weight: q.weight,
      maxScore: q.maxScore,
      order: q.order,
      isActive: q.isActive,
      applicableLevel: q.applicableLevel as AssessmentQuestion['applicableLevel'],
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error('Failed to fetch questions');
  }
}

/**
 * Get questions by assessment level
 */
export async function getQuestionsByLevel(level: string): Promise<AssessmentQuestion[]> {
  try {
    const questions = await findQuestionsByLevel(level);

    return questions.map((q) => ({
      id: q.id,
      questionTitle: q.questionTitle,
      description: q.description || '',
      category: q.category as AssessmentQuestion['category'],
      weight: q.weight,
      maxScore: q.maxScore,
      order: q.order,
      isActive: q.isActive,
      applicableLevel: q.applicableLevel as AssessmentQuestion['applicableLevel'],
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching questions by level:', error);
    throw new Error('Failed to fetch questions by level');
  }
}

/**
 * Get questions by category
 */
export async function getQuestionsByCategory(category: string): Promise<AssessmentQuestion[]> {
  try {
    const questions = await findQuestionsByCategory(category);

    return questions.map((q) => ({
      id: q.id,
      questionTitle: q.questionTitle,
      description: q.description || '',
      category: q.category as AssessmentQuestion['category'],
      weight: q.weight,
      maxScore: q.maxScore,
      order: q.order,
      isActive: q.isActive,
      applicableLevel: q.applicableLevel as AssessmentQuestion['applicableLevel'],
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    return [];
  }
}

/**
 * Get single question by ID
 */
export async function getQuestion(id: string) {
  try {
    const q = await prisma.assessmentQuestion.findUnique({
      where: { id },
    });

    if (!q) {
      return { success: false, error: 'Question not found' };
    }

    return {
      success: true,
      data: {
        id: q.id,
        questionTitle: q.questionTitle,
        description: q.description || '',
        category: q.category,
        weight: q.weight,
        maxScore: q.maxScore,
        order: q.order,
        isActive: q.isActive,
        applicableLevel: q.applicableLevel,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    return { success: false, error: 'Failed to fetch question' };
  }
}

/**
 * Create a new question
 */
export async function createQuestion(data: Omit<AssessmentQuestion, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const result = await prisma.assessmentQuestion.create({
      data: {
        questionTitle: data.questionTitle,
        description: data.description || null,
        category: data.category,
        applicableLevel: data.applicableLevel,
        weight: data.weight,
        maxScore: data.maxScore || 5,
        order: data.order,
        isActive: data.isActive !== false,
      },
    });
    
    revalidatePath('/admin/questions');
    revalidatePath('/dashboard/questions');
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating question:', error);
    return { success: false, error: 'Failed to create question' };
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(id: string, data: Partial<AssessmentQuestion>) {
  try {
    const updateData: any = {};
    
    if (data.questionTitle !== undefined) updateData.questionTitle = data.questionTitle;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.applicableLevel !== undefined) updateData.applicableLevel = data.applicableLevel;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.assessmentQuestion.update({
      where: { id },
      data: updateData,
    });
    
    revalidatePath('/admin/questions');
    revalidatePath('/dashboard/questions');
    return { success: true };
  } catch (error) {
    console.error('Error updating question:', error);
    return { success: false, error: 'Failed to update question' };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string) {
  try {
    await prisma.assessmentQuestion.delete({
      where: { id },
    });
    
    revalidatePath('/admin/questions');
    revalidatePath('/dashboard/questions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: 'Failed to delete question' };
  }
}

/**
 * Toggle question active status
 */
export async function toggleQuestionStatus(id: string) {
  try {
    const question = await prisma.assessmentQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    await prisma.assessmentQuestion.update({
      where: { id },
      data: { isActive: !question.isActive },
    });
    
    revalidatePath('/admin/questions');
    revalidatePath('/dashboard/questions');
    return { success: true };
  } catch (error) {
    console.error('Error toggling question status:', error);
    return { success: false, error: 'Failed to toggle question status' };
  }
}

/**
 * Get question statistics
 */
export async function getQuestionStats() {
  try {
    const total = await prisma.assessmentQuestion.count();
    const active = await prisma.assessmentQuestion.count({
      where: { isActive: true },
    });

    const byCategory = await prisma.assessmentQuestion.groupBy({
      by: ['category'],
      _count: true,
    });

    const byLevel = await prisma.assessmentQuestion.groupBy({
      by: ['applicableLevel'],
      _count: true,
    });

    return {
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byLevel: byLevel.reduce((acc, item) => {
          acc[item.applicableLevel] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
