import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { CustomFieldsBuilder } from '@/components/admin/CustomFieldsBuilder';

export const metadata: Metadata = { title: 'Custom Fields | Admin | DAS CRM' };

export default function CustomFieldsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Custom Fields" actions={
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
          Admin Only
        </span>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <CustomFieldsBuilder />
      </main>
    </div>
  );
}
