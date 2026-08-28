import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Building2, Save, Upload, Shield, Bell, Key, CreditCard, Users, User } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Settings | DAS CRM' };

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Organization Settings" actions={
        <button className="btn-primary text-sm gap-1.5"><Save size={14} /> Save Changes</button>
      } />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-6">
        {/* Settings Sub-nav */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand/10 text-white border-l-2 border-brand">
              <Building2 size={16} /> Organization Profile
            </Link>
            <Link href="/settings/team" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Users size={16} /> Team & Members
            </Link>
            <Link href="/settings/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <CreditCard size={16} /> Subscription & Billing
            </Link>
            <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <User size={16} /> My Account Profile
            </Link>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="crm-card space-y-4">
            <h3 className="font-semibold text-base border-b pb-3" style={{ borderColor: 'rgb(var(--border))' }}>
              Organization Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Company Name</label>
                <input className="crm-input text-sm" defaultValue="Acme Sales Solutions Ltd." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Industry Template</label>
                <select className="crm-input text-sm" defaultValue="general">
                  <option value="general">General SME / Sales (Default)</option>
                  <option value="construction">Construction & Interior Design</option>
                  <option value="realestate">Real Estate & Property Management</option>
                  <option value="automobile">Automobile Dealership</option>
                  <option value="hospitality">Hospitality & Event Management</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Default Currency</label>
                <select className="crm-input text-sm" defaultValue="INR">
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Timezone</label>
                <select className="crm-input text-sm" defaultValue="IST">
                  <option value="IST">(UTC+05:30) Asia/Kolkata (IST)</option>
                  <option value="UTC">(UTC+00:00) UTC</option>
                  <option value="EST">(UTC-05:00) Eastern Time (US)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
