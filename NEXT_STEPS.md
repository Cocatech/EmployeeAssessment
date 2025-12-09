# Next Steps - TRTH Employee Assessment System

## ✅ Completed (Module 1 + Enhanced Features)
- [x] Project structure initialized
- [x] Package.json with all dependencies
- [x] Dockerfile (multi-stage build)
- [x] docker-compose.yml
- [x] TypeScript, Tailwind, ESLint configuration
- [x] Base UI components (Button, Card, Input)
- [x] Layout components (Header, Sidebar)
- [x] Microsoft Graph client setup
- [x] NextAuth.js v5 configuration
- [x] Server Actions for assessments
- [x] Middleware for auth protection
- [x] Type definitions (User, Assessment, API)
- [x] Pushed to GitHub
- [x] **Dual Authentication (Microsoft + EmpCode)**
- [x] **Smart Skip Logic (Auto-skip Approver2 if empty)**
- [x] **Auto Email Resolution (Get email from ID)**
- [x] **Enhanced Types (Employee, KPIItem, Workflow)**
- [x] **Score Table Component (Color-coded, Lock logic)**
- [x] **Power Automate Integration Guide**

---

## 🔄 Module 2: Azure AD & Authentication Setup

### ✅ Completed:
- [x] Dual Authentication Strategy implemented
- [x] Microsoft Entra ID Provider configured
- [x] Credentials Provider for temp staff (EmpCode + JoinDate)
- [x] Session callbacks with extended user data
- [x] Employee lookup from SharePoint

### Tasks Remaining:
1. **Azure Portal Configuration**
   - Create App Registration in Azure AD
   - Configure redirect URIs: 
     - `http://localhost:3000/api/auth/callback/microsoft-entra-id`
     - `http://localhost:3000/api/auth/callback/credentials`
   - Add API permissions: `User.Read`, `Sites.Read.All`, `Sites.ReadWrite.All`
   - Create Client Secret

2. **Fill `.env.local`**
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   AZURE_AD_CLIENT_ID=<from Azure AD>
   AZURE_AD_CLIENT_SECRET=<from Azure AD>
   AZURE_AD_TENANT_ID=<from Azure AD>
   SHAREPOINT_SITE_ID=<from SharePoint>
   ```

3. **Create Auth Pages**
   - `/auth/signin` - Sign in page (with dual login options)
   - `/auth/error` - Error page
   - `/auth/signout` - Sign out confirmation
   - Add toggle between Microsoft and EmpCode login

---

## 🔄 Module 3: SharePoint Lists Setup

### ✅ Completed:
- [x] SharePoint utility functions created
- [x] Employee lookup by code function
- [x] Email resolution function
- [x] Query employees function

### Tasks Remaining:
1. **Create SharePoint Lists**
   
   **TRTH_Master_Employee** (Required fields):
   - Title (Text) - Employee Code
   - EmpName_Eng (Text)
   - Email (Text)
   - Position (Text)
   - Department (Text)
   - AssessmentLevel (Choice)
   - Approver1_ID (Text)
   - Approver2_ID (Text) - *Can be empty/dash*
   - GM_ID (Text)
   - JoinDate (Date) - Format: YYYY-MM-DD
   - WarningCount (Number)
   
   **TRTH_Assessments** (Required fields):
   - Title (Text) - Assessment Title
   - EmpCode (Text)
   - Status (Choice) - DRAFT, SUBMITTED_MGR, SUBMITTED_APPR2, SUBMITTED_GM, COMPLETED, REJECTED
   - Current_Assignee_Email (Text)
   - PeriodStart (Date)
   - PeriodEnd (Date)
   - DueDate (Date)
   - RejectionReason (Multi-line Text)
   - Score (Number)
   
   **TRTH_Questions** (Optional for KPIs):
   - Title (Text) - Topic
   - Weight (Number)
   - Category (Choice)
   - Order (Number)
   
   **TRTH_Responses** (Optional for detailed tracking):
   - AssessmentId (Text)
   - QuestionId (Text)
   - ScoreSelf (Number)
   - ScoreMgr (Number)
   - ScoreAppr2 (Number)
   - ScoreGm (Number)
   - Comments (Multi-line Text)

2. **Get SharePoint Site ID**
   ```
   GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-name}
   ```

3. **Set up Power Automate Flows** (See docs/POWER_AUTOMATE_SETUP.md)
   - Assessment notification flow
   - Completion notification flow
   - Rejection notification flow

---

## 🔄 Module 4: Dashboard & UI

### ✅ Completed:
- [x] Score Table component with color coding
- [x] Lock logic based on role and status
- [x] Weighted average calculation
- [x] Legend for score types

### Tasks Remaining:
1. Complete Sidebar navigation
2. User profile dropdown (show role and empCode)
3. Assessment list page
4. Assessment detail page (integrate ScoreTable)
5. Create assessment form
6. Status badge component
7. Workflow progress indicator

---

## 🔄 Module 5: Assessment Workflow

### ✅ Completed:
- [x] submitAssessment Server Action with Smart Skip Logic
- [x] rejectAssessment Server Action
- [x] Auto Email Resolution
- [x] Status transition logic

### Tasks Remaining:
1. Self-assessment form UI
2. Manager review page
3. Approver2 review page (conditional)
4. GM review page
5. Comments & feedback sections
6. Submit/Reject buttons with confirmations
7. Email notification integration testing

---

## 🔜 Module 6: Reports & Analytics

### Tasks:
1. Performance charts
2. Department summary
3. Trend analysis
4. Export to Excel/PDF

---

## 🔜 Module 7: Docker Deployment

### Tasks:
1. Build Docker image
2. Test locally with docker-compose
3. Deploy to production server

---

## Commands Reference

```bash
# Development
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Docker
docker-compose up -d
```

---

*Last updated: December 8, 2025*
