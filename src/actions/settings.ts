'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

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

export async function createPosition(data: {
  code: string;
  name: string;
  description?: string;
}) {
  try {
    const maxOrder = await prisma.position.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const position = await prisma.position.create({
      data: {
        ...data,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, position };
  } catch (error: any) {
    console.error('Error creating position:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePosition(id: string, data: {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const position = await prisma.position.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, position };
  } catch (error: any) {
    console.error('Error updating position:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePosition(id: string) {
  try {
    await prisma.position.delete({
      where: { id },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting position:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderPositions(items: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(
      items.map((item) =>
        prisma.position.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering positions:', error);
    return { success: false, error: error.message };
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

export async function createGroup(data: {
  code: string;
  name: string;
  description?: string;
}) {
  try {
    const maxOrder = await prisma.group.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const group = await prisma.group.create({
      data: {
        ...data,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, group };
  } catch (error: any) {
    console.error('Error creating group:', error);
    return { success: false, error: error.message };
  }
}

export async function updateGroup(id: string, data: {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const group = await prisma.group.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, group };
  } catch (error: any) {
    console.error('Error updating group:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteGroup(id: string) {
  try {
    await prisma.group.delete({
      where: { id },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderGroups(items: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(
      items.map((item) =>
        prisma.group.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering groups:', error);
    return { success: false, error: error.message };
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

export async function createTeam(data: {
  code: string;
  name: string;
  groupCode?: string;
  description?: string;
}) {
  try {
    const maxOrder = await prisma.team.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const team = await prisma.team.create({
      data: {
        ...data,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, team };
  } catch (error: any) {
    console.error('Error creating team:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTeam(id: string, data: {
  code?: string;
  name?: string;
  groupCode?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const team = await prisma.team.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, team };
  } catch (error: any) {
    console.error('Error updating team:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTeam(id: string) {
  try {
    await prisma.team.delete({
      where: { id },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderTeams(items: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(
      items.map((item) =>
        prisma.team.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering teams:', error);
    return { success: false, error: error.message };
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

export async function createAssessmentType(data: {
  code: string;
  name: string;
  description?: string;
}) {
  try {
    const maxOrder = await prisma.assessmentType.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const assessmentType = await prisma.assessmentType.create({
      data: {
        ...data,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: true, assessmentType };
  } catch (error: any) {
    console.error('Error creating assessment type:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAssessmentType(id: string, data: {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const assessmentType = await prisma.assessmentType.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, assessmentType };
  } catch (error: any) {
    console.error('Error updating assessment type:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAssessmentType(id: string) {
  try {
    await prisma.assessmentType.delete({
      where: { id },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting assessment type:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderAssessmentTypes(items: { id: string; sortOrder: number }[]) {
  try {
    await Promise.all(
      items.map((item) =>
        prisma.assessmentType.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering assessment types:', error);
    return { success: false, error: error.message };
  }
}
