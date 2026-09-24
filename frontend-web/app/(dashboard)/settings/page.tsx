import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { OrganizationSettingsView } from '@/components/settings/OrganizationSettingsView';

export const metadata: Metadata = { title: 'Organization Settings | DAS CRM' };

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Organization Settings" />
      <main className="flex-1 p-6 overflow-auto">
        <OrganizationSettingsView />
      </main>
    </div>
  );
}
