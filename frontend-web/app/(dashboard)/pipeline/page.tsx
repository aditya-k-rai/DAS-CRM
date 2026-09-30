'use client';

import { Topbar } from '@/components/layout/Topbar';
import { DealsKanban } from '@/components/deals/DealsKanban';
import { Filter, BarChart3, Plus } from 'lucide-react';

export default function PipelinePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Opportunities & Pipeline"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
            <button className="btn-secondary text-sm gap-1.5"><BarChart3 size={14} /> Forecast</button>
            <button
              onClick={() => {
                const addBtn = document.querySelector('[data-action="add-deal"]') as HTMLElement;
                if (addBtn) addBtn.click();
              }}
              className="btn-primary text-sm gap-1.5"
            >
              <Plus size={14} /> New Opportunity
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <DealsKanban />
      </main>
    </div>
  );
}
