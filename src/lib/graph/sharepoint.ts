import { getGraphClient, SHAREPOINT_SITE_ID } from './client';

/**
 * SharePoint List Operations using Microsoft Graph API
 */

export interface SharePointListItem {
  id: string;
  fields: Record<string, unknown>;
  createdDateTime: string;
  lastModifiedDateTime: string;
}

/**
 * Get all items from a SharePoint list
 */
export async function getListItems(listName: string): Promise<SharePointListItem[]> {
  const client = getGraphClient();
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items`)
      .expand('fields')
      .get();
    
    return response.value;
  } catch (error) {
    console.error(`Error fetching list items from ${listName}:`, error);
    throw error;
  }
}

/**
 * Get a single item from a SharePoint list by ID
 */
export async function getListItem(listName: string, itemId: string): Promise<SharePointListItem> {
  const client = getGraphClient();
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items/${itemId}`)
      .expand('fields')
      .get();
    
    return response;
  } catch (error) {
    console.error(`Error fetching item ${itemId} from ${listName}:`, error);
    throw error;
  }
}

/**
 * Create a new item in a SharePoint list
 */
export async function createListItem(
  listName: string,
  fields: Record<string, unknown>
): Promise<SharePointListItem> {
  const client = getGraphClient();
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items`)
      .post({ fields });
    
    return response;
  } catch (error) {
    console.error(`Error creating item in ${listName}:`, error);
    throw error;
  }
}

/**
 * Update an existing item in a SharePoint list
 */
export async function updateListItem(
  listName: string,
  itemId: string,
  fields: Record<string, unknown>
): Promise<SharePointListItem> {
  const client = getGraphClient();
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items/${itemId}/fields`)
      .patch(fields);
    
    return response;
  } catch (error) {
    console.error(`Error updating item ${itemId} in ${listName}:`, error);
    throw error;
  }
}

/**
 * Delete an item from a SharePoint list
 */
export async function deleteListItem(listName: string, itemId: string): Promise<void> {
  const client = getGraphClient();
  
  try {
    await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items/${itemId}`)
      .delete();
  } catch (error) {
    console.error(`Error deleting item ${itemId} from ${listName}:`, error);
    throw error;
  }
}

/**
 * Employee Master Data Operations
 */

export interface EmployeeData {
  empCode: string;
  empName_Eng: string;
  email: string | null;
  position: string;
  department: string;
  assessmentLevel: string;
  approver1_ID: string;
  approver2_ID: string | null;
  gm_ID: string;
  joinDate: string;
  warningCount: number;
}

/**
 * Get employee by employee code from TRTH_Master_Employee list
 * @param empCode - Employee code (Title field in SharePoint)
 * @returns Employee data or null if not found
 */
export async function getEmployeeByCode(empCode: string): Promise<EmployeeData | null> {
  const client = getGraphClient();
  const listName = 'TRTH_Master_Employee';
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items`)
      .expand('fields')
      .filter(`fields/Title eq '${empCode}'`)
      .get();
    
    if (response.value.length === 0) {
      return null;
    }
    
    const item = response.value[0];
    const fields = item.fields;
    
    return {
      empCode: fields.Title as string,
      empName_Eng: fields.EmpName_Eng as string,
      email: (fields.Email as string) || null,
      position: fields.Position as string,
      department: fields.Department as string,
      assessmentLevel: fields.AssessmentLevel as string,
      approver1_ID: fields.Approver1_ID as string,
      approver2_ID: (fields.Approver2_ID as string) || null,
      gm_ID: fields.GM_ID as string,
      joinDate: fields.JoinDate as string,
      warningCount: (fields.WarningCount as number) || 0,
    };
  } catch (error) {
    console.error(`Error fetching employee ${empCode}:`, error);
    return null;
  }
}

/**
 * Get employee email by employee ID
 * Used for resolving approver emails in workflow
 * @param empId - Employee ID/Code
 * @returns Email address or null if not found
 */
export async function getEmployeeEmail(empId: string): Promise<string | null> {
  const employee = await getEmployeeByCode(empId);
  return employee?.email || null;
}

/**
 * Query employees with filter
 * @param filter - OData filter string
 * @returns Array of employee data
 */
export async function queryEmployees(filter: string): Promise<EmployeeData[]> {
  const client = getGraphClient();
  const listName = 'TRTH_Master_Employee';
  
  try {
    const response = await client
      .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items`)
      .expand('fields')
      .filter(filter)
      .get();
    
    return response.value.map((item: any) => ({
      empCode: item.fields.Title,
      empName_Eng: item.fields.EmpName_Eng,
      email: item.fields.Email || null,
      position: item.fields.Position,
      department: item.fields.Department,
      assessmentLevel: item.fields.AssessmentLevel,
      approver1_ID: item.fields.Approver1_ID,
      approver2_ID: item.fields.Approver2_ID || null,
      gm_ID: item.fields.GM_ID,
      joinDate: item.fields.JoinDate,
      warningCount: item.fields.WarningCount || 0,
    }));
  } catch (error) {
    console.error('Error querying employees:', error);
    return [];
  }
}
