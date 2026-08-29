'use client';

import React, { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { QuotationBuilder } from '@/components/quotations/QuotationBuilder';
import { Plus, List } from 'lucide-react';

export default function QuotationsPage() {
  const [openHistoryTrigger, setOpenHistoryTrigger] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Quotations"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setOpenHistoryTrigger(true)}
              className="btn-secondary text-sm gap-1.5 cursor-pointer"
            >
              <List size={14} /> All Quotes
            </button>
            <button
              onClick={() => {
                const builderReset = (window as any).__resetQuoteBuilder;
                if (builderReset) builderReset();
              }}
              className="btn-primary text-sm gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> New Quote
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <QuotationBuilder
          externalOpenHistory={openHistoryTrigger}
          onExternalOpenHistoryHandled={() => setOpenHistoryTrigger(false)}
        />
      </main>
    </div>
  );
}
