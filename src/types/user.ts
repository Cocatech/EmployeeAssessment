/**
 * User type definitions
 */
export interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  position?: string;
  managerId?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  manager?: User;
  directReports?: User[];
}

/**
 * Employee data from SharePoint Master_Employee list
 */
export interface Employee {
  empCode: string; // Title field
  empName_Eng: string;
  profileImage?: string | null; // URL to profile image
  empName_Thai?: string; // Thai name
  email: string | null;
  phoneNumber?: string; // Contact number
  position: string;
  group: string; // Group code and name (e.g., "11002 : ADM, DRC")
  team?: string; // Team assignment (multiple lines allowed)
  assessmentLevel: string;
  employeeType: 'Permanent' | 'Temporary'; // Staff type
  approver1_ID: string | null;
  approver2_ID: string | null;
  approver3_ID?: string | null; // Optional 3rd approver
  manager_ID?: string | null; // Manager (Applied by Manager)
  gm_ID: string; // GM (Confirmed by GM)
  joinDate: string; // YYYY-MM-DD format
  warningCount: number;
  isActive: boolean;
}

/**
 * Extended User for Dual Authentication
 */
export interface ExtendedUser extends User {
  empCode?: string;
  role?: 'PERMANENT' | 'TEMP_USER' | 'MANAGER' | 'GM' | 'ADMIN';
  employee?: Employee;
}
