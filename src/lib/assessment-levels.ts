export const ASSESSMENT_LEVELS = [
  {
    code: 'L1-Supplier',
    name: 'Supplier',
    order: 1,
    description: 'ผู้จัดหา/ซัพพลายเออร์',
    label: 'L1-Supplier - Supplier (ผู้จัดหา/ซัพพลายเออร์)'
  },
  {
    code: 'L2-Operator',
    name: 'Operator',
    order: 2,
    description: 'ผู้ปฏิบัติงาน',
    label: 'L2-Operator - Operator (ผู้ปฏิบัติงาน)'
  },
  {
    code: 'L3-General',
    name: 'General',
    order: 3,
    description: 'ทั่วไป',
    label: 'L3-General - General (ทั่วไป)'
  },
  {
    code: 'L4-Supervise',
    name: 'Supervise',
    order: 4,
    description: 'หัวหน้างาน/ผู้กำกับดูแล',
    label: 'L4-Supervise - Supervise (หัวหน้างาน/ผู้กำกับดูแล)'
  },
  {
    code: 'L5-Interpreter',
    name: 'Interpreter',
    order: 5,
    description: 'ผู้แปล/ล่าม',
    label: 'L5-Interpreter - Interpreter (ผู้แปล/ล่าม)'
  },
  {
    code: 'L6-Management',
    name: 'Management',
    order: 6,
    description: 'ผู้บริหาร',
    label: 'L6-Management - Management (ผู้บริหาร)'
  },
] as const;

export type AssessmentLevelCode = typeof ASSESSMENT_LEVELS[number]['code'];

export function getAssessmentLevelName(code: string): string {
  const level = ASSESSMENT_LEVELS.find(l => l.code === code);
  return level ? level.name : code;
}

export function getAssessmentLevelDescription(code: string): string {
  const level = ASSESSMENT_LEVELS.find(l => l.code === code);
  return level ? level.description : '';
}

export function getAssessmentLevelLabel(code: string): string {
  const level = ASSESSMENT_LEVELS.find(l => l.code === code);
  return level ? level.label : code;
}
