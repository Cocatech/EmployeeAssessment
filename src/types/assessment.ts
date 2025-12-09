/**
 * Assessment type definitions
 */

export type AssessmentStatus = 
  | 'DRAFT' 
  | 'SUBMITTED_MGR' 
  | 'SUBMITTED_APPR2' 
  | 'SUBMITTED_GM' 
  | 'COMPLETED' 
  | 'REJECTED';

export type AssessmentType = 'self' | 'manager' | 'peer' | '360';

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  employeeId: string;
  assessorId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  completedAt?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  category: string;
  question: string;
  weight: number;
  order: number;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  questionId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AssessmentSummary {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
}

/**
 * KPI Item for Score Table
 */
export interface KPIItem {
  id: string;
  topic: string;
  weight: number;
  scoreSelf?: number;
  scoreMgr?: number;
  scoreAppr2?: number;
  scoreGm?: number;
  commentSelf?: string;
  commentMgr?: string;
  commentGm?: string;
}

/**
 * Enhanced Assessment with Approver workflow
 */
export interface AssessmentWorkflow {
  currentAssigneeEmail: string | null;
  approver1Email?: string;
  approver2Email?: string;
  gmEmail?: string;
  submittedAt?: string;
  approvedAt?: string;
}
