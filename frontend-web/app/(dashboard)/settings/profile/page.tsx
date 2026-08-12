import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { User, Key, ShieldCheck, Save, Building2, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'My Profile & Security | Settings' };

export default function ProfileSettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="My Profile & Security Settings" actions={
        <button className="btn-primary text-sm gap-1.5"><Save size={14} /> Update Profile</button>
      } />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-6">
        {/* Settings Sub-nav */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Building2 size={16} /> Organization Profile
            </Link>
            <Link href="/settings/team" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Users size={16} /> Team & Members
            </Link>
            <Link href="/settings/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <CreditCard size={16} /> Subscription & Billing
            </Link>
            <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand/10 text-white border-l-2 border-brand">
              <User size={16} /> My Account Profile
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="crm-card space-y-4">
            <h3 className="font-semibold text-base border-b pb-3" style={{ borderColor: 'rgb(var(--border))' }}>
              Personal Profile
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">First Name</label>
                <input className="crm-input text-sm" defaultValue="John" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Last Name</label>
                <input className="crm-input text-sm" defaultValue="Doe" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Email Address</label>
                <input className="crm-input text-sm" defaultValue="john@company.com" disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Role & Position</label>
                <input className="crm-input text-sm" defaultValue="Organization Owner" disabled />
              </div>
            </div>
          </div>

          <div className="crm-card space-y-4">
            <h3 className="font-semibold text-base border-b pb-3 flex items-center gap-2" style={{ borderColor: 'rgb(var(--border))' }}>
              <Key size={16} className="text-brand" /> Two-Factor Authentication (2FA) & Password
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div>
                <p className="text-sm font-semibold">2FA Security Status</p>
                <p className="text-xs text-muted">Protect your CRM account with authenticator apps (TOTP)</p>
              </div>
              <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={14} /> Enabled
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
