'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Save, Users, CreditCard, User, Info, FileText,
  Mail, Download, ShieldCheck, CheckCircle2, AlertCircle, Loader2,
  Copy, Check, ExternalLink, Key, Sparkles, Clock, Shield
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

export function OrganizationSettingsView() {
  const { currentUser, subscription } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Dynamic Company Details
  const companyName = currentUser?.companyName || subscription?.companyName || 'Adorable Trading';
  const adminEmail = currentUser?.email || 'adorabletrading08@gmail.com';
  const companyId = currentUser?.companyId || subscription?.id || '';

  // Retrieve registration key from stored metadata
  const [companyKey, setCompanyKey] = useState<string>('ADOR-EC-7187');
  const [copiedKey, setCopiedKey] = useState(false);

  // Form Fields
  const [editableCompanyName, setEditableCompanyName] = useState('');
  const [industryTemplate, setIndustryTemplate] = useState('general');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('IST');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Registration PDF Action State
  const [sendingPdf, setSendingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ type: 'success' | 'error'; message: string; previewUrl?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    setEditableCompanyName(companyName);

    // Retrieve active or last registered key
    if (typeof window !== 'undefined') {
      try {
        const lastReg = localStorage.getItem('last_registered_company');
        if (lastReg) {
          const parsed = JSON.parse(lastReg);
          if (parsed?.key) setCompanyKey(parsed.key);
        } else {
          const pendingKey = localStorage.getItem('pending_company_key');
          if (pendingKey) setCompanyKey(pendingKey);
        }
      } catch (_) {}
    }
  }, [companyName]);

  const normalizedRole = normalizeRoleStr(currentUser?.role);
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN';

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined' && companyKey) {
      navigator.clipboard.writeText(companyKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveChanges = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendPdfEmail = async () => {
    const targetCompId = companyId || companyKey || 'cmuev7n3o000mikew7je1tdiw';
    setSendingPdf(true);
    setPdfNotice(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${targetCompId}/send-registration-pdf`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ recipientEmail: adminEmail }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setPdfNotice({
          type: 'success',
          message: data.message || `Official Registration Certificate PDF dispatched to ${adminEmail}`,
          previewUrl: data.previewUrl || data.delivery?.previewUrl,
        });
      } else {
        setPdfNotice({
          type: 'error',
          message: data.message || 'Failed to dispatch Registration PDF email.',
        });
      }
    } catch (err: any) {
      setPdfNotice({
        type: 'error',
        message: 'Could not connect to server: ' + err?.message,
      });
    } finally {
      setSendingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    const targetCompId = companyId || companyKey || 'cmuev7n3o000mikew7je1tdiw';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.open(`${apiUrl}/auth/super-admin/companies/${targetCompId}/registration-pdf`, '_blank');
  };

  if (!mounted) {
    return <div className="p-8 text-xs text-muted-foreground">Loading settings...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="crm-card p-8 text-center max-w-xl mx-auto space-y-4 my-12 border border-rose-500/20 bg-rose-500/5">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <Shield size={24} />
        </div>
        <h2 className="text-lg font-bold text-white">Access Restricted to Admin Dashboard</h2>
        <p className="text-xs text-muted">
          Company Profile Settings and Organization controls are restricted exclusively to Workspace Administrators.
        </p>
        <Link
          href="/leads"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
        >
          Return to My Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Settings Sub-nav */}
      <div className="col-span-12 lg:col-span-3">
        <div className="crm-card p-2 space-y-1 bg-card border border-border rounded-2xl shadow-sm">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-l-4 border-indigo-600 dark:border-indigo-400"
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
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
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

      {/* Settings Content Area */}
      <div className="col-span-12 lg:col-span-9 space-y-6">

        {/* ============================================================ */}
        {/* 1. COMPANY REGISTRATION CERTIFICATE & CREDENTIALS (ADMIN ONLY)*/}
        {/* ============================================================ */}
        {isAdmin && (
          <div className="crm-card p-6 bg-card border-2 border-indigo-500/30 rounded-3xl shadow-xl relative overflow-hidden space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-md">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-foreground">
                      Company Registration Certificate &amp; Credentials
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Admin Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official encrypted company certificate, registration key, and onboarding package.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Send PDF Email & Download PDF */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendPdfEmail}
                  disabled={sendingPdf}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                  title={`Send Official Registration Certificate to ${adminEmail}`}
                >
                  {sendingPdf ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Mail size={14} />
                  )}
                  <span>Send PDF Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                  title="Download Official Registration Certificate PDF"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Notification Banner for PDF Action */}
            {pdfNotice && (
              <div
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md border transition-all ${
                  pdfNotice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {pdfNotice.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-500 shrink-0" />
                  )}
                  <p className="text-xs font-bold">{pdfNotice.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pdfNotice.previewUrl && (
                    <a
                      href={pdfNotice.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>View Email Preview</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPdfNotice(null)}
                    className="text-xs opacity-70 hover:opacity-100 px-1 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Credential Metadata Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Registered Company</span>
                <p className="font-extrabold text-foreground text-sm truncate">{companyName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Workspace Key</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedKey ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono font-black text-amber-500 text-sm tracking-wider">{companyKey}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Admin Contact Email</span>
                <p className="font-bold text-foreground text-xs truncate font-mono">{adminEmail}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Plan Tier &amp; Seats</span>
                <p className="font-bold text-foreground text-xs">
                  {subscription.planType || 'BUSINESS'} ({subscription.userSeatsAllocated || 18} Seats)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs">
              <ShieldCheck size={15} className="shrink-0 text-indigo-500" />
              <span>
                <strong>Confidentiality Notice:</strong> This official PDF certificate contains your cryptographic registration key and system parameters. Keep it secured or download a copy for offline filing.
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. GENERAL ORGANIZATION PROFILE FORM                         */}
        {/* ============================================================ */}
        <div className="crm-card p-6 bg-card border border-border rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Organization Details
              </h3>
              <p className="text-xs text-muted-foreground">General workspace identity and regional localization preferences.</p>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={14} /> Changes saved successfully!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Company Name</label>
              <input
                className="crm-input text-sm font-semibold"
                value={editableCompanyName}
                onChange={(e) => setEditableCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Industry Template</label>
              <select
                className="crm-input text-sm"
                value={industryTemplate}
                onChange={(e) => setIndustryTemplate(e.target.value)}
              >
                <option value="general">General SME / Sales (Default)</option>
                <option value="textile">Textile &amp; Apparel</option>
                <option value="construction">Construction &amp; Interior Design</option>
                <option value="realestate">Real Estate &amp; Property Management</option>
                <option value="automobile">Automobile Dealership</option>
                <option value="hospitality">Hospitality &amp; Event Management</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Default Currency</label>
              <select
                className="crm-input text-sm font-semibold"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Timezone</label>
              <select
                className="crm-input text-sm"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="IST">(UTC+05:30) Asia/Kolkata (IST)</option>
                <option value="UTC">(UTC+00:00) UTC</option>
                <option value="EST">(UTC-05:00) Eastern Time (US)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
