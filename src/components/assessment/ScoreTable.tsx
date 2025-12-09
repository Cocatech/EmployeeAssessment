'use client';

import { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { KPIItem } from '@/types';
import { cn } from '@/lib/utils';

interface ScoreTableProps {
  items: KPIItem[];
  role: 'EMPLOYEE' | 'MANAGER' | 'APPROVER2' | 'GM' | 'ADMIN';
  status: string;
  register: UseFormRegister<any>;
  readonly?: boolean;
}

/**
 * Score Table Component with Color Coding and Lock Logic
 * 
 * Color Scheme:
 * - Self Score: Blue (bg-blue-50)
 * - Manager Score: Yellow (bg-yellow-50)
 * - Approver2 Score: Orange (bg-orange-50)
 * - GM Score: Green (bg-green-50)
 * 
 * Lock Logic:
 * - Self Score: Editable only for EMPLOYEE and status = 'DRAFT'
 * - Manager Score: Editable only for MANAGER and status = 'SUBMITTED_MGR'
 * - Approver2 Score: Editable only for APPROVER2 and status = 'SUBMITTED_APPR2'
 * - GM Score: Editable only for GM and status = 'SUBMITTED_GM'
 */
export function ScoreTable({ items, role, status, register, readonly = false }: ScoreTableProps) {
  // Determine which columns are visible based on status
  const showManagerScore = status !== 'DRAFT';
  const showApprover2Score = ['SUBMITTED_APPR2', 'SUBMITTED_GM', 'COMPLETED'].includes(status);
  const showGmScore = ['SUBMITTED_GM', 'COMPLETED'].includes(status);

  // Determine edit permissions
  const canEditSelf = role === 'EMPLOYEE' && status === 'DRAFT' && !readonly;
  const canEditManager = role === 'MANAGER' && status === 'SUBMITTED_MGR' && !readonly;
  const canEditApprover2 = role === 'APPROVER2' && status === 'SUBMITTED_APPR2' && !readonly;
  const canEditGm = role === 'GM' && status === 'SUBMITTED_GM' && !readonly;

  // Calculate totals
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalSelf = items.reduce((sum, item) => sum + (item.scoreSelf || 0) * item.weight, 0);
  const totalMgr = items.reduce((sum, item) => sum + (item.scoreMgr || 0) * item.weight, 0);
  const totalAppr2 = items.reduce((sum, item) => sum + (item.scoreAppr2 || 0) * item.weight, 0);
  const totalGm = items.reduce((sum, item) => sum + (item.scoreGm || 0) * item.weight, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">KPI / Topic</th>
            <th className="border border-gray-300 px-4 py-2 text-center w-20">Weight</th>
            <th className={cn(
              "border border-gray-300 px-4 py-2 text-center w-24",
              "bg-blue-100"
            )}>
              Self Score
            </th>
            {showManagerScore && (
              <th className={cn(
                "border border-gray-300 px-4 py-2 text-center w-24",
                "bg-yellow-100"
              )}>
                Manager Score
              </th>
            )}
            {showApprover2Score && (
              <th className={cn(
                "border border-gray-300 px-4 py-2 text-center w-24",
                "bg-orange-100"
              )}>
                Approver2 Score
              </th>
            )}
            {showGmScore && (
              <th className={cn(
                "border border-gray-300 px-4 py-2 text-center w-24",
                "bg-green-100"
              )}>
                GM Score
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">
                {item.topic}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {item.weight}
              </td>
              
              {/* Self Score Column */}
              <td className={cn(
                "border border-gray-300 px-2 py-2",
                "bg-blue-50"
              )}>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  defaultValue={item.scoreSelf}
                  {...register(`items.${index}.scoreSelf`)}
                  disabled={!canEditSelf}
                  className={cn(
                    "text-center w-full",
                    !canEditSelf && "bg-gray-100 cursor-not-allowed"
                  )}
                />
              </td>

              {/* Manager Score Column */}
              {showManagerScore && (
                <td className={cn(
                  "border border-gray-300 px-2 py-2",
                  "bg-yellow-50"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    defaultValue={item.scoreMgr}
                    {...register(`items.${index}.scoreMgr`)}
                    disabled={!canEditManager}
                    className={cn(
                      "text-center w-full",
                      !canEditManager && "bg-gray-100 cursor-not-allowed"
                    )}
                  />
                </td>
              )}

              {/* Approver2 Score Column */}
              {showApprover2Score && (
                <td className={cn(
                  "border border-gray-300 px-2 py-2",
                  "bg-orange-50"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    defaultValue={item.scoreAppr2}
                    {...register(`items.${index}.scoreAppr2`)}
                    disabled={!canEditApprover2}
                    className={cn(
                      "text-center w-full",
                      !canEditApprover2 && "bg-gray-100 cursor-not-allowed"
                    )}
                  />
                </td>
              )}

              {/* GM Score Column */}
              {showGmScore && (
                <td className={cn(
                  "border border-gray-300 px-2 py-2",
                  "bg-green-50"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    defaultValue={item.scoreGm}
                    {...register(`items.${index}.scoreGm`)}
                    disabled={!canEditGm}
                    className={cn(
                      "text-center w-full",
                      !canEditGm && "bg-gray-100 cursor-not-allowed"
                    )}
                  />
                </td>
              )}
            </tr>
          ))}
          
          {/* Total Row */}
          <tr className="bg-gray-200 font-semibold">
            <td className="border border-gray-300 px-4 py-2">
              Total (Weighted Average)
            </td>
            <td className="border border-gray-300 px-4 py-2 text-center">
              {totalWeight}
            </td>
            <td className="border border-gray-300 px-4 py-2 text-center bg-blue-100">
              {(totalSelf / totalWeight).toFixed(2)}
            </td>
            {showManagerScore && (
              <td className="border border-gray-300 px-4 py-2 text-center bg-yellow-100">
                {(totalMgr / totalWeight).toFixed(2)}
              </td>
            )}
            {showApprover2Score && (
              <td className="border border-gray-300 px-4 py-2 text-center bg-orange-100">
                {(totalAppr2 / totalWeight).toFixed(2)}
              </td>
            )}
            {showGmScore && (
              <td className="border border-gray-300 px-4 py-2 text-center bg-green-100">
                {(totalGm / totalWeight).toFixed(2)}
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Score Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-gray-300"></div>
          <span>Self Assessment</span>
        </div>
        {showManagerScore && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border border-gray-300"></div>
            <span>Manager Review</span>
          </div>
        )}
        {showApprover2Score && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 border border-gray-300"></div>
            <span>Approver2 Review</span>
          </div>
        )}
        {showGmScore && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-gray-300"></div>
            <span>GM Review</span>
          </div>
        )}
      </div>
    </div>
  );
}
