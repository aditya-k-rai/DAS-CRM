import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AutomationBuilder } from '@/components/automations/AutomationBuilder';
import { Plus, Zap } from 'lucide-react';

export const metadata: Metadata = { title: 'Automations | NexCRM' };

export default function AutomationsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Automations"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
              <Zap size={11} className="inline mr-1" />Admin / Owner Only
            </span>
            <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> New Automation</button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <AutomationBuilder />
      </main>
    </div>
  );
}
