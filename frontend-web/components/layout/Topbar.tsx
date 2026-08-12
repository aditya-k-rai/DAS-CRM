'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <div
            onClick={() => setCmdOpen(true)}
            className="relative hidden md:flex items-center cursor-pointer group"
          >
            <Search size={15} className="absolute left-3 text-muted group-hover:text-white transition-colors" style={{ color: 'rgb(var(--muted-foreground))' }} />
            <input
              readOnly
              className="crm-input pl-9 w-64 text-sm h-9 cursor-pointer"
              placeholder="Search leads, contacts... (⌘K)"
            />
            <kbd className="absolute right-3 text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgb(var(--border))', color: 'rgb(var(--muted-foreground))' }}>
              ⌘K
            </kbd>
          </div>

          {/* Page Actions */}
          {actions}

          {/* Notification Center (live dropdown) */}
          <NotificationCenter />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
