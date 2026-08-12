'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Briefcase, Target,
  CheckSquare, FileText, BarChart3, Settings,
  Zap, Mail, Package, Database, HelpCircle,
  DollarSign, Calendar, Shield, UserCog, MessageSquare,
  TrendingUp, ClipboardList, Lock, LogOut, ChevronDown,
  AlertTriangle, LockKeyhole, Crown, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole, DEMO_USERS } from '@/context/AuthContext';
import { useState } from 'react';

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
    group: 'SUPER ADMIN',
    roles: ['SUPER_ADMIN'],
    items: [
      { label: 'Administrative Portal', href: '/admin/super', icon: Crown, roles: ['SUPER_ADMIN'] },
    ],
  },
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
    roles: ['ADMIN', 'HR', 'SALES_EXEC'],
    items: [
      { label: 'HR Dashboard', href: '/hr', icon: UserCog, roles: ['ADMIN', 'HR'] },
      { label: 'Attendance', href: '/hr/attendance', icon: Calendar, roles: ['ADMIN', 'HR', 'SALES_EXEC', 'TEAM_LEADER', 'MANAGER'] },
      { label: 'Leave Requests', href: '/hr/leaves', icon: CheckSquare, roles: ['ADMIN', 'HR', 'SALES_EXEC', 'TEAM_LEADER', 'MANAGER'] },
      { label: 'Salary & Payroll', href: '/hr/salary', icon: DollarSign, roles: ['ADMIN', 'HR'] },
      { label: 'Employees', href: '/hr/employees', icon: Users, roles: ['ADMIN', 'HR'] },
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
      { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
      { label: 'Help', href: '/help', icon: HelpCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, subscription, canEdit, isSeatExceeded } = useAuth();

  const userRole = currentUser.role;

  const filteredNav = navigation
    .filter(group => !group.roles || group.roles.includes(userRole))
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.includes(userRole)),
    }))
    .filter(group => group.items.length > 0);

  const isViewOnly = !canEdit();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">NexCRM</span>
          <p className="text-xs text-muted font-medium">{subscription.companyName}</p>
        </div>
      </div>

      {/* User Role Badge */}
      <div className="px-3 mb-3">
        <div
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold"
          style={{
            background: 'rgba(99,102,241,0.12)',
            borderColor: 'rgba(99,102,241,0.3)',
            color: 'rgb(129,140,248)',
          }}
        >
          <Shield size={14} />
          <span>ROLE: {currentUser.role}</span>
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
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
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

      {/* User section */}
      <div className="border-t mx-2 mb-2" style={{ borderColor: 'rgb(var(--sidebar-border))' }}>
        <div className="sidebar-item mt-2 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="avatar w-8 h-8 text-xs flex-shrink-0">{currentUser.avatar}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--sidebar-text-active))' }}>{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgb(var(--sidebar-text))' }}>{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
