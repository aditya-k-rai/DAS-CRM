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
  const { currentUser, subscription, canEdit, isSeatExceeded, switchRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();

  const normalizeRole = (r?: string): string => {
    const norm = (r || '').toString().trim().toUpperCase();
    if (norm === 'EMPLOYEE' || norm === 'STAFF' || norm === 'REP' || norm === 'EXECUTIVE' || norm === 'SALES_REP') return 'SALES_EXEC';
    if (norm === 'TL' || norm === 'LEAD') return 'TEAM_LEADER';
    if (norm === 'OWNER' || norm === 'TENANT_ADMIN' || norm === 'COMPANY_ADMIN') return 'ADMIN';
    if (norm === 'SUPERADMIN' || norm === 'SYSTEM_ADMIN') return 'SUPER_ADMIN';
    if (norm === 'HR_MANAGER' || norm === 'HUMAN_RESOURCES') return 'HR';
    if (norm === 'DEPT_MANAGER' || norm === 'SALES_MANAGER') return 'MANAGER';
    return norm;
  };

  const currentNormalizedRole = normalizeRole(rawRole);

  const filteredNav = navigation
    .filter(group => {
      if (!group.roles) return true;
      const normalizedGroupRoles = group.roles.map(r => normalizeRole(r));
      return normalizedGroupRoles.includes(currentNormalizedRole);
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.roles) return true;
        const normalizedItemRoles = item.roles.map(r => normalizeRole(r));
        return normalizedItemRoles.includes(currentNormalizedRole);
      }),
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

      {/* Interactive Role Perspective Switcher Dropdown */}
      <div className="px-3 mb-3 relative">
        <button
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-brand/20"
          style={{
            background: 'rgba(99,102,241,0.15)',
            borderColor: 'rgba(99,102,241,0.4)',
            color: 'rgb(129,140,248)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-brand-400" />
            <span>ROLE: {currentNormalizedRole}</span>
          </div>
          <ChevronDown size={14} className={`transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {roleDropdownOpen && (
          <div className="absolute left-3 right-3 top-11 z-50 p-2 rounded-2xl bg-card border border-brand/40 shadow-2xl space-y-1 animate-scale-in">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted px-2 py-1">
              Switch Workspace Perspective
            </p>
            {[
              { role: 'SUPER_ADMIN' as UserRole, label: '👑 Super Admin Portal' },
              { role: 'ADMIN' as UserRole, label: '🏢 Tenant Admin Dashboard' },
              { role: 'MANAGER' as UserRole, label: '👔 Department Manager' },
              { role: 'TEAM_LEADER' as UserRole, label: '🛡️ Team Leader Unit' },
              { role: 'HR' as UserRole, label: '📋 HR & Payroll' },
              { role: 'SALES_EXEC' as UserRole, label: '💼 Sales Exec (Employee)' },
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => {
                  switchRole(item.role);
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  currentNormalizedRole === item.role
                    ? 'bg-brand/25 text-brand-300 border border-brand/40'
                    : 'text-muted hover:text-white hover:bg-background'
                }`}
              >
                <span>{item.label}</span>
                {currentNormalizedRole === item.role && <span className="text-emerald-400 text-[10px]">ACTIVE</span>}
              </button>
            ))}
          </div>
        )}
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
