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
      scoreAppr1: r.scoreAppr1 || undefined,
      scoreAppr2: r.scoreAppr2 || undefined,
      scoreAppr3: r.scoreAppr3 || undefined,
      scoreMgr: r.scoreMgr || undefined,
      scoreGm: r.scoreGm || undefined,
      commentSelf: r.commentSelf || undefined,
      commentAppr1: r.commentAppr1 || undefined,
      commentAppr2: r.commentAppr2 || undefined,
      commentAppr3: r.commentAppr3 || undefined,
      commentMgr: r.commentMgr || undefined,
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
        scoreAppr1: data.scoreAppr1 || null,
        scoreAppr2: data.scoreAppr2 || null,
        scoreAppr3: data.scoreAppr3 || null,
        scoreMgr: data.scoreMgr || null,
        scoreGm: data.scoreGm || null,
        commentSelf: data.commentSelf || null,
        commentAppr1: data.commentAppr1 || null,
        commentAppr2: data.commentAppr2 || null,
        commentAppr3: data.commentAppr3 || null,
        commentMgr: data.commentMgr || null,
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
    if (data.scoreAppr1 !== undefined) updateData.scoreAppr1 = data.scoreAppr1;
    if (data.scoreAppr2 !== undefined) updateData.scoreAppr2 = data.scoreAppr2;
    if (data.scoreAppr3 !== undefined) updateData.scoreAppr3 = data.scoreAppr3;
    if (data.scoreMgr !== undefined) updateData.scoreMgr = data.scoreMgr;
    if (data.scoreGm !== undefined) updateData.scoreGm = data.scoreGm;

    if (data.commentSelf !== undefined) updateData.commentSelf = data.commentSelf || null;
    if (data.commentAppr1 !== undefined) updateData.commentAppr1 = data.commentAppr1 || null;
    if (data.commentAppr2 !== undefined) updateData.commentAppr2 = data.commentAppr2 || null;
    if (data.commentAppr3 !== undefined) updateData.commentAppr3 = data.commentAppr3 || null;
    if (data.commentMgr !== undefined) updateData.commentMgr = data.commentMgr || null;
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
    scoreAppr1?: number | null;
    scoreAppr2?: number | null;
    scoreAppr3?: number | null;
    scoreMgr?: number | null;
    scoreGm?: number | null;
    commentSelf?: string | null;
    commentAppr1?: string | null;
    commentAppr2?: string | null;
    commentAppr3?: string | null;
    commentMgr?: string | null;
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
            scoreAppr1: response.scoreAppr1 || null,
            scoreAppr2: response.scoreAppr2 || null,
            scoreAppr3: response.scoreAppr3 || null,
            scoreMgr: response.scoreMgr || null,
            scoreGm: response.scoreGm || null,
            commentSelf: response.commentSelf || null,
            commentAppr1: response.commentAppr1 || null,
            commentAppr2: response.commentAppr2 || null,
            commentAppr3: response.commentAppr3 || null,
            commentMgr: response.commentMgr || null,
            commentGm: response.commentGm || null,
          },
          update: {
            scoreSelf: response.scoreSelf !== undefined ? response.scoreSelf : undefined,
            scoreAppr1: response.scoreAppr1 !== undefined ? response.scoreAppr1 : undefined,
            scoreAppr2: response.scoreAppr2 !== undefined ? response.scoreAppr2 : undefined,
            scoreAppr3: response.scoreAppr3 !== undefined ? response.scoreAppr3 : undefined,
            scoreMgr: response.scoreMgr !== undefined ? response.scoreMgr : undefined,
            scoreGm: response.scoreGm !== undefined ? response.scoreGm : undefined,
            commentSelf: response.commentSelf !== undefined ? response.commentSelf : undefined,
            commentAppr1: response.commentAppr1 !== undefined ? response.commentAppr1 : undefined,
            commentAppr2: response.commentAppr2 !== undefined ? response.commentAppr2 : undefined,
            commentAppr3: response.commentAppr3 !== undefined ? response.commentAppr3 : undefined,
            commentMgr: response.commentMgr !== undefined ? response.commentMgr : undefined,
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
