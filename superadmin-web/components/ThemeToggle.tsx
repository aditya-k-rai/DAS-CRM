'use client';

import { useTheme, Theme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            title={`Set theme to ${opt.label} Mode`}
          >
            <Icon
              size={14}
              className={`flex-shrink-0 ${
                isActive
                  ? 'text-white'
                  : opt.value === 'light'
                  ? 'text-amber-500'
                  : 'text-indigo-400'
              }`}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
