import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { QuotationBuilder } from '@/components/quotations/QuotationBuilder';
import { Plus, List } from 'lucide-react';

export const metadata: Metadata = { title: 'Quotations | NexCRM' };

export default function QuotationsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Quotations"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary text-sm gap-1.5"><List size={14} /> All Quotes</button>
            <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> New Quote</button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <QuotationBuilder />
      </main>
    </div>
  );
}
