'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  color: 'brand' | 'green' | 'blue' | 'purple' | 'orange';
}

const colorMap = {
  brand:  { bg: 'rgb(99 102 241 / 0.12)',  icon: 'rgb(129 140 248)',  glow: 'rgb(99 102 241 / 0.3)' },
  green:  { bg: 'rgb(34 197 94 / 0.12)',   icon: 'rgb(74 222 128)',   glow: 'rgb(34 197 94 / 0.3)' },
  blue:   { bg: 'rgb(59 130 246 / 0.12)',  icon: 'rgb(96 165 250)',   glow: 'rgb(59 130 246 / 0.3)' },
  purple: { bg: 'rgb(139 92 246 / 0.12)',  icon: 'rgb(167 139 250)',  glow: 'rgb(139 92 246 / 0.3)' },
  orange: { bg: 'rgb(245 158 11 / 0.12)',  icon: 'rgb(251 191 36)',   glow: 'rgb(245 158 11 / 0.3)' },
};

export function StatCard({ label, value, change, positive, icon, color }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: colors.bg, color: colors.icon, boxShadow: `0 0 16px ${colors.glow}` }}
        >
          {icon}
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', positive ? 'text-emerald-400' : 'text-red-400')}
          style={{ background: positive ? 'rgb(34 197 94 / 0.1)' : 'rgb(239 68 68 / 0.1)' }}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {change}
        </div>
      </div>
      <div>
        <p className="metric-value">{value}</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>{label}</p>
      </div>
    </div>
  );
}
