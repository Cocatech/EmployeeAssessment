/**
 * Database Query Helpers
 * Helper functions สำหรับ common database queries
 */

import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Employee Queries
// ============================================

export async function findEmployeeByCode(empCode: string) {
  return prisma.employee.findUnique({
    where: { empCode },
    include: {
      user: true, // Include linked user
    }
  });
}

export async function findEmployeeByEmail(email: string) {
  return prisma.employee.findFirst({
    where: { email },
  });
}

export async function findActiveEmployees(params?: {
  group?: string;
  employeeType?: string;
  search?: string;
}) {
  const where: Prisma.EmployeeWhereInput = {
    isActive: true,
  };

  if (params?.group) {
    where.group = { contains: params.group };
  }

  if (params?.employeeType) {
    where.employeeType = params.employeeType;
  }

  if (params?.search) {
    where.OR = [
      { empCode: { contains: params.search, mode: 'insensitive' } },
      { empName_Eng: { contains: params.search, mode: 'insensitive' } },
      { empName_Thai: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return prisma.employee.findMany({
    where,
    orderBy: { empCode: 'asc' },
  });
}

// ============================================
// Assessment Queries
// ============================================

export async function findAssessmentById(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      employee: true,
      assessor: true,
      responses: {
        include: {
          question: true,
        },
      },
    },
  });
}

export async function findAssessmentsByEmployee(empCode: string) {
  return prisma.assessment.findMany({
    where: { employeeId: empCode },
    include: {
      employee: true,
      assessor: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findAssessmentsByPeriod(year: number, quarter: number) {
  const startDate = new Date(year, (quarter - 1) * 3, 1);
  const endDate = new Date(year, quarter * 3, 0);

  return prisma.assessment.findMany({
    where: {
      periodStart: { gte: startDate },
      periodEnd: { lte: endDate },
    },
    include: {
      employee: true,
      assessor: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findPendingAssessments() {
  return prisma.assessment.findMany({
    where: {
      status: { in: ['Pending', 'InProgress'] },
    },
    include: {
      employee: true,
      assessor: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Question Queries
// ============================================

export async function findQuestionsByLevel(assessmentLevel: string) {
  return prisma.assessmentQuestion.findMany({
    where: {
      applicableLevel: assessmentLevel,
      isActive: true,
    },
    orderBy: [
      { category: 'asc' },
      { order: 'asc' },
    ],
  });
}

export async function findQuestionsByCategory(category: string) {
  return prisma.assessmentQuestion.findMany({
    where: {
      category,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });
}

// ============================================
// Response Queries
// ============================================

export async function findResponsesByAssessment(assessmentId: string) {
  return prisma.assessmentResponse.findMany({
    where: { assessmentId },
    include: {
      question: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ============================================
// Statistics Queries
// ============================================

export async function getEmployeeStatistics() {
  const total = await prisma.employee.count({
    where: { isActive: true },
  });

  const byType = await prisma.employee.groupBy({
    by: ['employeeType'],
    where: { isActive: true },
    _count: true,
  });

  const byLevel = await prisma.employee.groupBy({
    by: ['assessmentLevel'],
    where: { isActive: true },
    _count: true,
  });

  return {
    total,
    byType,
    byLevel,
  };
}

export async function getAssessmentStatistics(year?: number, quarter?: number) {
  const where: Prisma.AssessmentWhereInput = {};

  if (year && quarter) {
    const startDate = new Date(year, (quarter - 1) * 3, 1);
    const endDate = new Date(year, quarter * 3, 0);
    where.periodStart = { gte: startDate };
    where.periodEnd = { lte: endDate };
  }

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
    total,
    byStatus,
    avgScore: avgScore._avg.score || 0,
    avgFinalScore: avgScore._avg.finalScore || 0,
  };
}
