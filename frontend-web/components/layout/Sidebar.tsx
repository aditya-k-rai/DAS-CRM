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
                  <span className="text-foreground font-bold text-base tracking-tight block truncate">DAS CRM</span>
                  <p className="text-xs text-muted-foreground font-medium truncate">{subscription.companyName}</p>
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

        {/* User profile & single streamlined logout */}
        <div className="border-t mx-2 mb-2 pt-2 border-border">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border transition-all duration-200 shadow-sm">
              <Link
                href="/profile"
                onClick={closeMobile}
                className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-xl hover:bg-background/60 transition-colors"
                title="View Profile & Account Settings"
              >
                <div className="avatar w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {currentUser.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-foreground">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] truncate text-muted-foreground font-medium">
                    {currentUser.email}
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
                href="/profile"
                title={`${currentUser.name} (View Profile)`}
                className="avatar w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-500/40 transition-all"
              >
                {currentUser.avatar}
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
        companyName={subscription?.companyName || 'Acme Sales Solutions'}
      />
    </>
  );
}
