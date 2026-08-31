'use client';

import { Topbar } from '@/components/layout/Topbar';
import { AIScoreCustomization } from '@/components/admin/AIScoreCustomization';

export default function AICustomizationPage() {
  return (
    <>
      <Topbar title="AI Customization" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <AIScoreCustomization />
        </div>
      </main>
    </>
  );
}
