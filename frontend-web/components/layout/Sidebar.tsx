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

const ROLE_NAV_GROUPS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['SUPER ADMIN', 'MAIN', 'WORK', 'HR PORTAL', 'ADMIN', 'SYSTEM'],
  ADMIN:       ['MAIN', 'WORK', 'HR PORTAL', 'ADMIN', 'SYSTEM'],
  HR:          ['MAIN', 'WORK', 'HR PORTAL', 'SYSTEM'],
  MANAGER:     ['MAIN', 'WORK', 'SYSTEM'],
  TEAM_LEADER: ['MAIN', 'WORK', 'SYSTEM'],
  SALES_EXEC:  ['MAIN', 'WORK', 'SYSTEM'],
};

const navigation = [
  {
    group: 'SUPER ADMIN',
    items: [
      { label: 'Administrative Portal', href: '/admin/super', icon: Crown },
    ],
  },
  {
    group: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Leads', href: '/leads', icon: Target },
      { label: 'Contacts', href: '/contacts', icon: Users },
      { label: 'Companies', href: '/companies', icon: Building2 },
      { label: 'Deals', href: '/deals', icon: Briefcase },
    ],
  },
  {
    group: 'WORK',
    items: [
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
      { label: 'Quotations', href: '/quotes', icon: FileText },
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Communications', href: '/comms', icon: MessageSquare },
      { label: 'Email Templates', href: '/emails', icon: Mail },
      { label: 'Goals & Targets', href: '/goals', icon: TrendingUp },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    group: 'HR PORTAL',
    items: [
      { label: 'HR Dashboard', href: '/hr', icon: UserCog },
      { label: 'Attendance', href: '/hr/attendance', icon: Calendar },
      { label: 'Leave Requests', href: '/hr/leaves', icon: CheckSquare },
      { label: 'Salary & Payroll', href: '/hr/salary', icon: DollarSign },
      { label: 'Employees', href: '/hr/employees', icon: Users },
    ],
  },
  {
    group: 'ADMIN',
    items: [
      { label: 'Team Leaders & Managers', href: '/admin/team-leaders', icon: Shield },
      { label: 'Workflow Setup', href: '/admin/workflow', icon: Zap },
      { label: 'Custom Fields', href: '/admin/custom-fields', icon: ClipboardList },
      { label: 'Automations', href: '/automations', icon: Zap },
      { label: 'Imports', href: '/imports', icon: Database },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: Lock },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, subscription, switchRole, toggleScenario, canEdit, isSeatExceeded } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const allowedGroups = ROLE_NAV_GROUPS[currentUser.role] || ROLE_NAV_GROUPS.ADMIN;
  const filteredNav = navigation.filter(g => allowedGroups.includes(g.group));

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
