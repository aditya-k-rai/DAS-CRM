'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, Package, Receipt, MessageSquare,
  MessageCircle, Mail, Sparkles, FileText, GitBranch,
  BarChart3, Zap, Database, Briefcase, TrendingUp,
  UserCheck, Radio, Settings, Building2, HelpCircle, Info,
  Shield, LogOut, PanelLeftClose, PanelLeft, X, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, normalizeRoleStr, inferRoleFromEmail, UserRole } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/context/SidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  upcoming?: boolean;
  dividerAfter?: boolean;
  roles?: UserRole[];
}

// ─── Navigation Items in exact order specified ───
// Displayed for ADMIN and MANAGER roles
const adminNavigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] },
  { label: 'Leads', href: '/leads', icon: Target, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Lead Pipeline', href: '/pipeline', icon: GitBranch, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Employees', href: '/hr/employees', icon: Users, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Product Catalogue', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
  { label: 'Quotations & Invoices', href: '/quotes', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'WhatsApp Cloud', href: '/comms', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
  { label: 'WhatsApp Direct Template', href: '/whatsapp-templates', icon: MessageCircle, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Email Marketing', href: '/emails', icon: Mail, dividerAfter: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'AI Customization', href: '/admin/ai', icon: Sparkles, roles: ['ADMIN', 'MANAGER'] },
  { label: 'PDF Catalogue', href: '/pdf-catalogue', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
  { label: 'Workflow Automations & Bot Rules', href: '/automations', icon: Zap, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Database', href: '/database', icon: Database, dividerAfter: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Attendance', href: '/attendance', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Deals', href: '/deals', icon: Briefcase, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Goals & Targets', href: '/goals', icon: TrendingUp, roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
  { label: 'Interview for Hiring', href: '/hr/interviews', icon: UserCheck, roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'The Notice Board', href: '/communicate', icon: Radio, dividerAfter: true, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Company Profile Settings', href: '/profile', icon: Building2, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'Support', href: '/help', icon: HelpCircle, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
  { label: 'About & Developer', href: '/about', icon: Info, roles: ['ADMIN', 'MANAGER', 'HR', 'TEAM_LEADER', 'SALES_EXEC'] },
];

import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, subscription, logout } = useAuth();
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    closeMobile();
    logout();
    router.push('/login');
  };

  const currentNormalizedRole = normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email) || 'ADMIN');

  const isAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(currentNormalizedRole);

  // Filter navigation items for Admin & Manager (all 20) vs other roles
  const filteredNav = adminNavigation.filter(item => {
    if (isAdminOrManager) return true; // Admin & Manager get all 20 items
    if (!item.roles) return true;
    const normalizedItemRoles = item.roles.map(r => normalizeRoleStr(r));
    return normalizedItemRoles.includes(currentNormalizedRole);
  });

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
                  <span className="text-white font-bold text-base tracking-tight block truncate">DAS CRM</span>
                  <p className="text-xs text-muted font-medium truncate">{subscription.companyName}</p>
                </div>
              </div>

              {/* Mobile close button */}
              <button onClick={closeMobile} className="lg:hidden p-1 rounded-lg text-muted hover:text-white hover:bg-slate-800 transition-colors">
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
                <PanelLeft size={18} className="text-indigo-400" />
              </button>
            </div>
          )}
        </div>

        {/* Authenticated User Role Badge */}
        <div className="px-3 my-3 sidebar-role-badge">
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
        <nav className="flex-1 overflow-y-auto px-1 pb-4 min-h-0">
          {filteredNav.map((item) => {
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

        {/* User section with Modern Logout */}
        <div className="border-t mx-2 mb-2 pt-2 space-y-2" style={{ borderColor: 'rgb(var(--sidebar-border))' }}>
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-card/70 border border-transparent hover:border-border/60 transition-all">
            <Link href="/profile" onClick={closeMobile} className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="avatar w-8 h-8 text-xs flex-shrink-0 font-bold group-hover:ring-2 group-hover:ring-brand-500/40 transition-all">{currentUser.avatar}</div>
              <div className="sidebar-user-info min-w-0">
                <p className="text-xs font-bold truncate text-white group-hover:text-brand-400 transition-colors">{currentUser.name}</p>
                <p className="text-[10px] truncate text-muted" style={{ color: 'rgb(var(--sidebar-text))' }}>{currentUser.email}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out of Workspace"
              className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/25 hover:border-rose-500/50 shadow-xs hover:shadow-rose-600/30 transition-all duration-200 flex-shrink-0 group"
            >
              <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Quick Sign Out Action Bar (Visible in expanded sidebar) */}
          <div className="sidebar-user-info">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-red-500/10 hover:from-rose-500/20 hover:to-red-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                  <LogOut size={11} />
                </span>
                <span>Sign Out</span>
              </div>
              <span className="text-[9px] uppercase font-extrabold tracking-wider text-rose-400/80 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                Exit
              </span>
            </button>
          </div>
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
        companyName={subscription?.companyName || 'Acme Sales Solutions'}
      />
    </>
  );
}
