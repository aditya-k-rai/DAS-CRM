'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import {
  Plus, Building2, MapPin, Globe, Phone, Mail, Users,
  Search, Edit2, Trash2, CheckCircle2,
  X, Loader2, Landmark
} from 'lucide-react';
import { SellerProfile } from '@/lib/serverSellerParties';

interface UnifiedCompany {
  id: string;
  type: 'SELLER' | 'BUYER';
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNo?: string;
  panNo?: string;
  industry?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  createdAt?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<UnifiedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SELLER' | 'BUYER'>('SELLER');
  const [editingCompany, setEditingCompany] = useState<UnifiedCompany | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    email: '',
    phone: '',
    address: '',
    gstNo: '',
    panNo: '',
    industry: 'General Enterprise',
    bankName: 'HDFC Bank',
    accountNo: '',
    ifscCode: '',
    branch: '',
    upiId: '',
  });

  const fetchAllCompanies = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
        apiBase = '/api';
      }

      const list: UnifiedCompany[] = [];
      const seenSeller = new Set<string>();
      const seenBuyer = new Set<string>();

      // 1. Fetch Seller Companies from /api/organization/seller-profile
      try {
        const sRes = await fetch('/api/organization/seller-profile');
        if (sRes.ok) {
          const sData = await sRes.json();
          const sellerList: SellerProfile[] = Array.isArray(sData.companies) && sData.companies.length > 0
            ? sData.companies
            : (sData.name ? [sData] : []);

          sellerList.forEach((s: any) => {
            const key = (s.id || s.name || '').toLowerCase().trim();
            if (key && !seenSeller.has(key)) {
              seenSeller.add(key);
              list.push({
                id: s.id || `seller-${Date.now()}`,
                type: 'SELLER',
                name: s.name || 'Adorable Trading',
                logoUrl: s.logoUrl || '',
                email: s.email || '',
                phone: s.phone || '',
                address: s.address || 'Registered Business Address',
                gstNo: s.gstNumber || s.gstNo || '',
                panNo: s.panNumber || s.panNo || '',
                industry: 'Your Seller Organization',
                bankName: s.bankDetails?.bankName || s.bankName || 'HDFC Bank',
                accountNo: s.bankDetails?.accountNo || s.accountNo || '',
                ifscCode: s.bankDetails?.ifscCode || s.ifscCode || '',
                branch: s.bankDetails?.branch || s.branch || '',
                upiId: s.bankDetails?.upiId || s.upiId || '',
                createdAt: s.updatedAt || new Date().toISOString(),
              });
            }
          });
        }
      } catch (_) {}

      // 1b. Check localStorage seller companies cache
      if (typeof window !== 'undefined') {
        try {
          const localSellers = JSON.parse(localStorage.getItem('das_crm_seller_companies') || '[]');
          if (Array.isArray(localSellers)) {
            localSellers.forEach((s: any) => {
              const key = (s.id || s.name || '').toLowerCase().trim();
              if (key && !seenSeller.has(key)) {
                seenSeller.add(key);
                list.push({
                  id: s.id || `seller-${Date.now()}`,
                  type: 'SELLER',
                  name: s.name,
                  logoUrl: s.logoUrl || '',
                  email: s.email || '',
                  phone: s.phone || '',
                  address: s.address || 'Registered Business Address',
                  gstNo: s.gstNo || s.gstNumber || '',
                  panNo: s.panNo || s.panNumber || '',
                  industry: 'Your Seller Organization',
                  bankName: s.bankName || s.bankDetails?.bankName || 'HDFC Bank',
                  accountNo: s.accountNo || s.bankDetails?.accountNo || '',
                  ifscCode: s.ifscCode || s.bankDetails?.ifscCode || '',
                  branch: s.branch || s.bankDetails?.branch || '',
                  upiId: s.upiId || s.bankDetails?.upiId || '',
                  createdAt: new Date().toISOString(),
                });
              }
            });
          }
        } catch (_) {}
      }

      // 2. Fetch Buyer Parties from /api/parties
      try {
        const pRes = await fetch('/api/parties');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData)) {
            pData.forEach((p: any) => {
              const key = (p.id || p.name || '').toLowerCase().trim();
              if (key && !seenBuyer.has(key)) {
                seenBuyer.add(key);
                list.push({
                  id: p.id || `party-${Date.now()}`,
                  type: 'BUYER',
                  name: p.name,
                  email: p.email || '',
                  phone: p.phone || '',
                  address: p.address || 'Billed To Address',
                  gstNo: p.gstNo || '',
                  panNo: p.panNo || '',
                  industry: 'Client / Buyer Organization',
                  createdAt: p.createdAt || new Date().toISOString(),
                });
              }
            });
          }
        }
      } catch (_) {}

      // 2b. Check localStorage saved parties
      if (typeof window !== 'undefined') {
        try {
          const localParties = JSON.parse(localStorage.getItem('das_crm_saved_parties') || '[]');
          if (Array.isArray(localParties)) {
            localParties.forEach((p: any) => {
              const key = (p.id || p.name || '').toLowerCase().trim();
              if (key && !seenBuyer.has(key)) {
                seenBuyer.add(key);
                list.push({
                  id: p.id || `party-${Date.now()}`,
                  type: 'BUYER',
                  name: p.name,
                  email: p.email || '',
                  phone: p.phone || '',
                  address: p.address || 'Billed To Address',
                  gstNo: p.gstNo || '',
                  panNo: p.panNo || '',
                  industry: 'Client / Buyer Organization',
                  createdAt: p.createdAt || new Date().toISOString(),
                });
              }
            });
          }
        } catch (_) {}
      }

      // 3. Backend /companies
      try {
        const cRes = await fetch(`${apiBase}/companies`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          const cList = Array.isArray(cJson) ? cJson : cJson?.items || [];
          cList.forEach((c: any) => {
            const key = (c.name || '').toLowerCase().trim();
            if (key && !seenBuyer.has(key)) {
              seenBuyer.add(key);
              list.push({
                id: `backend-comp-${c.id}`,
                type: 'BUYER',
                name: c.name,
                email: c.email || '',
                phone: c.phone || '',
                address: c.address || '',
                gstNo: c.gstNumber || '',
                industry: c.industry || 'Client Account',
                createdAt: c.createdAt || new Date().toISOString(),
              });
            }
          });
        }
      } catch (_) {}

      setCompanies(list);
    } catch (err) {
      console.warn('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompanies();

    const handleSellerUpdate = () => fetchAllCompanies();
    const handlePartyUpdate = () => fetchAllCompanies();

    window.addEventListener('das_crm_seller_profile_updated', handleSellerUpdate);
    window.addEventListener('das_crm_parties_updated', handlePartyUpdate);

    let bcComp: BroadcastChannel | null = null;
    let bcParty: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bcComp = new BroadcastChannel('das_crm_company_channel');
        bcComp.onmessage = () => fetchAllCompanies();
        bcParty = new BroadcastChannel('das_crm_party_channel');
        bcParty.onmessage = () => fetchAllCompanies();
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('das_crm_seller_profile_updated', handleSellerUpdate);
      window.removeEventListener('das_crm_parties_updated', handlePartyUpdate);
      if (bcComp) bcComp.close();
      if (bcParty) bcParty.close();
    };
  }, []);

  const handleOpenAdd = (type: 'SELLER' | 'BUYER' = 'SELLER') => {
    setEditingCompany(null);
    setModalType(type);
    setFormData({
      name: '',
      logoUrl: '',
      email: '',
      phone: '',
      address: '',
      gstNo: '',
      panNo: '',
      industry: type === 'SELLER' ? 'Your Seller Organization' : 'Client / Buyer Organization',
      bankName: 'HDFC Bank',
      accountNo: '',
      ifscCode: '',
      branch: '',
      upiId: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: UnifiedCompany) => {
    setEditingCompany(comp);
    setModalType(comp.type);
    setFormData({
      name: comp.name || '',
      logoUrl: comp.logoUrl || '',
      email: comp.email || '',
      phone: comp.phone || '',
      address: comp.address || '',
      gstNo: comp.gstNo || '',
      panNo: comp.panNo || '',
      industry: comp.industry || (comp.type === 'SELLER' ? 'Your Seller Organization' : 'Client / Buyer Organization'),
      bankName: comp.bankName || 'HDFC Bank',
      accountNo: comp.accountNo || '',
      ifscCode: comp.ifscCode || '',
      branch: comp.branch || '',
      upiId: comp.upiId || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Company Name is required.');
      return;
    }

    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
      apiBase = '/api';
    }

    const compId = editingCompany?.id || `${modalType.toLowerCase()}-${Date.now()}`;

    if (modalType === 'SELLER') {
      const sellerProfile: SellerProfile = {
        id: compId,
        name: formData.name.trim(),
        logoUrl: formData.logoUrl,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || 'Registered Business Address',
        gstNumber: formData.gstNo,
        panNumber: formData.panNo,
        bankDetails: {
          bankName: formData.bankName,
          accountNo: formData.accountNo,
          ifscCode: formData.ifscCode,
          branch: formData.branch,
          upiId: formData.upiId,
        },
        updatedAt: new Date().toISOString(),
      };

      const updatedUnified: UnifiedCompany = {
        id: compId,
        type: 'SELLER',
        name: sellerProfile.name,
        logoUrl: sellerProfile.logoUrl,
        email: sellerProfile.email,
        phone: sellerProfile.phone,
        address: sellerProfile.address,
        gstNo: sellerProfile.gstNumber,
        panNo: sellerProfile.panNumber,
        industry: 'Your Seller Organization',
        bankName: sellerProfile.bankDetails.bankName,
        accountNo: sellerProfile.bankDetails.accountNo,
        ifscCode: sellerProfile.bankDetails.ifscCode,
        branch: sellerProfile.bankDetails.branch,
        upiId: sellerProfile.bankDetails.upiId,
        createdAt: new Date().toISOString(),
      };

      setCompanies(prev => {
        const exists = prev.some(c => c.id === compId);
        return exists ? prev.map(c => c.id === compId ? updatedUnified : c) : [updatedUnified, ...prev];
      });

      // Update localStorage
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('das_crm_seller_companies');
          const current: any[] = raw ? JSON.parse(raw) : [];
          const exists = current.some((c: any) => c.id === compId);
          const next = exists ? current.map((c: any) => c.id === compId ? sellerProfile : c) : [sellerProfile, ...current];
          localStorage.setItem('das_crm_seller_companies', JSON.stringify(next));
          localStorage.setItem('das_crm_company_profile', JSON.stringify(sellerProfile));
        }
      } catch (_) {}

      // Broadcast
      try {
        window.dispatchEvent(new CustomEvent('das_crm_seller_profile_updated', { detail: sellerProfile }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('das_crm_company_channel');
          bc.postMessage({ type: 'SELLER_PROFILE_UPDATED', company: sellerProfile });
          bc.close();
        }
      } catch (_) {}

      // Call APIs
      try {
        await Promise.allSettled([
          fetch('/api/organization/seller-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sellerProfile),
          }),
          fetch(`${apiBase}/organizations/seller-profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(sellerProfile),
          }),
        ]);
      } catch (_) {}

    } else {
      // BUYER COMPANY
      const partyPayload = {
        id: compId,
        name: formData.name.trim(),
        contactPerson: formData.name.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address || 'Billed To Address',
        shippingAddress: '',
        gstNo: formData.gstNo,
        panNo: formData.panNo,
      };

      const updatedUnified: UnifiedCompany = {
        id: compId,
        type: 'BUYER',
        name: partyPayload.name,
        email: partyPayload.email,
        phone: partyPayload.phone,
        address: partyPayload.address,
        gstNo: partyPayload.gstNo,
        panNo: partyPayload.panNo,
        industry: formData.industry || 'Client / Buyer Organization',
        createdAt: new Date().toISOString(),
      };

      setCompanies(prev => {
        const exists = prev.some(c => c.id === compId);
        return exists ? prev.map(c => c.id === compId ? updatedUnified : c) : [updatedUnified, ...prev];
      });

      // Update localStorage
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('das_crm_saved_parties');
          const current: any[] = raw ? JSON.parse(raw) : [];
          const exists = current.some((c: any) => c.id === compId);
          const next = exists ? current.map((c: any) => c.id === compId ? partyPayload : c) : [partyPayload, ...current];
          localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
        }
      } catch (_) {}

      // Broadcast
      try {
        window.dispatchEvent(new CustomEvent('das_crm_parties_updated', { detail: partyPayload }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('das_crm_party_channel');
          bc.postMessage({ type: 'PARTY_UPDATED', party: partyPayload });
          bc.close();
        }
      } catch (_) {}

      // Call APIs
      try {
        if (editingCompany) {
          await fetch(`/api/parties/${compId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partyPayload),
          });
        } else {
          await fetch('/api/parties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partyPayload),
          });

          fetch(`${apiBase}/companies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: partyPayload.name,
              email: partyPayload.email,
              phone: partyPayload.phone,
              address: partyPayload.address,
              gstNumber: partyPayload.gstNo,
              industry: formData.industry,
            }),
          }).catch(() => {});
        }
      } catch (_) {}
    }

    setSaving(false);
    setModalOpen(false);
    setEditingCompany(null);
  };

  const handleDeleteCompany = async (comp: UnifiedCompany) => {
    if (!confirm(`Are you sure you want to delete "${comp.name}"?`)) return;

    setCompanies(prev => prev.filter(c => c.id !== comp.id));

    if (comp.type === 'BUYER') {
      try {
        if (typeof window !== 'undefined') {
          const existing = JSON.parse(localStorage.getItem('das_crm_saved_parties') || '[]');
          const next = existing.filter((p: any) => p.id !== comp.id);
          localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
        }
        await fetch(`/api/parties/${comp.id}`, { method: 'DELETE' });
        window.dispatchEvent(new CustomEvent('das_crm_parties_updated'));
      } catch (_) {}
    } else {
      try {
        if (typeof window !== 'undefined') {
          const existing = JSON.parse(localStorage.getItem('das_crm_seller_companies') || '[]');
          const next = existing.filter((p: any) => p.id !== comp.id);
          localStorage.setItem('das_crm_seller_companies', JSON.stringify(next));
        }
        window.dispatchEvent(new CustomEvent('das_crm_seller_profile_updated'));
      } catch (_) {}
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (tab === 'SELLER' && c.type !== 'SELLER') return false;
      if (tab === 'BUYER' && c.type !== 'BUYER') return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.gstNo && c.gstNo.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [companies, tab, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Companies &amp; Organizations"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/contacts"
              className="btn-secondary text-xs sm:text-sm px-3 py-1.5 gap-1.5 cursor-pointer flex items-center hover:text-indigo-400"
              title="Go to Contacts & Parties Directory"
            >
              <Users size={14} className="text-emerald-400" /> Contacts
            </Link>
            <button
              onClick={() => handleOpenAdd('SELLER')}
              className="btn-secondary text-xs sm:text-sm px-3 py-1.5 gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Seller / Branch
            </button>
            <button
              onClick={() => handleOpenAdd('BUYER')}
              className="btn-primary text-xs sm:text-sm px-3.5 py-1.5 gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus size={14} /> Add Client Company
            </button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-5">
        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
          <div className="relative max-w-md flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="crm-input pl-9 h-9 text-xs sm:text-sm w-full"
              placeholder="Search companies by name, GSTIN, email, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border text-xs">
            <button
              onClick={() => setTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${tab === 'ALL' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All Entities ({companies.length})
            </button>
            <button
              onClick={() => setTab('SELLER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${tab === 'SELLER' ? 'bg-background shadow-xs text-indigo-500 dark:text-indigo-400 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Seller Profile ({companies.filter(c => c.type === 'SELLER').length})
            </button>
            <button
              onClick={() => setTab('BUYER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${tab === 'BUYER' ? 'bg-background shadow-xs text-emerald-500 dark:text-emerald-400 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Client / Buyers ({companies.filter(c => c.type === 'BUYER').length})
            </button>
          </div>
        </div>

        {/* Company Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 size={28} className="animate-spin mx-auto mb-3 text-indigo-500" />
            <p className="text-sm">Loading registered companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="crm-card p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 border border-border bg-card rounded-3xl shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
              <Building2 size={28} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">No Companies Registered</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Setup your seller business profile or register client corporate entities for automated invoicing and quotations.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAdd('SELLER')}
                className="btn-secondary text-xs px-3.5 py-2 cursor-pointer"
              >
                + Add Seller Profile
              </button>
              <button
                onClick={() => handleOpenAdd('BUYER')}
                className="btn-primary text-xs px-4 py-2 cursor-pointer shadow-md"
              >
                + Add Client Company
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                className={`crm-card p-5 rounded-2xl flex flex-col justify-between border transition-all duration-300 hover:shadow-md ${
                  c.type === 'SELLER'
                    ? 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div>
                  {/* Header Badge & Logo */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt={c.name}
                          className="w-11 h-11 rounded-xl object-contain bg-background border border-border p-1 shadow-xs"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs"
                          style={{
                            background: c.type === 'SELLER' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)',
                            color: c.type === 'SELLER' ? 'rgb(129,140,248)' : 'rgb(52,211,153)',
                          }}
                        >
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'CO'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-base text-foreground line-clamp-1">{c.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{c.industry || 'Organization'}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        c.type === 'SELLER'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {c.type === 'SELLER' ? 'Seller Entity' : 'Client / Buyer'}
                    </span>
                  </div>

                  {/* Address & Meta */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <p className="flex items-start gap-1.5 text-xs line-clamp-2" title={c.address}>
                      <MapPin size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                      <span>{c.address || 'Address not specified'}</span>
                    </p>

                    {c.phone && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone size={12} className="text-emerald-500 shrink-0" />
                        <span>{c.phone}</span>
                      </p>
                    )}

                    {c.email && (
                      <p className="flex items-center gap-1.5 text-[11px] truncate">
                        <Mail size={12} className="text-sky-500 shrink-0" />
                        <span>{c.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Tax & Bank Details Footer */}
                <div className="border-t border-border/80 pt-3 mt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-semibold">GSTIN</span>
                    <span className="font-mono font-bold text-foreground">
                      {c.gstNo || <span className="text-muted-foreground/60 font-normal">N/A</span>}
                    </span>
                  </div>

                  {c.panNo && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-semibold">PAN No</span>
                      <span className="font-mono font-bold text-foreground">{c.panNo}</span>
                    </div>
                  )}

                  {c.type === 'SELLER' && c.bankName && (
                    <div className="p-2 rounded-xl bg-muted/30 border border-border text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-indigo-400">
                        <Landmark size={12} /> {c.bankName}
                      </div>
                      {c.accountNo && (
                        <p className="font-mono text-muted-foreground text-[10px]">A/C: {c.accountNo}</p>
                      )}
                      {c.ifscCode && (
                        <p className="font-mono text-muted-foreground text-[10px]">IFSC: {c.ifscCode}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete company record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* ADD / EDIT COMPANY MODAL                                     */}
      {/* ============================================================ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xl shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <h3 className="font-bold text-base">
                  {editingCompany ? `Edit ${modalType === 'SELLER' ? 'Seller' : 'Buyer'} Company` : `Add New ${modalType === 'SELLER' ? 'Seller' : 'Buyer'} Company`}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    Company / Entity Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adorable Trading or Alpha Corp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs font-mono uppercase"
                    value={formData.gstNo}
                    onChange={e => setFormData({ ...formData, gstNo: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs font-mono uppercase"
                    value={formData.panNo}
                    onChange={e => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, State, PIN code..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Bank Details (Only for Seller profile) */}
              {modalType === 'SELLER' && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-xs">
                    <Landmark size={14} /> Bank &amp; Payment Settlement Details
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="HDFC Bank"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        value={formData.bankName}
                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="50200012345678"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        value={formData.accountNo}
                        onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="HDFC0001234"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs"
                        value={formData.ifscCode}
                        onChange={e => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Branch / City</label>
                      <input
                        type="text"
                        placeholder="Corporate Branch"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        value={formData.branch}
                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">UPI ID</label>
                      <input
                        type="text"
                        placeholder="company@hdfc"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        value={formData.upiId}
                        onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{editingCompany ? 'Update Company' : 'Save Company'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
