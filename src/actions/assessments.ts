'use server';

import { getListItems, createListItem, updateListItem, deleteListItem } from '@/lib/graph/sharepoint';
import { revalidatePath } from 'next/cache';
import type { Assessment } from '@/types';

const ASSESSMENTS_LIST = 'Assessments';

/**
 * Get all assessments from SharePoint
 */
export async function getAssessments(): Promise<Assessment[]> {
  try {
    const items = await getListItems(ASSESSMENTS_LIST);
    return items.map((item) => ({
      id: item.id,
      title: item.fields.Title as string,
      description: item.fields.Description as string | undefined,
      type: item.fields.Type as Assessment['type'],
      status: item.fields.Status as Assessment['status'],
      employeeId: item.fields.EmployeeId as string,
      assessorId: item.fields.AssessorId as string,
      periodStart: item.fields.PeriodStart as string,
      periodEnd: item.fields.PeriodEnd as string,
      dueDate: item.fields.DueDate as string,
      completedAt: item.fields.CompletedAt as string | undefined,
      score: item.fields.Score as number | undefined,
      createdAt: item.createdDateTime,
      updatedAt: item.lastModifiedDateTime,
    }));
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw new Error('Failed to fetch assessments');
  }
}

/**
 * Create a new assessment in SharePoint
 */
export async function createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const result = await createListItem(ASSESSMENTS_LIST, {
      Title: data.title,
      Description: data.description,
      Type: data.type,
      Status: data.status,
      EmployeeId: data.employeeId,
      AssessorId: data.assessorId,
      PeriodStart: data.periodStart,
      PeriodEnd: data.periodEnd,
      DueDate: data.dueDate,
    });
    
    revalidatePath('/dashboard/assessments');
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating assessment:', error);
    return { success: false, error: 'Failed to create assessment' };
  }
}

/**
 * Update an existing assessment in SharePoint
 */
export async function updateAssessment(id: string, data: Partial<Assessment>) {
  try {
    await updateListItem(ASSESSMENTS_LIST, id, {
      ...(data.title && { Title: data.title }),
      ...(data.description !== undefined && { Description: data.description }),
      ...(data.status && { Status: data.status }),
      ...(data.score !== undefined && { Score: data.score }),
      ...(data.completedAt && { CompletedAt: data.completedAt }),
    });
    
    revalidatePath('/dashboard/assessments');
    return { success: true };
  } catch (error) {
    console.error('Error updating assessment:', error);
    return { success: false, error: 'Failed to update assessment' };
  }
}

/**
 * Delete an assessment from SharePoint
 */
export async function deleteAssessment(id: string) {
  try {
    await deleteListItem(ASSESSMENTS_LIST, id);
    
    revalidatePath('/dashboard/assessments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return { success: false, error: 'Failed to delete assessment' };
  }
}

/**
 * Submit assessment with Smart Skip Logic and Auto Email Resolution
 * Determines next approver and automatically resolves their email
 */
export async function submitAssessment(
  assessmentId: string,
  currentStatus: string,
  empCode: string
) {
  try {
    const { getEmployeeByCode, getEmployeeEmail } = await import('@/lib/graph/sharepoint');
    
    // Fetch employee profile
    const employee = await getEmployeeByCode(empCode);
    
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    let nextStatus: string;
    let targetId: string;
    let targetEmail: string | null;

    // Determine next status and target approver based on current status
    switch (currentStatus) {
      case 'DRAFT':
        // First submission -> Manager (Approver1)
        nextStatus = 'SUBMITTED_MGR';
        targetId = employee.approver1_ID;
        break;

      case 'SUBMITTED_MGR':
        // Smart Skip Logic: Check if Approver2 exists
        if (employee.approver2_ID && employee.approver2_ID !== '-' && employee.approver2_ID.trim() !== '') {
          // Has Approver2 -> Send to Approver2
          nextStatus = 'SUBMITTED_APPR2';
          targetId = employee.approver2_ID;
        } else {
          // No Approver2 -> Skip to GM
          nextStatus = 'SUBMITTED_GM';
          targetId = employee.gm_ID;
        }
        break;

      case 'SUBMITTED_APPR2':
        // From Approver2 -> GM
        nextStatus = 'SUBMITTED_GM';
        targetId = employee.gm_ID;
        break;

      case 'SUBMITTED_GM':
        // GM approval -> Complete
        nextStatus = 'COMPLETED';
        targetId = empCode; // Back to employee
        break;

      default:
        return { success: false, error: 'Invalid status transition' };
    }

    // Auto Email Resolution: Get target approver's email
    if (nextStatus === 'COMPLETED') {
      targetEmail = employee.email;
    } else {
      targetEmail = await getEmployeeEmail(targetId);
    }

    if (!targetEmail) {
      console.warn(`Email not found for target: ${targetId}`);
      // Continue anyway, email might be resolved later
    }

    // Update assessment in SharePoint
    await updateListItem(ASSESSMENTS_LIST, assessmentId, {
      Status: nextStatus,
      Current_Assignee_Email: targetEmail,
      LastUpdated: new Date().toISOString(),
    });

    revalidatePath('/dashboard/assessments');
    
    return {
      success: true,
      nextStatus,
      targetEmail,
      message: `Assessment submitted to ${nextStatus}`,
    };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Reject assessment and send back to previous stage
 */
export async function rejectAssessment(
  assessmentId: string,
  currentStatus: string,
  empCode: string,
  reason?: string
) {
  try {
    const { getEmployeeByCode, getEmployeeEmail } = await import('@/lib/graph/sharepoint');
    
    const employee = await getEmployeeByCode(empCode);
    
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    let previousStatus: string;
    let targetEmail: string | null;

    switch (currentStatus) {
      case 'SUBMITTED_MGR':
        previousStatus = 'DRAFT';
        targetEmail = employee.email;
        break;
      case 'SUBMITTED_APPR2':
        previousStatus = 'SUBMITTED_MGR';
        targetEmail = await getEmployeeEmail(employee.approver1_ID);
        break;
      case 'SUBMITTED_GM':
        // Check if came from Approver2 or Manager
        if (employee.approver2_ID && employee.approver2_ID !== '-') {
          previousStatus = 'SUBMITTED_APPR2';
          targetEmail = await getEmployeeEmail(employee.approver2_ID);
        } else {
          previousStatus = 'SUBMITTED_MGR';
          targetEmail = await getEmployeeEmail(employee.approver1_ID);
        }
        break;
      default:
        return { success: false, error: 'Cannot reject from this status' };
    }

    await updateListItem(ASSESSMENTS_LIST, assessmentId, {
      Status: previousStatus,
      Current_Assignee_Email: targetEmail,
      RejectionReason: reason || '',
      LastUpdated: new Date().toISOString(),
    });

    revalidatePath('/dashboard/assessments');
    
    return {
      success: true,
      previousStatus,
      message: `Assessment rejected and sent back`,
    };
  } catch (error) {
    console.error('Error rejecting assessment:', error);
    return { success: false, error: 'Failed to reject assessment' };
  }
}
