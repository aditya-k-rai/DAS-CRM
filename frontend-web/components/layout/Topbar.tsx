'use client';

import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';
import { ThemeToggle } from '../common/ThemeToggle';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { toggleMobile, collapsed, toggleCollapsed } = useSidebar();

  const handleHamburgerClick = () => {
    if (window.innerWidth < 1024) {
      toggleMobile();
    } else {
      toggleCollapsed();
    }
  };

  return (
    <>
      <header className="topbar flex-wrap gap-2 px-3 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Hamburger button — shrinks desktop sidebar & toggles mobile drawer */}
          <button
            type="button"
            onClick={handleHamburgerClick}
            className={cn(
              'hamburger-btn flex items-center justify-center p-2 rounded-lg transition-all',
              collapsed && 'glowing'
            )}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu size={18} />
          </button>

          <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white dark:text-white truncate max-w-[200px] sm:max-w-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="md:hidden p-2 rounded-lg bg-secondary border border-border text-muted hover:text-foreground transition-colors"
            title="Search (⌘K)"
          >
            <Search size={16} />
          </button>

          {/* Desktop Search Trigger */}
          <div
            onClick={() => setCmdOpen(true)}
            className="relative hidden md:flex items-center cursor-pointer group"
          >
            <Search size={15} className="absolute left-3 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none" />
            <input
              readOnly
              className="crm-input pl-9 pr-12 w-48 lg:w-64 text-xs sm:text-sm h-9 cursor-pointer truncate"
              placeholder="Search leads, contacts..."
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-border/60 text-muted-foreground border border-border/80 pointer-events-none select-none">
              ⌘K
            </kbd>
          </div>

          {/* Page Actions */}
          {actions}

          {/* 3-way Theme Toggle (Light / System / Dark) */}
          <ThemeToggle />

          {/* Quick App Downloads Button */}
          <a
            href="/downloads"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Download Android & Mac Apps"
          >
            <span className="text-xs">📱 Apps</span>
          </a>

          {/* Notification Center */}
          <NotificationCenter />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
