'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Briefcase, Target,
  CheckSquare, FileText, BarChart3, Settings, User,
  Zap, Mail, Package, Database, HelpCircle,
  DollarSign, Calendar, Shield, UserCog, MessageSquare,
  TrendingUp, ClipboardList, Lock, LogOut, ChevronDown,
  AlertTriangle, LockKeyhole, Crown, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole, DEMO_USERS, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles?: UserRole[];
}

interface NavGroup {
  group: string;
  roles?: UserRole[];
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    group: 'MAIN',
    roles: ['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'],
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Leads', href: '/leads', icon: Target, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Contacts', href: '/contacts', icon: Users, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Companies', href: '/companies', icon: Building2, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
      { label: 'Deals', href: '/deals', icon: Briefcase, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    ],
  },
  {
    group: 'WORK',
    roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'],
    items: [
      { label: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Quotations', href: '/quotes', icon: FileText, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Products', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
      { label: 'Communications', href: '/comms', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
      { label: 'Email Templates', href: '/emails', icon: Mail, roles: ['ADMIN', 'MANAGER'] },
      { label: 'Goals & Targets', href: '/goals', icon: TrendingUp, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
    ],
  },
  {
    group: 'HR PORTAL',
    roles: ['ADMIN', 'HR'],
    items: [
      { label: 'HR Dashboard', href: '/hr', icon: UserCog, roles: ['ADMIN', 'HR'] },
      { label: 'Attendance Management', href: '/hr/attendance', icon: Calendar, roles: ['ADMIN', 'HR'] },
      { label: 'Leave Requests Queue', href: '/hr/leaves', icon: CheckSquare, roles: ['ADMIN', 'HR'] },
      { label: 'Salary & Payroll', href: '/hr/salary', icon: DollarSign, roles: ['ADMIN', 'HR'] },
      { label: 'Employees Directory', href: '/hr/employees', icon: Users, roles: ['ADMIN', 'HR'] },
    ],
  },
  {
    group: 'MY ATTENDANCE',
    roles: ['MANAGER', 'TEAM_LEADER', 'SALES_EXEC'],
    items: [
      { label: 'My Attendance Log', href: '/hr/attendance', icon: Calendar, roles: ['MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    ],
  },
  {
    group: 'ADMINISTRATION',
    roles: ['ADMIN'],
    items: [
      { label: 'Plan & Billing', href: '/billing', icon: DollarSign, roles: ['ADMIN'] },
      { label: 'Team Leaders & Managers', href: '/admin/team-leaders', icon: Shield, roles: ['ADMIN'] },
      { label: 'Workflow Setup', href: '/admin/workflow', icon: Zap, roles: ['ADMIN'] },
      { label: 'Custom Fields', href: '/admin/custom-fields', icon: ClipboardList, roles: ['ADMIN'] },
      { label: 'Automations', href: '/automations', icon: Zap, roles: ['ADMIN'] },
      { label: 'Imports', href: '/imports', icon: Database, roles: ['ADMIN'] },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: Lock, roles: ['ADMIN'] },
    ],
  },
  {
    group: 'SYSTEM',
    roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'],
    items: [
      { label: 'App Downloads', href: '/downloads', icon: Layers, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'My Profile', href: '/profile', icon: User, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Help', href: '/help', icon: HelpCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    ],
  },
];

import { useSidebar } from '@/context/SidebarContext';
import { X } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, subscription, canEdit, isSeatExceeded, logout } = useAuth();
  const { mobileOpen, closeMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentNormalizedRole = mounted
    ? normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email))
    : 'ADMIN';

  const filteredNav = navigation
    .filter(group => {
      if (!group.roles) return true;
      const normalizedGroupRoles = group.roles.map(r => normalizeRoleStr(r));
      return normalizedGroupRoles.includes(currentNormalizedRole);
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.roles) return true;
        const normalizedItemRoles = item.roles.map(r => normalizeRoleStr(r));
        return normalizedItemRoles.includes(currentNormalizedRole);
      }),
    }))
    .filter(group => group.items.length > 0);

  const isViewOnly = !canEdit();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={cn('sidebar transition-transform duration-300 z-50', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 mb-1">
          <div className="flex items-center gap-3">
            <img src="/das-logo.png" alt="DAS CRM Logo" className="h-9 w-auto object-contain rounded-lg shadow-md" />
            <div>
              <span className="text-white font-bold text-base tracking-tight">DAS CRM</span>
              <p className="text-xs text-muted font-medium">{subscription.companyName}</p>
            </div>
          </div>
          <button onClick={closeMobile} className="lg:hidden p-1 rounded-lg text-muted hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

      {/* Authenticated User Role Badge (Read-Only) */}
      <div className="px-3 mb-3">
        <div
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
          style={{
            background: 'rgba(99,102,241,0.12)',
            borderColor: 'rgba(99,102,241,0.3)',
            color: 'rgb(129,140,248)',
          }}
        >
          <Shield size={14} className="text-brand-400" />
          <span>ROLE: {currentNormalizedRole}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredNav.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="text-xs font-semibold tracking-widest px-3 mb-1" style={{ color: 'rgb(var(--sidebar-text))' }}>
              {group.group}
            </p>
            {group.items.map((item) => {
              let targetHref = item.href;
              if (item.label === 'Dashboard' || item.href === '/dashboard') {
                if (currentNormalizedRole === 'HR') targetHref = '/hr';
                else if (currentNormalizedRole === 'MANAGER') targetHref = '/dashboard/manager';
                else if (currentNormalizedRole === 'TEAM_LEADER') targetHref = '/dashboard/team-leader';
                else if (currentNormalizedRole === 'SALES_EXEC') targetHref = '/dashboard/sales';
                else if (currentNormalizedRole === 'SUPER_ADMIN') targetHref = '/admin/super';
                else targetHref = '/dashboard';
              }

              const isActive = pathname === targetHref || pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={targetHref} onClick={closeMobile}>
                  <div className={cn('sidebar-item', isActive && 'active')}>
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section with Logout */}
      <div className="border-t mx-2 mb-2 pt-2 space-y-2" style={{ borderColor: 'rgb(var(--sidebar-border))' }}>
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-card transition-colors">
          <Link href="/profile" onClick={closeMobile} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="avatar w-8 h-8 text-xs flex-shrink-0 font-bold">{currentUser.avatar}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-white hover:text-brand-400 transition-colors">{currentUser.name}</p>
              <p className="text-[10px] truncate text-muted" style={{ color: 'rgb(var(--sidebar-text))' }}>{currentUser.email}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              closeMobile();
              logout();
              router.push('/login');
            }}
            title="Sign Out / Switch Workspace"
            className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* 💻 Developer Credit Bar */}
        <div className="px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <a
            href="https://github.com/aditya-k-rai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-300 hover:text-indigo-400 transition-colors"
          >
            <span>💻 Dev: <strong className="text-white">Aditya Kumar Rai</strong></span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">GitHub ↗</span>
          </a>
        </div>
      </div>
    </aside>
    </>
  );
}
