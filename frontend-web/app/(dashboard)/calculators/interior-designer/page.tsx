import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { InteriorDesignerCalculatorView } from '@/components/calculators/InteriorDesignerCalculatorView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Interior Designer Calculator | DAS CRM',
  description: 'Interior design cost calculator — room-wise area, finishes, furniture, and project budgeting',
};

export default function InteriorDesignerCalculatorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Interior Designer Calculator"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-semibold text-foreground/80">Module:</span>
            <span>Interior Design Cost Estimator</span>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <InteriorDesignerCalculatorView />
      </main>
    </div>
  );
}

