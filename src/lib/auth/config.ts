import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';

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
    // Provider 1: Microsoft Entra ID for permanent staff (disabled for development)
    ...(process.env.AZURE_AD_CLIENT_ID ? [
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
        authorization: {
          params: {
            scope: 'openid profile email User.Read',
          },
        },
      })
    ] : []),
    
    // Provider 2: Credentials for User authentication
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Email or Employee Code', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Import bcrypt and prisma
          const bcrypt = await import('bcryptjs');
          const { prisma } = await import('@/lib/db');
          
          // Try to find user by email or empCode
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.username as string },
                { empCode: credentials.username as string },
              ],
            },
            include: {
              employee: true,
            },
          });
          
          if (!user || !user.isActive) {
            console.error('User not found or inactive:', credentials.username);
            return null;
          }

          // Validate password using bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.username);
            return null;
          }

          // Return user object
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            empCode: user.empCode || undefined,
            role: user.role,
            userType: user.userType,
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
        token.role = (user as any).role || 'EMPLOYEE';
        token.userType = (user as any).userType || 'EMPLOYEE';
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
        (session.user as any).userType = token.userType;
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
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // Update session every 1 hour
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
