'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, Package, MessageSquare,
  MessageCircle, Mail, Sparkles, FileText, GitBranch,
  BarChart3, Zap, Database, Briefcase, TrendingUp,
  UserCheck, Radio, Settings, Building2, HelpCircle,
  Shield, LogOut, User, Menu, PanelLeftClose, PanelLeft,
  X, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/SidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  upcoming?: boolean;
  dividerAfter?: boolean;
}

// ─── 20 Navigation Items in exact order specified ───
const adminNavigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Target },
  { label: 'Employees', href: '/hr/employees', icon: Users },
  { label: 'Product Catalogue', href: '/products', icon: Package },
  { label: 'WhatsApp Cloud', href: '/comms', icon: MessageSquare },
  { label: 'WhatsApp Direct Template', href: '/comms?tab=templates', icon: MessageCircle },
  { label: 'Email Marketing', href: '/emails', icon: Mail, dividerAfter: true },
  { label: 'AI Customization', href: '/admin/ai', icon: Sparkles },
  { label: 'PDF Catalogue', href: '/products?tab=pdf', icon: FileText },
  { label: 'Lead Pipeline', href: '/deals?view=pipeline', icon: GitBranch },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
  { label: 'Workflow Automations & Bot Rules', href: '/automations', icon: Zap },
  { label: 'Lead Import History', href: '/imports', icon: Database, dividerAfter: true },
  { label: 'Deals', href: '/deals', icon: Briefcase },
  { label: 'Goals & Targets', href: '/goals', icon: TrendingUp },
  { label: 'Interview for Hiring', href: '/hr/interviews', icon: UserCheck },
  { label: 'Communicate with Employees', href: '#', icon: Radio, upcoming: true, dividerAfter: true },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Company Profile Settings', href: '/profile', icon: Building2 },
  { label: 'Support', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, subscription, canEdit, logout } = useAuth();
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentNormalizedRole = mounted
    ? normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email))
    : 'ADMIN';

  // For Dashboard, route based on role
  const getDashboardHref = () => {
    if (currentNormalizedRole === 'HR') return '/hr';
    if (currentNormalizedRole === 'MANAGER') return '/dashboard/manager';
    if (currentNormalizedRole === 'TEAM_LEADER') return '/dashboard/team-leader';
    if (currentNormalizedRole === 'SALES_EXEC') return '/dashboard/sales';
    if (currentNormalizedRole === 'SUPER_ADMIN') return '/admin/super';
    return '/dashboard';
  };

  const isItemActive = (item: NavItem) => {
    const href = item.label === 'Dashboard' ? getDashboardHref() : item.href;
    const cleanHref = href.split('?')[0]; // ignore query params for matching
    if (pathname === cleanHref) return true;
    if (cleanHref !== '/dashboard' && cleanHref !== '/' && pathname.startsWith(cleanHref)) return true;
    return false;
  };

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
        <div className="flex items-center justify-between px-4 py-4 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/das-logo.png"
              alt="DAS CRM Logo"
              className="h-9 w-9 flex-shrink-0 object-contain rounded-lg shadow-md"
            />
            <div className="sidebar-logo-text min-w-0">
              <span className="text-white font-bold text-base tracking-tight block truncate">DAS CRM</span>
              <p className="text-xs text-muted font-medium truncate">{subscription.companyName}</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button onClick={closeMobile} className="lg:hidden p-1 rounded-lg text-muted hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>

          {/* Desktop collapse toggle — inside sidebar */}
          <button
            onClick={toggleCollapsed}
            className={cn('hamburger-btn hidden lg:flex items-center justify-center', collapsed && 'glowing')}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Authenticated User Role Badge */}
        <div className="px-3 mb-3 sidebar-role-badge">
          <div
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
            style={{
              background: 'rgba(99,102,241,0.12)',
              borderColor: 'rgba(99,102,241,0.3)',
              color: 'rgb(129,140,248)',
            }}
          >
            <Shield size={14} className="text-brand-400 flex-shrink-0" />
            <span className="sidebar-label truncate">ROLE: {currentNormalizedRole}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-1 pb-4">
          {adminNavigation.map((item) => {
            const targetHref = item.label === 'Dashboard' ? getDashboardHref() : item.href;
            const isActive = isItemActive(item);

            if (item.upcoming) {
              return (
                <div key={item.label}>
                  <div
                    className={cn('sidebar-item upcoming')}
                    title={`${item.label} (Upcoming Feature)`}
                  >
                    <item.icon size={17} className="flex-shrink-0" />
                    <span className="sidebar-label truncate">{item.label}</span>
                    <span className="sidebar-upcoming-badge ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex-shrink-0 whitespace-nowrap">
                      Upcoming
                    </span>
                  </div>
                  {item.dividerAfter && <div className="sidebar-divider" />}
                </div>
              );
            }

            return (
              <div key={item.href + item.label}>
                <Link href={targetHref} onClick={closeMobile}>
                  <div className={cn('sidebar-item', isActive && 'active')} title={item.label}>
                    <item.icon size={17} className="flex-shrink-0" />
                    <span className="sidebar-label truncate">{item.label}</span>
                  </div>
                </Link>
                {item.dividerAfter && <div className="sidebar-divider" />}
              </div>
            );
          })}
        </nav>

        {/* User section with Logout */}
        <div className="border-t mx-2 mb-2 pt-2 space-y-2" style={{ borderColor: 'rgb(var(--sidebar-border))' }}>
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-card transition-colors">
            <Link href="/profile" onClick={closeMobile} className="flex items-center gap-3 min-w-0 flex-1">
              <div className="avatar w-8 h-8 text-xs flex-shrink-0 font-bold">{currentUser.avatar}</div>
              <div className="sidebar-user-info min-w-0">
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

          {/* Developer Credit Bar */}
          <div className="sidebar-dev-credit px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
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
