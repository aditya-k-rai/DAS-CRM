import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { ConstructionCalculatorView } from '@/components/calculators/ConstructionCalculatorView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Construction Calculator | DAS CRM',
  description: 'Construction cost estimator — materials, labour, civil, MEP, and finishing modules',
};

export default function ConstructionCalculatorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Construction Calculator"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-foreground/80">Module:</span>
            <span>Construction Cost Estimator</span>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <ConstructionCalculatorView />
      </main>
    </div>
  );
}

