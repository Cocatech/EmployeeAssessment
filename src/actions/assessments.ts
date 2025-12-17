'use server';

import { prisma, findAssessmentById, findAssessmentsByEmployee, findAssessmentsByPeriod, findPendingAssessments } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Assessment } from '@/types';
import { getMDConfig } from './settings';
import { logAudit } from '@/lib/audit';
import { auth } from '@/lib/auth';

/**
 * Get all assessments with optional filters
 */
export async function getAssessments(params?: {
  empCode?: string;
  status?: string;
  year?: number;
  quarter?: number;
  excludeAssignedDrafts?: boolean;
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

    // Filter out Assigned Drafts (Master Templates) if requested
    if (params?.excludeAssignedDrafts) {
      where.NOT = {
        AND: [
          { isDraft: true },
          { status: 'Assigned' }
        ]
      };
    }

    const assessments = await prisma.assessment.findMany({
      where,
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
 * Get paginated assessments
 */
export async function getAssessmentsPaginated(params?: {
  empCode?: string;
  status?: string;
  year?: number;
  quarter?: number;
  excludeAssignedDrafts?: boolean;
  page?: number;
  limit?: number;
  // Advanced filtering for Roles
  viewerId?: string;
  isAdmin?: boolean;
}) {
  try {
    const where: any = {};
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    // Role-based Access Control (Row Level Security logic)
    if (params?.viewerId && !params?.isAdmin) {
      const { getMDConfig } = await import('./settings');
      const mdCode = await getMDConfig();
      const isMD = mdCode === params.viewerId;

      where.OR = [
        { employeeId: params.viewerId }, // Own assessment
        { assessorId: params.viewerId }, // Is Assessor
        // Approver logic (using relation filter)
        {
          employee: {
            OR: [
              { manager_ID: params.viewerId },
              { approver1_ID: params.viewerId },
              { approver2_ID: params.viewerId },
              { approver3_ID: params.viewerId },
              { gm_ID: params.viewerId },
            ]
          }
        }
      ];

      // If user is MD, they should see assessments pending MD review
      if (isMD) {
        where.OR.push({ status: 'SUBMITTED_MD' });
        where.OR.push({ currentStage: mdCode });
      }


    } else if (params?.empCode) {
      // Admin specific filter
      where.employeeId = params.empCode;
    }

    if (params?.status) where.status = params.status;
    if (params?.year && params?.quarter) {
      const startDate = new Date(params.year, (params.quarter - 1) * 3, 1);
      const endDate = new Date(params.year, params.quarter * 3, 0);
      where.AND = [
        { periodStart: { gte: startDate } },
        { periodEnd: { lte: endDate } }
      ];
    }

    // Filter out Assigned Drafts (Master Templates) if requested
    // Logic: Admin sees all (except drafts if filtered), User sees only their scope
    if (params?.excludeAssignedDrafts) {
      // If NOT check for existing where.NOT, we might overwrite it.
      // But currently 'where' is fresh.
      where.NOT = {
        AND: [
          { isDraft: true },
          { status: 'Assigned' }
        ]
      };
    }

    const [total, assessments] = await Promise.all([
      prisma.assessment.count({ where }),
      prisma.assessment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    const serializedAssessments = assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title || '',
      description: assessment.description || undefined,
      type: assessment.assessmentType as Assessment['type'], // Type Assertion
      assessmentType: assessment.assessmentType as Assessment['assessmentType'],
      status: assessment.status as Assessment['status'],
      employeeId: assessment.employeeId,
      assessorId: assessment.assessorId || '',
      isDraft: assessment.isDraft,
      targetLevel: assessment.targetLevel || undefined,
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
      currentStage: assessment.currentStage || undefined,
    }));

    return {
      data: serializedAssessments,
      metadata: {
        total,
        page,
        limit,
        totalPages
      }
    };
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
    console.log('[DEBUG] getAssessment called with ID:', id);
    const assessment = await findAssessmentById(id);
    console.log('[DEBUG] findAssessmentById result:', assessment ? 'Found' : 'Not Found');

    if (!assessment) {
      console.log('[DEBUG] Assessment not found in DB');
      return { success: false, error: 'Assessment not found' };
    }

    // Fetch approver details
    const approverIds = [
      assessment.employee.approver1_ID,
      assessment.employee.approver2_ID,
      assessment.employee.approver3_ID,
      assessment.employee.approver3_ID,
      assessment.employee.manager_ID,
      assessment.employee.gm_ID
    ].filter(Boolean) as string[];

    // Fetch MD Config to get MD Name
    const mdEmpCode = await getMDConfig();
    if (mdEmpCode && !approverIds.includes(mdEmpCode)) {
      approverIds.push(mdEmpCode);
    }

    const approvers = await prisma.employee.findMany({
      where: { empCode: { in: approverIds } },
      select: { empCode: true, empName_Eng: true, position: true }
    });

    const approverMap = new Map(approvers.map(a => [a.empCode, a]));

    const enhancedEmployee = {
      ...assessment.employee,
      approver1_Name: assessment.employee.approver1_ID ? approverMap.get(assessment.employee.approver1_ID!)?.empName_Eng : undefined,
      approver1_Position: assessment.employee.approver1_ID ? approverMap.get(assessment.employee.approver1_ID!)?.position : undefined,
      approver2_Name: assessment.employee.approver2_ID ? approverMap.get(assessment.employee.approver2_ID!)?.empName_Eng : undefined,
      approver2_Position: assessment.employee.approver2_ID ? approverMap.get(assessment.employee.approver2_ID!)?.position : undefined,
      approver3_Name: assessment.employee.approver3_ID ? approverMap.get(assessment.employee.approver3_ID!)?.empName_Eng : undefined,
      approver3_Position: assessment.employee.approver3_ID ? approverMap.get(assessment.employee.approver3_ID!)?.position : undefined,
      manager_Name: assessment.employee.manager_ID ? approverMap.get(assessment.employee.manager_ID!)?.empName_Eng : undefined,
      manager_Position: assessment.employee.manager_ID ? approverMap.get(assessment.employee.manager_ID!)?.position : undefined,
      gm_Name: assessment.employee.gm_ID ? approverMap.get(assessment.employee.gm_ID!)?.empName_Eng : undefined,
      md_Name: mdEmpCode ? approverMap.get(mdEmpCode)?.empName_Eng : undefined,
      md_Position: mdEmpCode ? approverMap.get(mdEmpCode)?.position : undefined,
      gm_Position: assessment.employee.gm_ID ? approverMap.get(assessment.employee.gm_ID!)?.position : undefined,
    };

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
        isDraft: assessment.isDraft,
        targetLevel: assessment.targetLevel || undefined,
        currentStage: assessment.currentStage,
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
        // Approver Comments
        approver1Good: assessment.approver1Good || undefined,
        approver1Improve: assessment.approver1Improve || undefined,
        approver2Good: assessment.approver2Good || undefined,
        approver2Improve: assessment.approver2Improve || undefined,
        approver3Good: assessment.approver3Good || undefined,
        approver3Improve: assessment.approver3Improve || undefined,
        // Manager Options
        managerAction: assessment.managerAction || undefined,
        managerReason: assessment.managerReason || undefined,
        // HR Review
        hrStatus: assessment.hrStatus || undefined,
        hrDate: assessment.hrDate?.toISOString() || undefined,
        hrNote: assessment.hrNote || undefined,

        // MD & Feedback
        mdStatus: assessment.mdStatus || undefined,
        mdDate: assessment.mdDate?.toISOString() || undefined,
        mdNote: assessment.mdNote || undefined,
        feedbackDate: assessment.feedbackDate?.toISOString() || undefined,

        // Dates for Approvers
        approver1Date: assessment.approver1Date?.toISOString() || undefined,
        approver2Date: assessment.approver2Date?.toISOString() || undefined,
        approver3Date: assessment.approver3Date?.toISOString() || undefined,

        // GM Confirmation
        gmStatus: assessment.gmStatus || undefined,
        gmDate: assessment.gmDate?.toISOString() || undefined,
        gmNote: assessment.gmNote || undefined,

        employee: enhancedEmployee,
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

    // [AUDIT LOG]
    await logAudit(
      'ASSESSMENT_CREATE',
      'Assessment',
      result.id,
      {
        title: result.title,
        type: result.assessmentType,
        target: result.employeeId
      }
    );

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

    // Approver Comments
    if (data.approver1Good !== undefined) updateData.approver1Good = data.approver1Good;
    if (data.approver1Improve !== undefined) updateData.approver1Improve = data.approver1Improve;
    if (data.approver2Good !== undefined) updateData.approver2Good = data.approver2Good;
    if (data.approver2Improve !== undefined) updateData.approver2Improve = data.approver2Improve;
    if (data.approver3Good !== undefined) updateData.approver3Good = data.approver3Good;
    if (data.approver3Improve !== undefined) updateData.approver3Improve = data.approver3Improve;

    // Manager Options
    if (data.managerAction !== undefined) updateData.managerAction = data.managerAction;
    if (data.managerReason !== undefined) updateData.managerReason = data.managerReason;

    // HR Review
    if (data.hrStatus !== undefined) updateData.hrStatus = data.hrStatus;
    if (data.hrNote !== undefined) updateData.hrNote = data.hrNote;
    if (data.hrDate !== undefined) updateData.hrDate = data.hrDate ? new Date(data.hrDate) : null;

    // MD Review
    if (data.mdStatus !== undefined) updateData.mdStatus = data.mdStatus;
    if (data.mdNote !== undefined) updateData.mdNote = data.mdNote;
    if (data.mdDate !== undefined) updateData.mdDate = data.mdDate ? new Date(data.mdDate) : null;

    // Feedback
    if (data.feedbackDate !== undefined) updateData.feedbackDate = data.feedbackDate ? new Date(data.feedbackDate) : null;

    // GM Confirmation
    if (data.gmStatus !== undefined) updateData.gmStatus = data.gmStatus;
    if (data.gmNote !== undefined) updateData.gmNote = data.gmNote;
    if (data.gmDate !== undefined) updateData.gmDate = data.gmDate ? new Date(data.gmDate) : null;

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
    // [AUDIT LOG] Fetch details before delete
    const assessmentToRemove = await prisma.assessment.findUnique({
      where: { id },
      select: { title: true, employeeId: true, status: true }
    });

    if (assessmentToRemove) {
      await logAudit(
        'ASSESSMENT_DELETE',
        'Assessment',
        id,
        {
          title: assessmentToRemove.title,
          ownerId: assessmentToRemove.employeeId,
          lastStatus: assessmentToRemove.status
        }
      );
    }

    // Delete related notifications first (since they are loose coupled)
    await prisma.notification.deleteMany({
      where: { assessmentId: id }
    });

    // Delete assessment (responses cascade automatically)
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
      assessmentType: assessment.assessmentType,
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

    // [AUDIT LOG]
    await logAudit(
      'ASSESSMENT_CREATE',
      'Assessment',
      assessment.id,
      {
        action: 'Draft Creation',
        title: assessment.title,
        type: assessment.assessmentType,
        targetLevel: assessment.targetLevel,
        creatorId: data.assessorId
      }
    );

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

    // Use transaction to ensure atomicity and consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create assessments
      const assessmentPromises = employees.map(employee =>
        tx.assessment.create({
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
        })
      );

      const newAssessments = await Promise.all(assessmentPromises);

      // 2. Create notifications
      const notificationPromises = employees.map(employee =>
        tx.notification.create({
          data: {
            userId: employee.empCode,
            type: 'AssessmentAssigned',
            title: 'New Assessment Assigned',
            message: `You have been assigned a new assessment: ${draft.title}`,
            assessmentId: assessmentId, // Link to original draft for reference, or should it be the new one? 
            // Ideally link to the *new* assessment ID, but that's hard in bulk map without index matching. 
            // For now, linking to list page is safer.
            link: `/dashboard/assessments`,
          },
        })
      );

      await Promise.all(notificationPromises);

      // 3. Mark draft as assigned
      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'Assigned',
          assignedAt: new Date(),
        },
      });

      return newAssessments;
    });

    revalidatePath('/dashboard/assessments');

    // [AUDIT LOG]
    await logAudit(
      'ASSESSMENT_ASSIGN', // Changed from CREATE to ASSIGN for clarity
      'Assessment',
      assessmentId,
      {
        action: 'Bulk Assignment',
        draftTitle: draft.title,
        targetLevel: draft.targetLevel,
        count: result.length
      }
    );

    return {
      success: true,
      count: result.length,
      message: `Assessment assigned to ${result.length} employees`
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

    // [AUDIT LOG]
    await logAudit(
      'ASSESSMENT_SUBMIT',
      'Assessment',
      assessmentId,
      {
        status: nextStage,
        nextStage: nextStage,
        nextPerson: nextPerson
      }
    );

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);

    return { success: true, message: 'Assessment submitted successfully' };
  } catch (error) {
    console.error('Error submitting self assessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Reject assessment
 */
export async function rejectAssessment(assessmentId: string, note?: string) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'REJECTED',
        updatedAt: new Date(),
        // We might want to clear currentStage or set it back to employee?
        currentStage: assessment.employeeId,
      },
    });

    // [AUDIT LOG]
    await logAudit(
      'ASSESSMENT_REJECT',
      'Assessment',
      assessmentId,
      {
        reason: note,
        rejectedFromStage: assessment.status
      }
    );

    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error rejecting assessment:', error);
    return { success: false, error: 'Failed to reject assessment' };
  }
}

/**
 * Approve assessment (dynamic approval chain)
 */
export async function approveAssessment(
  assessmentId: string,
  stage: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'hr' | 'md' | 'gm' | 'feedback',
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

      // Check if Approver 2 exists
      if (employee.approver2_ID) {
        nextStage = 'SUBMITTED_APPR2';
        nextPerson = employee.approver2_ID;
        updateData.approver2Status = 'Pending';
      } else if (employee.approver3_ID) {
        // Skip to Approver 3
        nextStage = 'SUBMITTED_APPR3';
        nextPerson = employee.approver3_ID;
        updateData.approver3Status = 'Pending';
      } else if (employee.manager_ID) {
        // Skip to Manager
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        // No approver 2, 3, or manager - go to HR
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
      }
    } else if (stage === 'approver2') {
      updateData.approver2Status = 'Approved';
      updateData.approver2Date = new Date();
      updateData.approver2Note = note;

      // Check if Approver 3 exists
      if (employee.approver3_ID) {
        nextStage = 'SUBMITTED_APPR3';
        nextPerson = employee.approver3_ID;
        updateData.approver3Status = 'Pending';
      } else if (employee.manager_ID) {
        // Skip to Manager
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        // No approver 3 or manager - go to HR
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
      }
    } else if (stage === 'approver3') {
      updateData.approver3Status = 'Approved';
      updateData.approver3Date = new Date();
      updateData.approver3Note = note;

      // Check if Manager exists and is not the same person as Approver 3 (optional optimization, but strict flow prefers explicit steps)
      // For now, we enforce the step if manager_ID is present to ensure the "Manager" role sign-off is recorded specifically.
      if (employee.manager_ID) {
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        // No manager - go to HR
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
      }
    } else if (stage === 'manager') {
      updateData.managerStatus = 'Approved';
      updateData.managerDate = new Date();
      updateData.managerNote = note;

      // Manager -> GM
      if (employee.gm_ID) {
        nextStage = 'SUBMITTED_GM';
        nextPerson = employee.gm_ID;
        updateData.gmStatus = 'Pending';
      } else {
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
      }

    } else if (stage === 'gm') {
      updateData.gmStatus = 'Approved';
      updateData.gmDate = new Date();
      updateData.gmNote = note;

      // GM -> HR
      nextStage = 'SUBMITTED_HR';
      updateData.hrStatus = 'Pending';

    } else if (stage === 'hr') {
      updateData.hrStatus = 'Approved';
      updateData.hrDate = new Date();
      updateData.hrNote = note;

      // HR -> MD
      const mdSetting = await prisma.systemSetting.findUnique({ where: { key: 'md_code' } });
      const mdId = mdSetting?.value;

      if (mdId) {
        nextStage = 'SUBMITTED_MD';
        nextPerson = mdId;
        updateData.mdStatus = 'Pending';
      } else {
        nextStage = 'FEEDBACK_REQUIRED';
        nextPerson = employee.manager_ID;
      }

    } else if (stage === 'md') {
      updateData.mdStatus = 'Approved';
      updateData.mdDate = new Date();
      updateData.mdNote = note;

      // MD -> Feedback
      nextStage = 'FEEDBACK_REQUIRED';
      nextPerson = employee.manager_ID;

    } else if (stage === 'feedback') {
      updateData.feedbackDate = new Date();

      // Feedback -> Employee Confirm
      nextStage = 'EMPLOYEE_ACKNOWLEDGE';
      nextPerson = employee.empCode;
      updateData.employeeFeedbackStatus = 'Pending';
    }

    updateData.status = nextStage;
    updateData.currentStage = nextPerson;

    // Update assessment
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData,
    });

    // [AUDIT LOG]
    let auditAction = 'ASSESSMENT_UPDATE';
    if (stage === 'approver1') auditAction = 'ASSESSMENT_APPROVE_APPR1';
    else if (stage === 'approver2') auditAction = 'ASSESSMENT_APPROVE_APPR2';
    else if (stage === 'approver3') auditAction = 'ASSESSMENT_APPROVE_APPR3';
    else if (stage === 'manager') auditAction = 'ASSESSMENT_APPROVE_MGR';
    else if (stage === 'hr') auditAction = 'ASSESSMENT_REVIEW_HR';
    else if (stage === 'md') auditAction = 'ASSESSMENT_REVIEW_MD';
    else if (stage === 'feedback') auditAction = 'ASSESSMENT_FEEDBACK';
    else if (stage === 'gm') auditAction = 'ASSESSMENT_CONFIRM_GM';

    await logAudit(
      auditAction as any,
      'Assessment',
      assessmentId,
      {
        stage: stage,
        status: nextStage,
        note: note,
        nextPerson: nextPerson
      }
    );

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
    } else if (nextStage === 'COMPLETED') {
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
 * Submit full assessment (Consolidated Action)
 * Saves comments, responses, and handles status transitions within a single transaction.
 */
export async function submitFullAssessment(payload: {
  assessmentId: string;
  responses: Array<{
    questionId: string;
    score?: number;
    comment?: string;
  }>;
  comments: {
    approver1Good?: string;
    approver1Improve?: string;
    approver2Good?: string;
    approver2Improve?: string;
    approver3Good?: string;
    approver3Improve?: string;
  };
  managerData?: {
    action: string;
    reason: string;
  };
  hrData?: {
    status: string;
    note: string;
  };
  gmData?: {
    status: string;
    note: string;
  };
  stage: 'self' | 'approver1' | 'approver2' | 'approver3' | 'manager' | 'hr' | 'md' | 'gm' | 'feedback';
}) {
  const { assessmentId, responses, comments, managerData, hrData, gmData, stage } = payload;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    const employee = assessment.employee;

    // determine next stage and update fields
    let nextStage = assessment.status;
    let nextPerson = assessment.currentStage;
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update Comment Fields
    if (stage === 'approver1') {
      if (comments.approver1Good !== undefined) updateData.approver1Good = comments.approver1Good;
      if (comments.approver1Improve !== undefined) updateData.approver1Improve = comments.approver1Improve;
    }
    if (stage === 'approver2') {
      if (comments.approver2Good !== undefined) updateData.approver2Good = comments.approver2Good;
      if (comments.approver2Improve !== undefined) updateData.approver2Improve = comments.approver2Improve;
    }
    if (stage === 'approver3') {
      if (comments.approver3Good !== undefined) updateData.approver3Good = comments.approver3Good;
      if (comments.approver3Improve !== undefined) updateData.approver3Improve = comments.approver3Improve;
    }
    if (stage === 'manager' && managerData) {
      updateData.managerAction = managerData.action;
      updateData.managerReason = managerData.reason;
    }
    if (stage === 'hr' && hrData) {
      updateData.hrStatus = hrData.status;
      updateData.hrNote = hrData.note;
    }
    if (stage === 'gm' && gmData) {
      updateData.gmStatus = gmData.status;
      updateData.gmNote = gmData.note;
    }

    // Determine Status Transitions
    if (stage === 'self') {
      // Logic for Employee Submission
      const nextP = employee.approver1_ID || employee.manager_ID;
      nextStage = employee.approver1_ID ? 'SUBMITTED_APPR1' : 'SUBMITTED_MGR';
      nextPerson = nextP;
      updateData.submittedAt = new Date();
      updateData.approver1Status = employee.approver1_ID ? 'Pending' : undefined;
    }
    // Logic for Approvers (Similar to approveAssessment but inline)
    else if (stage === 'approver1') {
      updateData.approver1Status = 'Approved';
      updateData.approver1Date = new Date();

      if (employee.approver2_ID) {
        nextStage = 'SUBMITTED_APPR2';
        nextPerson = employee.approver2_ID;
        updateData.approver2Status = 'Pending';
      } else if (employee.approver3_ID) {
        nextStage = 'SUBMITTED_APPR3';
        nextPerson = employee.approver3_ID;
        updateData.approver3Status = 'Pending';
      } else if (employee.manager_ID) {
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
        nextPerson = null; // HR Queue
      }
    } else if (stage === 'approver2') {
      updateData.approver2Status = 'Approved';
      updateData.approver2Date = new Date();

      if (employee.approver3_ID) {
        nextStage = 'SUBMITTED_APPR3';
        nextPerson = employee.approver3_ID;
        updateData.approver3Status = 'Pending';
      } else if (employee.manager_ID) {
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
        nextPerson = null;
      }
    } else if (stage === 'approver3') {
      updateData.approver3Status = 'Approved';
      updateData.approver3Date = new Date();

      if (employee.manager_ID) {
        nextStage = 'SUBMITTED_MGR';
        nextPerson = employee.manager_ID;
        updateData.managerStatus = 'Pending';
      } else {
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
        nextPerson = null;
      }
    } else if (stage === 'manager') {
      updateData.managerStatus = 'Approved';
      updateData.managerDate = new Date();

      // Manager -> GM
      if (employee.gm_ID) {
        nextStage = 'SUBMITTED_GM';
        nextPerson = employee.gm_ID;
        updateData.gmStatus = 'Pending';
      } else {
        // No GM -> HR
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
        nextPerson = null;
      }

    } else if (stage === 'gm') {
      if (gmData?.status === 'Rejected') {
        nextStage = 'REJECTED';
        updateData.gmDate = new Date();
        // Reason handled by gmNote above
      } else {
        // Default to Approved if not Rejected
        // updateData.gmStatus = 'Approved'; // Handled by gmData.status above
        updateData.gmDate = new Date();

        // GM -> HR
        nextStage = 'SUBMITTED_HR';
        updateData.hrStatus = 'Pending';
        nextPerson = null; // HR Queue
      }

    } else if (stage === 'hr') {
      updateData.hrStatus = 'Approved';
      updateData.hrDate = new Date();

      const mdSetting = await prisma.systemSetting.findUnique({ where: { key: 'md_code' } });
      const mdId = mdSetting?.value;

      if (mdId) {
        nextStage = 'SUBMITTED_MD';
        nextPerson = mdId;
        updateData.mdStatus = 'Pending';
      } else {
        nextStage = 'FEEDBACK_REQUIRED';
        nextPerson = employee.manager_ID;
      }

    } else if (stage === 'md') {
      updateData.mdStatus = 'Approved';
      updateData.mdDate = new Date();

      // MD -> Feedback Required
      nextStage = 'FEEDBACK_REQUIRED';
      nextPerson = employee.manager_ID;

    } else if (stage === 'feedback') {
      updateData.feedbackDate = new Date();

      // Feedback -> Employee Confirm
      nextStage = 'EMPLOYEE_ACKNOWLEDGE';
      nextPerson = employee.empCode;
      updateData.employeeFeedbackStatus = 'Pending';
    }

    updateData.status = nextStage;
    updateData.currentStage = nextPerson;

    // Execute Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Save Responses
      for (const resp of responses) {
        const dataToSave: any = {};
        // Assign score to correct field based on stage
        if (stage === 'self') {
          dataToSave.scoreSelf = resp.score;
          dataToSave.commentSelf = resp.comment;
        } else if (stage === 'approver1') {
          dataToSave.scoreAppr1 = resp.score;
        } else if (stage === 'approver2') {
          dataToSave.scoreAppr2 = resp.score;
        } else if (stage === 'approver3') {
          dataToSave.scoreAppr3 = resp.score;
        }

        await tx.assessmentResponse.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId: assessmentId,
              questionId: resp.questionId,
            },
          },
          create: {
            assessmentId: assessmentId,
            questionId: resp.questionId,
            // Fallback for missing titles if creating new (should usually exist)
            questionTitle: 'Unknown',
            questionWeight: 1,
            ...dataToSave
          },
          update: dataToSave
        });
      }

      // 2. Update Assessment Fields & Status
      await tx.assessment.update({
        where: { id: assessmentId },
        data: updateData
      });

      // 3. Create Notification
      if (nextPerson) {
        await tx.notification.create({
          data: {
            userId: nextPerson,
            type: 'ApprovalRequired',
            title: 'Action Required: Assessment',
            message: `Assessment for ${employee.empName_Eng} is waiting for your action.`,
            assessmentId: assessmentId,
            link: `/dashboard/assessments/${assessmentId}/approve`, // Simplified link
          },
        });
      } else if (nextStage === 'COMPLETED') {
        // Notify employee
        await tx.notification.create({
          data: {
            userId: employee.empCode,
            type: 'Approved',
            title: 'Assessment Completed',
            message: 'Your assessment has been completed.',
            assessmentId: assessmentId,
            link: `/dashboard/assessments/${assessmentId}/summary`,
          },
        });
      }
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);

    // [AUDIT LOG] - Outside transaction to avoid blocking if audit fails (or could be inside)
    // We already have logAudit helper, using it here.
    let auditAction = 'ASSESSMENT_UPDATE';
    if (stage === 'self') auditAction = 'ASSESSMENT_SUBMIT';
    else if (stage === 'approver1') auditAction = 'ASSESSMENT_APPROVE_APPR1';
    else if (stage === 'approver2') auditAction = 'ASSESSMENT_APPROVE_APPR2';
    else if (stage === 'approver3') auditAction = 'ASSESSMENT_APPROVE_APPR3';
    else if (stage === 'manager') auditAction = 'ASSESSMENT_APPROVE_MGR';
    else if (stage === 'hr') auditAction = 'ASSESSMENT_REVIEW_HR';
    else if (stage === 'md') auditAction = 'ASSESSMENT_REVIEW_MD';
    else if (stage === 'gm') auditAction = 'ASSESSMENT_CONFIRM_GM';
    else if (stage === 'feedback') auditAction = 'ASSESSMENT_FEEDBACK';

    await logAudit(
      auditAction as any,
      'Assessment',
      assessmentId,
      {
        stage: stage,
        nextStage: nextStage,
        nextPerson: nextPerson
      }
    );

    return { success: true, message: 'Assessment submitted successfully' };
  } catch (error) {
    console.error('Error in submitFullAssessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Confirm Employee Feedback
 */
export async function confirmEmployeeFeedback(assessmentId: string) {
  try {
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'FINAL_HR', // Send to Final HR Check
        hrFinalStatus: 'Pending',
        employeeFeedbackStatus: 'Confirmed',
        employeeFeedbackDate: new Date(),
        updatedAt: new Date(),
      }
    });

    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error confirming feedback:', error);
    return { success: false, error: 'Failed to confirm feedback' };
  }
}

/**
 * Sign Assessment by HR (Staff or JM)
 */
export async function signAssessmentByHR(assessmentId: string, role: 'STAFF' | 'JM') {
  try {
    const session = await auth();
    const currentUser = session?.user as any;
    const currentUserId = currentUser?.empCode || 'HR_USER';
    const signerName = currentUser?.name || currentUserId;

    // 1. Update the specific signature
    const updateData: any = {};
    if (role === 'STAFF') {
      updateData.hrStaffSignature = signerName;
      updateData.hrStaffDate = new Date();
    } else {
      updateData.hrJMSignature = signerName;
      updateData.hrJMDate = new Date();
    }

    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData
    });

    // 2. Check if both are signed
    if (updatedAssessment.hrStaffSignature && updatedAssessment.hrJMSignature) {
      // Both signed, mark as COMPLETED
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          hrFinalStatus: 'Approved',
          hrFinalDate: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Notify Employee
      await prisma.notification.create({
        data: {
          userId: updatedAssessment.employeeId,
          type: 'Approved',
          title: 'Assessment Completed',
          message: 'Your assessment has been completed by HR.',
          assessmentId: assessmentId,
          link: `/dashboard/assessments/${assessmentId}/summary`,
        },
      });
    }

    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error signing assessment:', error);
    return { success: false, error: 'Failed to sign assessment' };
  }
}

/**
 * Complete Assessment by HR (Final) - Preserved for backward compatibility or force complete
 */
export async function completeAssessmentByHR(assessmentId: string, note?: string) {
  try {
    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        hrFinalStatus: 'Approved',
        hrFinalDate: new Date(),
        hrFinalNote: note,
        completedAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Notify Employee
    await prisma.notification.create({
      data: {
        userId: assessment.employeeId,
        type: 'Approved',
        title: 'Assessment Concluded',
        message: 'Your assessment process is fully completed.',
        assessmentId: assessmentId,
        link: `/dashboard/assessments/${assessmentId}/summary`,
      }
    });

    revalidatePath('/dashboard/assessments');
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, error: 'Failed to complete assessment' };
  }
}
