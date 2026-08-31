'use client';

import { Topbar } from '@/components/layout/Topbar';
import { AIHub } from '@/components/admin/AIHub';

export default function AICustomizationPage() {
  return (
    <>
      <Topbar title="AI Customization" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          <AIHub />
        </div>
      </main>
    </>
  );
}
