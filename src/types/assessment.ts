/**
 * Assessment type definitions
 */

export type AssessmentStatus =
  | 'DRAFT'
  | 'SUBMITTED_APPR1'
  | 'SUBMITTED_APPR2'
  | 'SUBMITTED_APPR3'
  | 'SUBMITTED_MGR'
  | 'SUBMITTED_GM'
  | 'COMPLETED'
  | 'REJECTED';


export type AssessmentType = 'self' | 'manager' | 'peer' | '360';

/**
 * Assessment Level - ระดับการประเมิน
 * - General: คำถามทั่วไป (ใช้กับทุกระดับ)
 * - Interpreter: ล่าม/นักแปล
 * - Operate: พนักงานปฏิบัติการ (Level 1-3)
 * - Supervise: หัวหน้างาน/ซุปเปอร์ไวเซอร์ (Level 4-5)
 * - Management: ผู้จัดการ/ผู้บริหาร (Level 6+)
 */
export type AssessmentLevel =
  | 'General'
  | 'Interpreter'
  | 'Operate'
  | 'Supervise'
  | 'Management';

/**
 * Applicable Level - ระดับที่คำถามใช้ได้
 */
export type ApplicableLevel = AssessmentLevel | 'All';

/**
 * Question Category - หมวดหมู่คำถาม
 */
export type QuestionCategory =
  | 'Performance'      // ผลการปฏิบัติงาน
  | 'Quality'          // คุณภาพงาน
  | 'Behavior'         // พฤติกรรม
  | 'Competency'       // สมรรถนะ
  | 'Leadership'       // ความเป็นผู้นำ (Supervise, Management)
  | 'Team Management'  // การบริหารทีม (Management)
  | 'Strategic';       // เชิงกลยุทธ์ (Management)

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  assessmentType: 'Annual' | 'Mid-year' | 'Probation' | 'Special'; // Assessment period type
  status: AssessmentStatus;
  employeeId: string;
  assessorId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  completedAt?: string;
  score?: number;
  finalScore?: number; // Calculated final score
  createdAt: string;
  updatedAt: string;
  submittedAt?: string; // When first submitted
  approvedAt?: string; // When fully approved
}

/**
 * Question/KPI Item
 */
export interface AssessmentQuestion {
  id: string;
  assessmentId?: string; // Optional - for master questions
  category: QuestionCategory; // ใช้ QuestionCategory type
  questionTitle: string; // Short title/topic
  description?: string; // Detailed description/criteria
  weight: number; // น้ำหนัก % (รวมต้อง = 100)
  maxScore: number; // คะแนนเต็ม (default: 5)
  order: number; // ลำดับการแสดง
  isActive: boolean; // สถานะใช้งาน
  applicableLevel: ApplicableLevel; // ระดับที่ใช้คำถามนี้
  createdAt?: string;
  updatedAt?: string;
}


export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  questionId: string;
  questionTitle?: string; // For easy reference
  questionWeight?: number; // For easy calculation
  scoreSelf?: number; // Employee self-score (0-5)
  scoreAppr1?: number; // Approver 1 score (0-5)
  scoreAppr2?: number; // Approver 2 score (0-5)
  scoreAppr3?: number; // Approver 3 score (0-5)
  scoreMgr?: number; // Manager score (0-5)
  scoreGm?: number; // MD/GM score (0-5)
  commentSelf?: string; // Employee comment
  commentAppr1?: string; // Approver 1 comment
  commentAppr2?: string; // Approver 2 comment
  commentAppr3?: string; // Approver 3 comment
  commentMgr?: string; // Manager comment
  commentGm?: string; // MD/GM comment

  rating?: number; // Legacy field (backward compatibility)
  comment?: string; // Legacy field (backward compatibility)
  createdAt: string;
  updatedAt?: string;
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
