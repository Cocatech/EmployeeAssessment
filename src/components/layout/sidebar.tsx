'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  UserCog,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  requirePermission?: boolean; // General HR permissions
  requireSysAdmin?: boolean; // [NEW] Strict SYSADMIN only
}

interface SidebarProps {
  logoUrl?: string; // Add optional prop
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/employees', label: 'Employees', icon: Users, requirePermission: true },
  { href: '/dashboard/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/dashboard/delegations', label: 'Delegations', icon: UserCog, requirePermission: true },
  { href: '/dashboard/audit', label: 'Audit Logs', icon: ShieldAlert, requireSysAdmin: true }, // [NEW]
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, requirePermission: true },
];

export function Sidebar({ logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    // Check permissions
    const checkPermissions = async () => {
      const currentUser = session?.user as any;
      const role = currentUser?.role;
      const userType = currentUser?.userType;

      const isSysAdmin = userType === 'SYSTEM_ADMIN';
      const isAdminOrHr = isSysAdmin || role === 'HR';

      // Filter items based on permissions
      const filtered = allNavItems.filter(item => {
        if (item.requireSysAdmin) return isSysAdmin;
        if (item.requirePermission) return isAdminOrHr;
        return true;
      });

      setNavItems(filtered);
    };

    if (session) {
      checkPermissions();
    }
  }, [session]);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            {logoUrl ? (
              <div className="relative w-32 h-10">
                <Image src={logoUrl} alt="Logo" fill className="object-contain object-left" />
              </div>
            ) : (
              <span className="text-xl font-bold text-primary">TRTH</span>
            )}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
