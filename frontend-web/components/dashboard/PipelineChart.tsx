'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'Mar', won: 18, lost: 6, pipeline: 45 },
  { month: 'Apr', won: 24, lost: 8, pipeline: 52 },
  { month: 'May', won: 19, lost: 5, pipeline: 38 },
  { month: 'Jun', won: 31, lost: 10, pipeline: 67 },
  { month: 'Jul', won: 27, lost: 7, pipeline: 58 },
  { month: 'Aug', won: 22, lost: 4, pipeline: 49 },
];

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
    </div>
  );
}
