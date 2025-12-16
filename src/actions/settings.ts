'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

/**
 * Get a system setting by key
 */
export async function getSystemSetting(key: string) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return { success: true, value: setting?.value || null };
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return { success: false, error: 'Failed to get setting' };
  }
}

/**
 * Update or Create a system setting
 */
export async function updateSystemSetting(key: string, value: string, label?: string, type: string = 'text') {
  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, label, type },
      create: { key, value, label, type },
    });

    revalidatePath('/admin/settings');
    // [AUDIT LOG]
    await logAudit('SETTING_UPDATE', 'SystemSetting', key, { value, label, type });
    return { success: true, data: setting };
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return { success: false, error: 'Failed to update setting' };
  }
}

/**
 * Helper to get MD Employee Code
 */
export async function getMDConfig() {
  const result = await getSystemSetting('md_code');
  return result.value || '';
}

/**
 * Get all system settings as a dictionary
 */
export async function getSystemSettings() {
  try {
    const settings = await prisma.systemSetting.findMany();

    // Reduce to key-value map
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return settingsMap;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {};
  }
}

/**
 * Check if an employee is HR based on their position code
 * Employee.position stores position NAME, need to lookup Position table to get CODE
 */
export async function isUserHR(empCode: string) {
  try {
    // Get employee's position (which is position NAME)
    const employee = await prisma.employee.findUnique({
      where: { empCode },
      select: { position: true }
    });

    if (!employee?.position) return false;

    // Find position by NAME to get CODE
    const position = await prisma.position.findFirst({
      where: { name: employee.position }
    });

    return position?.code === 'HR';
  } catch (error) {
    console.error('Error checking if user is HR:', error);
    return false;
  }
}

/**
 * Check if an employee is MD based on their position code
 */
export async function isUserMD(empCode: string) {
  try {
    // Get employee's position (which is position NAME)
    const employee = await prisma.employee.findUnique({
      where: { empCode },
      select: { position: true }
    });

    if (!employee?.position) return false;

    // Find position by NAME to get CODE
    const position = await prisma.position.findFirst({
      where: { name: employee.position }
    });

    return position?.code === 'MD';
  } catch (error) {
    console.error('Error checking if user is MD:', error);
    return false;
  }
}

/**
 * Upload a file for settings (e.g. Logo)
 */
export async function uploadSettingFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // Ensure upload directory exists
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return { success: true, data: `/uploads/${filename}` };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Upload failed' };
  }
}


// ============================================
// Position Actions
// ============================================

export async function getPositions() {
  try {
    return await prisma.position.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

export async function createPosition(data: any) {
  try {
    const result = await prisma.position.create({ data });
    revalidatePath('/dashboard/settings/positions');

    // [AUDIT LOG]
    await logAudit('POSITION_CREATE', 'Position', result.id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error creating position:', error);
    return { success: false, error: 'Failed to create position' };
  }
}

export async function updatePosition(id: string, data: any) {
  try {
    await prisma.position.update({ where: { id }, data });
    revalidatePath('/dashboard/settings/positions');

    // [AUDIT LOG]
    await logAudit('POSITION_UPDATE', 'Position', id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error updating position:', error);
    return { success: false, error: 'Failed to update position' };
  }
}

export async function deletePosition(id: string) {
  try {
    // [AUDIT LOG] Fetch for name before delete?
    const target = await prisma.position.findUnique({ where: { id } });

    await prisma.position.delete({ where: { id } });
    revalidatePath('/dashboard/settings/positions');

    // [AUDIT LOG]
    if (target) await logAudit('POSITION_DELETE', 'Position', id, { name: target.name });

    return { success: true };
  } catch (error) {
    console.error('Error deleting position:', error);
    return { success: false, error: 'Failed to delete. It might be in use.' };
  }
}

export async function reorderPositions(items: { id: string; sortOrder: number }[]) {
  try {
    const transaction = items.map((item) =>
      prisma.position.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    await prisma.$transaction(transaction);
    revalidatePath('/dashboard/settings/positions');
    return { success: true };
  } catch (error) {
    console.error('Error reordering positions:', error);
    return { success: false, error: 'Failed to reorder' };
  }
}

// ============================================
// Group Actions
// ============================================

export async function getGroups() {
  try {
    return await prisma.group.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

export async function createGroup(data: any) {
  try {
    const result = await prisma.group.create({ data });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    await logAudit('GROUP_CREATE', 'Group', result.id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error: 'Failed to create group' };
  }
}

export async function updateGroup(id: string, data: any) {
  try {
    await prisma.group.update({ where: { id }, data });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    await logAudit('GROUP_UPDATE', 'Group', id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error updating group:', error);
    return { success: false, error: 'Failed to update group' };
  }
}

export async function deleteGroup(id: string) {
  try {
    const target = await prisma.group.findUnique({ where: { id } });

    await prisma.group.delete({ where: { id } });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    if (target) await logAudit('GROUP_DELETE', 'Group', id, { name: target.name });

    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: 'Failed to delete group' };
  }
}

export async function reorderGroups(items: { id: string; sortOrder: number }[]) {
  try {
    const transaction = items.map((item) =>
      prisma.group.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    await prisma.$transaction(transaction);
    revalidatePath('/dashboard/settings/organization');
    return { success: true };
  } catch (error) {
    console.error('Error reordering groups:', error);
    return { success: false, error: 'Failed to reorder' };
  }
}

// ============================================
// Team Actions
// ============================================

export async function getTeams() {
  try {
    return await prisma.team.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function createTeam(data: any) {
  try {
    const result = await prisma.team.create({ data });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    await logAudit('TEAM_CREATE', 'Team', result.id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error creating team:', error);
    return { success: false, error: 'Failed to create team' };
  }
}

export async function updateTeam(id: string, data: any) {
  try {
    await prisma.team.update({ where: { id }, data });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    await logAudit('TEAM_UPDATE', 'Team', id, { data });

    return { success: true };
  } catch (error) {
    console.error('Error updating team:', error);
    return { success: false, error: 'Failed to update team' };
  }
}

export async function deleteTeam(id: string) {
  try {
    const target = await prisma.team.findUnique({ where: { id } });

    await prisma.team.delete({ where: { id } });
    revalidatePath('/dashboard/settings/organization');

    // [AUDIT LOG]
    if (target) await logAudit('TEAM_DELETE', 'Team', id, { name: target.name });

    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: 'Failed to delete team' };
  }
}

export async function reorderTeams(items: { id: string; sortOrder: number }[]) {
  try {
    const transaction = items.map((item) =>
      prisma.team.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    await prisma.$transaction(transaction);
    revalidatePath('/dashboard/settings/organization');
    return { success: true };
  } catch (error) {
    console.error('Error reordering teams:', error);
    return { success: false, error: 'Failed to reorder' };
  }
}

// ============================================
// Assessment Type Actions
// ============================================

export async function getAssessmentTypes() {
  try {
    return await prisma.assessmentType.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching assessment types:', error);
    return [];
  }
}

export async function createAssessmentType(data: any) {
  try {
    const result = await prisma.assessmentType.create({ data });
    revalidatePath('/dashboard/settings/assessments');

    // [AUDIT LOG]
    await logAudit('SETTING_UPDATE', 'AssessmentType', result.id, { action: 'CREATE', data });

    return { success: true };
  } catch (error) {
    console.error('Error creating assessment type:', error);
    return { success: false, error: 'Failed to create type' };
  }
}

export async function updateAssessmentType(id: string, data: any) {
  try {
    await prisma.assessmentType.update({ where: { id }, data });
    revalidatePath('/dashboard/settings/assessments');

    // [AUDIT LOG]
    await logAudit('SETTING_UPDATE', 'AssessmentType', id, { action: 'UPDATE', data });

    return { success: true };
  } catch (error) {
    console.error('Error updating assessment type:', error);
    return { success: false, error: 'Failed to update type' };
  }
}

export async function deleteAssessmentType(id: string) {
  try {
    const target = await prisma.assessmentType.findUnique({ where: { id } });

    await prisma.assessmentType.delete({ where: { id } });
    revalidatePath('/dashboard/settings/assessments');

    // [AUDIT LOG]
    if (target) await logAudit('SETTING_UPDATE', 'AssessmentType', id, { action: 'DELETE', name: target.name });

    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment type:', error);
    return { success: false, error: 'Failed to delete type' };
  }
}

export async function reorderAssessmentTypes(items: { id: string; sortOrder: number }[]) {
  try {
    const transaction = items.map((item) =>
      prisma.assessmentType.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    await prisma.$transaction(transaction);
    revalidatePath('/dashboard/settings/assessments');
    return { success: true };
  } catch (error) {
    console.error('Error reordering assessment types:', error);
    return { success: false, error: 'Failed to reorder' };
  }
}
