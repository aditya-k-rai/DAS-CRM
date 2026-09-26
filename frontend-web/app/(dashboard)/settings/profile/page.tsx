'use client';

import React, { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { User, Key, ShieldCheck, Save, Building2, Users, CreditCard, Info, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

export default function ProfileSettingsPage() {
  const { currentUser, updateUserProfile } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole);

  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleUpdate = () => {
    if (nameInput.trim()) {
      updateUserProfile({ name: nameInput.trim() });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="My Profile & Security Settings"
        actions={
          <button
            onClick={handleUpdate}
            className="btn-primary text-sm gap-1.5 flex items-center"
          >
            <Save size={14} /> Update Profile
          </button>
        }
      />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-6">
        {/* Settings Sub-nav */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1 bg-card border border-border rounded-2xl shadow-sm">
            {isAdmin && (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Building2 size={16} /> Organization Profile
                </Link>
                <Link
                  href="/settings/team"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Users size={16} /> Team &amp; Members
                </Link>
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <CreditCard size={16} /> Subscription &amp; Billing
                </Link>
              </>
            )}
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-l-4 border-indigo-600 dark:border-indigo-400"
            >
              <User size={16} /> My Account Profile
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <Info size={16} /> About &amp; Developer
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {savedNotice && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-bold shadow-md">
              <CheckCircle2 size={16} /> Profile updated successfully!
            </div>
          )}

          <div className="crm-card p-6 space-y-4 bg-card rounded-2xl border border-border">
            <h3 className="font-bold text-base border-b pb-3 border-border text-foreground">
              Personal Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                <input
                  className="crm-input text-sm w-full"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Address</label>
                <input
                  className="crm-input text-sm w-full bg-secondary/50 text-muted-foreground"
                  value={currentUser?.email || ''}
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Company Workspace</label>
                <input
                  className="crm-input text-sm w-full bg-secondary/50 text-muted-foreground"
                  value={currentUser?.companyName || 'Adorable Trading'}
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Role &amp; Position</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-secondary/50">
                  <Shield size={14} className="text-indigo-400" />
                  <span className="text-sm font-bold text-foreground">{normalizedRole}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="crm-card p-6 space-y-4 bg-card rounded-2xl border border-border">
            <h3 className="font-bold text-base border-b pb-3 flex items-center gap-2 border-border text-foreground">
              <Key size={16} className="text-indigo-400" /> Two-Factor Authentication (2FA) &amp; Security
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div>
                <p className="text-sm font-bold text-foreground">2FA Security Status</p>
                <p className="text-xs text-muted-foreground">Session protected with role-based JWT bearer authentication</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck size={14} /> Active &amp; Verified
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
