
export interface ScoreResult {
    totalScore: number;
    weightedScore?: number;
    rank: 'S' | 'A' | 'B' | 'C' | 'D';
    warningDeduction: number;
    netScore: number;
}

export const WARNING_PENALTY_PER_COUNT = 0.5; // Configurable penalty per warning

export function calculateRank(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 4.50) return 'S';
    if (score >= 4.00) return 'A';
    if (score >= 3.00) return 'B';
    if (score >= 2.00) return 'C';
    return 'D';
}

export function calculateWeightedScore(
    questions: { id: string; weight: number }[],
    responses: Map<string, any>,
    field: string // e.g. 'scoreGm'
): number | null {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let hasScore = false;

    questions.forEach((q) => {
        const resp = responses.get(q.id);
        // Explicitly check for generic object access
        const scoreVal = resp ? (resp as any)[field] : undefined;

        if (scoreVal !== undefined && scoreVal !== null) {
            totalWeightedScore += scoreVal * (q.weight / 100);
            totalWeight += q.weight;
            hasScore = true;
        }
    });

    if (!hasScore) return null;

    // Normalize if total weight (of answered questions) is not 100?
    // Usually we assume full completion.
    // If partial, we might want to scale up? 
    // For now, assume simple sum of weighted parts. 
    // If questions define 100%, and all answered, sum is correct.

    return parseFloat(totalWeightedScore.toFixed(2));
}

export function calculateFinalResult(
    questions: { id: string; weight: number }[],
    responses: any[], // Array of responses
    warningCount: number
    // field parameter removed
): ScoreResult | null {

    const responseMap = new Map(responses.map(r => [r.questionId, r]));

    // Calculate Weighted Scores for all Approvers
    const s1 = calculateWeightedScore(questions, responseMap, 'scoreAppr1');
    const s2 = calculateWeightedScore(questions, responseMap, 'scoreAppr2');
    const s3 = calculateWeightedScore(questions, responseMap, 'scoreAppr3');

    // Filter out null scores (approvers who haven't scored)
    const validScores = [s1, s2, s3].filter((s): s is number => s !== null);

    if (validScores.length === 0) return null;

    // Calculate Average of Valid Scores
    const sumScore = validScores.reduce((a, b) => a + b, 0);
    const avgScore = sumScore / validScores.length;
    const baseScore = parseFloat(avgScore.toFixed(2));

    const warningDeduction = warningCount * WARNING_PENALTY_PER_COUNT;
    const netScore = Math.max(0, parseFloat((baseScore - warningDeduction).toFixed(2))); // Ensure not negative

    return {
        totalScore: baseScore,
        weightedScore: baseScore,
        warningDeduction,
        netScore,
        rank: calculateRank(netScore)
    };
}
