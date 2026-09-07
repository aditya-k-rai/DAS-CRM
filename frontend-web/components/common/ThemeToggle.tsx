'use client';

import { useTheme, Theme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'buttons' | 'dropdown' | 'icon-cycle';
  className?: string;
}

export function ThemeToggle({ variant = 'buttons', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon-cycle') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-semibold',
          'bg-secondary/50 border-border text-foreground hover:bg-secondary hover:border-brand-500/50',
          className
        )}
        title={`Current: ${theme.toUpperCase()} (${resolvedTheme} active). Click to switch preference.`}
      >
        {theme === 'system' && <Monitor size={16} className="text-brand-400 flex-shrink-0" />}
        {theme === 'dark' && <Moon size={16} className="text-indigo-400 flex-shrink-0" />}
        {theme === 'light' && <Sun size={16} className="text-amber-500 flex-shrink-0" />}
        <span className="hidden sm:inline capitalize">{theme}</span>
      </button>
    );
  }

  // 3-way Segmented Control (Default)
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 border border-slate-800/80 dark:border-slate-800/80 shadow-inner',
        className
      )}
      style={{
        background: 'rgb(var(--muted))',
        borderColor: 'rgb(var(--border))',
      }}
      role="group"
      aria-label="Theme selection"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 select-none',
              isActive
                ? 'bg-brand-500 text-white shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
            )}
            title={`Set theme preference to ${opt.label}${opt.value === 'system' ? ' (OS Default)' : ''}`}
          >
            <Icon
              size={14}
              className={cn(
                'flex-shrink-0',
                isActive
                  ? 'text-white'
                  : opt.value === 'light'
                  ? 'text-amber-500'
                  : opt.value === 'dark'
                  ? 'text-indigo-400'
                  : 'text-brand-400'
              )}
            />
            <span className="hidden xs:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
