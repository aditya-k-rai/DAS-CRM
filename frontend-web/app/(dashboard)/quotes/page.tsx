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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setOpenHistoryTrigger(true)}
              className="btn-secondary text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <List size={14} /> <span className="hidden xs:inline sm:inline">All</span> Quotes
            </button>
            <button
              onClick={() => {
                const builderReset = (window as any).__resetQuoteBuilder;
                if (builderReset) builderReset();
              }}
              className="btn-primary text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} /> <span className="hidden xs:inline sm:inline">New</span> Quote
            </button>
          </div>
        }
      />
      <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto">
        <QuotationBuilder
          externalOpenHistory={openHistoryTrigger}
          onExternalOpenHistoryHandled={() => setOpenHistoryTrigger(false)}
        />
      </main>
    </div>
  );
}
