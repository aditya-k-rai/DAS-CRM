'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { TrendingUp } from 'lucide-react';

const data: Array<{ month: string; won: number; lost: number; pipeline: number }> = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span style={{ color: 'rgb(var(--muted-foreground))' }}>{p.name}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PipelineChart() {
  return (
    <div className="crm-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">Pipeline Overview</h3>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>Last 6 months performance</p>
        </div>
        <div className="flex gap-1">
          {['1M', '3M', '6M', '1Y'].map((p) => (
            <button key={p} className={`pill-tab text-xs py-1 px-3 ${p === '6M' ? 'active' : ''}`}>{p}</button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-[220px] flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl">
          <TrendingUp size={32} className="text-muted/60 mb-2" />
          <p className="font-bold text-sm text-foreground">No pipeline activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Deals and pipeline performance will be charted here as your team closes deals.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="35%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(30 41 59)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(30 41 59 / 0.5)' }} />
            <Bar dataKey="pipeline" name="In Pipeline" fill="rgb(99 102 241 / 0.5)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="won" name="Won" fill="rgb(34 197 94)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lost" name="Lost" fill="rgb(239 68 68 / 0.7)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
