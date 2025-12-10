'use server';

import { prisma, findResponsesByAssessment } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { AssessmentResponse } from '@/types/assessment';

/**
 * Get all responses for an assessment
 */
export async function getResponsesByAssessment(assessmentId: string): Promise<AssessmentResponse[]> {
  try {
    const responses = await findResponsesByAssessment(assessmentId);

    return responses.map((r) => ({
      id: r.id,
      assessmentId: r.assessmentId,
      questionId: r.questionId,
      questionTitle: r.question.questionTitle,
      questionWeight: r.question.weight,
      scoreSelf: r.scoreSelf || undefined,
      scoreMgr: r.scoreMgr || undefined,
      scoreAppr2: r.scoreAppr2 || undefined,
      scoreGm: r.scoreGm || undefined,
      commentSelf: r.commentSelf || undefined,
      commentMgr: r.commentMgr || undefined,
      commentAppr2: r.commentAppr2 || undefined,
      commentGm: r.commentGm || undefined,
      rating: r.scoreSelf || 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
}

/**
 * Get single response by ID
 */
export async function getResponse(id: string) {
  try {
    const r = await prisma.assessmentResponse.findUnique({
      where: { id },
      include: { question: true },
    });

    if (!r) {
      return { success: false, error: 'Response not found' };
    }

    return {
      success: true,
      data: {
        id: r.id,
        assessmentId: r.assessmentId,
        questionId: r.questionId,
        questionTitle: r.question.questionTitle,
        questionWeight: r.question.weight,
        scoreSelf: r.scoreSelf || undefined,
        scoreMgr: r.scoreMgr || undefined,
        scoreAppr2: r.scoreAppr2 || undefined,
        scoreGm: r.scoreGm || undefined,
        commentSelf: r.commentSelf || undefined,
        commentMgr: r.commentMgr || undefined,
        commentAppr2: r.commentAppr2 || undefined,
        commentGm: r.commentGm || undefined,
        rating: r.scoreSelf || 0,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching response:', error);
    return { success: false, error: 'Failed to fetch response' };
  }
}

/**
 * Create a new response
 */
export async function createResponse(data: Omit<AssessmentResponse, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    await prisma.assessmentResponse.create({
      data: {
        assessmentId: data.assessmentId,
        questionId: data.questionId,
        questionTitle: data.questionTitle || '',
        questionWeight: data.questionWeight || 0,
        scoreSelf: data.scoreSelf || null,
        scoreMgr: data.scoreMgr || null,
        scoreAppr2: data.scoreAppr2 || null,
        scoreAppr3: (data as any).scoreAppr3 || null,
        scoreGm: data.scoreGm || null,
        commentSelf: data.commentSelf || null,
        commentMgr: data.commentMgr || null,
        commentAppr2: data.commentAppr2 || null,
        commentAppr3: (data as any).commentAppr3 || null,
        commentGm: data.commentGm || null,
      },
    });
    
    revalidatePath(`/dashboard/assessments/${data.assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating response:', error);
    return { success: false, error: 'Failed to create response' };
  }
}

/**
 * Update an existing response
 */
export async function updateResponse(id: string, data: Partial<AssessmentResponse>) {
  try {
    const updateData: any = {};
    
    if (data.scoreSelf !== undefined) updateData.scoreSelf = data.scoreSelf;
    if (data.scoreMgr !== undefined) updateData.scoreMgr = data.scoreMgr;
    if (data.scoreAppr2 !== undefined) updateData.scoreAppr2 = data.scoreAppr2;
    if (data.scoreGm !== undefined) updateData.scoreGm = data.scoreGm;
    if (data.commentSelf !== undefined) updateData.commentSelf = data.commentSelf || null;
    if (data.commentMgr !== undefined) updateData.commentMgr = data.commentMgr || null;
    if (data.commentAppr2 !== undefined) updateData.commentAppr2 = data.commentAppr2 || null;
    if (data.commentGm !== undefined) updateData.commentGm = data.commentGm || null;

    await prisma.assessmentResponse.update({
      where: { id },
      data: updateData,
    });
    
    if (data.assessmentId) {
      revalidatePath(`/dashboard/assessments/${data.assessmentId}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating response:', error);
    return { success: false, error: 'Failed to update response' };
  }
}

/**
 * Delete a response
 */
export async function deleteResponse(id: string) {
  try {
    const response = await prisma.assessmentResponse.findUnique({
      where: { id },
    });

    if (!response) {
      return { success: false, error: 'Response not found' };
    }

    await prisma.assessmentResponse.delete({
      where: { id },
    });
    
    revalidatePath(`/dashboard/assessments/${response.assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting response:', error);
    return { success: false, error: 'Failed to delete response' };
  }
}

/**
 * Bulk create or update responses
 */
export async function saveResponses(
  assessmentId: string,
  responses: Array<{
    questionId: string;
    questionTitle: string;
    questionWeight: number;
    scoreSelf?: number | null;
    commentSelf?: string | null;
    scoreMgr?: number | null;
    commentMgr?: string | null;
    scoreAppr2?: number | null;
    commentAppr2?: string | null;
    scoreGm?: number | null;
    commentGm?: string | null;
  }>
) {
  try {
    // Use transaction for bulk operations
    await prisma.$transaction(
      responses.map((response) => {
        return prisma.assessmentResponse.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId,
              questionId: response.questionId,
            },
          },
          create: {
            assessmentId,
            questionId: response.questionId,
            questionTitle: response.questionTitle || '',
            questionWeight: response.questionWeight || 0,
            scoreSelf: response.scoreSelf || null,
            commentSelf: response.commentSelf || null,
            scoreMgr: response.scoreMgr || null,
            commentMgr: response.commentMgr || null,
            scoreAppr2: response.scoreAppr2 || null,
            commentAppr2: response.commentAppr2 || null,
            scoreAppr3: (response as any).scoreAppr3 || null,
            commentAppr3: (response as any).commentAppr3 || null,
            scoreGm: response.scoreGm || null,
            commentGm: response.commentGm || null,
          },
          update: {
            scoreSelf: response.scoreSelf !== undefined ? response.scoreSelf : undefined,
            commentSelf: response.commentSelf !== undefined ? response.commentSelf : undefined,
            scoreMgr: response.scoreMgr !== undefined ? response.scoreMgr : undefined,
            commentMgr: response.commentMgr !== undefined ? response.commentMgr : undefined,
            scoreAppr2: response.scoreAppr2 !== undefined ? response.scoreAppr2 : undefined,
            commentAppr2: response.commentAppr2 !== undefined ? response.commentAppr2 : undefined,
            scoreAppr3: (response as any).scoreAppr3 !== undefined ? (response as any).scoreAppr3 : undefined,
            commentAppr3: (response as any).commentAppr3 !== undefined ? (response as any).commentAppr3 : undefined,
            scoreGm: response.scoreGm !== undefined ? response.scoreGm : undefined,
            commentGm: response.commentGm !== undefined ? response.commentGm : undefined,
          },
        });
      })
    );

    // Calculate and update assessment total score
    await updateAssessmentScore(assessmentId);
    
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving responses:', error);
    return { success: false, error: 'Failed to save responses' };
  }
}

/**
 * Calculate and update assessment total score
 */
async function updateAssessmentScore(assessmentId: string) {
  try {
    const responses = await prisma.assessmentResponse.findMany({
      where: { assessmentId },
      include: { question: true },
    });

    let totalScore = 0;
    let totalWeight = 0;

    responses.forEach((response) => {
      const score = response.scoreSelf || 0;
      const weight = response.question.weight;
      totalScore += score * weight;
      totalWeight += weight;
    });

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { score: finalScore },
    });
  } catch (error) {
    console.error('Error updating assessment score:', error);
  }
}

/**
 * Delete all responses for an assessment
 */
export async function deleteAssessmentResponses(assessmentId: string) {
  try {
    await prisma.assessmentResponse.deleteMany({
      where: { assessmentId },
    });
    
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment responses:', error);
    return { success: false, error: 'Failed to delete responses' };
  }
}

/**
 * Get response statistics for an assessment
 */
export async function getResponseStats(assessmentId: string) {
  try {
    const responses = await prisma.assessmentResponse.findMany({
      where: { assessmentId },
      include: { question: true },
    });

    const totalQuestions = responses.length;
    const completedResponses = responses.filter((r) => r.scoreSelf !== null).length;
    const avgScore = responses.reduce((sum, r) => sum + (r.scoreSelf || 0), 0) / totalQuestions || 0;

    return {
      success: true,
      data: {
        totalQuestions,
        completedResponses,
        pendingResponses: totalQuestions - completedResponses,
        completionRate: totalQuestions > 0 ? (completedResponses / totalQuestions) * 100 : 0,
        avgScore,
      },
    };
  } catch (error) {
    console.error('Error fetching response stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
