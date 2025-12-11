import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
import { getResponsesByAssessment } from '@/actions/responses';
import { getQuestionsByLevel } from '@/actions/questions';
import { notFound } from 'next/navigation';
import { calculateFinalResult, calculateWeightedScore, calculateRank } from '@/lib/score-utils';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

import { auth } from '@/lib/auth';

export default async function AssessmentSummaryPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const currentUser = session?.user as any;
  const isEmployeeView = currentUser?.empCode === (await getAssessments().then(as => as.find(a => a.id === id)?.employeeId));


  // ดึงข้อมูล assessment
  const assessments = await getAssessments();
  const assessment = assessments.find(a => a.id === id);

  if (!assessment) {
    notFound();
  }

  // ดึงข้อมูล employee
  const employees = await getEmployees();
  const employee = employees.find(e => e.empCode === assessment.employeeId);
  const isEmployee = currentUser?.empCode === employee?.empCode;

  if (!employee) {
    return <div className="p-8 text-center text-red-600">Employee not found</div>;
  }

  // ดึงคำถามและคำตอบ
  const questions = await getQuestionsByLevel(employee.assessmentLevel);
  const responses = await getResponsesByAssessment(id);

  // สร้าง map สำหรับหาคำตอบแต่ละคำถาม
  const responseMap = new Map(responses.map(r => [r.questionId, r]));

  // คำนวณคะแนนเฉลี่ย
  const calculateAverageScore = (field: 'scoreSelf' | 'scoreMgr' | 'scoreGm' | 'scoreAppr1' | 'scoreAppr2' | 'scoreAppr3') => {
    const scores = responses
      .map(r => r[field])
      .filter((score): score is number => score !== undefined && score !== null);

    if (scores.length === 0) return null;
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2);
  };

  const avgSelf = calculateAverageScore('scoreSelf');
  const avgAppr1 = calculateAverageScore('scoreAppr1');
  const avgAppr2 = calculateAverageScore('scoreAppr2');
  const avgAppr3 = calculateAverageScore('scoreAppr3');
  // Manager/GM scores are ignored for display as per new requirement

  // Calculate Weighted Scores for Table Footer
  const weightedSelf = calculateWeightedScore(questions, responseMap, 'scoreSelf');
  const weightedAppr1 = calculateWeightedScore(questions, responseMap, 'scoreAppr1');
  const weightedAppr2 = calculateWeightedScore(questions, responseMap, 'scoreAppr2');
  const weightedAppr3 = calculateWeightedScore(questions, responseMap, 'scoreAppr3');
  // Weighted scores for Manager/GM removed

  const rankSelf = weightedSelf ? calculateRank(weightedSelf) : null;
  const rankAppr1 = weightedAppr1 ? calculateRank(weightedAppr1) : null;
  const rankAppr2 = weightedAppr2 ? calculateRank(weightedAppr2) : null;
  const rankAppr3 = weightedAppr3 ? calculateRank(weightedAppr3) : null;


  // Calculate Final Result (Grand Result)
  // Logic: Average of Approver 1, 2, 3 - Warning Penalty
  const grandResult = calculateFinalResult(questions, responses, employee.warningCount);

  // Note: This logic assumes if GM hasn't started, show Manager's result as interim "Grand Result"?
  // Or should we only show if COMPLETED?
  // User wants to see it. So showing best available is likely desired.

  const getScoreColor = (score?: number | string | null) => {
    if (score === undefined || score === null) return 'text-gray-400';
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (numScore >= 4.5) return 'text-green-600';
    if (numScore >= 3.5) return 'text-blue-600';
    if (numScore >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComparison = (score1: string | null, score2: string | null) => {
    if (!score1 || !score2) return null;
    const diff = parseFloat(score2) - parseFloat(score1);
    if (Math.abs(diff) < 0.1) return { icon: Minus, text: 'Same', color: 'text-gray-500' };
    if (diff > 0) return { icon: TrendingUp, text: `+${diff.toFixed(2)}`, color: 'text-green-600' };
    return { icon: TrendingDown, text: diff.toFixed(2), color: 'text-red-600' };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' },
      SUBMITTED_MGR: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'With Manager' },
      SUBMITTED_APPR2: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'With Approver 2' },
      SUBMITTED_GM: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'With GM' },
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/assessments/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Assessment Summary</h1>
              {getStatusBadge(assessment.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {employee.empCode} - {employee.empName_Eng} ({employee.position})
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Overall Scores */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Overall Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {avgSelf && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Self Assessment</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgSelf)}`}>{avgSelf}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
            </div>
          )}
          {avgAppr1 && !isEmployee && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Approver 1</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgAppr1)}`}>{avgAppr1}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
            </div>
          )}
          {avgAppr2 && !isEmployee && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Approver 2</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgAppr2)}`}>{avgAppr2}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
            </div>
          )}
          {avgAppr3 && !isEmployee && (
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Approver 3</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgAppr3)}`}>{avgAppr3}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
            </div>
          )}
          {/* Show Mgr/GM only if they have scores (Legacy support or exceptional cases) */}
          {/* Manager/GM Scores hidden by requirement */}
        </div>
      </Card>

      {/* Detailed Comparison */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Detailed Score Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Question</th>
                <th className="text-center py-3 px-4 bg-blue-50">Self</th>
                {!isEmployee && responses.some(r => r.scoreAppr1 !== null && r.scoreAppr1 !== undefined) && (
                  <th className="text-center py-3 px-4 bg-green-50">Approver 1</th>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr2 !== null && r.scoreAppr2 !== undefined) && (
                  <th className="text-center py-3 px-4 bg-yellow-50">Approver 2</th>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr3 !== null && r.scoreAppr3 !== undefined) && (
                  <th className="text-center py-3 px-4 bg-purple-50">Approver 3</th>
                )}

              </tr>
            </thead>
            <tbody>
              {questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => {
                  const response = responseMap.get(question.id);
                  if (!response) return null;

                  return (
                    <tr key={question.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{question.questionTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Weight: {question.weight}% | Category: {question.category}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`text-lg font-bold ${getScoreColor(response.scoreSelf)}`}>
                          {response.scoreSelf?.toFixed(1) || 'N/A'}
                        </span>
                      </td>
                      {!isEmployee && responses.some(r => r.scoreAppr1 !== null && r.scoreAppr1 !== undefined) && (
                        <td className="text-center py-3 px-4">
                          <span className={`text-lg font-bold ${getScoreColor(response.scoreAppr1)}`}>
                            {response.scoreAppr1?.toFixed(1) || '-'}
                          </span>
                        </td>
                      )}
                      {!isEmployee && responses.some(r => r.scoreAppr2 !== null && r.scoreAppr2 !== undefined) && (
                        <td className="text-center py-3 px-4">
                          <span className={`text-lg font-bold ${getScoreColor(response.scoreAppr2)}`}>
                            {response.scoreAppr2?.toFixed(1) || '-'}
                          </span>
                        </td>
                      )}
                      {!isEmployee && responses.some(r => r.scoreAppr3 !== null && r.scoreAppr3 !== undefined) && (
                        <td className="text-center py-3 px-4">
                          <span className={`text-lg font-bold ${getScoreColor(response.scoreAppr3)}`}>
                            {response.scoreAppr3?.toFixed(1) || '-'}
                          </span>
                        </td>
                      )}

                    </tr>
                  );
                })}
            </tbody>
            <tfoot className="border-t-2 border-primary/20 bg-muted/50 font-semibold">
              <tr>
                <td className="py-3 px-4">Total Weighted Score</td>
                <td className="text-center py-3 px-4">{weightedSelf?.toFixed(2) || '-'}</td>
                {!isEmployee && responses.some(r => r.scoreAppr1 !== null && r.scoreAppr1 !== undefined) && (
                  <td className="text-center py-3 px-4">{weightedAppr1?.toFixed(2) || '-'}</td>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr2 !== null && r.scoreAppr2 !== undefined) && (
                  <td className="text-center py-3 px-4">{weightedAppr2?.toFixed(2) || '-'}</td>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr3 !== null && r.scoreAppr3 !== undefined) && (
                  <td className="text-center py-3 px-4">{weightedAppr3?.toFixed(2) || '-'}</td>
                )}

              </tr>
              <tr>
                <td className="py-3 px-4">Grade (Pre-penalty)</td>
                <td className="text-center py-3 px-4 text-lg text-primary">{rankSelf || '-'}</td>
                {!isEmployee && responses.some(r => r.scoreAppr1 !== null && r.scoreAppr1 !== undefined) && (
                  <td className="text-center py-3 px-4 text-lg text-primary">{rankAppr1 || '-'}</td>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr2 !== null && r.scoreAppr2 !== undefined) && (
                  <td className="text-center py-3 px-4 text-lg text-primary">{rankAppr2 || '-'}</td>
                )}
                {!isEmployee && responses.some(r => r.scoreAppr3 !== null && r.scoreAppr3 !== undefined) && (
                  <td className="text-center py-3 px-4 text-lg text-primary">{rankAppr3 || '-'}</td>
                )}

              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Comments Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Comments & Feedback</h2>
        <div className="space-y-4">
          {questions
            .sort((a, b) => a.order - b.order)
            .map(question => {
              const response = responseMap.get(question.id);
              if (!response) return null;

              const hasComments = response.commentSelf || response.commentMgr ||
                response.commentAppr2 || response.commentGm;

              if (!hasComments) return null;

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{question.questionTitle}</h3>
                  <div className="space-y-3">
                    {response.commentSelf && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-1">Self Comment:</p>
                        <p className="text-sm">{response.commentSelf}</p>
                      </div>
                    )}
                    {response.commentMgr && (
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm font-medium text-green-900 mb-1">Manager Feedback:</p>
                        <p className="text-sm">{response.commentMgr}</p>
                      </div>
                    )}
                    {response.commentAppr2 && (
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-sm font-medium text-yellow-900 mb-1">Approver 2 Feedback:</p>
                        <p className="text-sm">{response.commentAppr2}</p>
                      </div>
                    )}
                    {response.commentGm && (
                      <div className="bg-orange-50 p-3 rounded">
                        <p className="text-sm font-medium text-orange-900 mb-1">GM Feedback:</p>
                        <p className="text-sm">{response.commentGm}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Grand Result & Ranking */}
      {grandResult && (
        <Card className="p-6 border-t-4 border-t-primary">
          <h2 className="text-xl font-bold mb-6">Grand Result</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-muted-foreground">Weighted Total Score</span>
                <span className="font-mono font-bold text-lg">{grandResult.totalScore.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg text-red-700">
                <div>
                  <span className="block font-medium">Warning Penalty</span>
                  <span className="text-xs opacity-75">({employee.warningCount} warning{employee.warningCount !== 1 ? 's' : ''} × 0.5)</span>
                </div>
                <span className="font-mono font-bold text-lg">-{grandResult.warningDeduction.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-bold text-lg text-primary">Final Net Score</span>
                <span className="font-mono font-bold text-2xl text-primary">{grandResult.netScore.toFixed(2)}</span>
              </div>
            </div>

            {/* Rank Badge */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Final Rank</span>
              <div className={`
                w-24 h-24 flex items-center justify-center rounded-full text-5xl font-black shadow-lg
                ${grandResult.rank === 'S' ? 'bg-purple-100 text-purple-600 border-4 border-purple-200' : ''}
                ${grandResult.rank === 'A' ? 'bg-green-100 text-green-600 border-4 border-green-200' : ''}
                ${grandResult.rank === 'B' ? 'bg-blue-100 text-blue-600 border-4 border-blue-200' : ''}
                ${grandResult.rank === 'C' ? 'bg-yellow-100 text-yellow-600 border-4 border-yellow-200' : ''}
                ${grandResult.rank === 'D' ? 'bg-red-100 text-red-600 border-4 border-red-200' : ''}
              `}>
                {grandResult.rank}
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Based on score range:
                {grandResult.rank === 'S' && ' 4.50 - 5.00'}
                {grandResult.rank === 'A' && ' 4.00 - 4.49'}
                {grandResult.rank === 'B' && ' 3.00 - 3.99'}
                {grandResult.rank === 'C' && ' 2.00 - 2.99'}
                {grandResult.rank === 'D' && ' 1.00 - 1.99'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Signature Section (Static Placeholder) */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Signatures</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-8 text-center bg-gray-50/50">
            <div className="w-full border-b border-gray-300 h-16 mb-2"></div>
            <p className="text-sm font-medium">Employee</p>
            <p className="text-xs text-muted-foreground mt-1">Date: ____/____/____</p>
          </div>
          <div className="border rounded-lg p-8 text-center bg-gray-50/50">
            <div className="w-full border-b border-gray-300 h-16 mb-2"></div>
            <p className="text-sm font-medium">Manager</p>
            <p className="text-xs text-muted-foreground mt-1">Date: ____/____/____</p>
          </div>
          <div className="border rounded-lg p-8 text-center bg-gray-50/50">
            <div className="w-full border-b border-gray-300 h-16 mb-2"></div>
            <p className="text-sm font-medium">GM</p>
            <p className="text-xs text-muted-foreground mt-1">Date: ____/____/____</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
