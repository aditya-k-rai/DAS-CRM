'use client';

import { useTheme, Theme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl shadow-inner border transition-colors ${className}`}
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
            title={`Set theme preference to ${opt.label}${opt.value === 'system' ? ' (OS Default)' : ''}`}
          >
            <Icon
              size={14}
              className={`flex-shrink-0 ${
                isActive
                  ? 'text-white'
                  : opt.value === 'light'
                  ? 'text-amber-500'
                  : opt.value === 'dark'
                  ? 'text-indigo-400'
                  : 'text-indigo-300'
              }`}
            />
            <span className="hidden xs:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
