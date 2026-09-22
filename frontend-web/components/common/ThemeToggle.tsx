'use client';

import { useTheme, Theme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'buttons' | 'dropdown' | 'icon-cycle';
  className?: string;
}

export function ThemeToggle({ variant = 'buttons', className }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

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
        title={`Current: ${theme.toUpperCase()}. Click to switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode.`}
      >
        {theme === 'dark' ? (
          <Moon size={16} className="text-indigo-400 flex-shrink-0" />
        ) : (
          <Sun size={16} className="text-amber-500 flex-shrink-0" />
        )}
        <span className="hidden sm:inline capitalize">{theme}</span>
      </button>
    );
  }

  // Strictly 2-Way Control: Light and Dark
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-secondary/80 border border-border shadow-inner',
        className
      )}
      role="group"
      aria-label="Theme selection (Light or Dark)"
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
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 select-none cursor-pointer',
              isActive
                ? 'bg-brand-600 text-white shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            title={`Set theme to ${opt.label} Mode`}
          >
            <Icon
              size={14}
              className={cn(
                'flex-shrink-0',
                isActive
                  ? 'text-white'
                  : opt.value === 'light'
                  ? 'text-amber-500'
                  : 'text-indigo-400'
              )}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
