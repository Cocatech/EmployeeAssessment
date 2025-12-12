'use server';

import { writeFile, readFile, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { revalidatePath } from 'next/cache';

// Interface matching the component
interface AssessmentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Group {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Position {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Team {
  id: string;
  code: string;
  name: string;
  groupCode?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

const DATA_FILE = 'src/data/assessment-types.json';
const GROUPS_FILE = 'src/data/groups.json';
const POSITIONS_FILE = 'src/data/positions.json';
const TEAMS_FILE = 'src/data/teams.json';

// Default initial data
const DEFAULT_TYPES: AssessmentType[] = [
  {
    id: 'type-1',
    code: 'PROBATION',
    name: 'Probation',
    description: 'Probationary Period Assessment',
    sortOrder: 0,
    isActive: true
  },
  {
    id: 'type-2',
    code: 'ANNUAL',
    name: 'Annual',
    description: 'Annual Performance Review',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'type-3',
    code: 'PIP',
    name: 'Performance Improvement',
    description: 'Performance Improvement Plan',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'type-4',
    code: 'PROMOTION',
    name: 'Promotion',
    description: 'Promotion Assessment',
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'type-5',
    code: 'SPECIAL',
    name: 'Special Project',
    description: 'Project-based Assessment',
    sortOrder: 4,
    isActive: true
  }
];

const DEFAULT_GROUPS: Group[] = [
  { id: 'g1', code: 'PRD', name: 'Production', sortOrder: 0, isActive: true },
  { id: 'g2', code: 'QA', name: 'Quality Assurance', sortOrder: 1, isActive: true },
  { id: 'g3', code: 'ENG', name: 'Engineering', sortOrder: 2, isActive: true },
  { id: 'g4', code: 'HR', name: 'Human Resources', sortOrder: 3, isActive: true },
  { id: 'g5', code: 'IT', name: 'Information Technology', sortOrder: 4, isActive: true },
]

const DEFAULT_POSITIONS: Position[] = [
  { id: 'p1', code: 'OP', name: 'Operator', sortOrder: 0, isActive: true },
  { id: 'p2', code: 'LD', name: 'Leader', sortOrder: 1, isActive: true },
  { id: 'p3', code: 'SV', name: 'Supervisor', sortOrder: 2, isActive: true },
  { id: 'p4', code: 'MG', name: 'Manager', sortOrder: 3, isActive: true },
  { id: 'p5', code: 'GM', name: 'General Manager', sortOrder: 4, isActive: true },
]

const DEFAULT_TEAMS: Team[] = [
  { id: 't1', code: 'PRD-1', name: 'Production Line 1', groupCode: 'PRD', sortOrder: 0, isActive: true },
  { id: 't2', code: 'QA-IN', name: 'Incoming QA', groupCode: 'QA', sortOrder: 1, isActive: true },
  { id: 't3', code: 'DEV', name: 'Software Development', groupCode: 'IT', sortOrder: 2, isActive: true },
]

async function getStoragePath(file: string) {
  return join(process.cwd(), file);
}

async function ensureDataFile(file: string, defaults: any[]) {
  const path = await getStoragePath(file);
  try {
    await access(path);
  } catch {
    // File doesn't exist, create it with defaults
    // Ensure directory exists first
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(defaults, null, 2));
  }
}

export async function uploadSystemLogo(formData: FormData) {
  try {
    const file = formData.get('logo') as File;

    if (!file) {
      return { success: false, error: 'No file selected' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Invalid file type. Please upload an image.' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/logo.png
    const path = join(process.cwd(), 'public', 'logo.png');

    await writeFile(path, buffer);

    revalidatePath('/');
    revalidatePath('/dashboard/assessments');
    return { success: true, message: 'Logo uploaded successfully' };
  } catch (error) {
    console.error('Error uploading logo:', error);
    return { success: false, error: 'Failed to upload logo' };
  }
}

// ==========================================
// ASSESSMENT TYPES
// ==========================================

export async function getAssessmentTypes() {
  await ensureDataFile(DATA_FILE, DEFAULT_TYPES);
  const path = await getStoragePath(DATA_FILE);
  const data = await readFile(path, 'utf-8');
  const types = JSON.parse(data) as AssessmentType[];

  // Return sorted by sortOrder
  return types.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createAssessmentType(data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const types = await getAssessmentTypes();

    const newType: AssessmentType = {
      id: `type-${Date.now()}`,
      code: data.code,
      name: data.name,
      description: data.description || null,
      sortOrder: types.length, // Add to end
      isActive: data.isActive ?? true
    };

    types.push(newType);

    const path = await getStoragePath(DATA_FILE);
    await writeFile(path, JSON.stringify(types, null, 2));

    revalidatePath('/dashboard/settings/assessment-types');
    revalidatePath('/dashboard/assessments/new');

    return { success: true, data: newType };
  } catch (error) {
    return { success: false, error: 'Failed to create assessment type' };
  }
}

export async function updateAssessmentType(id: string, data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const types = await getAssessmentTypes();
    const index = types.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, error: 'Assessment type not found' };
    }

    types[index] = {
      ...types[index],
      ...data,
      description: data.description || null,
      isActive: data.isActive ?? types[index].isActive
    };

    const path = await getStoragePath(DATA_FILE);
    await writeFile(path, JSON.stringify(types, null, 2));

    revalidatePath('/dashboard/settings/assessment-types');
    revalidatePath('/dashboard/assessments/new');

    return { success: true, data: types[index] };
  } catch (error) {
    return { success: false, error: 'Failed to update assessment type' };
  }
}

export async function deleteAssessmentType(id: string) {
  try {
    const types = await getAssessmentTypes();
    const filtered = types.filter(t => t.id !== id);

    if (filtered.length === types.length) {
      return { success: false, error: 'Assessment type not found' };
    }

    const path = await getStoragePath(DATA_FILE);
    await writeFile(path, JSON.stringify(filtered, null, 2));

    revalidatePath('/dashboard/settings/assessment-types');
    revalidatePath('/dashboard/assessments/new');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete assessment type' };
  }
}

export async function reorderAssessmentTypes(items: { id: string; sortOrder: number }[]) {
  try {
    const types = await getAssessmentTypes();

    // Update sort orders
    const updated = types.map(t => {
      const item = items.find(i => i.id === t.id);
      return item ? { ...t, sortOrder: item.sortOrder } : t;
    });

    const path = await getStoragePath(DATA_FILE);
    await writeFile(path, JSON.stringify(updated, null, 2));

    revalidatePath('/dashboard/settings/assessment-types');
    revalidatePath('/dashboard/assessments/new');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reorder types' };
  }
}

// ==========================================
// GROUPS
// ==========================================

export async function getGroups() {
  await ensureDataFile(GROUPS_FILE, DEFAULT_GROUPS);
  const path = await getStoragePath(GROUPS_FILE);
  const data = await readFile(path, 'utf-8');
  const groups = JSON.parse(data) as Group[];
  return groups.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createGroup(data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const groups = await getGroups();
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      code: data.code,
      name: data.name,
      description: data.description || null,
      sortOrder: groups.length,
      isActive: data.isActive ?? true
    };
    groups.push(newGroup);
    const path = await getStoragePath(GROUPS_FILE);
    await writeFile(path, JSON.stringify(groups, null, 2));
    revalidatePath('/dashboard/settings/groups');
    return { success: true, data: newGroup };
  } catch (error) {
    return { success: false, error: 'Failed to create group' };
  }
}

export async function updateGroup(id: string, data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const groups = await getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return { success: false, error: 'Group not found' };

    groups[index] = {
      ...groups[index],
      ...data,
      description: data.description || null,
      isActive: data.isActive ?? groups[index].isActive
    };

    const path = await getStoragePath(GROUPS_FILE);
    await writeFile(path, JSON.stringify(groups, null, 2));
    revalidatePath('/dashboard/settings/groups');
    return { success: true, data: groups[index] };
  } catch (error) {
    return { success: false, error: 'Failed to update group' };
  }
}

export async function deleteGroup(id: string) {
  try {
    const groups = await getGroups();
    const filtered = groups.filter(g => g.id !== id);
    if (filtered.length === groups.length) return { success: false, error: 'Group not found' };

    const path = await getStoragePath(GROUPS_FILE);
    await writeFile(path, JSON.stringify(filtered, null, 2));
    revalidatePath('/dashboard/settings/groups');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete group' };
  }
}

export async function reorderGroups(items: { id: string; sortOrder: number }[]) {
  try {
    const groups = await getGroups();
    const updated = groups.map(g => {
      const item = items.find(i => i.id === g.id);
      return item ? { ...g, sortOrder: item.sortOrder } : g;
    });
    const path = await getStoragePath(GROUPS_FILE);
    await writeFile(path, JSON.stringify(updated, null, 2));
    revalidatePath('/dashboard/settings/groups');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reorder groups' };
  }
}

// ==========================================
// POSITIONS
// ==========================================

export async function getPositions() {
  await ensureDataFile(POSITIONS_FILE, DEFAULT_POSITIONS);
  const path = await getStoragePath(POSITIONS_FILE);
  const data = await readFile(path, 'utf-8');
  const positions = JSON.parse(data) as Position[];
  return positions.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createPosition(data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const positions = await getPositions();
    const newPosition: Position = {
      id: `pos-${Date.now()}`,
      code: data.code,
      name: data.name,
      description: data.description || null,
      sortOrder: positions.length,
      isActive: data.isActive ?? true
    };
    positions.push(newPosition);
    const path = await getStoragePath(POSITIONS_FILE);
    await writeFile(path, JSON.stringify(positions, null, 2));
    revalidatePath('/dashboard/settings/positions');
    return { success: true, data: newPosition };
  } catch (error) {
    return { success: false, error: 'Failed to create position' };
  }
}

export async function updatePosition(id: string, data: {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const positions = await getPositions();
    const index = positions.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Position not found' };

    positions[index] = {
      ...positions[index],
      ...data,
      description: data.description || null,
      isActive: data.isActive ?? positions[index].isActive
    };

    const path = await getStoragePath(POSITIONS_FILE);
    await writeFile(path, JSON.stringify(positions, null, 2));
    revalidatePath('/dashboard/settings/positions');
    return { success: true, data: positions[index] };
  } catch (error) {
    return { success: false, error: 'Failed to update position' };
  }
}

export async function deletePosition(id: string) {
  try {
    const positions = await getPositions();
    const filtered = positions.filter(p => p.id !== id);
    if (filtered.length === positions.length) return { success: false, error: 'Position not found' };

    const path = await getStoragePath(POSITIONS_FILE);
    await writeFile(path, JSON.stringify(filtered, null, 2));
    revalidatePath('/dashboard/settings/positions');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete position' };
  }
}

export async function reorderPositions(items: { id: string; sortOrder: number }[]) {
  try {
    const positions = await getPositions();
    const updated = positions.map(p => {
      const item = items.find(i => i.id === p.id);
      return item ? { ...p, sortOrder: item.sortOrder } : p;
    });
    const path = await getStoragePath(POSITIONS_FILE);
    await writeFile(path, JSON.stringify(updated, null, 2));
    revalidatePath('/dashboard/settings/positions');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reorder positions' };
  }
}

// ==========================================
// TEAMS
// ==========================================

export async function getTeams() {
  await ensureDataFile(TEAMS_FILE, DEFAULT_TEAMS);
  const path = await getStoragePath(TEAMS_FILE);
  const data = await readFile(path, 'utf-8');
  const teams = JSON.parse(data) as Team[];
  return teams.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createTeam(data: {
  code: string;
  name: string;
  groupCode?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const teams = await getTeams();
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      code: data.code,
      name: data.name,
      groupCode: data.groupCode || null,
      description: data.description || null,
      sortOrder: teams.length,
      isActive: data.isActive ?? true
    };
    teams.push(newTeam);
    const path = await getStoragePath(TEAMS_FILE);
    await writeFile(path, JSON.stringify(teams, null, 2));
    revalidatePath('/dashboard/settings/teams');
    return { success: true, data: newTeam };
  } catch (error) {
    return { success: false, error: 'Failed to create team' };
  }
}

export async function updateTeam(id: string, data: {
  code: string;
  name: string;
  groupCode?: string;
  description?: string;
  isActive?: boolean;
}) {
  try {
    const teams = await getTeams();
    const index = teams.findIndex(t => t.id === id);
    if (index === -1) return { success: false, error: 'Team not found' };

    teams[index] = {
      ...teams[index],
      ...data,
      groupCode: data.groupCode || null,
      description: data.description || null,
      isActive: data.isActive ?? teams[index].isActive
    };

    const path = await getStoragePath(TEAMS_FILE);
    await writeFile(path, JSON.stringify(teams, null, 2));
    revalidatePath('/dashboard/settings/teams');
    return { success: true, data: teams[index] };
  } catch (error) {
    return { success: false, error: 'Failed to update team' };
  }
}

export async function deleteTeam(id: string) {
  try {
    const teams = await getTeams();
    const filtered = teams.filter(t => t.id !== id);
    if (filtered.length === teams.length) return { success: false, error: 'Team not found' };

    const path = await getStoragePath(TEAMS_FILE);
    await writeFile(path, JSON.stringify(filtered, null, 2));
    revalidatePath('/dashboard/settings/teams');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete team' };
  }
}

export async function reorderTeams(items: { id: string; sortOrder: number }[]) {
  try {
    const teams = await getTeams();
    const updated = teams.map(t => {
      const item = items.find(i => i.id === t.id);
      return item ? { ...t, sortOrder: item.sortOrder } : t;
    });
    const path = await getStoragePath(TEAMS_FILE);
    await writeFile(path, JSON.stringify(updated, null, 2));
    revalidatePath('/dashboard/settings/teams');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reorder teams' };
  }
}
