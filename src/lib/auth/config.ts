import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';
import { getEmployeeByCode } from '@/lib/graph/sharepoint';

/**
 * Validate temporary staff credentials
 * Password format: DDMMYYYY (JoinDate)
 */
function validateTempStaffPassword(joinDate: string, password: string): boolean {
  try {
    // joinDate format: YYYY-MM-DD
    const [year, month, day] = joinDate.split('-');
    const expectedPassword = `${day}${month}${year}`;
    return password === expectedPassword;
  } catch (error) {
    return false;
  }
}

/**
 * NextAuth.js v5 Configuration
 * Dual Authentication Strategy:
 * 1. Microsoft Entra ID (Azure AD) for permanent staff
 * 2. Credentials (EmpCode + JoinDate) for temporary staff
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // Provider 1: Microsoft Entra ID for permanent staff
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
    
    // Provider 2: Credentials for temporary staff
    Credentials({
      id: 'credentials',
      name: 'Employee Code',
      credentials: {
        username: { label: 'Employee Code', type: 'text' },
        password: { label: 'Password (DDMMYYYY)', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Fetch employee data from SharePoint
          const employee = await getEmployeeByCode(credentials.username as string);
          
          if (!employee) {
            console.error('Employee not found:', credentials.username);
            return null;
          }

          // Validate password (JoinDate in DDMMYYYY format)
          const isValidPassword = validateTempStaffPassword(
            employee.joinDate,
            credentials.password as string
          );

          if (!isValidPassword) {
            console.error('Invalid password for employee:', credentials.username);
            return null;
          }

          // Return user object for temporary staff
          return {
            id: employee.empCode,
            name: employee.empName_Eng,
            email: employee.email || `${employee.empCode}@temp.trth.co.th`,
            empCode: employee.empCode,
            role: 'TEMP_USER',
            department: employee.department,
            position: employee.position,
          };
        } catch (error) {
          console.error('Error during credentials authentication:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      
      if (isOnDashboard || isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      
      return true;
    },
    async jwt({ token, account, profile, user }) {
      // First time JWT is created (sign in)
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
        token.empCode = (user as any).empCode;
        token.role = (user as any).role || 'PERMANENT';
        token.department = (user as any).department;
        token.position = (user as any).position;
      }
      
      // For Azure AD, use profile.sub as ID
      if (account && profile) {
        token.id = profile.sub;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).empCode = token.empCode;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
        (session.user as any).position = token.position;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
