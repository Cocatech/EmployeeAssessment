import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export type AuditAction =
    | 'ASSESSMENT_SUBMIT'
    | 'ASSESSMENT_APPROVE_APPR1'
    | 'ASSESSMENT_APPROVE_APPR2'
    | 'ASSESSMENT_APPROVE_APPR3'
    | 'ASSESSMENT_APPROVE_MGR'
    | 'ASSESSMENT_REVIEW_HR'
    | 'ASSESSMENT_REVIEW_MD'
    | 'ASSESSMENT_FEEDBACK'
    | 'ASSESSMENT_CONFIRM_GM'
    | 'ASSESSMENT_REJECT'
    | 'ASSESSMENT_UPDATE'
    | 'ASSESSMENT_COMPLETE'
    | 'USER_ROLE_UPDATE'
    | 'USER_PASSWORD_RESET'
    | 'USER_STATUS_UPDATE'
    | 'USER_CREATE'
    | 'EMPLOYEE_CREATE'
    | 'EMPLOYEE_UPDATE'
    | 'EMPLOYEE_DELETE'
    | 'SECURITY_ALERT'
    | 'DELEGATION_GRANT'
    | 'DELEGATION_UPDATE'
    | 'DELEGATION_REVOKE'
    | 'SETTING_UPDATE'
    | 'POSITION_CREATE'
    | 'POSITION_UPDATE'
    | 'POSITION_DELETE'
    | 'GROUP_CREATE'
    | 'GROUP_UPDATE'
    | 'GROUP_DELETE'
    | 'TEAM_CREATE'
    | 'TEAM_UPDATE'
    | 'TEAM_DELETE'
    | 'LEVEL_CREATE'
    | 'LEVEL_UPDATE'
    | 'LEVEL_DELETE'
    | 'CATEGORY_CREATE'
    | 'CATEGORY_UPDATE'
    | 'CATEGORY_DELETE'
    | 'QUESTION_CREATE'
    | 'QUESTION_UPDATE'
    | 'QUESTION_DELETE'
    | 'ASSESSMENT_CREATE'
    | 'ASSESSMENT_ASSIGN'
    | 'ASSESSMENT_DELETE';

/**
 * Log an audit event
 */
export async function logAudit(
    action: AuditAction,
    entity: string,
    entityId: string,
    changes: Record<string, any>,
    overrideUser?: { id: string, email: string }
) {
    try {
        let userId = overrideUser?.id;
        let userEmail = overrideUser?.email;

        if (!userId) {
            const session = await auth();
            if (session?.user) {
                userId = session.user.id;
                userEmail = session.user.email || 'unknown';
            } else {
                userId = 'system';
                userEmail = 'system';
            }
        }

        await prisma.auditLog.create({
            data: {
                userId: userId!,
                userEmail: userEmail!,
                action,
                entity,
                entityId,
                changes: changes,
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
}
