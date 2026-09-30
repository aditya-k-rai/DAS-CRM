import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { DealsKanban } from '@/components/deals/DealsKanban';
import { Plus, Filter, BarChart3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Deals & Pipeline' };

export default function DealsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Deals & Pipeline" actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
          <button className="btn-secondary text-sm gap-1.5"><BarChart3 size={14} /> Forecast</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> New Deal</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <DealsKanban />
      </main>
    </div>
  );
}
