'use client';

import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';
import { useSidebar } from '@/context/SidebarContext';

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { toggleMobile } = useSidebar();

  return (
    <>
      <header className="topbar flex-wrap gap-2 px-3 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-muted hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-muted hover:text-white transition-colors"
            title="Search (⌘K)"
          >
            <Search size={16} />
          </button>

          {/* Desktop Search Trigger */}
          <div
            onClick={() => setCmdOpen(true)}
            className="relative hidden md:flex items-center cursor-pointer group"
          >
            <Search size={15} className="absolute left-3 text-muted group-hover:text-white transition-colors" style={{ color: 'rgb(var(--muted-foreground))' }} />
            <input
              readOnly
              className="crm-input pl-9 w-48 lg:w-64 text-xs sm:text-sm h-9 cursor-pointer"
              placeholder="Search leads, contacts... (⌘K)"
            />
            <kbd className="absolute right-3 text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgb(var(--border))', color: 'rgb(var(--muted-foreground))' }}>
              ⌘K
            </kbd>
          </div>

          {/* Page Actions */}
          {actions}

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
