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

      {/* Structure Scenario Indicator Badge */}
      <div className="px-3 mb-2">
        <button
          onClick={() => toggleScenario(!subscription.hasTeamLeaders)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all"
          style={{
            background: subscription.hasTeamLeaders ? 'rgba(99,102,241,0.12)' : 'rgba(34,197,94,0.12)',
            borderColor: subscription.hasTeamLeaders ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.3)',
            color: subscription.hasTeamLeaders ? 'rgb(129,140,248)' : 'rgb(34,197,94)',
          }}
          title="Click to toggle between Scenario A (With TL) and Scenario B (Without TL)"
        >
          <div className="flex items-center gap-1.5">
            <Layers size={12} />
            <span>{subscription.hasTeamLeaders ? 'SCENARIO A: WITH TL' : 'SCENARIO B: WITHOUT TL'}</span>
          </div>
          <span className="underline text-[9px]">Toggle</span>
        </button>
      </div>

      {/* Subscription Plan Status Banners */}
      <div className="px-3 mb-2 space-y-1.5">
        {subscription.planType === 'FREE_TRIAL' && !subscription.isExpired && (
          <div className="px-3 py-2 rounded-xl border text-[11px] font-semibold bg-amber-500/10 border-amber-500/30 text-amber-300">
            <div className="flex items-center justify-between font-bold mb-0.5">
              <span>30-Day Free Trial</span>
              <span>{subscription.trialDaysLeft}d left</span>
            </div>
            <p className="text-[10px] text-amber-400/80 leading-tight">WhatsApp & Email locked in trial.</p>
          </div>
        )}

        {isViewOnly && (
          <div className="px-3 py-2 rounded-xl border text-[11px] font-bold bg-red-500/15 border-red-500/40 text-red-400 flex items-center gap-2">
            <LockKeyhole size={14} className="flex-shrink-0" />
            <div>
              <p className="leading-tight">View-Only Mode Active</p>
              <p className="text-[10px] font-normal text-red-300">30-Day Trial Expired. Upgrade plan.</p>
            </div>
          </div>
        )}

        {isSeatExceeded && (
          <div className="px-3 py-2 rounded-xl border text-[11px] font-bold bg-red-500/15 border-red-500/40 text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <div>
              <p className="leading-tight">Seat Limit Exceeded</p>
              <p className="text-[10px] font-normal text-red-300">
                {subscription.userSeatsUsed} / {subscription.userSeatsAllocated} seats used. Upgrade Plan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Role Switcher dropdown */}
      <div className="px-3 mb-3 relative">
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all"
          style={{
            background: 'rgba(99,102,241,0.12)',
            borderColor: 'rgba(99,102,241,0.3)',
            color: 'rgb(129,140,248)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield size={13} />
            <span>ROLE: {currentUser.role}</span>
          </div>
          <ChevronDown size={13} className={`transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {roleMenuOpen && (
          <div
            className="absolute left-3 right-3 top-10 z-50 rounded-xl shadow-2xl border p-1 space-y-1 animate-scale-in"
            style={{ background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))' }}
          >
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1">Switch Role View</p>
            {(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => { switchRole(role); setRoleMenuOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${currentUser.role === role ? 'bg-brand/20 text-brand-400 font-bold' : 'text-muted hover:text-white hover:bg-muted/20'}`}
              >
                <span>{role}</span>
                {currentUser.role === role && <span>✓</span>}
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
