import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { WoodworkCutlistCalculatorView } from '@/components/calculators/WoodworkCutlistCalculatorView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Woodwork Cutlist Calculator | DAS CRM',
  description: 'Woodwork cutlist calculator — panel optimization, material requirements, wastage minimization',
};

export default function WoodworkCutlistCalculatorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Woodwork Cutlist Calculator"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold text-foreground/80">Module:</span>
            <span>Woodwork Cutlist Optimizer</span>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <WoodworkCutlistCalculatorView />
      </main>
    </div>
  );
}

