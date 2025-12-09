Module 1: Project Setup & Structure

เป้าหมาย: สร้างโครงโปรเจกต์ Next.js พร้อม Docker และ Library ที่จำเป็น

Prompt:

"Act as a Senior Full Stack Developer. I need to initialize a Next.js 14 project (App Router) for an Employee Assessment System called 'TRTH'.

Stack:

Framework: Next.js 14 (TypeScript)

Styling: Tailwind CSS + Shadcn/UI

Auth: NextAuth.js v5

Backend Logic: Server Actions

Database: SharePoint Online Lists (accessed via Microsoft Graph API)

Containerization: Docker

Tasks:

Provide the package.json dependencies I need to install (include @microsoft/microsoft-graph-client, @azure/identity, next-auth, clsx, tailwind-merge, lucide-react).

Write a production-ready Dockerfile (multi-stage build) and docker-compose.yml for running this Next.js app.

Show me the recommended folder structure for this Hybrid architecture (separating lib, components, app, and types)."

Module 2: SharePoint & Graph API Utility

เป้าหมาย: สร้างไฟล์เชื่อมต่อ SharePoint และฟังก์ชันดึงข้อมูลพนักงาน

Prompt:

"I need a utility file src/lib/graph.ts to handle Microsoft Graph API connections using 'Application Permissions' (Client Credentials Flow).

Configuration:

Use @azure/identity's ClientSecretCredential.

Use environment variables: AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET.

Required Functions:

getGraphClient(): Returns an authenticated Graph client.

getEmployeeByCode(empCode: string): Queries a SharePoint List named 'TRTH_Master_Employee'.

Filter by fields/Title equals empCode.

It must return fields: Title (EmpCode), EmpName_Eng, Email, Position, Department, AssessmentLevel, Approver1_ID, Approver2_ID, GM_ID, JoinDate, WarningCount.

Note: Error handling is important. If the user is not found, return null."

Module 3: Authentication (Dual Strategy)

เป้าหมาย: สร้างระบบ Login 2 แบบ (Microsoft + EmpCode)

Prompt:

"Create the src/auth.ts configuration for NextAuth.js v5 with a Dual Authentication strategy.

Provider 1: Azure AD (Microsoft)

Use AzureADProvider for permanent staff with emails @trth.co.th.

Scope: openid profile email.

Provider 2: Credentials (Temporary Staff)

Inputs: username (EmpCode) and password (JoinDate in 'DDMMYYYY' format).

Logic inside authorize():

Call getEmployeeByCode(credentials.username) from src/lib/graph.ts.

Check if the user exists.

Validate password: Parse the SharePoint JoinDate (YYYY-MM-DD) and check if it matches the input password (DDMMYYYY).

If valid, return a user object { id: empCode, name: empName, email: null, role: 'TEMP_USER' }.

Session Callback:

Ensure the session object includes user.empCode and user.role so I can use them in the frontend."

Module 4: Backend Logic (Smart Skip & Email Lookup)

เป้าหมาย: เขียน Logic การส่งใบประเมินและค้นหา Email หัวหน้าจาก ID

Prompt:

"Write a Next.js Server Action file src/app/actions/assessment.ts to handle the 'Submit Assessment' logic.

Function: submitAssessment(assessmentId: string, currentStatus: string, empCode: string)

Logic Flow:

Fetch the employee profile using getEmployeeByCode(empCode).

Determine Next Status:

If currentStatus is 'DRAFT' -> Next is 'SUBMITTED_MGR'. Target ID is Approver1_ID.

If currentStatus is 'SUBMITTED_MGR':

Check if Approver2_ID exists and is not empty/dash.

IF exists: Next is 'SUBMITTED_APPR2'. Target ID is Approver2_ID.

ELSE (Smart Skip): Next is 'SUBMITTED_GM'. Target ID is GM_ID.

Email Resolution (Crucial):

Take the Target ID determined above.

Call getEmployeeByCode(Target ID) to find that approver's profile.

Extract their Email.

Update SharePoint:

Use Graph API to update the item in 'TRTH_Assessments' list.

Fields to update: Status (Next Status) and Current_Assignee_Email (The resolved email).

Please provide the full TypeScript code for this action."

Module 5: Frontend Component (Score Table)

เป้าหมาย: สร้างตารางคะแนนที่เปลี่ยนสีได้และ Lock ช่องตามสถานะ

Prompt:

"Create a React component src/components/assessment/ScoreTable.tsx using Shadcn UI Table and React Hook Form.

Props:

items: Array of KPI objects (topic, weight, scoreSelf, scoreMgr, scoreGm).

role: Current user role ('EMPLOYEE', 'MANAGER', 'GM').

status: Assessment status.

register: React Hook Form register function.

UI Requirements:

Columns:

Topic & Weight (Always visible).

Self Score: Blue background (bg-blue-50). Always ReadOnly for Manager/GM.

Manager Score: Yellow background (bg-yellow-50). Visible if status is NOT 'DRAFT'. Editable ONLY if role === 'MANAGER' AND status === 'SUBMITTED_MGR'.

GM Score: Green background (bg-green-50). Visible if status is 'SUBMITTED_GM' or 'COMPLETED'. Editable ONLY if role === 'GM' AND status === 'SUBMITTED_GM'.

Styling: Use Tailwind CSS to match the described colors. Center align numerical inputs."

Module 6: Power Automate Flow Logic

เป้าหมาย: สร้าง Flow สำหรับส่งอีเมล (อันนี้ Prompt ถาม AI เพื่อขอขั้นตอนการสร้าง Flow)

Prompt:

"I need to create a Power Automate flow that triggers when a SharePoint List item is modified.

Scenario:

List Name: 'TRTH_Assessments'

Trigger Condition: Only when the Status column changes.

Desired Logic:

Trigger: When an item or file is modified.

Condition: Check if Current_Assignee_Email is not null.

Action: Send an email (V2).

To: Current_Assignee_Email (Dynamic content from the trigger).

Subject: 'Action Required: Assessment for [EmpCode] - [Period]'.

Body: 'Please review the assessment. Click here: https://[MY_APP_URL]/assessment/[ID]'.

Please describe the steps to build this flow or provide the JSON definition for it."