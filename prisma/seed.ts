/**
 * Prisma Seed Script
 * เพิ่ม initial data สำหรับ development และ testing
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ALL_QUESTION_TEMPLATES } from '../src/lib/question-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.delegation.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.team.deleteMany();
  await prisma.group.deleteMany();
  await prisma.position.deleteMany();
  await prisma.assessmentType.deleteMany();

  // Seed Assessment Types
  console.log('📋 Seeding assessment types...');
  const assessmentTypes = [
    { code: 'ANNUAL', name: 'Annual', description: 'Annual performance review', sortOrder: 1 },
    { code: 'MID_YEAR', name: 'Mid-year', description: 'Mid-year performance review', sortOrder: 2 },
    { code: 'PROBATION', name: 'Probation', description: 'Probation period assessment', sortOrder: 3 },
    { code: 'SPECIAL', name: 'Special', description: 'Special assessment', sortOrder: 4 },
  ];

  for (const assessmentType of assessmentTypes) {
    await prisma.assessmentType.create({ data: assessmentType });
  }

  // Seed Positions
  console.log('💼 Seeding positions...');
  const positions = [
    { code: 'GM', name: 'General Manager', description: 'Top management position', sortOrder: 1 },
    { code: 'MGR', name: 'Manager', description: 'Department manager', sortOrder: 2 },
    { code: 'SUPV', name: 'Supervisor', description: 'Team supervisor', sortOrder: 3 },
    { code: 'SR_ENG', name: 'Senior Engineer', description: 'Senior technical position', sortOrder: 4 },
    { code: 'ENG', name: 'Engineer', description: 'Engineering position', sortOrder: 5 },
    { code: 'TECH', name: 'Technician', description: 'Technical support', sortOrder: 6 },
    { code: 'OP', name: 'Operator', description: 'Production operator', sortOrder: 7 },
    { code: 'STAFF', name: 'Staff', description: 'General staff', sortOrder: 8 },
  ];

  for (const position of positions) {
    await prisma.position.create({ data: position });
  }

  // Seed Groups
  console.log('🏢 Seeding groups...');
  const groups = [
    { code: 'MGT', name: 'Management', description: 'Management and executive team', sortOrder: 1 },
    { code: 'PRD', name: 'Production', description: 'Production department', sortOrder: 2 },
    { code: 'QA', name: 'Quality Assurance', description: 'Quality control and assurance', sortOrder: 3 },
    { code: 'ENG', name: 'Engineering', description: 'Engineering department', sortOrder: 4 },
    { code: 'HR', name: 'Human Resources', description: 'HR and administration', sortOrder: 5 },
    { code: 'IT', name: 'Information Technology', description: 'IT department', sortOrder: 6 },
    { code: 'FIN', name: 'Finance', description: 'Finance and accounting', sortOrder: 7 },
  ];

  for (const group of groups) {
    await prisma.group.create({ data: group });
  }

  // Seed Teams
  console.log('👥 Seeding teams...');
  const teams = [
    { code: 'PRD_A', name: 'Production Line A', groupCode: 'PRD', description: 'Production line A team', sortOrder: 1 },
    { code: 'PRD_B', name: 'Production Line B', groupCode: 'PRD', description: 'Production line B team', sortOrder: 2 },
    { code: 'QC', name: 'Quality Control', groupCode: 'QA', description: 'Quality control team', sortOrder: 3 },
    { code: 'QA_LAB', name: 'QA Laboratory', groupCode: 'QA', description: 'QA lab team', sortOrder: 4 },
    { code: 'ENG_MECH', name: 'Mechanical Engineering', groupCode: 'ENG', description: 'Mechanical engineering team', sortOrder: 5 },
    { code: 'ENG_ELEC', name: 'Electrical Engineering', groupCode: 'ENG', description: 'Electrical engineering team', sortOrder: 6 },
    { code: 'IT_DEV', name: 'IT Development', groupCode: 'IT', description: 'Software development team', sortOrder: 7 },
    { code: 'IT_SUP', name: 'IT Support', groupCode: 'IT', description: 'IT support team', sortOrder: 8 },
  ];

  for (const team of teams) {
    await prisma.team.create({ data: team });
  }

  // Seed Employees
  console.log('👥 Seeding employees...');
  const employees = [
    {
      empCode: 'SYSADMIN',
      empName_Eng: 'System Administrator',
      empName_Thai: 'ผู้ดูแลระบบ',
      email: 'admin@trth.com',
      phoneNumber: '080-000-0001',
      position: 'System Administrator',
      group: 'IT',
      team: 'IT',
      assessmentLevel: 'L6-Management',
      employeeType: 'Permanent',
      joinDate: new Date('2019-01-01'),
      warningCount: 0,
      isActive: true,
    },
    {
      empCode: 'EMP001',
      empName_Eng: 'John Smith',
      empName_Thai: 'จอห์น สมิธ',
      email: 'john.smith@trth.com',
      phoneNumber: '081-234-5678',
      position: 'Production Manager',
      group: 'PRD',
      team: 'Production A',
      assessmentLevel: 'L6-Management',
      employeeType: 'Permanent',
      approver1_ID: 'EMP999',
      gm_ID: 'EMP999',
      joinDate: new Date('2020-01-15'),
      warningCount: 0,
      isActive: true,
    },
    {
      empCode: 'EMP002',
      empName_Eng: 'Jane Doe',
      empName_Thai: 'เจน โด',
      email: 'jane.doe@trth.com',
      phoneNumber: '082-345-6789',
      position: 'QA Supervisor',
      group: 'QA',
      team: 'Quality Control',
      assessmentLevel: 'L4-Supervise',
      employeeType: 'Permanent',
      approver1_ID: 'EMP001',
      manager_ID: 'EMP001',
      gm_ID: 'EMP999',
      joinDate: new Date('2021-03-20'),
      warningCount: 0,
      isActive: true,
    },
    {
      empCode: 'EMP003',
      empName_Eng: 'Bob Johnson',
      empName_Thai: 'บ๊อบ จอห์นสัน',
      email: 'bob.johnson@trth.com',
      phoneNumber: '083-456-7890',
      position: 'Production Operator',
      group: 'PRD',
      team: 'Production B',
      assessmentLevel: 'L2-Operator',
      employeeType: 'Permanent',
      approver1_ID: 'EMP001',
      manager_ID: 'EMP001',
      gm_ID: 'EMP999',
      joinDate: new Date('2022-06-10'),
      warningCount: 1,
      isActive: true,
    },
    {
      empCode: 'EMP999',
      empName_Eng: 'General Manager',
      empName_Thai: 'ผู้จัดการทั่วไป',
      email: 'gm@trth.com',
      phoneNumber: '080-000-0000',
      position: 'General Manager',
      group: 'MGT',
      team: 'Management',
      assessmentLevel: 'L6-Management',
      employeeType: 'Permanent',
      joinDate: new Date('2019-01-01'),
      warningCount: 0,
      isActive: true,
    },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { empCode: emp.empCode },
      update: emp,
      create: emp,
    });
  }
  console.log(`✅ Created ${employees.length} employees`);

  // Seed Users (for authentication)
  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('password', 10);

  const users = [
    {
      empCode: 'SYSADMIN',
      email: 'admin@trth.com',
      name: 'System Administrator',
      role: 'ADMIN',
      userType: 'SYSTEM_ADMIN',
      passwordHash: hashedPassword,
      isActive: true,
    },
    {
      empCode: 'EMP999',
      email: 'gm@trth.com',
      name: 'General Manager',
      role: 'ADMIN',
      userType: 'EMPLOYEE',
      passwordHash: hashedPassword,
      isActive: true,
    },
    {
      empCode: 'EMP001',
      email: 'john.smith@trth.com',
      name: 'John Smith',
      role: 'MANAGER',
      userType: 'EMPLOYEE',
      passwordHash: hashedPassword,
      isActive: true,
    },
    {
      empCode: 'EMP002',
      email: 'jane.doe@trth.com',
      name: 'Jane Doe',
      role: 'EMPLOYEE',
      userType: 'EMPLOYEE',
      passwordHash: hashedPassword,
      isActive: true,
    },
    {
      empCode: 'EMP003',
      email: 'bob.johnson@trth.com',
      name: 'Bob Johnson',
      role: 'EMPLOYEE',
      userType: 'EMPLOYEE',
      passwordHash: hashedPassword,
      isActive: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }
  console.log(`✅ Created ${users.length} users`);

  // Seed Assessment Questions from Templates
  console.log('❓ Seeding questions from templates...');
  let questionCount = 0;

  for (const [levelCode, questions] of Object.entries(ALL_QUESTION_TEMPLATES)) {
    console.log(`  📝 Seeding ${questions.length} questions for ${levelCode}...`);

    for (const question of questions) {
      await prisma.assessmentQuestion.create({
        data: {
          questionTitle: question.questionTitle,
          description: question.description,
          category: question.category,
          weight: question.weight,
          maxScore: question.maxScore,
          order: question.order,
          applicableLevel: levelCode,
          isActive: true,
        },
      });
      questionCount++;
    }
  }
  console.log(`✅ Created ${questionCount} questions for all levels`);

  // Seed Sample Assessments
  console.log('📋 Seeding sample assessments...');

  // 1. Draft template (Admin เป็นเจ้าของ)
  const draftAssessment = await prisma.assessment.create({
    data: {
      title: 'Q1 2024 Performance Review (Draft)',
      description: 'Draft template for assessment',
      assessmentType: 'Annual',
      status: 'Draft',
      isDraft: true,
      targetLevel: 'L2-Operator',
      employeeId: 'SYSADMIN', // Admin is owner for Draft
      assessorId: 'SYSADMIN',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      dueDate: new Date('2024-04-15'),
    },
  });
  console.log(`✅ Created draft assessment: ${draftAssessment.id}`);

  // 2. Assigned assessment สำหรับ EMP003 (พนักงานทำได้)
  const assignedAssessment = await prisma.assessment.create({
    data: {
      title: 'Q1 2024 Performance Review - Bob Johnson',
      description: 'Assigned assessment for Bob Johnson',
      assessmentType: 'Annual',
      status: 'Assigned',
      isDraft: false,
      targetLevel: 'L2-Operator',
      employeeId: 'EMP003',
      assessorId: 'SYSADMIN',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      dueDate: new Date('2024-04-15'),
      assignedAt: new Date(),
    },
  });
  console.log(`✅ Created assigned assessment for EMP003: ${assignedAssessment.id}`);

  // Seed Sample Responses
  console.log('💬 Seeding sample responses...');
  const allQuestions = await prisma.assessmentQuestion.findMany({
    where: {
      applicableLevel: 'L2-Operator',
    },
  });

  let responseCount = 0;
  for (const question of allQuestions) {
    await prisma.assessmentResponse.create({
      data: {
        assessmentId: assignedAssessment.id,
        questionId: question.id,
        questionTitle: question.questionTitle,
        questionWeight: question.weight,
        scoreSelf: Math.floor(Math.random() * 2) + 4, // Random 4-5
        commentSelf: 'ทำงานได้ดีตามเป้าหมาย',
      },
    });
    responseCount++;
  }
  console.log(`✅ Created ${responseCount} responses`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
