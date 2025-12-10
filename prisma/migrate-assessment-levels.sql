-- Migration script to update assessmentLevel values
-- Run this if you have existing employees with old assessment level values

UPDATE employees 
SET "assessmentLevel" = CASE
  WHEN "assessmentLevel" = 'Management' THEN 'L6-Management'
  WHEN "assessmentLevel" = 'Supervise' THEN 'L4-Supervise'
  WHEN "assessmentLevel" = 'Operate' THEN 'L2-Operator'
  WHEN "assessmentLevel" = 'Interpreter' THEN 'L5-Interpreter'
  WHEN "assessmentLevel" = 'General' THEN 'L3-General'
  ELSE "assessmentLevel"
END
WHERE "assessmentLevel" IN ('Management', 'Supervise', 'Operate', 'Interpreter', 'General');

-- Verify the update
SELECT "assessmentLevel", COUNT(*) as count
FROM employees
GROUP BY "assessmentLevel"
ORDER BY "assessmentLevel";
