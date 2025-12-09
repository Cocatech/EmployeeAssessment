# Power Automate Integration Guide

## Overview
This document describes how to set up Power Automate flows to automatically send email notifications when assessment statuses change in SharePoint.

## Flow Configuration

### Prerequisites
- Access to Power Automate
- SharePoint site with `TRTH_Assessments` list
- Proper permissions to create flows

---

## Flow 1: Assessment Notification Email

### Trigger
**When an item or file is modified** (SharePoint)
- Site Address: Your SharePoint site URL
- List Name: `TRTH_Assessments`

### Condition
Check if `Current_Assignee_Email` is not empty
```
Condition: Current_Assignee_Email is not equal to null
AND
Status changed from previous value
```

### Action: Send Email (V2)
**To:** `Current_Assignee_Email` (Dynamic content from trigger)

**Subject:**
```
Action Required: Assessment for [EmpCode] - [Period]
```

**Body:**
```html
<p>Dear Team Member,</p>

<p>You have a new assessment assigned for your review.</p>

<p><strong>Details:</strong></p>
<ul>
  <li>Employee Code: [EmpCode]</li>
  <li>Assessment Period: [PeriodStart] to [PeriodEnd]</li>
  <li>Current Status: [Status]</li>
  <li>Due Date: [DueDate]</li>
</ul>

<p><strong>Action Required:</strong></p>
<p>Please review the assessment by clicking the link below:</p>
<p><a href="https://[YOUR_APP_URL]/dashboard/assessments/[ID]">View Assessment</a></p>

<p>If you have any questions, please contact HR.</p>

<br>
<p>Best regards,<br>
TRTH HR System</p>
```

### Dynamic Content Mapping
- `[EmpCode]` → `Title` or custom field
- `[PeriodStart]` → `PeriodStart` field
- `[PeriodEnd]` → `PeriodEnd` field
- `[Status]` → `Status` field
- `[DueDate]` → `DueDate` field
- `[ID]` → `ID` field
- `[YOUR_APP_URL]` → Replace with your actual app URL

---

## Flow 2: Assessment Completion Notification

### Trigger
**When an item or file is modified** (SharePoint)
- Site Address: Your SharePoint site URL
- List Name: `TRTH_Assessments`

### Condition
Check if Status equals "COMPLETED"
```
Condition: Status is equal to COMPLETED
```

### Action: Send Email to Employee
**To:** Get email from Employee lookup

**Subject:**
```
Your Assessment is Complete - [Period]
```

**Body:**
```html
<p>Dear [EmployeeName],</p>

<p>Your performance assessment for the period [PeriodStart] to [PeriodEnd] has been completed.</p>

<p><strong>Final Score:</strong> [FinalScore]</p>

<p>You can view the complete assessment details here:</p>
<p><a href="https://[YOUR_APP_URL]/dashboard/assessments/[ID]">View Your Assessment</a></p>

<p>If you have any questions or concerns about your assessment, please schedule a meeting with your manager.</p>

<br>
<p>Best regards,<br>
TRTH HR Department</p>
```

---

## Flow 3: Assessment Rejection Notification

### Trigger
**When an item or file is modified** (SharePoint)
- Site Address: Your SharePoint site URL
- List Name: `TRTH_Assessments`

### Condition
Check if RejectionReason is not empty
```
Condition: RejectionReason is not equal to null
AND
RejectionReason is not equal to empty string
```

### Action: Send Email
**To:** `Current_Assignee_Email`

**Subject:**
```
Assessment Returned for Revision - [EmpCode]
```

**Body:**
```html
<p>Dear Team Member,</p>

<p>An assessment has been returned for revision.</p>

<p><strong>Details:</strong></p>
<ul>
  <li>Employee Code: [EmpCode]</li>
  <li>Current Status: [Status]</li>
  <li>Reason: [RejectionReason]</li>
</ul>

<p>Please review and resubmit:</p>
<p><a href="https://[YOUR_APP_URL]/dashboard/assessments/[ID]">View Assessment</a></p>

<br>
<p>Best regards,<br>
TRTH HR System</p>
```

---

## JSON Definition (Export/Import)

To quickly set up the flow, you can use this template:

```json
{
  "definition": {
    "triggers": {
      "When_an_item_or_a_file_is_modified": {
        "type": "ApiConnection",
        "inputs": {
          "host": {
            "connection": {
              "name": "@parameters('$connections')['sharepointonline']['connectionId']"
            }
          },
          "method": "get",
          "path": "/datasets/@{encodeURIComponent(encodeURIComponent('YOUR_SITE_URL'))}/tables/@{encodeURIComponent(encodeURIComponent('TRTH_Assessments'))}/onupdateditems"
        }
      }
    },
    "actions": {
      "Condition": {
        "type": "If",
        "expression": {
          "and": [
            {
              "not": {
                "equals": [
                  "@triggerBody()?['Current_Assignee_Email']",
                  "@null"
                ]
              }
            }
          ]
        },
        "actions": {
          "Send_an_email_(V2)": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['office365']['connectionId']"
                }
              },
              "method": "post",
              "body": {
                "To": "@triggerBody()?['Current_Assignee_Email']",
                "Subject": "Action Required: Assessment for @{triggerBody()?['EmpCode']}",
                "Body": "<p>Your action is required...</p>"
              },
              "path": "/v2/Mail"
            }
          }
        }
      }
    }
  }
}
```

---

## Setup Steps

1. **Go to Power Automate** (https://make.powerautomate.com)

2. **Create a new automated cloud flow**
   - Choose trigger: "When an item or file is modified (SharePoint)"
   - Select your site and list

3. **Add Condition**
   - Check if `Current_Assignee_Email` is not null

4. **Add Send Email action**
   - Use Office 365 Outlook connector
   - Configure email template

5. **Test the flow**
   - Modify an item in SharePoint
   - Check if email is sent correctly

6. **Save and activate**

---

## Environment Variables

Make sure to update these in your flow:
- `YOUR_SITE_URL` - Your SharePoint site URL
- `YOUR_APP_URL` - Your TRTH application URL (e.g., https://trth-assessment.azurewebsites.net)

---

## Troubleshooting

### Email not sending
- Check if `Current_Assignee_Email` field has a valid email
- Verify Office 365 connection is authorized
- Check flow run history for errors

### Wrong recipient
- Verify the Auto Email Resolution function is working correctly in the app
- Check SharePoint list data for correct email addresses

### Duplicate emails
- Add a condition to check if status actually changed
- Use "Get previous item" action to compare values

---

## Notes

- The flow runs automatically when SharePoint items are modified
- Make sure the service account has proper permissions
- Consider adding error handling and logging
- Test thoroughly in a development environment first

---

*Last updated: December 9, 2025*
