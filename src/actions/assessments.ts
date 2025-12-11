'use server';

import { prisma, findAssessmentById, findAssessmentsByEmployee, findAssessmentsByPeriod, findPendingAssessments } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Assessment } from '@/types';

/**
 * Get all assessments with optional filters
 */
export async function getAssessments(params?: {
  empCode?: string;
  status?: string;
  year?: number;
  quarter?: number;
}): Promise<Assessment[]> {
  try {
    const where: any = {};

    if (params?.empCode) where.employeeId = params.empCode;
    if (params?.status) where.status = params.status;
    if (params?.year && params?.quarter) {
      const startDate = new Date(params.year, (params.quarter - 1) * 3, 1);
      const endDate = new Date(params.year, params.quarter * 3, 0);
      where.AND = [
        { periodStart: { gte: startDate } },
        { periodEnd: { lte: endDate } }
      ];
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        employee: true,
        assessor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title || '',
      description: assessment.description || undefined,
      type: assessment.assessmentType as Assessment['type'],
      assessmentType: assessment.assessmentType as Assessment['assessmentType'],
      status: assessment.status as Assessment['status'],
      employeeId: assessment.employeeId,
      assessorId: assessment.assessorId || '',
      targetLevel: assessment.targetLevel || undefined,
      isDraft: assessment.isDraft,
      periodStart: assessment.periodStart.toISOString(),
      periodEnd: assessment.periodEnd.toISOString(),
      dueDate: assessment.dueDate?.toISOString() || '',
      completedAt: assessment.completedAt?.toISOString() || undefined,
      score: assessment.score || undefined,
      finalScore: assessment.finalScore || undefined,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      submittedAt: assessment.submittedAt?.toISOString() || undefined,
      approvedAt: assessment.approvedAt?.toISOString() || undefined,
    }));
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw new Error('Failed to fetch assessments');
  }
}

/**
 * Get single assessment by ID
 */
export async function getAssessment(id: string) {
  try {
    const assessment = await findAssessmentById(id);

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    return {
      success: true,
      data: {
        id: assessment.id,
        title: assessment.title || '',
        description: assessment.description || undefined,
        type: assessment.assessmentType,
        assessmentType: assessment.assessmentType,
        status: assessment.status,
        employeeId: assessment.employeeId,
        assessorId: assessment.assessorId || '',
        periodStart: assessment.periodStart.toISOString(),
        periodEnd: assessment.periodEnd.toISOString(),
        dueDate: assessment.dueDate?.toISOString() || '',
        completedAt: assessment.completedAt?.toISOString() || undefined,
        score: assessment.score || undefined,
        finalScore: assessment.finalScore || undefined,
        createdAt: assessment.createdAt.toISOString(),
        updatedAt: assessment.updatedAt.toISOString(),
        submittedAt: assessment.submittedAt?.toISOString() || undefined,
        approvedAt: assessment.approvedAt?.toISOString() || undefined,
        employee: assessment.employee,
        responses: assessment.responses,
      },
    };
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return { success: false, error: 'Failed to fetch assessment' };
  }
}

/**
 * Create a new assessment
 */
export async function createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const result = await prisma.assessment.create({
      data: {
        title: data.title,
        description: data.description || null,
        assessmentType: data.assessmentType || data.type,
        status: data.status || 'Pending',
        employeeId: data.employeeId,
        assessorId: data.assessorId || null,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath('/admin/assessments');
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating assessment:', error);
    return { success: false, error: 'Failed to create assessment' };
  }
}

/**
 * Update an existing assessment
 */
export async function updateAssessment(id: string, data: Partial<Assessment>) {
  try {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.finalScore !== undefined) updateData.finalScore = data.finalScore;
    if (data.completedAt !== undefined) updateData.completedAt = new Date(data.completedAt);
    if (data.submittedAt !== undefined) updateData.submittedAt = new Date(data.submittedAt);
    if (data.approvedAt !== undefined) updateData.approvedAt = new Date(data.approvedAt);

    const updated = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        assessor: true,
      },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath('/admin/assessments');
    revalidatePath(`/dashboard/assessments/${id}`);

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title || '',
        description: updated.description || undefined,
        type: updated.assessmentType,
        assessmentType: updated.assessmentType,
        status: updated.status,
        employeeId: updated.employeeId,
        assessorId: updated.assessorId || '',
        periodStart: updated.periodStart.toISOString(),
        periodEnd: updated.periodEnd.toISOString(),
        dueDate: updated.dueDate?.toISOString() || '',
        completedAt: updated.completedAt?.toISOString() || undefined,
        score: updated.score || undefined,
        finalScore: updated.finalScore || undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating assessment:', error);
    return { success: false, error: 'Failed to update assessment' };
  }
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(id: string) {
  try {
    await prisma.assessment.delete({
      where: { id },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath('/admin/assessments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return { success: false, error: 'Failed to delete assessment' };
  }
}

/**
 * Get assessments by employee
 */
export async function getAssessmentsByEmployee(empCode: string) {
  try {
    const assessments = await findAssessmentsByEmployee(empCode);
    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title || '',
      type: assessment.assessmentType,
      status: assessment.status,
      assessmentDate: assessment.createdAt.toISOString(),
      totalScore: assessment.score,
      finalScore: assessment.finalScore,
    }));
  } catch (error) {
    console.error('Error fetching assessments by employee:', error);
    return [];
  }
}

/**
 * Get pending assessments
 */
export async function getPendingAssessments() {
  try {
    const assessments = await findPendingAssessments();
    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title || '',
      employeeId: assessment.employeeId,
      employeeName: assessment.employee.empName_Eng,
      dueDate: assessment.dueDate?.toISOString(),
      status: assessment.status,
    }));
  } catch (error) {
    console.error('Error fetching pending assessments:', error);
    return [];
  }
}

/**
 * Submit assessment
 */
export async function submitAssessment(id: string) {
  try {
    await prisma.assessment.update({
      where: { id },
      data: {
        status: 'Submitted',
        submittedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Complete assessment with final score (legacy function)
 */
export async function completeAssessmentScoring(id: string, finalScore: number) {
  try {
    await prisma.assessment.update({
      where: { id },
      data: {
        status: 'Completed',
        finalScore,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, error: 'Failed to complete assessment' };
  }
}

/**
 * Get assessment statistics
 */
export async function getAssessmentStats(year?: number, quarter?: number) {
  try {
    const where: any = {};
    if (year) where.assessmentYear = year;
    if (quarter) where.assessmentQuarter = quarter;

    const total = await prisma.assessment.count({ where });

    const byStatus = await prisma.assessment.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const avgScore = await prisma.assessment.aggregate({
      where: {
        ...where,
        status: 'Completed',
      },
      _avg: {
        score: true,
        finalScore: true,
      },
    });

    return {
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        avgScore: avgScore._avg.score || 0,
        avgFinalScore: avgScore._avg.finalScore || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching assessment stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

/**
 * Create assessment as draft (Admin function)
 */
export async function createAssessmentDraft(data: {
  title: string;
  description?: string;
  assessmentType: string;
  targetLevel: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  assessorId: string;
}) {
  try {
    const assessment = await prisma.assessment.create({
      data: {
        title: data.title,
        description: data.description || null,
        assessmentType: data.assessmentType,
        targetLevel: data.targetLevel,
        status: 'Draft',
        isDraft: true,
        employeeId: data.assessorId, // Use assessor as temporary employee for draft
        assessorId: data.assessorId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        dueDate: data.dueDate,
      },
    });

    revalidatePath('/dashboard/assessments');
    return { success: true, id: assessment.id };
  } catch (error) {
    console.error('Error creating assessment draft:', error);
    return { success: false, error: 'Failed to create assessment draft' };
  }
}

/**
 * Assign assessment to employees based on target level
 */
export async function assignAssessmentToEmployees(assessmentId: string) {
  try {
    // Get the draft assessment
    const draft = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!draft || !draft.isDraft) {
      return { success: false, error: 'Assessment not found or not a draft' };
    }

    // Find all active employees matching the target level
    if (!draft.targetLevel) {
      return { success: false, error: 'Target level not specified' };
    }

    const employees = await prisma.employee.findMany({
      where: {
        assessmentLevel: draft.targetLevel,
        isActive: true,
      },
    });

    if (employees.length === 0) {
      return { success: false, error: 'No employees found for this assessment level' };
    }

    // Create assessment instances for each employee
    const assessments = await Promise.all(
      employees.map(async (employee) => {
        return prisma.assessment.create({
          data: {
            title: draft.title,
            description: draft.description,
            assessmentType: draft.assessmentType,
            targetLevel: draft.targetLevel,
            status: 'Assigned',
            isDraft: false,
            employeeId: employee.empCode,
            assessorId: draft.assessorId,
            periodStart: draft.periodStart,
            periodEnd: draft.periodEnd,
            dueDate: draft.dueDate,
            assignedAt: new Date(),
          },
        });
      })
    );

    // Create notifications for each employee
    await Promise.all(
      employees.map(async (employee) => {
        return prisma.notification.create({
          data: {
            userId: employee.empCode,
            type: 'AssessmentAssigned',
            title: 'New Assessment Assigned',
            message: `You have been assigned a new assessment: ${draft.title}`,
            assessmentId: assessmentId,
            link: `/dashboard/assessments/${assessmentId}`,
          },
        });
      })
    );

    // Update the draft to mark it as assigned
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'Assigned',
        assignedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/assessments');
    return {
      success: true,
      count: assessments.length,
      message: `Assessment assigned to ${assessments.length} employees`
    };
  } catch (error) {
    console.error('Error assigning assessment:', error);
    return { success: false, error: 'Failed to assign assessment' };
  }
}

/**
 * Submit self assessment (employee starts approval flow)
 */
export async function submitSelfAssessment(assessmentId: string, responses: any[]) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    const employee = await prisma.employee.findUnique({
      where: { empCode: assessment.employeeId },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // Save all responses
    await Promise.all(
      responses.map(async (response) => {
        return prisma.assessmentResponse.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId: assessmentId,
              questionId: response.questionId,
            },
          },
          create: {
            assessmentId: assessmentId,
            questionId: response.questionId,
            questionTitle: response.questionTitle,
            questionWeight: response.questionWeight,
            scoreSelf: response.score,
            commentSelf: response.comment,
          },
          update: {
            scoreSelf: response.score,
            commentSelf: response.comment,
          },
        });
      })
    );

    // Determine next stage - check if employee has Approver 1
    const nextStage = employee.approver1_ID ? 'PendingApprover1' : 'PendingManager';
    const nextPerson = employee.approver1_ID || employee.manager_ID; // If no Approver1, go to Manager

    // Update assessment status
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: nextStage,
        currentStage: nextPerson,
        submittedAt: new Date(),
        approver1Status: employee.approver1_ID ? 'Pending' : undefined,
      },
    });

    // Create notification for next approver
    if (nextPerson) {
      await prisma.notification.create({
        data: {
          userId: nextPerson,
          type: 'ApprovalRequired',
          title: 'Assessment Approval Required',
          message: `${employee.empName_Eng} has submitted an assessment for your review`,
          assessmentId: assessmentId,
          link: `/dashboard/assessments/${assessmentId}/approve`,
        },
      });
    }

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);

    return { success: true, message: 'Assessment submitted successfully' };
  } catch (error) {
    console.error('Error submitting self assessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Approve assessment (dynamic approval chain)
 */
export async function approveAssessment(
  assessmentId: string,
  stage: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'md',
  note?: string
) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    const employee = assessment.employee;
    let nextStage = '';
    let nextPerson: string | null = null;
    let nextStatus = '';
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Determine next stage based on current stage
    if (stage === 'approver1') {
      updateData.approver1Status = 'Approved';
      updateData.approver1Date = new Date();
      updateData.approver1Note = note;

      // Check if employee has approver2
      if (employee.approver2_ID) {
        nextStage = 'PendingApprover2';
        nextPerson = employee.approver2_ID;
        updateData.approver2Status = 'Pending';
      } else {
        // Skip to manager
        nextStage = 'PendingManager';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      }
    } else if (stage === 'approver2') {
      updateData.approver2Status = 'Approved';
      updateData.approver2Date = new Date();
      updateData.approver2Note = note;

      // Check if employee has approver3
      if (employee.approver3_ID) {
        nextStage = 'PendingApprover3';
        nextPerson = employee.approver3_ID;
        updateData.approver3Status = 'Pending';
      } else {
        // Skip to manager
        nextStage = 'PendingManager';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      }
    } else if (stage === 'approver3') {
      updateData.approver3Status = 'Approved';
      updateData.approver3Date = new Date();
      updateData.approver3Note = note;

      // Go to manager
      nextStage = 'PendingManager';
      nextPerson = employee.manager_ID;
      updateData.managerStatus = 'Pending';
    } else if (stage === 'manager') {
      updateData.managerStatus = 'Approved';
      updateData.managerDate = new Date();
      updateData.managerNote = note;

      // Go to MD
      nextStage = 'PendingMD';
      nextPerson = employee.gm_ID;
      updateData.mdStatus = 'Pending';
    } else if (stage === 'md') {
      updateData.mdStatus = 'Approved';
      updateData.mdDate = new Date();
      updateData.mdNote = note;

      // Complete
      nextStage = 'Completed';
      nextPerson = null;
      updateData.completedAt = new Date();
    }

    updateData.status = nextStage;
    updateData.currentStage = nextPerson;

    // Update assessment
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData,
    });

    // Create notification for next person or employee if completed
    if (nextPerson) {
      await prisma.notification.create({
        data: {
          userId: nextPerson,
          type: 'ApprovalRequired',
          title: 'Assessment Approval Required',
          message: `Assessment for ${employee.empName_Eng} requires your approval`,
          assessmentId: assessmentId,
          link: `/dashboard/assessments/${assessmentId}/approve`,
        },
      });
    } else if (nextStage === 'Completed') {
      // Notify employee of completion
      await prisma.notification.create({
        data: {
          userId: employee.empCode,
          type: 'Approved',
          title: 'Assessment Completed',
          message: 'Your assessment has been fully approved and completed',
          assessmentId: assessmentId,
          link: `/dashboard/assessments/${assessmentId}/summary`,
        },
      });
    }

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);

    return { success: true, message: 'Assessment approved successfully' };
  } catch (error) {
    console.error('Error approving assessment:', error);
    return { success: false, error: 'Failed to approve assessment' };
  }
}

/**
 * Reject assessment (returns to employee for revision)
 */
export async function rejectAssessment(
  assessmentId: string,
  stage: string,
  reason: string
) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    // Update assessment to rejected state
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'Rejected',
        rejectionStage: stage,
        rejectionReason: reason,
        currentStage: assessment.employeeId,
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: assessment.employeeId,
        type: 'Rejected',
        title: 'Assessment Rejected',
        message: `Your assessment has been rejected. Reason: ${reason}`,
        assessmentId: assessmentId,
        link: `/dashboard/assessments/${assessmentId}`,
      },
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);

    return { success: true, message: 'Assessment rejected' };
  } catch (error) {
    console.error('Error rejecting assessment:', error);
    return { success: false, error: 'Failed to reject assessment' };
  }
}
