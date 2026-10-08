'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, Package, Receipt, MessageSquare,
  MessageCircle, Mail, Sparkles, FileText, GitBranch,
  BarChart3, Zap, Database, Briefcase, TrendingUp,
  UserCheck, Radio, Settings, Building2, HelpCircle, Info,
  Shield, LogOut, PanelLeftClose, PanelLeft, X, Calendar,
  Share2, UserX, Clock, Phone, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, normalizeRoleStr, inferRoleFromEmail, UserRole } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export interface NavSubItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  upcoming?: boolean;
  dividerAfter?: boolean;
  roles?: UserRole[];
  moduleKey?: string;
  subItems?: NavSubItem[];
}

// ─── Sales Representative Navigation (Exact Default Order) ─────────────────────
const salesRepNavigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/sales', icon: LayoutDashboard, moduleKey: 'DASHBOARD' },
  { label: 'Leads', href: '/leads', icon: Target, moduleKey: 'LEADS' },
  { label: 'Follow-ups', href: '/follow-ups', icon: Clock, moduleKey: 'FOLLOW_UPS' },
  { label: 'Active Opportunities', href: '/deals', icon: Briefcase, moduleKey: 'DEALS' },
  { label: 'My Goal & Target', href: '/goals', icon: TrendingUp, moduleKey: 'GOALS' },
  { label: 'My Report & Analytics', href: '/reports', icon: BarChart3, moduleKey: 'REPORTS', dividerAfter: true },
  { label: 'Attendance', href: '/attendance', icon: Calendar, moduleKey: 'ATTENDANCE' },
  { label: 'The Notice Board', href: '/notice-board', icon: Radio, moduleKey: 'UPCOMING_COMMS', dividerAfter: true },
  { label: 'Settings', href: '/settings', icon: Settings, moduleKey: 'SETTINGS' },
  { label: 'Support', href: '/help', icon: HelpCircle, moduleKey: 'SUPPORT' },
  { label: 'About & Developer', href: '/about', icon: Info, moduleKey: 'SUPPORT' },
];

// ─── Team Leader Navigation (Exact Default Order with Leads Tree) ──────────────
const teamLeaderNavigation: NavItem[] = [
  { label: 'Lead Distribution Hub', href: '/tl/lead-assignment', icon: Share2, moduleKey: 'LEAD_ASSIGNMENT' },
  { label: 'Dashboard Overview', href: '/dashboard/team-leader', icon: LayoutDashboard, moduleKey: 'DASHBOARD' },
  { label: 'My Team', href: '/hr/employees', icon: Users, moduleKey: 'EMPLOYEES' },
  {
    label: 'Leads',
    href: '/leads',
    icon: Target,
    moduleKey: 'LEADS',
    subItems: [
      { label: 'Team Total Leads', href: '/leads' },
      { label: 'Contacted', href: '/leads?status=Contacted' },
      { label: 'Qualified', href: '/leads?status=Qualified' },
      { label: 'Unqualified / Lost', href: '/leads?status=Lost' },
    ],
  },
  { label: 'Team Report & Analytics', href: '/reports', icon: BarChart3, moduleKey: 'REPORTS' },
  { label: 'Unassigned Leads', href: '/leads?filter=unassigned', icon: UserX, moduleKey: 'LEADS' },
  { label: 'Team Follow-ups', href: '/follow-ups', icon: Clock, moduleKey: 'FOLLOW_UPS' },
  { label: 'Team Calls', href: '/reports?tab=calls', icon: Phone, moduleKey: 'REPORTS' },
  { label: 'Team Attendance', href: '/attendance', icon: Calendar, moduleKey: 'ATTENDANCE' },
  { label: 'Team Goal & Target', href: '/goals', icon: TrendingUp, moduleKey: 'GOALS' },
  { label: 'The Notice Board', href: '/notice-board', icon: Radio, moduleKey: 'UPCOMING_COMMS', dividerAfter: true },
  { label: 'Team WhatsApp Direct', href: '/whatsapp-templates', icon: MessageCircle, moduleKey: 'WA_TEMPLATES' }, // Not Default (enabled by Admin)
  { label: 'Team WhatsApp Cloud', href: '/comms', icon: MessageSquare, moduleKey: 'COMMUNICATIONS', dividerAfter: true }, // Not Default (enabled by Admin)
  { label: 'Settings', href: '/settings', icon: Settings, moduleKey: 'SETTINGS' },
  { label: 'Support', href: '/help', icon: HelpCircle, moduleKey: 'SUPPORT' },
  { label: 'About & Developer', href: '/about', icon: Info, moduleKey: 'SUPPORT' },
];

// ─── Admin / Manager / General Workspace Navigation ───────────────────────────
const adminNavigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPER_ADMIN' as any, 'MANAGER', 'HR', 'UNASSIGNED' as any] },
  { label: 'Leads', href: '/leads', icon: Target, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Lead Pipeline', href: '/pipeline', icon: GitBranch, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Tasks & Follow-ups', href: '/follow-ups', icon: Clock, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Employees', href: '/hr/employees', icon: Users, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Admin Control Center', href: '/admin/control-center', icon: Shield, roles: ['ADMIN', 'SUPER_ADMIN' as any] },
  { label: 'Product Catalogue', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Quotations & Invoices', href: '/quotes', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Attendance', href: '/attendance', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Goals & Targets', href: '/goals', icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
  { label: 'The Notice Board', href: '/notice-board', icon: Radio, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Deals & Opportunities', href: '/deals', icon: Briefcase, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Interview for Hiring', href: '/hr/interviews', icon: UserCheck, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'WhatsApp Direct Templates', href: '/whatsapp-templates', icon: MessageCircle, roles: ['ADMIN', 'MANAGER'] },
  { label: 'WhatsApp Cloud', href: '/comms', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Email Marketing', href: '/emails', icon: Mail, dividerAfter: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'AI Customization', href: '/admin/ai', icon: Sparkles, roles: ['ADMIN', 'MANAGER'] },
  { label: 'PDF Catalogue', href: '/pdf-catalogue', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Workflow Automations & Bot Rules', href: '/automations', icon: Zap, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Database', href: '/database', icon: Database, dividerAfter: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Company Profile Settings', href: '/profile', icon: Building2, roles: ['ADMIN'] },
  { label: 'Support', href: '/help', icon: HelpCircle, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'About & Developer', href: '/about', icon: Info, roles: ['ADMIN', 'MANAGER', 'HR'] },
];

const HREF_TO_MODULE_KEY: Record<string, string> = {
  '/leads': 'LEADS',
  '/pipeline': 'PIPELINE',
  '/deals': 'DEALS',
  '/contacts': 'CONTACTS',
  '/companies': 'COMPANIES',
  '/hr/employees': 'EMPLOYEES',
  '/products': 'PRODUCTS',
  '/quotes': 'QUOTES',
  '/comms': 'COMMUNICATIONS',
  '/whatsapp-templates': 'WA_TEMPLATES',
  '/emails': 'EXTRA_EMAIL',
  '/admin/ai': 'AI_CONTROL',
  '/pdf-catalogue': 'PDF_CATALOG',
  '/reports': 'REPORTS',
  '/automations': 'AUTOMATIONS',
  '/database': 'DATABASE',
  '/attendance': 'ATTENDANCE',
  '/goals': 'GOALS',
  '/hr/interviews': 'INTERVIEWS',
  '/notice-board': 'UPCOMING_COMMS',
  '/communicate': 'UPCOMING_COMMS',
  '/settings': 'SETTINGS',
  '/profile': 'PROFILE',
  '/help': 'SUPPORT',
  '/about': 'SUPPORT',
  '/tl/lead-assignment': 'LEAD_ASSIGNMENT',
  '/tasks': 'TASKS',
  '/follow-ups': 'FOLLOW_UPS',
};

const roleDefaultsMap: Record<string, string[]> = {
  ADMIN:       Object.values(HREF_TO_MODULE_KEY),
  SUPER_ADMIN: Object.values(HREF_TO_MODULE_KEY),
  MANAGER:     ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'PRODUCTS', 'QUOTES', 'UPCOMING_COMMS', 'SUPPORT', 'GOALS', 'TASKS', 'SETTINGS', 'FOLLOW_UPS'],
  TEAM_LEADER: ['LEADS', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'GOALS', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'LEAD_ASSIGNMENT', 'TASKS', 'FOLLOW_UPS'],
  SALES_EXEC:  ['LEADS', 'DEALS', 'GOALS', 'REPORTS', 'ATTENDANCE', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'TASKS', 'FOLLOW_UPS'],
  HR:          ['EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'UPCOMING_COMMS', 'SUPPORT', 'SETTINGS'],
  UNASSIGNED:  [],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, subscription, logout } = useAuth();
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [policies, setPolicies] = useState<Record<string, any>>({});
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({ Leads: true });

  useEffect(() => {
    setMounted(true);
    const loadPolicies = () => {
      try {
        const raw = localStorage.getItem('@das_crm_module_policies_v1');
        if (raw) setPolicies(JSON.parse(raw));
      } catch (_) {}
    };
    loadPolicies();

    // Fetch latest policies from backend
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_token') || localStorage.getItem('token')) : null;
    let compId = currentUser?.companyId || (typeof window !== 'undefined' ? (localStorage.getItem('das_crm_org_id') || localStorage.getItem('companyId') || '') : '');
    if (compId === 'comp_das' || compId === 'comp_default' || compId === 'platform_system') {
      compId = '';
    }

    if (token) {
      const fetchUrl = compId
        ? `${apiBase}/users/module-policies?organizationId=${compId}`
        : `${apiBase}/users/module-policies`;

      fetch(fetchUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(compId ? { 'x-organization-id': compId } : {}),
        },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.policies && Object.keys(data.policies).length > 0) {
            setPolicies(prev => {
              const merged = { ...data.policies, ...prev };
              try { localStorage.setItem('@das_crm_module_policies_v1', JSON.stringify(merged)); } catch (_) {}
              return merged;
            });
          }
        })
        .catch(() => null);
    }

    const handleCustomUpdate = () => loadPolicies();
    window.addEventListener('storage', loadPolicies);
    window.addEventListener('das-crm-module-policy-updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', loadPolicies);
      window.removeEventListener('das-crm-module-policy-updated', handleCustomUpdate);
    };
  }, [currentUser?.companyId]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    closeMobile();
    logout();
    router.push('/login');
  };

  const currentNormalizedRole = normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email) || 'SALES_EXEC');
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentNormalizedRole);
  const profileHref = isAdmin ? '/profile' : '/settings/profile';

  // Role dashboard home resolver
  const getDashboardHref = () => {
    if (currentNormalizedRole === 'UNASSIGNED') return '/dashboard';
    if (currentNormalizedRole === 'HR') return '/hr';
    if (currentNormalizedRole === 'MANAGER') return '/dashboard/manager';
    if (currentNormalizedRole === 'TEAM_LEADER') return '/tl/lead-assignment';
    if (currentNormalizedRole === 'SALES_EXEC') return '/dashboard/sales';
    return '/dashboard';
  };

  // Precise active state matcher supporting query parameters
  const isHrefActive = (href: string) => {
    const [itemPath, itemQuery] = href.split('?');

    if (itemPath === '/dashboard' || itemPath.startsWith('/dashboard/')) {
      const dashHref = getDashboardHref();
      return pathname === dashHref || (dashHref === '/dashboard' && pathname === '/dashboard');
    }

    if (pathname !== itemPath && !pathname.startsWith(itemPath + '/')) {
      return false;
    }

    if (itemQuery) {
      if (typeof window === 'undefined') return false;
      const urlParams = new URLSearchParams(itemQuery);
      const currentParams = new URLSearchParams(window.location.search);
      for (const [k, v] of urlParams.entries()) {
        if (currentParams.get(k) !== v) return false;
      }
      return true;
    }

    // When link has no query param, only match if current window URL also has no filter/view/status query params
    if (typeof window !== 'undefined' && window.location.search) {
      const currentParams = new URLSearchParams(window.location.search);
      if (
        currentParams.get('status') ||
        currentParams.get('filter') ||
        currentParams.get('view') ||
        currentParams.get('type') ||
        currentParams.get('tab')
      ) {
        return false;
      }
    }

    return pathname === itemPath;
  };

  const toggleSubMenu = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Select base navigation list according to role
  let baseNavList: NavItem[] = adminNavigation;
  if (currentNormalizedRole === 'SALES_EXEC') {
    baseNavList = salesRepNavigation;
  } else if (currentNormalizedRole === 'TEAM_LEADER') {
    baseNavList = teamLeaderNavigation;
  } else if (currentNormalizedRole === 'UNASSIGNED') {
    baseNavList = [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['UNASSIGNED' as any] }];
  }

  // Filter based on Admin Control Center user policies and role defaults
  const baseFilteredNav: NavItem[] = baseNavList.filter(item => {
    if (item.href === '/admin/control-center') {
      return isAdmin;
    }
    if (item.label === 'Dashboard') {
      return true;
    }
    if (isAdmin) {
      return true;
    }

    const basePath = item.href.split('?')[0];
    const modKey = item.moduleKey || HREF_TO_MODULE_KEY[basePath] || HREF_TO_MODULE_KEY[item.href];

    if (modKey) {
      // Check explicit policy override for this user by ID or by Email
      const keyId = currentUser?.id ? `${currentUser.id}:${modKey}` : null;
      const keyEmail = currentUser?.email ? `${currentUser.email.toLowerCase().trim()}:${modKey}` : null;

      if (keyId && policies[keyId] !== undefined) {
        return Boolean(policies[keyId].active);
      }
      if (keyEmail && policies[keyEmail] !== undefined) {
        return Boolean(policies[keyEmail].active);
      }

      // Fresh user without override: follow role defaults
      const roleDefaults = roleDefaultsMap[currentNormalizedRole] || [];
      return roleDefaults.includes(modKey);
    }

    if (!item.roles) return true;
    const normalizedItemRoles = item.roles.map(r => normalizeRoleStr(r));
    return normalizedItemRoles.includes(currentNormalizedRole);
  });

  // Also include any non-default modules from adminNavigation that have been explicitly turned ON for this user by Admin
  const extraActiveItems: NavItem[] = [];
  adminNavigation.forEach(adminItem => {
    if (baseFilteredNav.some(n => n.href === adminItem.href)) return;
    const basePath = adminItem.href.split('?')[0];
    const modKey = adminItem.moduleKey || HREF_TO_MODULE_KEY[basePath] || HREF_TO_MODULE_KEY[adminItem.href];
    if (!modKey) return;
    const keyId = currentUser?.id ? `${currentUser.id}:${modKey}` : null;
    const keyEmail = currentUser?.email ? `${currentUser.email.toLowerCase().trim()}:${modKey}` : null;
    const isExplicitlyOn = (keyId && policies[keyId]?.active === true) || (keyEmail && policies[keyEmail]?.active === true);
    if (isExplicitlyOn) {
      extraActiveItems.push(adminItem);
    }
  });

  const filteredNav: NavItem[] = [...baseFilteredNav, ...extraActiveItems];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'sidebar transition-all duration-300 z-50',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed && 'collapsed'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-3.5 py-4 mb-1 h-16 border-b border-slate-800/50">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/das-logo.png"
                  alt="DAS CRM Logo"
                  className="h-9 w-9 flex-shrink-0 object-contain rounded-lg shadow-md"
                />
                <div className="sidebar-logo-text min-w-0">
                  <span className="text-foreground font-bold text-base tracking-tight block truncate">DAS CRM</span>
                  <p className="text-xs text-muted-foreground font-medium truncate">{currentUser?.companyName || subscription?.companyName || 'Organization Workspace'}</p>
                </div>
              </div>

              {/* Mobile close button */}
              <button onClick={closeMobile} className="lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={18} />
              </button>

              {/* Desktop collapse toggle */}
              <button
                onClick={toggleCollapsed}
                className="hamburger-btn hidden lg:flex items-center justify-center flex-shrink-0 p-1.5"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={toggleCollapsed}
                className="hamburger-btn glowing flex items-center justify-center p-2 rounded-lg"
                title="Expand Sidebar"
              >
                <PanelLeft size={18} className="text-indigo-500 dark:text-indigo-400" />
              </button>
            </div>
          )}
        </div>

        {/* Authenticated User Role Badge */}
        <div className="px-3 my-3 sidebar-role-badge">
          <div
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
          >
            <Shield size={14} className="text-indigo-500 dark:text-brand-400 flex-shrink-0" />
            <span className="sidebar-label truncate">ROLE: {currentNormalizedRole}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-1 pb-4 min-h-0 space-y-0.5">
          {filteredNav.map((item) => {
            const targetHref = item.label === 'Dashboard' ? getDashboardHref() : item.href;
            const isActive = isHrefActive(item.href);
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isExpanded = openSubMenus[item.label] ?? (item.href === '/leads' && pathname.startsWith('/leads'));

            if (item.upcoming) {
              return (
                <div key={item.label}>
                  <div
                    className={cn('sidebar-item upcoming')}
                    title={`${item.label} (Upcoming Feature)`}
                  >
                    <item.icon size={17} className="flex-shrink-0" />
                    <span className="sidebar-label truncate">{item.label}</span>
                    <span className="sidebar-upcoming-badge ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 flex-shrink-0 whitespace-nowrap">
                      Upcoming
                    </span>
                  </div>
                  {item.dividerAfter && <div className="sidebar-divider" />}
                </div>
              );
            }

            return (
              <div key={item.href + item.label}>
                <div className="flex items-center group/item">
                  <Link
                    href={targetHref}
                    onClick={() => {
                      closeMobile();
                      if (hasSub) {
                        setOpenSubMenus(prev => ({ ...prev, [item.label]: true }));
                      }
                    }}
                    className="flex-1 min-w-0"
                  >
                    <div className={cn('sidebar-item', isActive && 'active')} title={item.label}>
                      <item.icon size={17} className="flex-shrink-0" />
                      <span className="sidebar-label truncate">{item.label}</span>
                    </div>
                  </Link>

                  {/* Expand / Collapse toggle for tree menu */}
                  {hasSub && !collapsed && (
                    <button
                      type="button"
                      onClick={(e) => toggleSubMenu(item.label, e)}
                      className="p-1.5 mr-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                      title={isExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                    >
                      <ChevronDown
                        size={14}
                        className={cn('transition-transform duration-200', isExpanded ? 'rotate-180' : '')}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-item tree hierarchy (Indented with branch line) */}
                {hasSub && isExpanded && !collapsed && (
                  <div className="ml-5 pl-2.5 my-1 border-l-2 border-indigo-500/30 flex flex-col space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = isHrefActive(sub.href);
                      return (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          onClick={closeMobile}
                          className={cn(
                            'flex items-center gap-2 py-1 px-2.5 rounded-lg text-xs font-medium transition-all group/sub',
                            isSubActive
                              ? 'bg-indigo-600/25 text-indigo-300 font-semibold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full transition-all flex-shrink-0',
                              isSubActive ? 'bg-indigo-400 scale-125' : 'bg-slate-600 group-hover/sub:bg-slate-300'
                            )}
                          />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {item.dividerAfter && <div className="sidebar-divider" />}
              </div>
            );
          })}
        </nav>

        {/* User profile & single streamlined logout */}
        <div className="border-t mx-2 mb-2 pt-2 border-border">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border transition-all duration-200 shadow-sm">
              <Link
                href={profileHref}
                onClick={closeMobile}
                className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-xl hover:bg-background/60 transition-colors"
                title="View Profile & Account Settings"
              >
                <div className="avatar w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {currentUser?.avatar || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-foreground">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[10px] truncate text-muted-foreground font-medium">
                    {currentUser?.email || ''}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                title="Sign Out of Workspace"
                className="flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all duration-200 flex-shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <Link
                href={profileHref}
                title={`${currentUser?.name || 'User'} (View Profile)`}
                className="avatar w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-500/40 transition-all"
              >
                {currentUser?.avatar || '?'}
              </Link>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                title="Sign Out of Workspace"
                className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all flex items-center justify-center"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modern Confirmation Modal for Sign Out */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        userRole={currentUser?.role}
        userAvatar={currentUser?.avatar}
        companyName={currentUser?.companyName || subscription?.companyName || 'Organization Workspace'}
      />
    </>
  );
}
