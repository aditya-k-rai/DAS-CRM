import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { ModularKitchenCalculatorView } from '@/components/calculators/ModularKitchenCalculatorView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Modular Kitchen Calculator | DAS CRM',
  description: 'Modular kitchen cost calculator — cabinets, counter-tops, hardware, appliances and installation',
};

export default function ModularKitchenCalculatorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Modular Kitchen Calculator"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-foreground/80">Module:</span>
            <span>Modular Kitchen Estimator</span>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <ModularKitchenCalculatorView />
      </main>
    </div>
  );
}

